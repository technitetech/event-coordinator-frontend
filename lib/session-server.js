import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getPool } from "./db";
import { verifySessionToken, SESSION_COOKIE } from "./session";

// React `cache()` dedupes calls WITHIN a single request tree — the Nav,
// the page's own getSession() call, and any server components that need
// the session share one DB round trip per navigation instead of 2–3.
export const getSession = cache(async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role FROM users WHERE id = ?",
    [payload.userId]
  );
  if (!rows[0]) return null;

  // Expose BOTH `id` (DB row convention) and `userId` (JWT payload
  // convention). Call sites historically mixed the two, and `session.userId`
  // silently resolved to undefined — which made every room/dining booking
  // insert a NULL user_id and made "my bookings" always return empty.
  // Aliasing here fixes all call sites at once and keeps either name valid.
  return { ...rows[0], userId: rows[0].id };
});
