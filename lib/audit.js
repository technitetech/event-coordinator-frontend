/**
 * lib/audit.js — Immutable admin audit log writer
 */
import { getPool } from "./db.js";

/**
 * Write an entry to the audit_logs table.
 * Call this from any admin server action that modifies data.
 */
export async function writeAuditLog({ adminUserId, adminName, action, tableName, recordId, oldValues, newValues }) {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, admin_name, action, table_name, record_id, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        adminUserId || null,
        adminName || "System",
        action,
        tableName || null,
        recordId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
      ]
    );
  } catch (err) {
    // Audit failures must never crash the primary operation
    console.error("Audit log write failed:", err.message);
  }
}

/** Get recent audit log entries for admin display */
export async function getAuditLogs({ limit = 100, tableName, adminId } = {}) {
  const pool = getPool();
  let where = "1=1";
  const params = [];
  if (tableName) { where += " AND table_name = ?"; params.push(tableName); }
  if (adminId) { where += " AND admin_user_id = ?"; params.push(adminId); }

  const [rows] = await pool.query(
    `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ?`,
    [...params, limit]
  );
  return rows;
}
