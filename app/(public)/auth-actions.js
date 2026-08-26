"use server";

/**
 * Authentication — server actions.
 *
 * No password is ever hardcoded in this code. Customers register their own
 * password, which is hashed with bcrypt before it touches the database. The
 * admin account is created once by scripts/create-admin.mjs (see that file)
 * using a password YOU choose at seed time — the app only ever compares
 * against the stored bcrypt hash, never a plaintext value in source or env.
 */

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getPool } from "../../lib/db";
import { createSessionToken, verifySessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "../../lib/session";
import { getSession as _getCachedSession } from "../../lib/session-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setSessionCookie(user) {
  const token = createSessionToken({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

// ---- Register (always creates a 'customer' — role is never taken from the client) ----
export async function registerCustomer({ name, email, password, phone }) {
  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();
  phone = (phone || "").trim();

  if (!name || !email || !password) return { ok: false, error: "Name, email, and password are required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const pool = getPool();
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) return { ok: false, error: "An account with that email already exists." };

  const password_hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    "INSERT INTO users (name, email, phone, role, password_hash) VALUES (?, ?, ?, 'customer', ?)",
    [name, email, phone, password_hash]
  );

  setSessionCookie({ id: result.insertId, role: "customer" });
  return { ok: true };
}

// ---- Login (works for both customers and the admin — role comes from the DB row) ----
export async function login({ email, password }) {
  email = (email || "").trim().toLowerCase();
  if (!email || !password) return { ok: false, error: "Email and password are required." };

  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, role, password_hash FROM users WHERE email = ?",
    [email]
  );
  const user = rows[0];

  // Same generic error whether the email doesn't exist or the password is
  // wrong — this avoids leaking which emails are registered.
  if (!user || !user.password_hash) return { ok: false, error: "Incorrect email or password." };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { ok: false, error: "Incorrect email or password." };

  setSessionCookie(user);
  return { ok: true, role: user.role, name: user.name };
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
}

// ---- Read the current session (used by layouts/pages to decide what to show) ----
// Async wrapper around the request-cached getSession so this file's
// "use server" contract holds (only async functions can be exported from
// "use server" modules — a bare re-export of a cached function trips
// Next.js's Server Actions validator).
export async function getSession() {
  return _getCachedSession();
}
