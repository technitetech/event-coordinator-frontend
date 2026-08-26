/**
 * lib/validation.js — Shared input validation and status-transition rules.
 *
 * Previously each booking domain accepted whatever the client sent and wrote
 * whatever status string an admin picked, with no state machine at all. This
 * module centralises those rules so every entry point enforces the same ones.
 */

// ---------------------------------------------------------------------------
// Status state machines. Keys are current status; values are legal next states.
// Terminal states map to an empty array. These mirror the ENUM definitions in
// hotel_full_schema.sql exactly — an invalid value silently becomes '' under
// MySQL's non-strict mode, so it must never reach the query.
// ---------------------------------------------------------------------------

export const STAY_STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];
export const STAY_TRANSITIONS = {
  pending:     ["confirmed", "cancelled", "no_show"],
  confirmed:   ["checked_in", "cancelled", "no_show"],
  checked_in:  ["checked_out"],
  checked_out: [],
  cancelled:   [],
  no_show:     [],
};

// event_bookings.status is ENUM('pending','confirmed','cancelled') — there is
// deliberately no 'completed' member, so it must not appear here.
export const EVENT_STATUSES = ["pending", "confirmed", "cancelled"];
export const EVENT_TRANSITIONS = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

export const DINING_RES_STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];
export const DINING_RES_TRANSITIONS = {
  pending:   ["confirmed", "cancelled", "no_show"],
  confirmed: ["seated", "cancelled", "no_show"],
  seated:    ["completed"],
  completed: [],
  cancelled: [],
  no_show:   [],
};

// Kitchen tickets move forward one step at a time; cancel is allowed until served.
export const ORDER_STATUSES = ["received", "preparing", "ready", "served", "cancelled"];
export const ORDER_TRANSITIONS = {
  received:  ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready:     ["served", "cancelled"],
  served:    [],
  cancelled: [],
};

const TRANSITION_MAPS = {
  stay_bookings:       STAY_TRANSITIONS,
  event_bookings:      EVENT_TRANSITIONS,
  dining_reservations: DINING_RES_TRANSITIONS,
  dining_orders:       ORDER_TRANSITIONS,
};

/**
 * Validates a status change against the entity's state machine.
 * Returns { ok: true } or { ok: false, error }.
 */
export function assertTransition(tableName, fromStatus, toStatus) {
  const map = TRANSITION_MAPS[tableName];
  if (!map) return { ok: false, error: `No status rules defined for '${tableName}'.` };

  if (!Object.prototype.hasOwnProperty.call(map, toStatus)) {
    return { ok: false, error: `'${toStatus}' is not a valid status.` };
  }
  if (fromStatus === toStatus) {
    return { ok: false, error: `The record is already '${toStatus}'.` };
  }

  const allowed = map[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    return {
      ok: false,
      error: allowed.length === 0
        ? `'${fromStatus}' is a final state and cannot be changed.`
        : `Cannot go from '${fromStatus}' to '${toStatus}'. Allowed: ${allowed.join(", ")}.`,
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today at 00:00 local time — the boundary for "in the past". */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parses a YYYY-MM-DD string into a local-midnight Date.
 * Returns null when the string is malformed or not a real calendar date
 * (e.g. 2027-02-31, which `new Date()` would silently roll to March 3).
 */
export function parseDateOnly(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** Bounded positive integer check. */
export function parseIntInRange(value, { min, max, label }) {
  const n = Number(value);
  if (!Number.isInteger(n)) return { ok: false, error: `${label} must be a whole number.` };
  if (n < min) return { ok: false, error: `${label} must be at least ${min}.` };
  if (n > max) return { ok: false, error: `${label} cannot exceed ${max}.` };
  return { ok: true, value: n };
}

/** Trims and length-caps free text; returns null for empty input. */
export function sanitiseText(value, maxLen = 500) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

// ---------------------------------------------------------------------------
// Domain-specific rule constants
// ---------------------------------------------------------------------------

export const MAX_STAY_NIGHTS = 30;
export const MAX_ADVANCE_BOOKING_DAYS = 730; // 2 years
export const MIN_DINING_COVERS = 1;
export const MAX_DINING_COVERS = 12;
export const MAX_EVENT_GUESTS = 500;
export const CANCELLATION_NOTICE_HOURS = 24;
export const DINING_CANCELLATION_NOTICE_HOURS = 2;

/** The only time slots the restaurant accepts bookings for. */
export const DINING_TIME_SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
];

/**
 * Shared validation for a stay date range.
 * Returns { ok, nights } or { ok: false, error }.
 */
export function validateStayDates(checkIn, checkOut) {
  const inDate = parseDateOnly(checkIn);
  const outDate = parseDateOnly(checkOut);

  if (!inDate) return { ok: false, error: "Please provide a valid check-in date (YYYY-MM-DD)." };
  if (!outDate) return { ok: false, error: "Please provide a valid check-out date (YYYY-MM-DD)." };

  if (inDate < startOfToday()) {
    return { ok: false, error: "Check-in date cannot be in the past." };
  }

  const nights = Math.round((outDate - inDate) / 86400000);
  if (nights < 1) return { ok: false, error: "Check-out must be at least one night after check-in." };
  if (nights > MAX_STAY_NIGHTS) {
    return { ok: false, error: `Stays are limited to ${MAX_STAY_NIGHTS} nights. Please contact us for extended stays.` };
  }

  const daysAhead = Math.round((inDate - startOfToday()) / 86400000);
  if (daysAhead > MAX_ADVANCE_BOOKING_DAYS) {
    return { ok: false, error: "Bookings can only be made up to 2 years in advance." };
  }

  return { ok: true, nights };
}

/**
 * Shared validation for a future-dated event/dining date.
 */
export function validateFutureDate(value, label = "Date") {
  const d = parseDateOnly(value);
  if (!d) return { ok: false, error: `Please provide a valid ${label.toLowerCase()} (YYYY-MM-DD).` };
  if (d < startOfToday()) return { ok: false, error: `${label} cannot be in the past.` };

  const daysAhead = Math.round((d - startOfToday()) / 86400000);
  if (daysAhead > MAX_ADVANCE_BOOKING_DAYS) {
    return { ok: false, error: `${label} can only be set up to 2 years in advance.` };
  }
  return { ok: true, value: d };
}
