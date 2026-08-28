/**
 * Tests for app/(public)/auth-actions.js
 * Mocks: DB pool, bcrypt, next/headers cookies, session-server cache.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted by Vitest before all imports) ────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, cache: (fn) => fn };
});

// Use module-level spies stored outside the factory so tests can access them
const _cookiesSet = vi.fn();
const _cookiesDel = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => ({ set: _cookiesSet, delete: _cookiesDel, get: vi.fn() }),
}));

const mockQuery = vi.fn();
// Mock lib/db relative to THIS test file (one level up from __tests__/)
// Note: auth-actions.js imports "../../lib/db" from app/(public)/ — same absolute path
vi.mock("../lib/db", () => ({ getPool: () => ({ query: mockQuery }) }));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

vi.mock("../lib/session-server.js", () => ({
  getSession: vi.fn().mockResolvedValue({ id: 1, name: "Test User", role: "customer", userId: 1 }),
}));

import { registerCustomer, login, logout } from "../app/(public)/auth-actions.js";
import bcrypt from "bcryptjs";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── registerCustomer ─────────────────────────────────────────────────────────

describe("registerCustomer", () => {
  it("returns error when required fields are missing", async () => {
    const r = await registerCustomer({ name: "", email: "", password: "" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/required/i);
  });

  it("returns error for invalid email format", async () => {
    const r = await registerCustomer({ name: "Alice", email: "not-an-email", password: "secret123" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/valid email/i);
  });

  it("returns error when password is shorter than 8 characters", async () => {
    const r = await registerCustomer({ name: "Alice", email: "a@b.com", password: "short" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/8 characters/i);
  });

  it("returns error when email already exists", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1 }]]); // existing user found
    const r = await registerCustomer({ name: "Alice", email: "a@b.com", password: "validpass123" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already exists/i);
  });

  it("registers successfully and sets a session cookie", async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 42 }]);
    const r = await registerCustomer({ name: "Bob", email: "bob@example.com", password: "securepass" });
    expect(r.ok).toBe(true);
    expect(_cookiesSet).toHaveBeenCalledOnce();
    const cookieOpts = _cookiesSet.mock.calls[0][2];
    expect(cookieOpts.httpOnly).toBe(true);
  });

  it("never stores plaintext password — hashes with bcrypt cost 12", async () => {
    mockQuery.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 5 }]);
    await registerCustomer({ name: "Carol", email: "c@x.com", password: "mypassword123" });
    expect(bcrypt.hash).toHaveBeenCalledWith("mypassword123", 12);
    const insertArgs = mockQuery.mock.calls[1];
    const argStr = JSON.stringify(insertArgs);
    expect(argStr).not.toContain("mypassword123");
  });

  it("role is always 'customer', never taken from client", async () => {
    mockQuery.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 6 }]);
    await registerCustomer({ name: "Dan", email: "d@x.com", password: "mypassword" });
    const insertSql = mockQuery.mock.calls[1][0];
    expect(insertSql).toMatch(/customer/i);
  });

  it("trims and lowercases email before checking", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1 }]]); // simulate existing
    await registerCustomer({ name: "Ed", email: "  ED@EXAMPLE.COM  ", password: "password123" });
    const emailUsedInQuery = mockQuery.mock.calls[0][1][0];
    expect(emailUsedInQuery).toBe("ed@example.com");
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe("login", () => {
  it("returns error when email or password is missing", async () => {
    const r1 = await login({ email: "", password: "pass" });
    expect(r1.ok).toBe(false);
    const r2 = await login({ email: "a@b.com", password: "" });
    expect(r2.ok).toBe(false);
  });

  it("returns generic error when email not found (avoids email enumeration)", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no user
    const r = await login({ email: "nobody@x.com", password: "pass" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Incorrect email or password/i);
  });

  it("returns generic error when password is wrong (same message as not-found)", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, name: "Alice", role: "customer", password_hash: "$2b$12$hash" }]]);
    bcrypt.compare.mockResolvedValueOnce(false);
    const r = await login({ email: "alice@x.com", password: "wrongpass" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Incorrect email or password.");
  });

  it("logs in successfully and sets session cookie", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7, name: "Alice", role: "customer", password_hash: "$2b$12$hash" }]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    const r = await login({ email: "alice@x.com", password: "rightpass" });
    expect(r.ok).toBe(true);
    expect(r.role).toBe("customer");
    expect(r.name).toBe("Alice");
    expect(_cookiesSet).toHaveBeenCalledOnce();
  });

  it("admin login works — role comes from DB, not client", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, name: "Admin", role: "admin", password_hash: "$2b$12$adminhash" }]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    const r = await login({ email: "admin@hotel.com", password: "adminpass" });
    expect(r.ok).toBe(true);
    expect(r.role).toBe("admin");
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("logout", () => {
  it("deletes the session cookie", async () => {
    await logout();
    expect(_cookiesDel).toHaveBeenCalledOnce();
  });
});
