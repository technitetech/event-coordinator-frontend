/**
 * lib/rooms.js — Room availability engine and booking logic
 * Industrial-grade: handles overlapping bookings, overbooking prevention,
 * availability search, and confirmation code generation.
 */

import { getPool } from "./db.js";
import { generateUniqueConfirmationCode, computeCharges } from "./invoice.js";
import {
  assertTransition, validateStayDates, parseIntInRange, sanitiseText,
  CANCELLATION_NOTICE_HOURS,
} from "./validation.js";

/**
 * Get all active room types with their base rates.
 */
export async function getRoomTypes() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM room_types WHERE is_active = 1 ORDER BY display_order ASC`
  );
  return rows.map(rt => ({
    ...rt,
    amenities_json: typeof rt.amenities_json === "string" ? JSON.parse(rt.amenities_json) : (rt.amenities_json || []),
    images_json: typeof rt.images_json === "string" ? JSON.parse(rt.images_json) : (rt.images_json || []),
  }));
}

/**
 * Get a single room type by slug.
 */
export async function getRoomTypeBySlug(slug) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM room_types WHERE slug = ? AND is_active = 1 LIMIT 1`, [slug]
  );
  if (!rows[0]) return null;
  const rt = rows[0];
  return {
    ...rt,
    amenities_json: typeof rt.amenities_json === "string" ? JSON.parse(rt.amenities_json) : (rt.amenities_json || []),
    images_json: typeof rt.images_json === "string" ? JSON.parse(rt.images_json) : (rt.images_json || []),
  };
}

/**
 * Check room availability for a given room type and date range.
 * Returns an available room ID, or null if fully booked.
 * 
 * Availability logic: a room is "unavailable" for a date range if it has any
 * booking where check_in < req_check_out AND check_out > req_check_in
 * (the standard interval overlap test).
 */
export async function findAvailableRoom(roomTypeId, checkIn, checkOut) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.id
     FROM rooms r
     WHERE r.room_type_id = ?
       AND r.status = 'available'
       AND r.id NOT IN (
         SELECT sb.room_id
         FROM stay_bookings sb
         WHERE sb.status NOT IN ('cancelled', 'no_show')
           AND sb.check_in_date < ?
           AND sb.check_out_date > ?
       )
     ORDER BY r.room_number ASC
     LIMIT 1`,
    [roomTypeId, checkOut, checkIn]
  );
  return rows[0]?.id || null;
}

/**
 * Get availability counts by room type for a date range.
 * Used for the rooms listing page.
 */
export async function getRoomAvailability(checkIn, checkOut) {
  const dates = validateStayDates(checkIn, checkOut);
  if (!dates.ok) return {};

  const pool = getPool();

  // Single aggregate query. The previous implementation issued 2 queries per
  // room type inside a loop (10+ round trips) — a needless N+1.
  const [rows] = await pool.query(
    `SELECT rt.slug,
            COUNT(DISTINCT r.id) AS total,
            COUNT(DISTINCT CASE WHEN sb.id IS NOT NULL THEN r.id END) AS booked
     FROM room_types rt
     LEFT JOIN rooms r
            ON r.room_type_id = rt.id AND r.status = 'available'
     LEFT JOIN stay_bookings sb
            ON sb.room_id = r.id
           AND sb.status NOT IN ('cancelled', 'no_show')
           AND sb.check_in_date < ?
           AND sb.check_out_date > ?
     WHERE rt.is_active = 1
     GROUP BY rt.id, rt.slug`,
    [checkOut, checkIn]
  );

  const result = {};
  for (const r of rows) {
    result[r.slug] = {
      total: Number(r.total),
      booked: Number(r.booked),
      available: Math.max(0, Number(r.total) - Number(r.booked)),
    };
  }
  return result;
}

/**
 * Create a stay booking with overbooking prevention.
 * Uses a DB transaction to prevent race conditions.
 */
export async function createStayBooking({ userId, roomTypeId, checkIn, checkOut, guestsAdult, guestsChild, specialRequests }) {
  if (!userId) return { ok: false, error: "You must be signed in to make a reservation." };

  const dates = validateStayDates(checkIn, checkOut);
  if (!dates.ok) return { ok: false, error: dates.error };
  const { nights } = dates;

  const adults = parseIntInRange(guestsAdult, { min: 1, max: 20, label: "Number of adults" });
  if (!adults.ok) return { ok: false, error: adults.error };

  const children = parseIntInRange(guestsChild ?? 0, { min: 0, max: 20, label: "Number of children" });
  if (!children.ok) return { ok: false, error: children.error };

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Validate the room type and enforce its occupancy limit before we
    // reserve anything. Locking the room_types row also serialises concurrent
    // bookings of the same type, which is what actually prevents the
    // double-book race: the previous `FOR UPDATE` sat inside a NOT IN
    // subquery, where it locked nothing useful and left the outer
    // availability read as a stale REPEATABLE READ snapshot.
    const [rtRows] = await conn.query(
      `SELECT id, name, base_rate_per_night, max_occupancy
       FROM room_types WHERE id = ? AND is_active = 1 LIMIT 1 FOR UPDATE`,
      [roomTypeId]
    );
    const roomType = rtRows[0];
    if (!roomType) {
      await conn.rollback();
      return { ok: false, error: "That room type is not available for booking." };
    }

    const totalGuests = adults.value + children.value;
    if (totalGuests > roomType.max_occupancy) {
      await conn.rollback();
      return {
        ok: false,
        error: `${roomType.name} sleeps a maximum of ${roomType.max_occupancy} guests; you selected ${totalGuests}.`,
      };
    }

    // Now pick a free room. Because we hold the room_types lock, no other
    // transaction can be choosing a room of this type concurrently.
    const [rooms] = await conn.query(
      `SELECT r.id, r.room_number
       FROM rooms r
       WHERE r.room_type_id = ?
         AND r.status = 'available'
         AND NOT EXISTS (
           SELECT 1 FROM stay_bookings sb
           WHERE sb.room_id = r.id
             AND sb.status NOT IN ('cancelled', 'no_show')
             AND sb.check_in_date < ?
             AND sb.check_out_date > ?
         )
       ORDER BY r.room_number ASC
       LIMIT 1`,
      [roomTypeId, checkOut, checkIn]
    );

    if (!rooms[0]) {
      await conn.rollback();
      return { ok: false, error: "No rooms of this type are available for the selected dates." };
    }

    const room = rooms[0];
    const ratePerNight = Number(roomType.base_rate_per_night);

    // Store the tax-inclusive total so the DB, the checkout screen, the
    // invoice and every revenue report agree. Previously only the pre-tax
    // figure was stored while the invoice displayed subtotal x 1.15,
    // understating reported revenue by 15%.
    const charges = computeCharges(ratePerNight * nights);
    const confirmationCode = await generateUniqueConfirmationCode(conn, "stay_bookings", "SB");

    const [result] = await conn.query(
      `INSERT INTO stay_bookings
       (user_id, room_id, room_type_id, check_in_date, check_out_date, nights,
        guests_adult, guests_child, rate_per_night, total_amount,
        special_requests, confirmation_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        userId, room.id, roomTypeId, checkIn, checkOut, nights,
        adults.value, children.value, ratePerNight, charges.grand_total,
        sanitiseText(specialRequests, 1000), confirmationCode,
      ]
    );

    await conn.commit();

    return {
      ok: true,
      booking: {
        id: result.insertId,
        confirmation_code: confirmationCode,
        room_number: room.room_number,
        room_type_name: roomType.name,
        check_in_date: checkIn,
        check_out_date: checkOut,
        nights,
        guests_adult: adults.value,
        guests_child: children.value,
        rate_per_night: ratePerNight,
        subtotal: charges.subtotal,
        tax: charges.tax,
        service_charge: charges.service_charge,
        total_amount: charges.grand_total,
        status: "confirmed",
      },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get all stay bookings for a user.
 */
export async function getStayBookingsForUser(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT sb.*, rt.name AS room_type_name, rt.slug AS room_type_slug, r.room_number
     FROM stay_bookings sb
     JOIN room_types rt ON rt.id = sb.room_type_id
     JOIN rooms r ON r.id = sb.room_id
     WHERE sb.user_id = ?
     ORDER BY sb.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Cancel a stay booking (with business rules: must be > 24h before check-in).
 */
export async function cancelStayBooking(bookingId, userId, reason) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM stay_bookings WHERE id = ? AND user_id = ? LIMIT 1`, [bookingId, userId]
  );

  if (!rows[0]) return { ok: false, error: "Booking not found." };
  const booking = rows[0];

  const check = assertTransition("stay_bookings", booking.status, "cancelled");
  if (!check.ok) {
    return { ok: false, error: `Cannot cancel a booking that is '${booking.status}'.` };
  }

  const checkIn = new Date(booking.check_in_date);
  const now = new Date();
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

  if (hoursUntilCheckIn < CANCELLATION_NOTICE_HOURS) {
    return {
      ok: false,
      error: `Cancellations must be made at least ${CANCELLATION_NOTICE_HOURS} hours before check-in.`,
    };
  }

  await pool.query(
    `UPDATE stay_bookings SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?`,
    [reason || "Guest requested cancellation", bookingId]
  );

  return { ok: true };
}

/**
 * Admin: get all stay bookings with filters.
 */
export async function getAdminStayBookings({ status, dateFrom, dateTo, limit = 50 } = {}) {
  const pool = getPool();
  let where = "1=1";
  const params = [];

  if (status && status !== "all") { where += " AND sb.status = ?"; params.push(status); }
  if (dateFrom) { where += " AND sb.check_in_date >= ?"; params.push(dateFrom); }
  if (dateTo) { where += " AND sb.check_in_date <= ?"; params.push(dateTo); }

  // LIMIT is inlined as a validated integer: mysql2 sends placeholders as
  // strings in prepared mode, which makes `LIMIT ?` a syntax error.
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);

  const [rows] = await pool.query(
    `SELECT sb.*, rt.name AS room_type_name, r.room_number,
            u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
     FROM stay_bookings sb
     JOIN room_types rt ON rt.id = sb.room_type_id
     JOIN rooms r ON r.id = sb.room_id
     LEFT JOIN users u ON u.id = sb.user_id
     WHERE ${where}
     ORDER BY sb.created_at DESC
     LIMIT ${safeLimit}`,
    params
  );
  return rows;
}

/**
 * Admin: update booking status with audit trail.
 */
export async function updateStayBookingStatus(bookingId, newStatus, adminId, adminName) {
  const pool = getPool();
  const [old] = await pool.query(`SELECT status FROM stay_bookings WHERE id = ? LIMIT 1`, [bookingId]);
  if (!old[0]) return { ok: false, error: "Booking not found." };

  // Enforce the state machine. Without this, any string was written straight
  // into the ENUM column, and MySQL's non-strict mode silently coerced an
  // unknown value to '' — corrupting the row.
  const check = assertTransition("stay_bookings", old[0].status, newStatus);
  if (!check.ok) return { ok: false, error: check.error };

  await pool.query(`UPDATE stay_bookings SET status = ? WHERE id = ?`, [newStatus, bookingId]);

  await pool.query(
    `INSERT INTO audit_logs (admin_user_id, admin_name, action, table_name, record_id, old_values, new_values)
     VALUES (?, ?, 'STATUS_CHANGE', 'stay_bookings', ?, ?, ?)`,
    [adminId, adminName, bookingId, JSON.stringify({ status: old[0].status }), JSON.stringify({ status: newStatus })]
  );

  return { ok: true };
}

/**
 * Admin: occupancy rate stats for the admin dashboard.
 */
export async function getOccupancyStats() {
  const pool = getPool();
  const today = new Date().toISOString().split("T")[0];

  const [totalRooms] = await pool.query(`SELECT COUNT(*) AS total FROM rooms WHERE status = 'available'`);
  const [occupiedRooms] = await pool.query(
    `SELECT COUNT(DISTINCT room_id) AS occupied FROM stay_bookings
     WHERE status IN ('confirmed', 'checked_in')
       AND check_in_date <= ?
       AND check_out_date > ?`,
    [today, today]
  );
  const [todayArrivals] = await pool.query(
    `SELECT COUNT(*) AS arrivals FROM stay_bookings WHERE check_in_date = ? AND status IN ('pending','confirmed')`, [today]
  );
  const [todayDepartures] = await pool.query(
    `SELECT COUNT(*) AS departures FROM stay_bookings WHERE check_out_date = ? AND status = 'checked_in'`, [today]
  );

  const total = totalRooms[0].total;
  const occupied = occupiedRooms[0].occupied;

  return {
    total_rooms: total,
    occupied,
    available: total - occupied,
    occupancy_rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    today_arrivals: todayArrivals[0].arrivals,
    today_departures: todayDepartures[0].departures,
  };
}
