/**
 * Tests for lib/invoice.js
 * Covers: charge computation, inverse function, confirmation code generation,
 * and invoice object builders.
 */

import { describe, it, expect } from "vitest";
import {
  computeCharges,
  chargesFromGrandTotal,
  generateConfirmationCode,
  fmtLKR,
  buildStayInvoice,
  buildEventInvoice,
  buildDiningInvoice,
  GOVERNMENT_LEVY_RATE,
  SERVICE_CHARGE_RATE,
} from "../lib/invoice.js";

// ─── computeCharges ──────────────────────────────────────────────────────────

describe("computeCharges", () => {
  it("computes correct breakdown from subtotal", () => {
    const r = computeCharges(100_000);
    expect(r.subtotal).toBe(100_000);
    expect(r.tax).toBe(5_000);          // 5%
    expect(r.service_charge).toBe(10_000); // 10%
    expect(r.grand_total).toBe(115_000);
  });

  it("grand_total = subtotal + tax + service_charge always", () => {
    [1, 999, 10_000, 285_000, 1_000_001].forEach(sub => {
      const r = computeCharges(sub);
      expect(r.grand_total).toBe(r.subtotal + r.tax + r.service_charge);
    });
  });

  it("returns zeros for zero subtotal", () => {
    const r = computeCharges(0);
    expect(r).toEqual({ subtotal: 0, tax: 0, service_charge: 0, grand_total: 0 });
  });

  it("handles negative input by flooring at 0", () => {
    const r = computeCharges(-5000);
    expect(r.subtotal).toBe(0);
    expect(r.grand_total).toBe(0);
  });

  it("rounds to whole rupees", () => {
    const r = computeCharges(1001); // 1001 × 0.05 = 50.05 → 50
    expect(Number.isInteger(r.tax)).toBe(true);
    expect(Number.isInteger(r.service_charge)).toBe(true);
  });

  it("converts string input to number", () => {
    const r = computeCharges("50000");
    expect(r.subtotal).toBe(50_000);
    expect(r.grand_total).toBe(57_500);
  });
});

// ─── chargesFromGrandTotal ────────────────────────────────────────────────────

describe("chargesFromGrandTotal", () => {
  it("grand_total of recovered parts equals the original stored total", () => {
    [10_000, 57_500, 115_000, 285_000, 327_750, 1_000_000].forEach(gt => {
      const r = chargesFromGrandTotal(gt);
      expect(r.grand_total).toBe(gt);
      expect(r.subtotal + r.tax + r.service_charge).toBe(gt);
    });
  });

  it("recovers correct subtotal from a round-trip", () => {
    const original = computeCharges(200_000);
    const recovered = chargesFromGrandTotal(original.grand_total);
    expect(recovered.subtotal).toBe(original.subtotal);
    expect(recovered.tax).toBe(original.tax);
  });

  it("does NOT double-charge tax", () => {
    // Bug guard: calling computeCharges on the grand_total would inflate it.
    const gt = 115_000;
    const r = chargesFromGrandTotal(gt);
    // If double-charged: computeCharges(115000).grand_total = 132,250 ≠ 115,000
    expect(r.grand_total).toBe(gt); // parts sum back to the original
    expect(r.subtotal).toBeLessThan(gt);
  });

  it("handles zero", () => {
    const r = chargesFromGrandTotal(0);
    expect(r.grand_total).toBe(0);
    expect(r.subtotal).toBe(0);
  });

  it("handles negative by treating as zero", () => {
    const r = chargesFromGrandTotal(-100);
    expect(r.grand_total).toBe(0);
  });

  it("all parts are non-negative integers", () => {
    const r = chargesFromGrandTotal(99_999);
    expect(r.subtotal).toBeGreaterThanOrEqual(0);
    expect(r.tax).toBeGreaterThanOrEqual(0);
    expect(r.service_charge).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(r.subtotal)).toBe(true);
    expect(Number.isInteger(r.tax)).toBe(true);
    expect(Number.isInteger(r.service_charge)).toBe(true);
  });
});

// ─── generateConfirmationCode ─────────────────────────────────────────────────

describe("generateConfirmationCode", () => {
  it("returns a string in the format PREFIX-YYYYMMDD-XXXXX", () => {
    const code = generateConfirmationCode("BK");
    expect(code).toMatch(/^BK-\d{8}-[A-Z0-9]{5}$/);
  });

  it("random suffix is always exactly 5 characters", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateConfirmationCode("ST");
      const parts = code.split("-");
      expect(parts[2]).toHaveLength(5);
    }
  });

  it("uses the provided prefix", () => {
    expect(generateConfirmationCode("EVT")).toMatch(/^EVT-/);
    expect(generateConfirmationCode("DIN")).toMatch(/^DIN-/);
  });

  it("uses default prefix BK when none provided", () => {
    expect(generateConfirmationCode()).toMatch(/^BK-/);
  });

  it("uses only Crockford-safe characters in the suffix (no I/O/0/1)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateConfirmationCode("TST");
      const suffix = code.split("-")[2];
      expect(suffix).not.toMatch(/[IO01]/);
    }
  });

  it("generates unique codes across repeated calls", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateConfirmationCode("BK")));
    // In practice all 100 should differ — probability of collision is ~0
    expect(codes.size).toBeGreaterThan(90);
  });
});

// ─── fmtLKR ──────────────────────────────────────────────────────────────────

describe("fmtLKR", () => {
  it("formats with LKR prefix", () => {
    expect(fmtLKR(0)).toBe("LKR 0");
    expect(fmtLKR(1000)).toMatch(/^LKR /);
  });
  it("handles large numbers", () => {
    const s = fmtLKR(1_000_000);
    expect(s).toMatch(/^LKR /);
    expect(s).toContain("1");
  });
});

// ─── buildStayInvoice ────────────────────────────────────────────────────────

describe("buildStayInvoice", () => {
  const booking = {
    confirmation_code: "BK-20260828-ABCDE",
    check_in_date: "2026-09-10",
    check_out_date: "2026-09-13",
    nights: 3,
    guests_adult: 2,
    guests_child: 1,
    rate_per_night: 25_000,
    total_amount: 86_250, // computeCharges(75000).grand_total
    status: "confirmed",
    special_requests: "High floor please",
    created_at: "2026-08-28T10:00:00Z",
  };
  const roomType = { name: "Deluxe Ocean Room" };
  const user = { name: "Saman Perera", email: "saman@example.com", phone: "+94771234567" };

  it("returns an invoice with the correct structure", () => {
    const inv = buildStayInvoice(booking, roomType, user);
    expect(inv.invoice_number).toBe("INV-BK-20260828-ABCDE");
    expect(inv.type).toBe("Accommodation");
    expect(inv.guest.name).toBe("Saman Perera");
    expect(inv.booking.nights).toBe(3);
    expect(inv.booking.confirmation_code).toBe("BK-20260828-ABCDE");
  });

  it("totals sum correctly (no double-tax)", () => {
    const inv = buildStayInvoice(booking, roomType, user);
    // Extract numeric values from formatted LKR strings
    const parse = s => Number(s.replace(/[^0-9]/g, ""));
    const sub = parse(inv.totals.subtotal);
    const tax = parse(inv.totals.tax);
    const svc = parse(inv.totals.service_charge);
    const gt  = parse(inv.totals.grand_total);
    expect(sub + tax + svc).toBe(gt);
    expect(gt).toBe(booking.total_amount);
  });

  it("includes a line item for nights at rate", () => {
    const inv = buildStayInvoice(booking, roomType, user);
    expect(inv.line_items).toHaveLength(1);
    expect(inv.line_items[0].qty).toBe(3);
    expect(inv.line_items[0].description).toMatch(/3 night/i);
  });

  it("handles missing optional user gracefully", () => {
    const inv = buildStayInvoice(booking, roomType, null);
    expect(inv.guest.name).toBe("Guest");
  });
});

// ─── buildEventInvoice ───────────────────────────────────────────────────────

describe("buildEventInvoice", () => {
  const booking = {
    id: 42,
    event_type: "wedding",
    event_date: "2026-12-15",
    guests: 120,
    venue_name: "Grand Ballroom",
    venue_cost: 50_000,
    menu_name: "Royal Banquet",
    menu_price_per_head: 3_500,
    decoration_name: "Floral Fantasy",
    decoration_cost: 25_000,
    total_cost: 550_250,
    status: "confirmed",
    created_at: "2026-08-28T10:00:00Z",
  };
  const user = { name: "Ayesha Fernando", email: "ayesha@example.com" };

  it("generates a properly structured event invoice", () => {
    const inv = buildEventInvoice(booking, user);
    expect(inv.invoice_number).toBe("INV-EVT-42");
    expect(inv.type).toBe("Event");
    expect(inv.booking.event_type).toBe("Wedding");
  });

  it("line items include venue, menu, and decoration", () => {
    const inv = buildEventInvoice(booking, user);
    expect(inv.line_items).toHaveLength(3);
    const descs = inv.line_items.map(l => l.description);
    expect(descs.some(d => d.includes("Grand Ballroom"))).toBe(true);
    expect(descs.some(d => d.includes("Royal Banquet"))).toBe(true);
    expect(descs.some(d => d.includes("Floral Fantasy"))).toBe(true);
  });

  it("invoice totals reconstruct from stored grand total without double-tax", () => {
    const inv = buildEventInvoice(booking, user);
    const parse = s => Number(s.replace(/[^0-9]/g, ""));
    const gt = parse(inv.totals.grand_total);
    expect(gt).toBe(booking.total_cost);
  });

  it("shows Included when cost fields are null", () => {
    const b = { ...booking, venue_cost: null, decoration_cost: null };
    const inv = buildEventInvoice(b, user);
    const venueLine = inv.line_items.find(l => l.description.includes("Grand Ballroom"));
    expect(venueLine.unit).toBe("Included");
  });
});

// ─── buildDiningInvoice ──────────────────────────────────────────────────────

describe("buildDiningInvoice", () => {
  const reservation = {
    confirmation_code: "DIN-20260828-XYZAB",
    reservation_date: "2026-09-05",
    time_slot: "19:00",
    covers: 2,
    status: "confirmed",
    special_requests: null,
  };
  const order = {
    total_amount: 6_900,
    items: [
      { name: "Grilled Barramundi", quantity: 2, unit_price: 2_800 },
      { name: "Caesar Salad",       quantity: 1, unit_price: 1_300 },
    ],
  };
  const user = { name: "Kasun Silva", email: "kasun@example.com" };

  it("returns a dining invoice with order line items", () => {
    const inv = buildDiningInvoice(reservation, order, user);
    expect(inv.type).toBe("Dining");
    expect(inv.line_items).toHaveLength(2);
    expect(inv.line_items[0].description).toBe("Grilled Barramundi");
    expect(inv.line_items[0].qty).toBe(2);
  });

  it("totals sum correctly from stored amount", () => {
    const inv = buildDiningInvoice(reservation, order, user);
    const parse = s => Number(s.replace(/[^0-9]/g, ""));
    const gt = parse(inv.totals.grand_total);
    expect(gt).toBe(order.total_amount);
  });

  it("returns null totals when no order placed yet", () => {
    const inv = buildDiningInvoice(reservation, null, user);
    expect(inv.totals).toBeNull();
    expect(inv.line_items).toHaveLength(0);
  });
});
