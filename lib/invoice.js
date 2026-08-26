/**
 * lib/invoice.js — Confirmation code generation, invoice number, tax maths,
 * and formatted invoice data.
 */

import crypto from "crypto";

/** Statutory charges applied to every bookable item. */
export const GOVERNMENT_LEVY_RATE = 0.05; // 5%
export const SERVICE_CHARGE_RATE = 0.10; // 10%

/**
 * Single source of truth for money maths. Every surface that shows or stores
 * a total (checkout page, DB row, invoice, revenue report) must go through
 * this so the figures agree. All values are rounded to whole rupees.
 */
export function computeCharges(subtotal) {
  const sub = Math.max(0, Math.round(Number(subtotal) || 0));
  const tax = Math.round(sub * GOVERNMENT_LEVY_RATE);
  const service = Math.round(sub * SERVICE_CHARGE_RATE);
  return { subtotal: sub, tax, service_charge: service, grand_total: sub + tax + service };
}

/**
 * Inverse of computeCharges: recovers the pre-tax breakdown from a stored
 * tax-inclusive total. Booking rows persist the grand total, so an invoice
 * must work backwards — treating that figure as the subtotal and adding tax
 * again would double-charge and make the printed lines fail to sum.
 *
 * The remainder is folded into the service charge so the parts always add
 * back to exactly the stored total despite rounding.
 */
export function chargesFromGrandTotal(grandTotal) {
  const total = Math.max(0, Math.round(Number(grandTotal) || 0));
  const rate = 1 + GOVERNMENT_LEVY_RATE + SERVICE_CHARGE_RATE;
  const sub = Math.round(total / rate);
  const tax = Math.round(sub * GOVERNMENT_LEVY_RATE);
  const service = total - sub - tax;
  return { subtotal: sub, tax, service_charge: service, grand_total: total };
}

// Crockford-style alphabet: no I/O/0/1, so codes read unambiguously aloud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates a confirmation code in the format PREFIX-YYYYMMDD-XXXXX.
 *
 * The previous implementation used Math.random().toString(36).substring(2, 7),
 * which yields FEWER than 5 characters whenever the random float renders
 * short (e.g. 0.5 -> "0.i" -> "i"), producing malformed codes. This uses a
 * CSPRNG with rejection-free indexing so the code is always exactly 5 chars.
 */
export function generateConfirmationCode(prefix = "BK") {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const bytes = crypto.randomBytes(5);
  let rand = "";
  for (let i = 0; i < 5; i++) {
    rand += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${prefix}-${date}-${rand}`;
}

/**
 * Generates a confirmation code guaranteed not to collide with an existing
 * row. Retries a bounded number of times, then falls back to appending more
 * entropy rather than throwing (a booking must never fail on code generation).
 */
export async function generateUniqueConfirmationCode(conn, table, prefix) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateConfirmationCode(prefix);
    const [rows] = await conn.query(
      `SELECT 1 FROM ${table} WHERE confirmation_code = ? LIMIT 1`,
      [code]
    );
    if (rows.length === 0) return code;
  }
  return `${generateConfirmationCode(prefix)}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

/**
 * Format currency as LKR
 */
export function fmtLKR(amount) {
  return "LKR " + Number(amount).toLocaleString("en-LK");
}

/**
 * Generate a human-readable invoice object for a stay booking
 */
export function buildStayInvoice(booking, roomType, user) {
  const checkIn = new Date(booking.check_in_date);
  const checkOut = new Date(booking.check_out_date);
  const nights = booking.nights || Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  return {
    invoice_number: `INV-${booking.confirmation_code}`,
    type: "Accommodation",
    issued_date: new Date(booking.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    guest: {
      name: user?.name || "Guest",
      email: user?.email || "",
      phone: user?.phone || "",
    },
    hotel: {
      name: "St. Lachland Hotel",
      address: "Grand Estate Road, Nuwara Eliya, Central Province, Sri Lanka",
      phone: "+94 52 000 0000",
      email: "reservations@stlachland.lk",
    },
    booking: {
      confirmation_code: booking.confirmation_code,
      room_type: roomType?.name || "Room",
      room_number: booking.room_number,
      check_in: checkIn.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      check_out: checkOut.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      nights,
      guests: `${booking.guests_adult} adult${booking.guests_adult !== 1 ? "s" : ""}${booking.guests_child ? `, ${booking.guests_child} child${booking.guests_child !== 1 ? "ren" : ""}` : ""}`,
      status: booking.status,
    },
    line_items: [
      {
        description: `${roomType?.name || "Room"} — ${nights} night${nights !== 1 ? "s" : ""}`,
        qty: nights,
        unit: fmtLKR(booking.rate_per_night),
        total: fmtLKR(booking.rate_per_night * nights),
      },
    ],
    totals: buildTotals(booking.total_amount),
    special_requests: booking.special_requests || null,
  };
}

/**
 * Renders the totals block from the tax-inclusive amount stored on the
 * booking row, so subtotal + levy + service always equals the grand total.
 */
function buildTotals(storedTotal) {
  const c = chargesFromGrandTotal(storedTotal);
  return {
    subtotal: fmtLKR(c.subtotal),
    tax_label: "Government Levy (5%)",
    tax: fmtLKR(c.tax),
    service_charge_label: "Service Charge (10%)",
    service_charge: fmtLKR(c.service_charge),
    grand_total: fmtLKR(c.grand_total),
  };
}

/**
 * Generate a human-readable invoice object for an event booking
 */
export function buildEventInvoice(booking, user) {
  return {
    invoice_number: `INV-EVT-${booking.id}`,
    type: "Event",
    issued_date: new Date(booking.created_at || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    guest: { name: user?.name || booking.customer_name || "Guest", email: user?.email || "", phone: user?.phone || "" },
    hotel: {
      name: "St. Lachland Hotel",
      address: "Grand Estate Road, Nuwara Eliya, Central Province, Sri Lanka",
      phone: "+94 52 000 0000",
      email: "events@stlachland.lk",
    },
    booking: {
      confirmation_code: `EVT-${String(booking.id).padStart(6, "0")}`,
      event_type: booking.event_type?.charAt(0).toUpperCase() + booking.event_type?.slice(1) || "Event",
      event_date: new Date(booking.event_date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      venue: booking.venue_name,
      guests: `${booking.guests} guests`,
      status: booking.status,
    },
    // Per-line amounts are shown when the caller supplies the component costs;
    // otherwise the line is listed without a figure rather than printing a
    // bare em-dash in the money columns.
    line_items: [
      booking.venue_name
        ? {
            description: `Venue Hire — ${booking.venue_name}`,
            qty: 1,
            unit: booking.venue_cost != null ? fmtLKR(booking.venue_cost) : "Included",
            total: booking.venue_cost != null ? fmtLKR(booking.venue_cost) : "Included",
          }
        : null,
      booking.menu_name
        ? {
            description: `Catering — ${booking.menu_name}`,
            qty: booking.guests,
            unit: booking.menu_price_per_head != null ? fmtLKR(booking.menu_price_per_head) : "per head",
            total: booking.menu_price_per_head != null
              ? fmtLKR(Number(booking.menu_price_per_head) * Number(booking.guests))
              : "Included",
          }
        : null,
      booking.decoration_name
        ? {
            description: `Decoration — ${booking.decoration_name}`,
            qty: 1,
            unit: booking.decoration_cost != null ? fmtLKR(booking.decoration_cost) : "Included",
            total: booking.decoration_cost != null ? fmtLKR(booking.decoration_cost) : "Included",
          }
        : null,
    ].filter(Boolean),
    totals: buildTotals(booking.total_cost),
    special_requests: null,
  };
}

/**
 * Generate invoice for a dining reservation
 */
export function buildDiningInvoice(reservation, order, user) {
  return {
    invoice_number: `INV-DIN-${reservation.confirmation_code}`,
    type: "Dining",
    issued_date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    guest: { name: user?.name || "Guest", email: user?.email || "", phone: user?.phone || "" },
    hotel: { name: "St. Lachland Restaurant", address: "Grand Estate Road, Nuwara Eliya, Central Province, Sri Lanka", phone: "+94 52 000 0000", email: "dining@stlachland.lk" },
    booking: {
      confirmation_code: reservation.confirmation_code,
      date: new Date(reservation.reservation_date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      time: reservation.time_slot,
      covers: `${reservation.covers} guests`,
      status: reservation.status,
    },
    line_items: order?.items?.map(item => ({
      description: item.name,
      qty: item.quantity,
      unit: fmtLKR(item.unit_price),
      total: fmtLKR(item.quantity * item.unit_price),
    })) || [],
    totals: order
      ? buildTotals(order.total_amount)
      : null,
    special_requests: reservation.special_requests || null,
  };
}
