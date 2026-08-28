/**
 * Tests for lib/session.js
 * Covers: token creation, verification, expiry, tamper detection, and edge cases.
 */

import { describe, it, expect, vi } from "vitest";
import { createSessionToken, verifySessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "../lib/session.js";

// ─── createSessionToken ───────────────────────────────────────────────────────

describe("createSessionToken", () => {
  it("returns a string with exactly one dot separator", () => {
    const token = createSessionToken({ userId: 1, role: "customer" });
    expect(typeof token).toBe("string");
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
  });

  it("encodes userId and role in the payload", () => {
    const token = createSessionToken({ userId: 42, role: "admin" });
    const [encoded] = token.split(".");
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    expect(payload.userId).toBe(42);
    expect(payload.role).toBe("admin");
  });

  it("sets an expiry in the future", () => {
    const before = Date.now();
    const token = createSessionToken({ userId: 1, role: "customer" });
    const [encoded] = token.split(".");
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    expect(payload.exp).toBeGreaterThan(before + 1000);
  });

  it("generates different tokens for different users", () => {
    const t1 = createSessionToken({ userId: 1, role: "customer" });
    const t2 = createSessionToken({ userId: 2, role: "admin" });
    expect(t1).not.toBe(t2);
  });
});

// ─── verifySessionToken ───────────────────────────────────────────────────────

describe("verifySessionToken", () => {
  it("verifies a freshly-created token", () => {
    const token = createSessionToken({ userId: 7, role: "customer" });
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload.userId).toBe(7);
    expect(payload.role).toBe("customer");
  });

  it("returns null for a tampered payload", () => {
    const token = createSessionToken({ userId: 1, role: "customer" });
    const [encoded, sig] = token.split(".");
    // Encode a different payload with the same signature
    const fakePay = Buffer.from(JSON.stringify({ userId: 999, role: "admin", exp: Date.now() + 1e9 })).toString("base64url");
    const tampered = `${fakePay}.${sig}`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("returns null for a tampered signature", () => {
    const token = createSessionToken({ userId: 1, role: "customer" });
    const tamperedToken = token.slice(0, -4) + "XXXX";
    expect(verifySessionToken(tamperedToken)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const token = createSessionToken({ userId: 1, role: "customer" });
    const [encoded] = token.split(".");
    // Manually build a token with exp in the past using same key as setup.js
    const expiredPayload = JSON.stringify({ userId: 1, role: "customer", exp: Date.now() - 1000 });
    const expiredEncoded = Buffer.from(expiredPayload).toString("base64url");
    // We can't re-sign without the key, so test via time travel by mocking Date.now
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + SESSION_MAX_AGE * 1000 + 1000);
    expect(verifySessionToken(token)).toBeNull();
    vi.restoreAllMocks();
  });

  it("returns null for null/undefined/empty input", () => {
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });

  it("returns null for a token without a dot", () => {
    expect(verifySessionToken("nodottoken")).toBeNull();
  });

  it("returns null for a completely invalid string", () => {
    expect(verifySessionToken("aaa.bbb")).toBeNull();
  });

  it("includes exp in the returned payload", () => {
    const token = createSessionToken({ userId: 3, role: "admin" });
    const payload = verifySessionToken(token);
    expect(payload.exp).toBeGreaterThan(Date.now());
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe("session constants", () => {
  it("SESSION_COOKIE is a non-empty string", () => {
    expect(typeof SESSION_COOKIE).toBe("string");
    expect(SESSION_COOKIE.length).toBeGreaterThan(0);
  });

  it("SESSION_MAX_AGE is one week in seconds", () => {
    expect(SESSION_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });
});
