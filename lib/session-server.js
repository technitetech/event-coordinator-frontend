import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getPool } from "./db";
import { verifySessionToken, SESSION_COOKIE } from "./session";


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


  return { ...rows[0], userId: rows[0].id };
});
