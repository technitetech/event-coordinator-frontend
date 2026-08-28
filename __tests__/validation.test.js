/**
 * Tests for lib/validation.js
 * Covers: state machines, date parsing, range validation, text sanitisation,
 * stay-date business rules, and future-date rules.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  assertTransition,
  parseDateOnly,
  parseIntInRange,
  sanitiseText,
  validateStayDates,
  validateFutureDate,
  startOfToday,
  STAY_TRANSITIONS,
  EVENT_TRANSITIONS,
  DINING_RES_TRANSITIONS,
  ORDER_TRANSITIONS,
  DINING_TIME_SLOTS,
  MAX_STAY_NIGHTS,
  MAX_ADVANCE_BOOKING_DAYS,
  MIN_DINING_COVERS,
  MAX_DINING_COVERS,
} from "../lib/validation.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string offset by `n` days from today. */
function dateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

// ─── assertTransition ────────────────────────────────────────────────────────

describe("assertTransition", () => {
  describe("stay_bookings", () => {
    it("allows pending → confirmed", () => {
      expect(assertTransition("stay_bookings", "pending", "confirmed").ok).toBe(true);
    });
    it("allows confirmed → checked_in", () => {
      expect(assertTransition("stay_bookings", "confirmed", "checked_in").ok).toBe(true);
    });
    it("allows checked_in → checked_out", () => {
      expect(assertTransition("stay_bookings", "checked_in", "checked_out").ok).toBe(true);
    });
    it("allows pending → cancelled", () => {
      expect(assertTransition("stay_bookings", "pending", "cancelled").ok).toBe(true);
    });
    it("allows confirmed → no_show", () => {
      expect(assertTransition("stay_bookings", "confirmed", "no_show").ok).toBe(true);
    });
    it("blocks checked_out → pending (terminal state)", () => {
      const r = assertTransition("stay_bookings", "checked_out", "pending");
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/final state/i);
    });
    it("blocks cancelled → confirmed", () => {
      const r = assertTransition("stay_bookings", "cancelled", "confirmed");
      expect(r.ok).toBe(false);
    });
    it("blocks same-status transition", () => {
      const r = assertTransition("stay_bookings", "pending", "pending");
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/already/i);
    });
    it("blocks skip from pending → checked_out", () => {
      const r = assertTransition("stay_bookings", "pending", "checked_out");
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/Cannot go from/i);
    });
    it("rejects invalid target status", () => {
      const r = assertTransition("stay_bookings", "pending", "exploded");
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not a valid status/i);
    });
  });

  describe("event_bookings", () => {
    it("allows pending → confirmed", () => {
      expect(assertTransition("event_bookings", "pending", "confirmed").ok).toBe(true);
    });
    it("allows confirmed → cancelled", () => {
      expect(assertTransition("event_bookings", "confirmed", "cancelled").ok).toBe(true);
    });
    it("blocks confirmed → pending", () => {
      expect(assertTransition("event_bookings", "confirmed", "pending").ok).toBe(false);
    });
    it("blocks cancelled → confirmed (terminal)", () => {
      const r = assertTransition("event_bookings", "cancelled", "confirmed");
      expect(r.ok).toBe(false);
    });
  });

  describe("dining_reservations", () => {
    it("allows pending → confirmed", () => {
      expect(assertTransition("dining_reservations", "pending", "confirmed").ok).toBe(true);
    });
    it("allows confirmed → seated", () => {
      expect(assertTransition("dining_reservations", "confirmed", "seated").ok).toBe(true);
    });
    it("allows seated → completed", () => {
      expect(assertTransition("dining_reservations", "seated", "completed").ok).toBe(true);
    });
    it("blocks seated → cancelled (after being seated)", () => {
      // seated → cancelled is NOT in the map — once seated you finish
      expect(assertTransition("dining_reservations", "seated", "cancelled").ok).toBe(false);
    });
  });

  describe("dining_orders", () => {
    it("allows received → preparing", () => {
      expect(assertTransition("dining_orders", "received", "preparing").ok).toBe(true);
    });
    it("allows preparing → ready", () => {
      expect(assertTransition("dining_orders", "preparing", "ready").ok).toBe(true);
    });
    it("allows ready → served", () => {
      expect(assertTransition("dining_orders", "ready", "served").ok).toBe(true);
    });
    it("allows received → cancelled", () => {
      expect(assertTransition("dining_orders", "received", "cancelled").ok).toBe(true);
    });
    it("blocks served → cancelled (terminal)", () => {
      const r = assertTransition("dining_orders", "served", "cancelled");
      expect(r.ok).toBe(false);
    });
    it("blocks received → served (skip stages)", () => {
      expect(assertTransition("dining_orders", "received", "served").ok).toBe(false);
    });
  });

  it("returns error for unknown table name", () => {
    const r = assertTransition("unknown_table", "pending", "confirmed");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/No status rules/i);
  });
});

// ─── parseDateOnly ────────────────────────────────────────────────────────────

describe("parseDateOnly", () => {
  it("parses a valid date string", () => {
    const d = parseDateOnly("2027-06-15");
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(5); // zero-indexed
    expect(d.getDate()).toBe(15);
  });
  it("returns null for an invalid calendar date (Feb 31)", () => {
    expect(parseDateOnly("2027-02-31")).toBeNull();
  });
  it("returns null for wrong format", () => {
    expect(parseDateOnly("15/06/2027")).toBeNull();
    expect(parseDateOnly("2027-6-5")).toBeNull();
  });
  it("returns null for non-string input", () => {
    expect(parseDateOnly(20270615)).toBeNull();
    expect(parseDateOnly(null)).toBeNull();
    expect(parseDateOnly(undefined)).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseDateOnly("")).toBeNull();
  });
  it("handles leap-year Feb 29 correctly", () => {
    // 2028 is a leap year
    expect(parseDateOnly("2028-02-29")).toBeInstanceOf(Date);
    // 2027 is not
    expect(parseDateOnly("2027-02-29")).toBeNull();
  });
});

// ─── parseIntInRange ─────────────────────────────────────────────────────────

describe("parseIntInRange", () => {
  const opts = { min: 1, max: 10, label: "Guests" };

  it("accepts a valid integer", () => {
    const r = parseIntInRange(5, opts);
    expect(r.ok).toBe(true);
    expect(r.value).toBe(5);
  });
  it("accepts boundary values", () => {
    expect(parseIntInRange(1, opts).ok).toBe(true);
    expect(parseIntInRange(10, opts).ok).toBe(true);
  });
  it("rejects values below minimum", () => {
    const r = parseIntInRange(0, opts);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/at least 1/);
  });
  it("rejects values above maximum", () => {
    const r = parseIntInRange(11, opts);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cannot exceed 10/);
  });
  it("rejects floating-point numbers", () => {
    const r = parseIntInRange(3.5, opts);
    expect(r.ok).toBe(false);
  });
  it("rejects non-numeric strings", () => {
    const r = parseIntInRange("abc", opts);
    expect(r.ok).toBe(false);
  });
  it("accepts numeric strings", () => {
    expect(parseIntInRange("7", opts).ok).toBe(true);
    expect(parseIntInRange("7", opts).value).toBe(7);
  });
});

// ─── sanitiseText ────────────────────────────────────────────────────────────

describe("sanitiseText", () => {
  it("trims whitespace and returns the string", () => {
    expect(sanitiseText("  hello  ")).toBe("hello");
  });
  it("returns null for empty or whitespace-only", () => {
    expect(sanitiseText("")).toBeNull();
    expect(sanitiseText("   ")).toBeNull();
  });
  it("returns null for null/undefined", () => {
    expect(sanitiseText(null)).toBeNull();
    expect(sanitiseText(undefined)).toBeNull();
  });
  it("truncates to maxLen", () => {
    const long = "a".repeat(600);
    expect(sanitiseText(long)).toHaveLength(500);
    expect(sanitiseText(long, 100)).toHaveLength(100);
  });
  it("does not truncate short strings", () => {
    expect(sanitiseText("short text")).toBe("short text");
  });
  it("converts non-string values to string before trimming", () => {
    expect(sanitiseText(42)).toBe("42");
  });
});

// ─── validateStayDates ───────────────────────────────────────────────────────

describe("validateStayDates", () => {
  it("accepts valid future dates", () => {
    const r = validateStayDates(dateOffset(1), dateOffset(3));
    expect(r.ok).toBe(true);
    expect(r.nights).toBe(2);
  });
  it("rejects check-in in the past", () => {
    const r = validateStayDates(dateOffset(-1), dateOffset(2));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/past/i);
  });
  it("rejects check-out not after check-in (same day)", () => {
    const d = dateOffset(2);
    const r = validateStayDates(d, d);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/one night/i);
  });
  it("rejects check-out before check-in", () => {
    const r = validateStayDates(dateOffset(5), dateOffset(3));
    expect(r.ok).toBe(false);
  });
  it("rejects stays longer than MAX_STAY_NIGHTS", () => {
    const r = validateStayDates(dateOffset(1), dateOffset(1 + MAX_STAY_NIGHTS + 1));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/limited to/i);
  });
  it("accepts exactly MAX_STAY_NIGHTS", () => {
    const r = validateStayDates(dateOffset(1), dateOffset(1 + MAX_STAY_NIGHTS));
    expect(r.ok).toBe(true);
    expect(r.nights).toBe(MAX_STAY_NIGHTS);
  });
  it("rejects bookings further than MAX_ADVANCE_BOOKING_DAYS out", () => {
    const r = validateStayDates(dateOffset(MAX_ADVANCE_BOOKING_DAYS + 5), dateOffset(MAX_ADVANCE_BOOKING_DAYS + 7));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/2 years/i);
  });
  it("returns error for malformed check-in date", () => {
    const r = validateStayDates("not-a-date", dateOffset(3));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/check-in/i);
  });
  it("returns error for malformed check-out date", () => {
    const r = validateStayDates(dateOffset(1), "also-bad");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/check-out/i);
  });
});

// ─── validateFutureDate ──────────────────────────────────────────────────────

describe("validateFutureDate", () => {
  it("accepts a future date", () => {
    const r = validateFutureDate(dateOffset(10), "Event Date");
    expect(r.ok).toBe(true);
    expect(r.value).toBeInstanceOf(Date);
  });
  it("accepts today (not in the past)", () => {
    const today = dateOffset(0);
    const r = validateFutureDate(today, "Event Date");
    expect(r.ok).toBe(true);
  });
  it("rejects a past date", () => {
    const r = validateFutureDate(dateOffset(-1), "Event Date");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/past/i);
  });
  it("rejects malformed date", () => {
    const r = validateFutureDate("2027/06/15", "Event Date");
    expect(r.ok).toBe(false);
  });
  it("rejects date too far ahead", () => {
    const r = validateFutureDate(dateOffset(MAX_ADVANCE_BOOKING_DAYS + 5));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/2 years/i);
  });
});

// ─── DINING_TIME_SLOTS ───────────────────────────────────────────────────────

describe("DINING_TIME_SLOTS", () => {
  it("has exactly 12 time slots", () => {
    expect(DINING_TIME_SLOTS).toHaveLength(12);
  });
  it("all slots match HH:MM format", () => {
    DINING_TIME_SLOTS.forEach(slot => {
      expect(slot).toMatch(/^\d{2}:\d{2}$/);
    });
  });
  it("contains lunch and dinner slots", () => {
    expect(DINING_TIME_SLOTS).toContain("12:00");
    expect(DINING_TIME_SLOTS).toContain("19:00");
  });
});
