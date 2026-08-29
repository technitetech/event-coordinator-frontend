/**
 * lib/restaurant.js — Restaurant menu, table reservation, and ordering logic
 */

import { getPool } from "./db.js";
import { generateUniqueConfirmationCode, computeCharges } from "./invoice.js";
import {
  assertTransition, validateFutureDate, parseIntInRange, sanitiseText,
  DINING_TIME_SLOTS, MIN_DINING_COVERS, MAX_DINING_COVERS,
  DINING_CANCELLATION_NOTICE_HOURS,
} from "./validation.js";

/** Get all categories with their menu items */
export async function getMenuWithCategories() {
  const pool = getPool();
  const [categories] = await pool.query(
    `SELECT * FROM restaurant_categories ORDER BY display_order ASC`
  );
  const [items] = await pool.query(
    `SELECT * FROM restaurant_menu_items WHERE is_available = 1 ORDER BY category_id, display_order ASC`
  );
  return categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));
}

/** Get available dining time slots for a given date and cover count */
export async function getAvailableTimeSlots(date, covers) {
  const dateCheck = validateFutureDate(date, "Reservation date");
  if (!dateCheck.ok) return [];

  const coverCheck = parseIntInRange(covers, {
    min: MIN_DINING_COVERS, max: MAX_DINING_COVERS, label: "Party size",
  });
  if (!coverCheck.ok) return [];

  const pool = getPool();

  const [eligibleTables] = await pool.query(
    `SELECT id FROM restaurant_tables
     WHERE capacity >= ? AND is_active = 1`,
    [coverCheck.value]
  );
  if (eligibleTables.length === 0) return [];

  const tableIds = eligibleTables.map((t) => t.id);
  const placeholders = tableIds.map(() => "?").join(",");

  // One grouped query instead of one query per slot (was 12 round trips).
  const [bookedRows] = await pool.query(
    `SELECT time_slot, COUNT(*) AS cnt
     FROM dining_reservations
     WHERE reservation_date = ?
       AND status NOT IN ('cancelled','no_show')
       AND table_id IN (${placeholders})
     GROUP BY time_slot`,
    [date, ...tableIds]
  );
  const bookedBySlot = Object.fromEntries(bookedRows.map((r) => [r.time_slot, Number(r.cnt)]));

  // Slots that have already passed today must not be bookable.
  const now = new Date();
  const isToday = dateCheck.value.toDateString() === now.toDateString();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  return DINING_TIME_SLOTS.reduce((acc, slot) => {
    if (isToday) {
      const [h, m] = slot.split(":").map(Number);
      if (h * 60 + m <= minutesNow) return acc;
    }
    const remaining = eligibleTables.length - (bookedBySlot[slot] || 0);
    if (remaining > 0) acc.push({ slot, tables_available: remaining });
    return acc;
  }, []);
}

/** Find an available table for a given date/time/cover combination */
export async function findAvailableTable(date, timeSlot, covers) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT t.id
     FROM restaurant_tables t
     WHERE t.capacity >= ?
       AND t.is_active = 1
       AND t.id NOT IN (
         SELECT dr.table_id FROM dining_reservations dr
         WHERE dr.reservation_date = ?
           AND dr.time_slot = ?
           AND dr.status NOT IN ('cancelled','no_show')
       )
     ORDER BY t.capacity ASC
     LIMIT 1`,
    [covers, date, timeSlot]
  );
  return rows[0]?.id || null;
}

/** Create a dining reservation */
export async function createDiningReservation({ userId, date, timeSlot, covers, specialRequests, dietary, occasion }) {
  if (!userId) return { ok: false, error: "You must be signed in to reserve a table." };

  const dateCheck = validateFutureDate(date, "Reservation date");
  if (!dateCheck.ok) return { ok: false, error: dateCheck.error };

  // The time slot was previously an unvalidated free-text string, so any
  // value at all could be written into the row.
  if (!DINING_TIME_SLOTS.includes(timeSlot)) {
    return { ok: false, error: "Please choose one of our available seating times." };
  }

  const coverCheck = parseIntInRange(covers, {
    min: MIN_DINING_COVERS, max: MAX_DINING_COVERS, label: "Party size",
  });
  if (!coverCheck.ok) {
    return {
      ok: false,
      error: Number(covers) > MAX_DINING_COVERS
        ? `No table seats parties over ${MAX_DINING_COVERS} — please contact us for private-dining arrangements.`
        : coverCheck.error,
    };
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Lock the candidate tables for this slot so two concurrent requests
    // cannot both be handed the same table. The previous implementation did
    // an unlocked read via findAvailableTable() and then inserted, which is a
    // textbook time-of-check/time-of-use race.
    const [rows] = await conn.query(
      `SELECT t.id
       FROM restaurant_tables t
       WHERE t.capacity >= ?
         AND t.is_active = 1
         AND NOT EXISTS (
           SELECT 1 FROM dining_reservations dr
           WHERE dr.table_id = t.id
             AND dr.reservation_date = ?
             AND dr.time_slot = ?
             AND dr.status NOT IN ('cancelled','no_show')
         )
       ORDER BY t.capacity ASC
       LIMIT 1
       FOR UPDATE`,
      [coverCheck.value, date, timeSlot]
    );

    if (!rows[0]) {
      await conn.rollback();
      return {
        ok: false,
        error: "No tables are available for the selected date, time, and party size. Please choose a different slot.",
      };
    }

    const tableId = rows[0].id;
    const confirmationCode = await generateUniqueConfirmationCode(conn, "dining_reservations", "DR");

    const [result] = await conn.query(
      `INSERT INTO dining_reservations
        (user_id, table_id, reservation_date, time_slot, covers, special_requests,
         confirmation_code, dietary_notes, occasion, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        userId, tableId, date, timeSlot, coverCheck.value,
        sanitiseText(specialRequests, 500), confirmationCode,
        sanitiseText(dietary, 300), sanitiseText(occasion, 100),
      ]
    );

    await conn.commit();

    return {
      ok: true,
      reservation: {
        id: result.insertId,
        confirmation_code: confirmationCode,
        date,
        time_slot: timeSlot,
        covers: coverCheck.value,
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
 * Cancel a dining reservation the caller owns.
 * Previously there was no cancellation path at all on the customer side.
 */
export async function cancelDiningReservation(reservationId, userId, reason) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, status, reservation_date, time_slot
     FROM dining_reservations WHERE id = ? AND user_id = ? LIMIT 1`,
    [reservationId, userId]
  );
  if (!rows[0]) return { ok: false, error: "Reservation not found." };

  const res = rows[0];
  const check = assertTransition("dining_reservations", res.status, "cancelled");
  if (!check.ok) return { ok: false, error: `Cannot cancel a reservation that is '${res.status}'.` };

  // Build a LOCAL date-time for the reservation slot.
  // mysql2 returns DATE columns as UTC-midnight Date objects; extracting via
  // toISOString() gives the correct calendar date string, and appending the
  // time without a 'Z' suffix makes the Date constructor treat it as local —
  // which is what we need for an accurate "hours until" comparison.
  const dateStr = new Date(res.reservation_date).toISOString().split("T")[0];
  const timeStr = String(res.time_slot).substring(0, 5); // "18:00:00" → "18:00"
  const slotAt = new Date(`${dateStr}T${timeStr}:00`);
  const hoursUntil = (slotAt - new Date()) / 3600000;

  if (hoursUntil < DINING_CANCELLATION_NOTICE_HOURS) {
    return {
      ok: false,
      error: `Dining cancellations must be made at least ${DINING_CANCELLATION_NOTICE_HOURS} hours before your seating time.`,
    };
  }

  const cleanReason = sanitiseText(reason, 300) || "Guest requested cancellation";
  // Store reason in special_requests (dedicated cancellation_reason column is
  // not in this table's schema). The previous COALESCE kept the original value
  // when it was non-NULL, silently discarding the reason every time — fixed to
  // direct assignment so the reason is always recorded.
  await pool.query(
    `UPDATE dining_reservations SET status = 'cancelled', special_requests = ? WHERE id = ?`,
    [cleanReason, reservationId]
  );
  return { ok: true };
}

/** Get dining reservations for a user */
export async function getDiningReservationsForUser(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT dr.*, t.table_number, t.location, t.capacity
     FROM dining_reservations dr
     JOIN restaurant_tables t ON t.id = dr.table_id
     WHERE dr.user_id = ?
     ORDER BY dr.reservation_date DESC, dr.time_slot DESC`,
    [userId]
  );
  return rows;
}

/** Submit a dining order against a reservation */
export async function submitDiningOrder({ reservationId, userId, items }) {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // If the order is attached to a reservation, that reservation must belong
    // to the caller. Without this check any signed-in user could append an
    // order (and its bill) to a stranger's reservation.
    if (reservationId) {
      const [resRows] = await conn.query(
        `SELECT id, status FROM dining_reservations WHERE id = ? AND user_id = ? LIMIT 1`,
        [reservationId, userId]
      );
      if (!resRows[0]) {
        await conn.rollback();
        return { ok: false, error: "Reservation not found for your account." };
      }
      if (["cancelled", "no_show", "completed"].includes(resRows[0].status)) {
        await conn.rollback();
        return { ok: false, error: `Cannot add an order to a '${resRows[0].status}' reservation.` };
      }
    }

    // Validate all menu items exist and are available
    const itemIds = [...new Set(items.map((i) => Number(i.menu_item_id)))];
    const [menuItems] = await conn.query(
      `SELECT id, name, price FROM restaurant_menu_items WHERE id IN (${itemIds.map(() => "?").join(",")}) AND is_available = 1`,
      itemIds
    );

    if (menuItems.length !== itemIds.length) {
      await conn.rollback();
      return { ok: false, error: "One or more selected items are no longer available." };
    }

    // Price is always taken from the database, never from the client payload.
    const priceMap = Object.fromEntries(menuItems.map((m) => [m.id, Number(m.price)]));

    let subtotal = 0;
    for (const item of items) {
      const qty = parseIntInRange(item.quantity, { min: 1, max: 50, label: "Quantity" });
      if (!qty.ok) {
        await conn.rollback();
        return { ok: false, error: qty.error };
      }
      subtotal += priceMap[Number(item.menu_item_id)] * qty.value;
      item.quantity = qty.value;
    }

    const charges = computeCharges(subtotal);

    const [orderResult] = await conn.query(
      `INSERT INTO dining_orders (dining_reservation_id, user_id, status, total_amount, notes)
       VALUES (?, ?, 'received', ?, ?)`,
      [reservationId || null, userId, charges.grand_total, null]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO dining_order_items (order_id, menu_item_id, quantity, unit_price, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, Number(item.menu_item_id), item.quantity, priceMap[Number(item.menu_item_id)], sanitiseText(item.notes, 200)]
      );
    }

    await conn.commit();
    return {
      ok: true,
      order_id: orderId,
      subtotal: charges.subtotal,
      tax: charges.tax,
      service_charge: charges.service_charge,
      total: charges.grand_total,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Admin: get all dining reservations with filters */
export async function getAdminDiningReservations({ date, status, limit = 100 } = {}) {
  const pool = getPool();
  let where = "1=1";
  const params = [];
  if (date) { where += " AND dr.reservation_date = ?"; params.push(date); }
  if (status && status !== "all") { where += " AND dr.status = ?"; params.push(status); }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);

  const [rows] = await pool.query(
    `SELECT dr.*, t.table_number, t.location, u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
     FROM dining_reservations dr
     JOIN restaurant_tables t ON t.id = dr.table_id
     LEFT JOIN users u ON u.id = dr.user_id
     WHERE ${where}
     ORDER BY dr.reservation_date ASC, dr.time_slot ASC
     LIMIT ${safeLimit}`,
    params
  );
  return rows;
}

/** Admin: get kitchen order queue (active orders) */
export async function getKitchenOrders() {
  const pool = getPool();
  const [orders] = await pool.query(
    `SELECT do.*, dr.reservation_date, dr.time_slot, t.table_number,
            u.name AS guest_name
     FROM dining_orders do
     LEFT JOIN dining_reservations dr ON dr.id = do.dining_reservation_id
     LEFT JOIN restaurant_tables t ON t.id = dr.table_id
     LEFT JOIN users u ON u.id = do.user_id
     WHERE do.status IN ('received','preparing','ready')
     ORDER BY do.created_at ASC`
  );

  // Attach items to each order
  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return [];

  const [items] = await pool.query(
    `SELECT doi.*, rmi.name AS item_name, rmi.category_id
     FROM dining_order_items doi
     JOIN restaurant_menu_items rmi ON rmi.id = doi.menu_item_id
     WHERE doi.order_id IN (${orderIds.map(() => "?").join(",")})`,
    orderIds
  );

  return orders.map(o => ({
    ...o,
    items: items.filter(i => i.order_id === o.id),
  }));
}

/**
 * Admin: advance a kitchen ticket.
 * Enforces one-step-at-a-time progression (received → preparing → ready →
 * served); previously any status string was written with no checks at all.
 */
export async function updateOrderStatus(orderId, newStatus) {
  const pool = getPool();
  const [rows] = await pool.query(`SELECT status FROM dining_orders WHERE id = ? LIMIT 1`, [orderId]);
  if (!rows[0]) return { ok: false, error: "Order not found." };

  const check = assertTransition("dining_orders", rows[0].status, newStatus);
  if (!check.ok) return { ok: false, error: check.error };

  await pool.query(`UPDATE dining_orders SET status = ? WHERE id = ?`, [newStatus, orderId]);
  return { ok: true, from: rows[0].status, to: newStatus };
}

/** Admin: get daily dining stats */
export async function getDiningStats(date) {
  const pool = getPool();
  const d = date || new Date().toISOString().split("T")[0];

  const [reservations] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(covers) AS total_covers,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
            SUM(CASE WHEN status = 'seated' THEN 1 ELSE 0 END) AS seated,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM dining_reservations WHERE reservation_date = ?`, [d]
  );

  // Only 'served' counts as realised revenue. The previous filter included
  // 'completed', which is not a member of the dining_orders ENUM at all
  // (that value belongs to dining_reservations), and counted 'ready' tickets
  // that had not yet reached the table.
  const [revenue] = await pool.query(
    `SELECT COALESCE(SUM(do.total_amount), 0) AS total_revenue
     FROM dining_orders do
     JOIN dining_reservations dr ON dr.id = do.dining_reservation_id
     WHERE dr.reservation_date = ? AND do.status = 'served'`, [d]
  );

  return {
    date: d,
    total_reservations: reservations[0].total || 0,
    total_covers: reservations[0].total_covers || 0,
    confirmed: reservations[0].confirmed || 0,
    seated: reservations[0].seated || 0,
    completed: reservations[0].completed || 0,
    revenue: revenue[0].total_revenue || 0,
  };
}
