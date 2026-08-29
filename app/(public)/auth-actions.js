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
import { cookies, headers } from "next/headers";
import { getPool } from "../../lib/db";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "../../lib/session";
import { getSession as _getCachedSession } from "../../lib/session-server";
import { checkRateLimit } from "../../lib/rate-limiter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164-ish: optional leading +, then digits/spaces/hyphens, 7–20 chars total
const PHONE_RE = /^\+?[\d\s\-]{7,20}$/;
// bcryptjs silently truncates passwords beyond 72 bytes; cap here to make that explicit.
const PASSWORD_MAX_LEN = 72;
const IS_PROD = process.env.NODE_ENV === "production";

function clientIp() {
  const h = headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown").split(",")[0].trim();
}

function setSessionCookie(user) {
  const token = createSessionToken({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Only mark Secure in production; dev runs over plain HTTP
    secure: IS_PROD,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

// ---- Register (always creates a 'customer' — role is never taken from the client) ----
export async function registerCustomer({ name, email, password, phone }) {
  const ip = clientIp();
  const rl = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min per IP
  if (!rl.ok) return { ok: false, error: `Too many registration attempts. Please wait ${rl.retryAfter}s and try again.` };

  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();
  phone = (phone || "").trim();

  if (!name || !email || !password) return { ok: false, error: "Name, email, and password are required." };
  if (name.length > 100) return { ok: false, error: "Name must not exceed 100 characters." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (email.length > 254) return { ok: false, error: "Email address is too long." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (password.length > PASSWORD_MAX_LEN) return { ok: false, error: `Password must not exceed ${PASSWORD_MAX_LEN} characters.` };
  if (phone && !PHONE_RE.test(phone)) return { ok: false, error: "Phone number format is invalid (digits, spaces, hyphens, and an optional leading + are allowed)." };

  const pool = getPool();
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) return { ok: false, error: "An account with that email already exists." };

  const password_hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    "INSERT INTO users (name, email, phone, role, password_hash) VALUES (?, ?, ?, 'customer', ?)",
    [name, email, phone || null, password_hash]
  );

  setSessionCookie({ id: result.insertId, role: "customer" });
  return { ok: true };
}

// ---- Login (works for both customers and the admin — role comes from the DB row) ----
export async function login({ email, password }) {
  const ip = clientIp();
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000); // 10 per 15 min per IP
  if (!rl.ok) return { ok: false, error: `Too many login attempts. Please wait ${rl.retryAfter}s and try again.` };

  email = (email || "").trim().toLowerCase();
  if (!email || !password) return { ok: false, error: "Email and password are required." };
  if (password.length > PASSWORD_MAX_LEN) return { ok: false, error: "Incorrect email or password." };

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
