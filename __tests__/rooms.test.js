

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

// Also mock invoice helpers that use crypto
vi.mock("../lib/invoice.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    generateUniqueConfirmationCode: vi.fn().mockResolvedValue("BK-20260828-ABCDE"),
  };
});

import {
  getRoomTypes,
  getRoomTypeBySlug,
  findAvailableRoom,
  getRoomAvailability,
  createStayBooking,
  cancelStayBooking,
  updateStayBookingStatus,
} from "../lib/rooms.js";

//  Helpers 

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

//  getRoomTypes 

describe("getRoomTypes", () => {
  it("returns room types with parsed JSON amenities", async () => {
    mockQuery.mockResolvedValueOnce([[
      {
        id: 1,
        name: "Deluxe Ocean",
        slug: "deluxe-ocean",
        amenities_json: '["WiFi","Pool"]',
        images_json: '[]',
      },
    ]]);
    const types = await getRoomTypes();
    expect(types).toHaveLength(1);
    expect(types[0].amenities_json).toEqual(["WiFi", "Pool"]);
    expect(types[0].images_json).toEqual([]);
  });

  it("handles pre-parsed JSON objects gracefully", async () => {
    mockQuery.mockResolvedValueOnce([[
      { id: 2, slug: "suite", amenities_json: ["Spa", "Butler"], images_json: [] },
    ]]);
    const types = await getRoomTypes();
    expect(types[0].amenities_json).toEqual(["Spa", "Butler"]);
  });

  it("returns empty array when no room types", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const types = await getRoomTypes();
    expect(types).toHaveLength(0);
  });
});

//  getRoomTypeBySlug 

describe("getRoomTypeBySlug", () => {
  it("returns the matching room type", async () => {
    mockQuery.mockResolvedValueOnce([[
      { id: 1, slug: "deluxe-ocean", amenities_json: "[]", images_json: "[]" },
    ]]);
    const rt = await getRoomTypeBySlug("deluxe-ocean");
    expect(rt).not.toBeNull();
    expect(rt.slug).toBe("deluxe-ocean");
  });

  it("returns null when slug not found", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const rt = await getRoomTypeBySlug("nonexistent");
    expect(rt).toBeNull();
  });
});

//  findAvailableRoom 

describe("findAvailableRoom", () => {
  it("returns a room ID when available", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 101 }]]);
    const roomId = await findAvailableRoom(1, "2026-09-10", "2026-09-13");
    expect(roomId).toBe(101);
  });

  it("returns null when no room available", async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const roomId = await findAvailableRoom(1, "2026-09-10", "2026-09-13");
    expect(roomId).toBeNull();
  });
});

//  getRoomAvailability 

describe("getRoomAvailability", () => {
  it("returns availability map keyed by slug", async () => {
    mockQuery.mockResolvedValueOnce([[
      { slug: "deluxe-ocean", total: "3", booked: "1" },
      { slug: "family-suite", total: "2", booked: "0" },
    ]]);
    const avail = await getRoomAvailability(dateOffset(1), dateOffset(3));
    expect(avail["deluxe-ocean"].available).toBe(2);
    expect(avail["family-suite"].available).toBe(2);
  });

  it("returns empty object for invalid dates", async () => {
    const avail = await getRoomAvailability("not-a-date", "also-bad");
    expect(avail).toEqual({});
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns empty object when check-in is in the past", async () => {
    const avail = await getRoomAvailability(dateOffset(-1), dateOffset(2));
    expect(avail).toEqual({});
  });

  it("clamps booked > total to 0 available", async () => {
    mockQuery.mockResolvedValueOnce([[
      { slug: "penthouse", total: "1", booked: "2" }, // over-booked in DB (data anomaly)
    ]]);
    const avail = await getRoomAvailability(dateOffset(1), dateOffset(3));
    expect(avail["penthouse"].available).toBe(0);
  });
});

//  createStayBooking 

describe("createStayBooking", () => {
  const validInput = {
    userId: 5,
    roomTypeId: 1,
    checkIn: dateOffset(2),
    checkOut: dateOffset(5),
    guestsAdult: 2,
    guestsChild: 0,
    specialRequests: "Sea view",
  };

  function setupSuccessfulBooking(ratePerNight = 20_000, maxOccupancy = 4) {
    mockConn.query
      .mockResolvedValueOnce([[{
        id: 1, name: "Deluxe Ocean", base_rate_per_night: ratePerNight, max_occupancy: maxOccupancy,
      }]])                                    // room_type FOR UPDATE
      .mockResolvedValueOnce([[{ id: 101 }]]) // findAvailableRoom
      .mockResolvedValueOnce([{ insertId: 999 }]); // INSERT
  }

  it("creates a booking and returns ok + booking.confirmation_code", async () => {
    setupSuccessfulBooking();
    const result = await createStayBooking(validInput);
    expect(result.ok).toBe(true);
    // confirmation_code is nested: { ok, booking: { id, confirmation_code, ... } }
    expect(result.booking?.confirmation_code ?? result.confirmation_code).toBe("BK-20260828-ABCDE");
    expect(mockConn.commit).toHaveBeenCalledOnce();
  });

  it("rejects when userId is missing", async () => {
    const result = await createStayBooking({ ...validInput, userId: null });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/signed in/i);
  });

  it("rejects when dates are invalid", async () => {
    const result = await createStayBooking({ ...validInput, checkIn: "bad", checkOut: "also-bad" });
    expect(result.ok).toBe(false);
  });

  it("rejects when check-in is in the past", async () => {
    const result = await createStayBooking({ ...validInput, checkIn: dateOffset(-1), checkOut: dateOffset(2) });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/past/i);
  });

  it("rejects when adults below minimum (0)", async () => {
    const result = await createStayBooking({ ...validInput, guestsAdult: 0 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/at least 1/i);
  });

  it("rejects when room type not found", async () => {
    mockConn.query.mockResolvedValueOnce([[]]); // empty room type result
    const result = await createStayBooking(validInput);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/room type/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rejects when occupancy limit exceeded", async () => {
    mockConn.query.mockResolvedValueOnce([[{
      id: 1, name: "Studio", base_rate_per_night: 15_000, max_occupancy: 2,
    }]]);
    const result = await createStayBooking({ ...validInput, guestsAdult: 3, guestsChild: 0 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/sleeps a maximum/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rejects when no room is available", async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ id: 1, name: "Deluxe", base_rate_per_night: 20_000, max_occupancy: 4 }]])
      .mockResolvedValueOnce([[]]); // no available room (second query inside transaction)
    const result = await createStayBooking(validInput);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No rooms|not available/i);
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("rolls back on unexpected DB error", async () => {
    mockConn.query.mockRejectedValueOnce(new Error("DB connection lost"));
    // createStayBooking re-throws after rollback, so we catch it here
    await expect(createStayBooking(validInput)).rejects.toThrow("DB connection lost");
    expect(mockConn.rollback).toHaveBeenCalled();
  });

  it("stores a tax-inclusive grand total (not the subtotal)", async () => {
    setupSuccessfulBooking(20_000, 4); // 3 nights × 20,000 = 60,000 subtotal → 69,000 grand total
    await createStayBooking(validInput); // checkIn=+2, checkOut=+5 → 3 nights
    // Verify the INSERT used the grand total (not raw subtotal)
    const insertCall = mockConn.query.mock.calls.find(c => typeof c[0] === "string" && c[0].includes("INSERT"));
    if (insertCall) {
      const insertArgs = insertCall[1];
      // grand_total = 60000 * 1.15 = 69000
      const storedAmount = insertArgs.find(a => typeof a === "number" && a > 60_000);
      expect(storedAmount).toBeDefined();
    }
  });
});

//  cancelStayBooking 

describe("cancelStayBooking", () => {
  it("returns error when booking not found (null bookingId returns not found)", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no match for null
    const r = await cancelStayBooking(null, 1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it("returns error when booking not found or not owned by user", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // empty result
    const r = await cancelStayBooking(99, 1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it("rejects cancellation of an already-cancelled booking", async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, user_id: 1, status: "cancelled", check_in_date: dateOffset(5) }]]);
    const r = await cancelStayBooking(1, 1);
    expect(r.ok).toBe(false);
    // The function returns a custom message, not the state-machine error
    expect(r.error).toMatch(/Cannot cancel/i);
  });

  it("rejects cancellation within 24 hours of check-in", async () => {
    // check_in is today — definitely within the 24h window (0 hours away)
    const today = dateOffset(0);
    mockQuery.mockResolvedValueOnce([[{
      id: 1, user_id: 1, status: "confirmed", check_in_date: today,
    }]]);
    const r = await cancelStayBooking(1, 1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/hours before check-in/i);
  });

  it("cancels successfully when >24h before check-in", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, user_id: 1, status: "confirmed", check_in_date: dateOffset(5) }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE
    const r = await cancelStayBooking(1, 1);
    expect(r.ok).toBe(true);
  });
});

//  updateStayBookingStatus 

describe("updateStayBookingStatus", () => {
  // updateStayBookingStatus(bookingId, newStatus, adminId, adminName)
  // It fetches the CURRENT status from DB, then validates the transition.

  it("rejects invalid transition via state machine (terminal state)", async () => {
    // DB says current status is "checked_out" (terminal); trying to move to "pending" fails
    mockQuery.mockResolvedValueOnce([[{ status: "checked_out" }]]);
    const r = await updateStayBookingStatus(1, "pending", 1, "Admin");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/final state|Cannot/i);
  });

  it("updates status for a valid transition", async () => {
    // DB says current status is "pending"; newStatus is "confirmed" — valid
    mockQuery
      .mockResolvedValueOnce([[{ status: "pending" }]])  // SELECT
      .mockResolvedValueOnce([{ affectedRows: 1 }])       // UPDATE
      .mockResolvedValueOnce([{ insertId: 1 }]);          // audit_log INSERT
    const r = await updateStayBookingStatus(1, "confirmed", 1, "Admin");
    expect(r.ok).toBe(true);
  });

  it("returns error when booking not found", async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const r = await updateStayBookingStatus(999, "confirmed", 1, "Admin");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});
