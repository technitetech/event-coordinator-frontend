/**
 * Tests for lib/restaurant.js — DB layer mocked.
 * Covers: menu retrieval, time slot availability, reservation creation,
 * cancellation rules, order placement, and order status transitions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockConn = {
  query: vi.fn(),
  beginTransaction: vi.fn().mockResolvedValue(undefined),
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
  release: vi.fn(),
};

vi.mock("../lib/db.js", () => ({
  getPool: () => ({
    query: mockQuery,
    getConnection: vi.fn().mockResolvedValue(mockConn),
  }),
}));

vi.mock("../lib/invoice.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    generateUniqueConfirmationCode: vi.fn().mockResolvedValue("DIN-20260828-ABCDE"),
  };
});

import {
  getMenuWithCategories,
  getAvailableTimeSlots,
  createDiningReservation,
  cancelDiningReservation,
  submitDiningOrder,
  updateOrderStatus,
} from "../lib/restaurant.js";

function dateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockConn.query.mockReset();
  mockConn.beginTransaction.mockResolvedValue(undefined);
  mockConn.commit.mockResolvedValue(undefined);
  mockConn.rollback.mockResolvedValue(undefined);
});

// ─── getMenuWithCategories ────────────────────────────────────────────────────

describe("getMenuWithCategories", () => {
  it("groups menu items under their categories", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, name: "Starters" }, { id: 2, name: "Mains" }]])
      .mockResolvedValueOnce([[
        { id: 10, category_id: 1, name: "Bruschetta", is_available: 1 },
        { id: 11, category_id: 2, name: "Barramundi", is_available: 1 },
        { id: 12, category_id: 2, name: "Steak", is_available: 1 },
      ]]);
    const menu = await getMenuWithCategories();
    expect(menu).toHaveLength(2);
    expect(menu[0].items).toHaveLength(1);
    expect(menu[1].items).toHaveLength(2);
    expect(menu[1].items[0].name).toBe("Barramundi");
  });

  it("returns empty items array for categories with no items", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 3, name: "Desserts" }]])
      .mockResolvedValueOnce([[]]); // no items
    const menu = await getMenuWithCategories();
    expect(menu[0].items).toHaveLength(0);
  });
});

// ─── getAvailableTimeSlots ────────────────────────────────────────────────────

describe("getAvailableTimeSlots", () => {
  it("returns empty array for invalid date", async () => {
    const slots = await getAvailableTimeSlots("not-a-date", 2);
    expect(slots).toHaveLength(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns empty array for past date", async () => {
    const slots = await getAvailableTimeSlots(dateOffset(-1), 2);
    expect(slots).toHaveLength(0);
  });

  it("returns empty array when no tables can fit the party", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no eligible tables
    const slots = await getAvailableTimeSlots(dateOffset(3), 2);
    expect(slots).toHaveLength(0);
  });

  it("returns empty array for invalid cover count", async () => {
    const slots = await getAvailableTimeSlots(dateOffset(3), 0); // below MIN_DINING_COVERS
    expect(slots).toHaveLength(0);
  });

  it("returns empty array when covers exceed maximum", async () => {
    const slots = await getAvailableTimeSlots(dateOffset(3), 15); // above MAX_DINING_COVERS
    expect(slots).toHaveLength(0);
  });

  it("returns available slots with table count", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]) // 2 eligible tables
      .mockResolvedValueOnce([[{ time_slot: "19:00", cnt: "1" }]]); // 1 booked at 19:00
    const slots = await getAvailableTimeSlots(dateOffset(5), 2);
    // All DINING_TIME_SLOTS should appear with tables_available computed correctly
    const slot19 = slots.find(s => s.slot === "19:00");
    expect(slot19).toBeDefined();
    expect(slot19.tables_available).toBe(1); // 2 tables - 1 booked
    // A slot with no bookings should have all tables available
    const slot20 = slots.find(s => s.slot === "20:00");
    if (slot20) expect(slot20.tables_available).toBe(2);
  });

  it("excludes fully-booked slots", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1 }]]) // 1 eligible table
      .mockResolvedValueOnce([[{ time_slot: "19:00", cnt: "1" }]]); // fully booked at 19:00
    const slots = await getAvailableTimeSlots(dateOffset(5), 2);
    expect(slots.find(s => s.slot === "19:00")).toBeUndefined();
  });
});

// ─── createDiningReservation ──────────────────────────────────────────────────

describe("createDiningReservation", () => {
  const validInput = {
    userId: 5,
    date: dateOffset(3),
    timeSlot: "19:00",
    covers: 2,
    specialRequests: "Window seat please",
    dietary: "vegetarian",
    occasion: "birthday",
  };

  function setupSuccessfulReservation() {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 3 }]]) // eligible tables
      .mockResolvedValueOnce([[{ id: 3 }]]) // findAvailableTable FOR UPDATE
      .mockResolvedValueOnce([{ insertId: 42 }]); // INSERT
  }

  it("creates a reservation and returns ok with confirmation_code", async () => {
    setupSuccessfulReservation();
    const r = await createDiningReservation(validInput);
    expect(r.ok).toBe(true);
    expect(r.reservation.confirmation_code).toBe("DIN-20260828-ABCDE");
    expect(mockConn.commit).toHaveBeenCalledOnce();
  });

  it("rejects when userId is missing", async () => {
    const r = await createDiningReservation({ ...validInput, userId: null });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/signed in/i);
  });

  it("rejects invalid date", async () => {
    const r = await createDiningReservation({ ...validInput, date: "bad-date" });
    expect(r.ok).toBe(false);
  });

  it("rejects past date", async () => {
    const r = await createDiningReservation({ ...validInput, date: dateOffset(-2) });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/past/i);
  });

  it("rejects an invalid time slot", async () => {
    const r = await createDiningReservation({ ...validInput, timeSlot: "15:45" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/seating time/i);
  });

  it("rejects covers above maximum with private dining message", async () => {
    const r = await createDiningReservation({ ...validInput, covers: 15 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/private-dining|contact/i);
  });

  it("rejects when no table is available", async () => {
    // The function does ONE query inside the transaction (FOR UPDATE) that returns empty
    mockConn.query.mockResolvedValueOnce([[]]); // no available table in transaction
    const r = await createDiningReservation(validInput);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/No tables are available/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rolls back and re-throws on unexpected DB error", async () => {
    mockConn.query.mockRejectedValueOnce(new Error("Timeout"));
    await expect(createDiningReservation(validInput)).rejects.toThrow("Timeout");
    expect(mockConn.rollback).toHaveBeenCalled();
  });
});

// ─── cancelDiningReservation ──────────────────────────────────────────────────

describe("cancelDiningReservation", () => {
  it("returns not-found when reservation missing (null id)", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // null id → empty result
    const r = await cancelDiningReservation(null, 1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it("returns error when reservation not found / not owned", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // not found
    const r = await cancelDiningReservation(99, 5);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it("rejects cancellation of already-cancelled reservation", async () => {
    mockQuery.mockResolvedValueOnce([[{
      id: 1, user_id: 5, status: "cancelled",
      reservation_date: dateOffset(3), time_slot: "19:00",
    }]]);
    const r = await cancelDiningReservation(1, 5);
    expect(r.ok).toBe(false);
    // state machine says cancelled is terminal
    expect(r.error).toMatch(/Cannot cancel/i);
  });

  it("rejects cancellation within 2 hours of reservation", async () => {
    // Yesterday's date at any slot → hoursUntil is deeply negative (<2), always rejected
    const yesterday = dateOffset(-1);
    mockQuery.mockResolvedValueOnce([[{
      id: 1, user_id: 5, status: "confirmed",
      reservation_date: yesterday, time_slot: "12:00",
    }]]);
    const r = await cancelDiningReservation(1, 5);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/hours before/i);
  });

  it("cancels successfully when well before reservation time", async () => {
    mockQuery
      .mockResolvedValueOnce([[{
        id: 1, user_id: 5, status: "confirmed",
        reservation_date: dateOffset(5), time_slot: "19:00",
      }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const r = await cancelDiningReservation(1, 5);
    expect(r.ok).toBe(true);
  });
});

// ─── submitDiningOrder ────────────────────────────────────────────────────────

describe("submitDiningOrder", () => {
  // The function signature is submitDiningOrder({ reservationId, userId, items })
  // items use menu_item_id (not menuItemId), quantity up to 50
  const validOrder = {
    userId: 5,
    reservationId: 10,
    items: [{ menu_item_id: 1, quantity: 2 }],
  };

  it("proceeds without signed-in guard (userId is required but not checked before DB)", async () => {
    // The function does a DB check for the reservation, not a userId null check up front
    // It will try to query the DB even with userId undefined. We set up empty result.
    mockConn.query.mockResolvedValueOnce([[]]); // reservation not found for user=undefined
    const r = await submitDiningOrder({ ...validOrder, userId: undefined });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it("rejects when reservation not owned by user or not found", async () => {
    mockConn.query.mockResolvedValueOnce([[]]); // not found/not confirmed
    const r = await submitDiningOrder(validOrder);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rejects when reservation is in cancelled state", async () => {
    mockConn.query.mockResolvedValueOnce([[{ id: 10, user_id: 5, status: "cancelled" }]]);
    const r = await submitDiningOrder(validOrder);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cancelled/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rejects quantity below 1", async () => {
    mockConn.query.mockResolvedValueOnce([[{ id: 10, user_id: 5, status: "confirmed" }]]);
    // First mock: reservation found, second mock: menu item lookup, third fails on qty validation
    mockConn.query.mockResolvedValueOnce([[{ id: 1, name: "Soup", price: 800 }]]);
    const r = await submitDiningOrder({ ...validOrder, items: [{ menu_item_id: 1, quantity: 0 }] });
    expect(r.ok).toBe(false);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rejects quantity above 50", async () => {
    mockConn.query.mockResolvedValueOnce([[{ id: 10, user_id: 5, status: "confirmed" }]]);
    mockConn.query.mockResolvedValueOnce([[{ id: 1, name: "Soup", price: 800 }]]);
    const r = await submitDiningOrder({ ...validOrder, items: [{ menu_item_id: 1, quantity: 51 }] });
    expect(r.ok).toBe(false);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("creates order with server-side prices and returns total", async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 10, user_id: 5, status: "confirmed" }]])  // reservation
      .mockResolvedValueOnce([[{ id: 1, name: "Barramundi", price: 2_800 }]])  // menu items
      .mockResolvedValueOnce([{ insertId: 88 }])   // INSERT order
      .mockResolvedValueOnce([{ insertId: 200 }]);  // INSERT order item
    const r = await submitDiningOrder(validOrder);
    expect(r.ok).toBe(true);
    expect(mockConn.commit).toHaveBeenCalledOnce();
    // grand total = computeCharges(5600).grand_total = 6440
    expect(r.total).toBe(6440);
    expect(r.subtotal).toBe(5600);
  });

  it("rejects when a menu item is unavailable", async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 10, user_id: 5, status: "confirmed" }]])
      .mockResolvedValueOnce([[]]); // no matching available menu items
    const r = await submitDiningOrder(validOrder);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no longer available/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });
});

// ─── updateOrderStatus ────────────────────────────────────────────────────────

describe("updateOrderStatus", () => {
  // updateOrderStatus(orderId, newStatus) — fetches current status from DB first

  it("blocks invalid transition (DB=received, trying to jump to served)", async () => {
    mockQuery.mockResolvedValueOnce([[{ status: "received" }]]);
    const r = await updateOrderStatus(1, "served");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Cannot go from/i);
  });

  it("allows valid transition (DB=received → preparing)", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ status: "received" }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const r = await updateOrderStatus(1, "preparing");
    expect(r.ok).toBe(true);
    expect(r.from).toBe("received");
    expect(r.to).toBe("preparing");
  });

  it("blocks updating a terminal served order (DB=served)", async () => {
    mockQuery.mockResolvedValueOnce([[{ status: "served" }]]);
    const r = await updateOrderStatus(1, "cancelled");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/final state/i);
  });

  it("returns not-found when order does not exist", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const r = await updateOrderStatus(999, "preparing");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});
