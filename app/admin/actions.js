"use server";

/**
 * Admin backend — Next.js Server Actions.
 *
 * These run only on the server and talk to MySQL directly (via mysql2).
 * Client components call them like normal async functions — no separate API.
 *
 * Auth: every action checks the signed session cookie and requires
 * role === 'admin'. There is no hardcoded admin password anywhere in this
 * file — the admin account is a real row in `users` with a bcrypt hash,
 * created once by scripts/create-admin.mjs.
 */

import { cookies } from "next/headers";
import { getPool } from "../../lib/db";
import { verifySessionToken, SESSION_COOKIE } from "../../lib/session";
import bcrypt from "bcryptjs";

// Whitelist of tables and writable columns. Table/column names can't be
// parameterised in SQL, so we ONLY ever use names from here — never from the
// request — which keeps the generic queries injection-safe. Values are bound.
const ADMIN_TABLES = {
  users:          ["name", "email", "phone", "role"], // password handled separately, see below
  event_bookings: ["customer_name", "event_type", "event_date", "venue_id",
                   "guests", "total_cost", "status"],
  venues:         ["name", "min_capacity", "max_capacity", "base_cost",
                   "is_outdoor", "description"],
  menus:          ["name", "event_type", "price_per_head", "description"],
  decorations:    ["theme", "tier", "name", "cost"],
  event_packages: ["name", "event_type", "add_on_cost", "description"],
};

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "admin") {
    throw new Error("Unauthorised. Please log in as an admin.");
  }
  return payload;
}

// ---- Dashboard stats ----
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

// ---- CRUD ----
export async function listRecords(table) {
  await requireAdmin();
  if (!ADMIN_TABLES[table]) throw new Error("Unknown table");
  // Never return password hashes to the client.
  const cols = table === "users"
    ? "id, name, email, phone, role, created_at"
    : "*";
  const [rows] = await getPool().query(`SELECT ${cols} FROM ${table} ORDER BY id DESC`);
  return rows;
}

export async function createRecord(table, data) {
  await requireAdmin();
  const cols = ADMIN_TABLES[table];
  if (!cols) throw new Error("Unknown table");

  const fields = cols.filter((c) => data[c] !== undefined && data[c] !== "");

  // Special case: creating a user via the admin panel requires a password too.
  let extraCol = null, extraVal = null;
  if (table === "users") {
    if (!data.password || data.password.length < 8) {
      throw new Error("A password of at least 8 characters is required for new users.");
    }
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
    return rows[0];
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new Error("That email is already in use.");
    throw e;
  }
}

export async function updateRecord(table, id, data) {
  await requireAdmin();
  const cols = ADMIN_TABLES[table];
  if (!cols) throw new Error("Unknown table");

  const fields = cols.filter((c) => data[c] !== undefined);
  let extraCol = null, extraVal = null;

  // Optional password change when editing a user (only if provided).
  if (table === "users" && data.password) {
    if (data.password.length < 8) throw new Error("Password must be at least 8 characters.");
    extraCol = "password_hash";
    extraVal = await bcrypt.hash(data.password, 12);
  }

  if (fields.length === 0 && !extraCol) throw new Error("No valid fields provided");

  const allCols = extraCol ? [...fields, extraCol] : fields;
  const allVals = extraCol ? [...fields.map((c) => data[c]), extraVal] : fields.map((c) => data[c]);
  const sets = allCols.map((c) => `${c} = ?`).join(", ");

  try {
    await getPool().query(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...allVals, id]);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new Error("That email is already in use.");
    throw e;
  }
  const safeCols = table === "users" ? "id, name, email, phone, role, created_at" : "*";
  const [rows] = await getPool().query(`SELECT ${safeCols} FROM ${table} WHERE id = ?`, [id]);
  return rows[0];
}

export async function deleteRecord(table, id) {
  const admin = await requireAdmin();
  if (!ADMIN_TABLES[table]) throw new Error("Unknown table");
  if (table === "users" && Number(id) === admin.userId) {
    throw new Error("You can't delete your own admin account while logged in as it.");
  }
  await getPool().query(`DELETE FROM ${table} WHERE id = ?`, [id]);
  return { ok: true, deleted: Number(id) };
}
