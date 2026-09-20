

import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
 
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
