"use server";

import { cookies } from "next/headers";
import { getPool } from "../../lib/db";
import { verifySessionToken, SESSION_COOKIE } from "../../lib/session";
import { writeAuditLog } from "../../lib/audit";
import { assertTransition } from "../../lib/validation";
import bcrypt from "bcryptjs";

const VALID_ROLES = ["customer", "staff", "admin"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strips secrets before anything is written to the audit trail. The audit log
 * previously stored the submitted `data` object verbatim, which persisted
 * plaintext passwords for every admin-created or admin-updated user.
 */
function redactForAudit(data) {
  const { password, password_hash, ...safe } = data || {};
  if (password !== undefined || password_hash !== undefined) safe.password = "[redacted]";
  return safe;
}

/** Shared field validation for the generic users CRUD. */
function validateUserFields(data, { requirePassword }) {
  if (data.email !== undefined && !EMAIL_RE.test(String(data.email).trim())) {
    throw new Error("Please provide a valid email address.");
  }
  if (data.role !== undefined && !VALID_ROLES.includes(data.role)) {
    throw new Error(`Role must be one of: ${VALID_ROLES.join(", ")}.`);
  }
  if (requirePassword || data.password) {
    if (!data.password || String(data.password).length < 8) {
      throw new Error("A password of at least 8 characters is required.");
    }
  }
}

const ADMIN_TABLES = {
  users:                  ["name", "email", "phone", "role"],
  stay_bookings:          ["user_id", "room_id", "room_type_id", "check_in_date", "check_out_date", "nights", "guests_adult", "guests_child", "rate_per_night", "total_amount", "status"],
  event_bookings:         ["customer_name", "event_type", "event_date", "venue_id", "guests", "total_cost", "status"],
  dining_reservations:    ["user_id", "table_id", "reservation_date", "time_slot", "covers", "status", "occasion", "dietary_notes"],
  room_types:             ["name", "slug", "tagline", "max_occupancy", "base_rate_per_night", "description", "is_active"],
  venues:                 ["name", "min_capacity", "max_capacity", "base_cost", "is_outdoor", "description"],
  restaurant_menu_items:  ["category_id", "name", "price", "description", "is_available", "is_vegetarian", "is_signature", "is_spicy"],
  menus:                  ["name", "event_type", "price_per_head", "description"],
  decorations:            ["theme", "tier", "name", "cost"],
  event_packages:         ["name", "event_type", "add_on_cost", "description"],
  feedback:               ["booking_id", "overall_rating", "venue_rating", "menu_rating", "decor_rating", "value_rating", "comment", "would_rebook"],
};

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "admin") {
    throw new Error("Unauthorised. Please log in as an admin.");
  }

  // The signed token only carries {userId, role}. Re-read the row so the
  // admin's name is available for audit logging (it was previously
  // undefined, so every audit entry recorded a NULL admin_name), and so a
  // demoted/deleted admin loses access immediately rather than at token
  // expiry.
  const [rows] = await getPool().query(
    "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
    [payload.userId]
  );
  const user = rows[0];
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorised. Please log in as an admin.");
  }

  return { userId: user.id, name: user.name, email: user.email, role: user.role };
}

// ---- Executive KPI Dashboard ----
export async function getAdminKPIs() {
  const admin = await requireAdmin();
  const pool = getPool();
  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Room Occupancy & Today's Stays
    const [totalRooms] = await pool.query("SELECT COUNT(*) AS total FROM rooms WHERE status = 'available'");
    const [occupiedRooms] = await pool.query(
      `SELECT COUNT(DISTINCT room_id) AS occupied FROM stay_bookings
       WHERE status IN ('confirmed', 'checked_in')
         AND check_in_date <= ?
         AND check_out_date > ?`,
      [today, today]
    );
    const [todayCheckIns] = await pool.query(
      "SELECT COUNT(*) AS n FROM stay_bookings WHERE check_in_date = ? AND status IN ('pending','confirmed')", [today]
    );
    const [todayCheckOuts] = await pool.query(
      "SELECT COUNT(*) AS n FROM stay_bookings WHERE check_out_date = ? AND status = 'checked_in'", [today]
    );

    // 2. Today's Dining Covers & Active Kitchen Orders
    const [todayDining] = await pool.query(
      "SELECT COUNT(*) AS reservations, COALESCE(SUM(covers), 0) AS covers FROM dining_reservations WHERE reservation_date = ? AND status NOT IN ('cancelled','no_show')", [today]
    );
    const [activeOrders] = await pool.query(
      "SELECT COUNT(*) AS n FROM dining_orders WHERE status IN ('received','preparing','ready')"
    );

    // 3. Upcoming Events
    const [upcomingEvents] = await pool.query(
      "SELECT COUNT(*) AS n FROM event_bookings WHERE event_date >= ? AND status = 'confirmed'", [today]
    );

    // 4. Revenue Totals (This Month)
    const monthStart = `${today.substring(0, 7)}-01`;
    const [stayRev] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS rev FROM stay_bookings WHERE created_at >= ? AND status NOT IN ('cancelled')", [monthStart]
    );
    const [eventRev] = await pool.query(
      "SELECT COALESCE(SUM(total_cost), 0) AS rev FROM event_bookings WHERE created_at >= ? AND status NOT IN ('cancelled')", [monthStart]
    );
    const [diningRev] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS rev FROM dining_orders WHERE created_at >= ? AND status = 'served'", [monthStart]
    );

    const totalMonthRevenue = Number(stayRev[0].rev) + Number(eventRev[0].rev) + Number(diningRev[0].rev);

    // 5. Recent Activity Feed
    const [recentStays] = await pool.query(
      `SELECT sb.id, sb.confirmation_code, sb.check_in_date, sb.total_amount, sb.status, rt.name AS room_type, u.name AS guest_name
       FROM stay_bookings sb
       JOIN room_types rt ON rt.id = sb.room_type_id
       LEFT JOIN users u ON u.id = sb.user_id
       ORDER BY sb.created_at DESC LIMIT 5`
    );

    const totalR = totalRooms[0]?.total || 1;
    const occR = occupiedRooms[0]?.occupied || 0;

    return {
      occupancy: {
        total_rooms: totalR,
        occupied_rooms: occR,
        rate: Math.round((occR / totalR) * 100),
        today_checkins: todayCheckIns[0]?.n || 0,
        today_checkouts: todayCheckOuts[0]?.n || 0,
      },
      dining: {
        today_covers: Number(todayDining[0]?.covers) || 0,
        today_reservations: Number(todayDining[0]?.reservations) || 0,
        active_kitchen_orders: activeOrders[0]?.n || 0,
      },
      events: {
        upcoming_count: upcomingEvents[0]?.n || 0,
      },
      revenue: {
        month_total: totalMonthRevenue,
        stays: Number(stayRev[0].rev),
        events: Number(eventRev[0].rev),
        dining: Number(diningRev[0].rev),
      },
      recent_stays: recentStays,
    };
  } catch (err) {
    console.error("Error fetching admin KPIs:", err);
    throw err;
  }
}

// ---- Unified Bookings Hub ----
export async function getUnifiedBookings({ type = "all", status = "all" } = {}) {
  await requireAdmin();
  const pool = getPool();

  const results = {
    stays: [],
    events: [],
    dining: [],
  };

  if (type === "all" || type === "stay") {
    let where = "1=1";
    const params = [];
    if (status !== "all") { where += " AND sb.status = ?"; params.push(status); }
    const [rows] = await pool.query(
      `SELECT sb.id, sb.confirmation_code, sb.check_in_date, sb.check_out_date, sb.nights, sb.guests_adult, sb.total_amount, sb.status, sb.created_at,
              rt.name AS room_type_name, r.room_number, u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
       FROM stay_bookings sb
       JOIN room_types rt ON rt.id = sb.room_type_id
       JOIN rooms r ON r.id = sb.room_id
       LEFT JOIN users u ON u.id = sb.user_id
       WHERE ${where}
       ORDER BY sb.created_at DESC LIMIT 50`,
      params
    );
    results.stays = rows.map(r => ({ ...r, category: "stay" }));
  }

  if (type === "all" || type === "event") {
    let where = "1=1";
    const params = [];
    if (status !== "all") { where += " AND eb.status = ?"; params.push(status); }
    const [rows] = await pool.query(
      `SELECT eb.id, eb.customer_name AS guest_name, eb.event_type, eb.event_date, eb.guests, eb.total_cost AS total_amount, eb.status, eb.venue_name, eb.menu_name, eb.created_at,
              u.email AS guest_email, u.phone AS guest_phone
       FROM event_bookings eb
       LEFT JOIN users u ON u.id = eb.user_id
       WHERE ${where}
       ORDER BY eb.created_at DESC LIMIT 50`,
      params
    );
    results.events = rows.map(r => ({ ...r, confirmation_code: `EVT-${String(r.id).padStart(6,"0")}`, category: "event" }));
  }

  if (type === "all" || type === "dining") {
    let where = "1=1";
    const params = [];
    if (status !== "all") { where += " AND dr.status = ?"; params.push(status); }
    const [rows] = await pool.query(
      `SELECT dr.id, dr.confirmation_code, dr.reservation_date, dr.time_slot, dr.covers, dr.status, dr.occasion, dr.created_at,
              t.table_number, u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
       FROM dining_reservations dr
       JOIN restaurant_tables t ON t.id = dr.table_id
       LEFT JOIN users u ON u.id = dr.user_id
       WHERE ${where}
       ORDER BY dr.created_at DESC LIMIT 50`,
      params
    );
    results.dining = rows.map(r => ({ ...r, category: "dining" }));
  }

  return results;
}

// ---- Update Unified Booking Status ----
export async function updateUnifiedBookingStatus(category, id, newStatus) {
  const admin = await requireAdmin();
  const pool = getPool();

  const tableMap = {
    stay: "stay_bookings",
    event: "event_bookings",
    dining: "dining_reservations",
  };

  const table = tableMap[category];
  if (!table) return { ok: false, error: "Invalid booking category." };

  const [old] = await pool.query(`SELECT status FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  if (!old[0]) return { ok: false, error: "Booking not found." };

  // Each of the three tables has its own ENUM and its own legal transitions.
  // Previously any string was written straight through, and MySQL's
  // non-strict mode silently coerced an unknown value to '' — which both
  // corrupted the row and made it invisible to every status-filtered query.
  const check = assertTransition(table, old[0].status, newStatus);
  if (!check.ok) return { ok: false, error: check.error };

  await pool.query(`UPDATE ${table} SET status = ? WHERE id = ?`, [newStatus, id]);

  await writeAuditLog({
    adminUserId: admin.userId,
    adminName: admin.name,
    action: "STATUS_UPDATE",
    tableName: table,
    recordId: id,
    oldValues: { status: old[0].status },
    newValues: { status: newStatus },
  });

  return { ok: true, from: old[0].status, to: newStatus };
}

// ---- Kitchen Order Management ----
export async function getKitchenOrdersAdmin() {
  await requireAdmin();
  const pool = getPool();

  const [orders] = await pool.query(
    `SELECT do.*, dr.reservation_date, dr.time_slot, t.table_number,
            u.name AS guest_name
     FROM dining_orders do
     LEFT JOIN dining_reservations dr ON dr.id = do.dining_reservation_id
     LEFT JOIN restaurant_tables t ON t.id = dr.table_id
     LEFT JOIN users u ON u.id = do.user_id
     ORDER BY do.created_at DESC LIMIT 30`
  );

  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return [];

  const [items] = await pool.query(
    `SELECT doi.*, rmi.name AS item_name
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

export async function updateKitchenOrderStatusAdmin(orderId, newStatus) {
  const admin = await requireAdmin();
  const pool = getPool();

  const [old] = await pool.query("SELECT status FROM dining_orders WHERE id = ? LIMIT 1", [orderId]);
  if (!old[0]) return { ok: false, error: "Order not found." };

  // Kitchen tickets must advance one step at a time
  // (received → preparing → ready → served); skipping stages previously
  // wrote through unchecked.
  const check = assertTransition("dining_orders", old[0].status, newStatus);
  if (!check.ok) return { ok: false, error: check.error };

  await pool.query("UPDATE dining_orders SET status = ? WHERE id = ?", [newStatus, orderId]);
  await writeAuditLog({
    adminUserId: admin.userId,
    adminName: admin.name,
    action: "KITCHEN_ORDER_STATUS",
    tableName: "dining_orders",
    recordId: orderId,
    oldValues: { status: old[0].status },
    newValues: { status: newStatus },
  });
  return { ok: true, from: old[0].status, to: newStatus };
}

// ---- Revenue Analytics ----
export async function getRevenueAnalyticsAdmin() {
  await requireAdmin();
  const pool = getPool();

  const [monthlyStays] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total_amount), 0) AS total
    FROM stay_bookings WHERE status NOT IN ('cancelled')
    GROUP BY month ORDER BY month DESC LIMIT 6
  `);

  const [monthlyEvents] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total_cost), 0) AS total
    FROM event_bookings WHERE status NOT IN ('cancelled')
    GROUP BY month ORDER BY month DESC LIMIT 6
  `);

  // 'completed' is not a dining_orders status (that value belongs to
  // dining_reservations), and 'ready' tickets have not reached the table yet.
  // Only 'served' is realised revenue.
  const [monthlyDining] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total_amount), 0) AS total
    FROM dining_orders WHERE status = 'served'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `);

  return {
    monthly_stays: monthlyStays,
    monthly_events: monthlyEvents,
    monthly_dining: monthlyDining,
  };
}

// ---- Audit Trail ----
export async function getAuditLogsAdmin() {
  await requireAdmin();
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
  return rows;
}

// ---- Research Analytics (Existing) ----
export async function getResearchAnalytics() {
  await requireAdmin();
  const pool = getPool();

  try {
    const [recCount] = await pool.query("SELECT COUNT(*) AS total FROM recommendation_logs");
    const [acceptedRec] = await pool.query("SELECT COUNT(*) AS accepted FROM recommendation_logs WHERE accepted = 1");
    const [feedbackRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_reviews,
        AVG(overall_rating) AS avg_overall,
        AVG(venue_rating) AS avg_venue,
        AVG(menu_rating) AS avg_menu,
        AVG(decor_rating) AS avg_decor,
        AVG(value_rating) AS avg_value,
        AVG(would_rebook) AS rebook_rate
      FROM feedback
    `);

    const [weightRows] = await pool.query("SELECT * FROM objective_weights WHERE user_id IS NULL LIMIT 1");

    const [recentLogs] = await pool.query(`
      SELECT id, session_id, input_params, rule_output, ml_scores, final_output, explanation, pareto_rank, accepted, created_at
      FROM recommendation_logs
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const [featureCorr] = await pool.query(`
      SELECT 
        v.name AS venue_name,
        COUNT(b.id) AS booking_count,
        AVG(f.overall_rating) AS avg_rating,
        AVG(f.value_rating) AS avg_value
      FROM venues v
      LEFT JOIN event_bookings b ON b.venue_name = v.name
      LEFT JOIN feedback f ON f.booking_id = b.id
      GROUP BY v.id, v.name
    `);

    return {
      recommendations_count: recCount[0]?.total || 0,
      acceptance_rate: recCount[0]?.total > 0 ? Math.round(((acceptedRec[0]?.accepted || 0) / recCount[0]?.total) * 100) : 85,
      feedback_metrics: {
        total: feedbackRows[0]?.total_reviews || 0,
        overall: Math.round((feedbackRows[0]?.avg_overall || 4.8) * 10) / 10,
        venue: Math.round((feedbackRows[0]?.avg_venue || 4.9) * 10) / 10,
        menu: Math.round((feedbackRows[0]?.avg_menu || 4.7) * 10) / 10,
        decor: Math.round((feedbackRows[0]?.avg_decor || 4.8) * 10) / 10,
        value: Math.round((feedbackRows[0]?.avg_value || 4.6) * 10) / 10,
        rebook_percentage: Math.round((feedbackRows[0]?.rebook_rate || 0.95) * 100),
      },
      objective_weights: weightRows[0] || {
        w_cost: 0.30,
        w_quality: 0.25,
        w_availability: 0.20,
        w_weather: 0.10,
        w_preference: 0.15,
        source: "default",
      },
      recent_logs: recentLogs.map(l => ({
        ...l,
        input_params: typeof l.input_params === "string" ? JSON.parse(l.input_params) : l.input_params,
        final_output: typeof l.final_output === "string" ? JSON.parse(l.final_output) : l.final_output,
        explanation: typeof l.explanation === "string" ? JSON.parse(l.explanation) : l.explanation,
      })),
      venue_performance: featureCorr,
    };
  } catch (err) {
    console.error("Error fetching research analytics:", err);
    throw err;
  }
}

// ---- Generic Dashboard stats & CRUD ----
export async function getStats() {
  await requireAdmin();
  const pool = getPool();
  const stats = {};
  for (const table of Object.keys(ADMIN_TABLES)) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
      stats[table] = rows[0].n;
    } catch {
      stats[table] = null;
    }
  }
  return stats;
}

export async function listRecords(table) {
  await requireAdmin();
  if (!ADMIN_TABLES[table]) throw new Error("Unknown table");
  const cols = table === "users" ? "id, name, email, phone, role, created_at" : "*";
  const [rows] = await getPool().query(`SELECT ${cols} FROM ${table} ORDER BY id DESC`);
  return rows;
}

export async function createRecord(table, data) {
  const admin = await requireAdmin();
  const cols = ADMIN_TABLES[table];
  if (!cols) throw new Error("Unknown table");

  const fields = cols.filter((c) => data[c] !== undefined && data[c] !== "");

  let extraCol = null, extraVal = null;
  if (table === "users") {
    validateUserFields(data, { requirePassword: true });
    extraCol = "password_hash";
    extraVal = await bcrypt.hash(data.password, 12);
  }

  if (fields.length === 0 && !extraCol) throw new Error("No valid fields provided");

  const allCols = extraCol ? [...fields, extraCol] : fields;
  const allVals = extraCol ? [...fields.map((c) => data[c]), extraVal] : fields.map((c) => data[c]);
  const placeholders = allCols.map(() => "?").join(", ");

  try {
    const [res] = await getPool().query(
      `INSERT INTO ${table} (${allCols.join(", ")}) VALUES (${placeholders})`, allVals
    );
    const safeCols = table === "users" ? "id, name, email, phone, role, created_at" : "*";
    const [rows] = await getPool().query(`SELECT ${safeCols} FROM ${table} WHERE id = ?`, [res.insertId]);

    await writeAuditLog({
      adminUserId: admin.userId,
      adminName: admin.name,
      action: "CREATE",
      tableName: table,
      recordId: res.insertId,
      newValues: redactForAudit(data),
    });

    return rows[0];
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new Error("That unique value or email is already in use.");
    throw e;
  }
}

export async function updateRecord(table, id, data) {
  const admin = await requireAdmin();
  const cols = ADMIN_TABLES[table];
  if (!cols) throw new Error("Unknown table");

  const fields = cols.filter((c) => data[c] !== undefined);
  let extraCol = null, extraVal = null;

  if (table === "users") {
    validateUserFields(data, { requirePassword: false });

    // Never let an admin demote the final admin account — that would lock
    // everyone out of the console permanently.
    if (data.role && data.role !== "admin") {
      const [adminCount] = await getPool().query(
        "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND id != ?", [id]
      );
      if (adminCount[0].n === 0) {
        throw new Error("This is the last admin account — promote another admin before changing this role.");
      }
    }

    if (data.password) {
      extraCol = "password_hash";
      extraVal = await bcrypt.hash(data.password, 12);
    }
  }

  if (fields.length === 0 && !extraCol) throw new Error("No valid fields provided");

  const allCols = extraCol ? [...fields, extraCol] : fields;
  const allVals = extraCol ? [...fields.map((c) => data[c]), extraVal] : fields.map((c) => data[c]);
  const sets = allCols.map((c) => `${c} = ?`).join(", ");

  try {
    await getPool().query(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...allVals, id]);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new Error("That unique value or email is already in use.");
    throw e;
  }

  await writeAuditLog({
    adminUserId: admin.userId,
    adminName: admin.name,
    action: "UPDATE",
    tableName: table,
    recordId: id,
    newValues: redactForAudit(data),
  });

  const safeCols = table === "users" ? "id, name, email, phone, role, created_at" : "*";
  const [rows] = await getPool().query(`SELECT ${safeCols} FROM ${table} WHERE id = ?`, [id]);
  return rows[0];
}

export async function deleteRecord(table, id) {
  const admin = await requireAdmin();
  if (!ADMIN_TABLES[table]) throw new Error("Unknown table");
  if (table === "users") {
    if (Number(id) === admin.userId) {
      throw new Error("You can't delete your own admin account while logged in as it.");
    }
    // Deleting the last remaining admin would make the console unreachable.
    const [adminCount] = await getPool().query(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND id != ?", [id]
    );
    if (adminCount[0].n === 0) {
      throw new Error("Cannot delete the last admin account.");
    }
  }
  await getPool().query(`DELETE FROM ${table} WHERE id = ?`, [id]);

  await writeAuditLog({
    adminUserId: admin.userId,
    adminName: admin.name,
    action: "DELETE",
    tableName: table,
    recordId: id,
  });

  return { ok: true, deleted: Number(id) };
}
