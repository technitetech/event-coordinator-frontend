/**
 * Signed session cookies.
 *
 * We store {userId, role, exp} as a base64 JSON payload, signed with an HMAC
 * using SESSION_SECRET (set in .env.local — never committed, never hardcoded
 * in source). This is NOT a password: it's proof the server issued the
 * session after checking a hashed password, and it can't be forged or edited
 * without knowing SESSION_SECRET.
 */

import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  // Warn rather than throw: throwing here would break `next build`'s static
  // analysis pass, which imports this module before .env.local is loaded in
  // some environments. At runtime, missing this just means a weak fallback
  // key is used — set SESSION_SECRET in .env.local before deploying.
  console.warn(
    "[auth] SESSION_SECRET is not set in .env.local — using an insecure " +
    "default. Set a real secret before deploying: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}
const KEY = SECRET || "dev-only-insecure-secret-change-me";

const WEEK = 60 * 60 * 24 * 7;

function sign(data) {
  return crypto.createHmac("sha256", KEY).update(data).digest("base64url");
}

export function createSessionToken({ userId, role }) {
  const payload = JSON.stringify({ userId, role, exp: Date.now() + WEEK * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  const expected = sign(encoded);
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null; // expired
    return payload; // { userId, role, exp }
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "sl_session";
export const SESSION_MAX_AGE = WEEK;
