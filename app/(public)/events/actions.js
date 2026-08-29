"use server";

/**
 * Reservation & Recommendation Server Actions
 *
 * Enhanced with hybrid neuro-symbolic recommendation engine.
 * 
 *   getEstimate(plan)              -> Legacy: flat rule engine (kept for backward compatibility)
 *   getHybridEstimate(plan)        -> NEW: 3-layer hybrid engine with Pareto optimization + XAI
 *   createReservation(plan)        -> Saves a booking (requires logged-in user)
 *   getMyBookings()                -> Current customer's reservations
 *   submitEventFeedback(feedback)  -> NEW: Post-event satisfaction ratings
 */

import { getPool } from "../../../lib/db";
import { getSession } from "../auth-actions";
import { getHybridRecommendations } from "../../../lib/recommendation-engine";
import { submitFeedback, getLearningStats } from "../../../lib/feedback-learner";
import { computeCharges } from "../../../lib/invoice";
import {
  assertTransition, validateFutureDate, parseIntInRange, sanitiseText,
  MAX_EVENT_GUESTS, DINING_TIME_SLOTS,
} from "../../../lib/validation";

const VALID_EVENT_TYPES = ["wedding", "conference", "birthday", "dinner"];
const VALID_THEMES      = ["floral", "modern", "tropical", "classic"];

// ---- NEW: Hybrid Recommendation Engine ----
export async function getHybridEstimate(input) {
  const session = await getSession();
  if (!session) return { error: "Please log in to get a personalised recommendation." };

  // Validate / coerce all fields before they reach the engine
  const eventType = String(input?.event_type || "").toLowerCase();
  if (!VALID_EVENT_TYPES.includes(eventType))
    return { error: `Event type must be one of: ${VALID_EVENT_TYPES.join(", ")}.` };

  const guestCheck = parseIntInRange(input?.guests, { min: 1, max: MAX_EVENT_GUESTS, label: "Guest count" });
  if (!guestCheck.ok) return { error: guestCheck.error };

  const budget = Number(input?.budget);
  if (!Number.isFinite(budget) || budget <= 0)
    return { error: "Budget must be a positive number." };

  const theme = String(input?.theme || "floral").toLowerCase();
  if (!VALID_THEMES.includes(theme))
    return { error: `Theme must be one of: ${VALID_THEMES.join(", ")}.` };

  // event_date is optional; validate only when provided
  let eventDate;
  if (input?.event_date) {
    const dateCheck = validateFutureDate(input.event_date, "Event date");
    if (!dateCheck.ok) return { error: dateCheck.error };
    eventDate = input.event_date;
  }

  try {
    return await getHybridRecommendations({
      event_type: eventType,
      guests: guestCheck.value,
      budget,
      theme,
      event_date: eventDate,
      user_id: session.id,
    });
  } catch (e) {
    console.error("[getHybridEstimate] Error:", e);
    return { error: `Recommendation engine error: ${e.message}` };
  }
}

// ---- NEW: Post-event feedback ----
export async function submitEventFeedback(feedbackData) {
  const session = await getSession();
  if (!session) return { ok: false, message: "Please log in to submit feedback." };

  // Verify the booking belongs to this user before accepting feedback.
  // feedbackData.booking_id must not be trusted without this ownership check.
  const bookingId = Number(feedbackData?.booking_id);
  if (!Number.isInteger(bookingId) || bookingId <= 0)
    return { ok: false, message: "Invalid booking reference." };

  const pool = getPool();
  const [ownerRows] = await pool.query(
    "SELECT id FROM event_bookings WHERE id = ? AND user_id = ? LIMIT 1",
    [bookingId, session.id]
  );
  if (!ownerRows.length)
    return { ok: false, message: "Booking not found or does not belong to your account." };

  return submitFeedback({
    ...feedbackData,
    booking_id: bookingId,  // use the validated integer, not the raw client value
    user_id: session.id,
  });
}

// ---- NEW: Learning system analytics (admin-visible only) ----
export async function getFeedbackStats() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return { error: "Unauthorised." };
  return getLearningStats();
}

/**
 * Returns the signed-in guest's learned objective weights, plus how many of
 * their reviews informed them. Falls back to the system default row when the
 * guest has no personalised vector yet, and reports that honestly instead of
 * presenting defaults as if they were learned.
 */
export async function getMyPreferenceVector() {
  const session = await getSession();
  if (!session) return null;

  const pool = getPool();

  const [rows] = await pool.query(
    `SELECT w_cost, w_quality, w_availability, w_weather, w_preference, source, updated_at
     FROM objective_weights
     WHERE user_id = ? OR user_id IS NULL
     ORDER BY user_id IS NULL ASC
     LIMIT 1`,
    [session.id]
  );

  const w = rows[0] || {
    w_cost: 0.3, w_quality: 0.25, w_availability: 0.2,
    w_weather: 0.1, w_preference: 0.15, source: "default",
  };

  const [fb] = await pool.query(
    `SELECT COUNT(*) AS n FROM feedback WHERE user_id = ?`, [session.id]
  );

  return {
    source: w.source || "default",
    personalised: (w.source === "learned" || w.source === "user"),
    feedback_count: Number(fb[0]?.n || 0),
    updated_at: w.updated_at || null,
    weights: [
      { key: "w_quality",      label: "Atmospheric Quality Sensitivity", value: Number(w.w_quality) },
      { key: "w_cost",         label: "Budget Efficiency Focus",         value: Number(w.w_cost) },
      { key: "w_availability", label: "Date Flexibility Weighting",      value: Number(w.w_availability) },
      { key: "w_weather",      label: "Weather Risk Aversion",           value: Number(w.w_weather) },
      { key: "w_preference",   label: "Personal Style Alignment",        value: Number(w.w_preference) },
    ],
  };
}

// Column is TEXT (64 KB). Stay well inside it while leaving room for the
// generated image URLs, which embed the whole prompt and run ~1 KB each.
const MAX_IMAGE_JSON_BYTES = 16000;
const MAX_SINGLE_URL_CHARS = 2500;

/**
 * Serialises generated concept-image URLs for storage.
 *
 * Critically, this never truncates the JSON string itself: slicing a JSON
 * array mid-string yields a value that JSON.parse() rejects, which made the
 * dashboard fall back to rendering the entire raw blob as one <img src> (a
 * guaranteed 404). Instead we drop whole URLs until the payload fits.
 */
function packImageUrls(plan) {
  let candidates = [];

  if (Array.isArray(plan?.image_url_list)) {
    candidates = plan.image_url_list;
  } else if (typeof plan?.image_url === "string") {
    // Accept a pre-serialised array from older clients.
    try {
      const parsed = JSON.parse(plan.image_url);
      candidates = Array.isArray(parsed) ? parsed : [plan.image_url];
    } catch {
      candidates = [plan.image_url];
    }
  }

  const safe = candidates
    .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u) && u.length <= MAX_SINGLE_URL_CHARS)
    .slice(0, 4);

  while (safe.length > 0) {
    const json = JSON.stringify(safe);
    if (Buffer.byteLength(json, "utf8") <= MAX_IMAGE_JSON_BYTES) return json;
    safe.pop(); // drop a whole URL, never a partial one
  }
  return null;
}

// ---- Existing: Create reservation (enhanced with recommendation_id) ----
export async function createReservation(plan) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in to make a reservation.", needsLogin: true };

  const dateCheck = validateFutureDate(plan?.event_date, "Event date");
  if (!dateCheck.ok) return { ok: false, error: dateCheck.error };

  const guestCheck = parseIntInRange(plan?.guests, { min: 1, max: MAX_EVENT_GUESTS, label: "Guest count" });
  if (!guestCheck.ok) return { ok: false, error: guestCheck.error };
  const guests = guestCheck.value;

  if (!plan?.venue_name) return { ok: false, error: "Please select a venue package before reserving." };

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Re-price the entire package from the database. The client previously
    // supplied total_cost directly, which meant a crafted request could book
    // any event for any amount. Nothing money-related is trusted from input.
    const [venueRows] = await conn.query(
      `SELECT id, name, base_cost, min_capacity, max_capacity
       FROM venues WHERE name = ? LIMIT 1 FOR UPDATE`,
      [plan.venue_name]
    );
    const venue = venueRows[0];
    if (!venue) {
      await conn.rollback();
      return { ok: false, error: "That venue no longer exists. Please regenerate your recommendation." };
    }

    if (guests < venue.min_capacity || guests > venue.max_capacity) {
      await conn.rollback();
      return {
        ok: false,
        error: `${venue.name} hosts ${venue.min_capacity}–${venue.max_capacity} guests; you selected ${guests}.`,
      };
    }

    // Venue/date conflict check now runs inside the transaction while we hold
    // the venue row lock, closing the check-then-insert race that previously
    // let two guests book the same venue on the same day.
    const [conflict] = await conn.query(
      `SELECT COUNT(*) AS n FROM event_bookings
       WHERE venue_id = ? AND event_date = ? AND status != 'cancelled'`,
      [venue.id, plan.event_date]
    );
    if (conflict[0].n > 0) {
      await conn.rollback();
      return { ok: false, error: "That venue is already booked on that date. Please choose another date." };
    }

    let subtotal = Number(venue.base_cost);
    let menuName = null;
    let decorationName = null;

    if (plan.menu_name) {
      const [menuRows] = await conn.query(
        `SELECT name, price_per_head FROM menus WHERE name = ? LIMIT 1`, [plan.menu_name]
      );
      if (!menuRows[0]) {
        await conn.rollback();
        return { ok: false, error: "The selected menu is no longer offered. Please regenerate your recommendation." };
      }
      menuName = menuRows[0].name;
      subtotal += Number(menuRows[0].price_per_head) * guests;
    }

    if (plan.decoration_name) {
      const [decoRows] = await conn.query(
        `SELECT name, cost FROM decorations WHERE name = ? LIMIT 1`, [plan.decoration_name]
      );
      if (!decoRows[0]) {
        await conn.rollback();
        return { ok: false, error: "The selected decoration package is no longer offered." };
      }
      decorationName = decoRows[0].name;
      subtotal += Number(decoRows[0].cost);
    }

    const charges = computeCharges(subtotal);

    const imageUrl = packImageUrls(plan);

    const [result] = await conn.query(
      `INSERT INTO event_bookings
         (user_id, customer_name, event_type, event_date, venue_id, guests,
          total_cost, theme, venue_name, menu_name, decoration_name, budget, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        session.id, session.name, sanitiseText(plan.event_type, 40),
        plan.event_date, venue.id, guests,
        charges.grand_total, sanitiseText(plan.theme, 40), venue.name,
        menuName, decorationName,
        Number.isFinite(Number(plan.budget)) ? Math.max(0, Math.round(Number(plan.budget))) : null,
        imageUrl,
      ]
    );

    await conn.commit();

    return {
      ok: true,
      booking: {
        id: result.insertId,
        reference: `EVT-${String(result.insertId).padStart(6, "0")}`,
        venue_name: venue.name,
        guests,
        subtotal: charges.subtotal,
        tax: charges.tax,
        service_charge: charges.service_charge,
        total_cost: charges.grand_total,
        status: "confirmed",
      },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Cancel an event booking the signed-in customer owns. */
export async function cancelMyEventBooking(bookingId, reason) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in." };

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, status, event_date FROM event_bookings WHERE id = ? AND user_id = ? LIMIT 1`,
    [bookingId, session.id]
  );
  if (!rows[0]) return { ok: false, error: "Booking not found." };

  const check = assertTransition("event_bookings", rows[0].status, "cancelled");
  if (!check.ok) return { ok: false, error: `Cannot cancel a booking that is '${rows[0].status}'.` };

  const daysUntil = (new Date(rows[0].event_date) - new Date()) / 86400000;
  if (daysUntil < 7) {
    return { ok: false, error: "Event cancellations require at least 7 days' notice. Please call our events team." };
  }

  await pool.query(`UPDATE event_bookings SET status = 'cancelled' WHERE id = ?`, [bookingId]);
  return { ok: true };
}

export async function getMyBookings() {
  const session = await getSession();
  if (!session) return [];
  // menu_name / decoration_name / theme / budget were previously omitted from
  // this projection, so the dashboard card and the event invoice always fell
  // back to placeholder text ("Standard Buffet", "Custom Theme") no matter
  // what the guest actually booked.
  // The joins recover each component's price so the event invoice can print
  // real per-line amounts instead of placeholder dashes.
  const [rows] = await getPool().query(
    `SELECT eb.id, eb.event_type, eb.event_date, eb.venue_id, eb.venue_name,
            eb.guests, eb.total_cost, eb.budget, eb.theme,
            eb.menu_name, eb.decoration_name, eb.status, eb.created_at, eb.image_url,
            v.base_cost        AS venue_cost,
            m.price_per_head   AS menu_price_per_head,
            d.cost             AS decoration_cost
     FROM event_bookings eb
     LEFT JOIN venues      v ON v.id   = eb.venue_id
     LEFT JOIN menus       m ON m.name = eb.menu_name
     LEFT JOIN decorations d ON d.name = eb.decoration_name
     WHERE eb.user_id = ?
     ORDER BY eb.created_at DESC`,
    [session.id]
  );
  return rows;
}

// ---- Legacy: Flat rule engine (kept for backward compatibility & A/B testing) ----
export async function getEstimate({ event_type, guests, budget, theme, event_date }) {
  // Validate all inputs before touching the DB
  const et = String(event_type || "").toLowerCase();
  if (!VALID_EVENT_TYPES.includes(et))
    return { error: `Event type must be one of: ${VALID_EVENT_TYPES.join(", ")}.` };

  const guestCheck = parseIntInRange(guests, { min: 1, max: MAX_EVENT_GUESTS, label: "Guest count" });
  if (!guestCheck.ok) return { error: guestCheck.error };

  const budgetNum = Number(budget);
  if (!Number.isFinite(budgetNum) || budgetNum <= 0)
    return { error: "Budget must be a positive number." };

  if (event_date) {
    const dc = validateFutureDate(event_date, "Event date");
    if (!dc.ok) return { error: dc.error };
  }

  const pool = getPool();
  const result = { warnings: [], suggestions: [] };
  guests = guestCheck.value;
  budget = budgetNum;

  try {
    const [venues] = await pool.query(
      "SELECT * FROM venues WHERE ? BETWEEN min_capacity AND max_capacity ORDER BY base_cost ASC",
      [guests]
    );
    if (!venues.length) return { error: `No venue can host ${guests} guests (max is 500).` };
    let venue = venues[0];

    if (event_date) {
      const month = new Date(event_date).getMonth() + 1;
      if (venue.is_outdoor && month >= 5 && month <= 9) {
        const [indoors] = await pool.query(
          "SELECT * FROM venues WHERE ? BETWEEN min_capacity AND max_capacity AND is_outdoor = 0 ORDER BY base_cost ASC LIMIT 1",
          [guests]
        );
        if (indoors.length) {
          result.warnings.push(`'${venue.name}' is outdoor and your date falls in the rainy season (May–Sep). Switched to '${indoors[0].name}'.`);
          venue = indoors[0];
        }
      }
    }

    let [menus] = await pool.query("SELECT * FROM menus WHERE event_type = ? LIMIT 1", [event_type]);
    if (!menus.length) [menus] = await pool.query("SELECT * FROM menus WHERE event_type = 'birthday' LIMIT 1");
    const menu = menus[0];
    const menu_cost = guests * menu.price_per_head;

    const venue_cost = venue.base_cost;
    const remaining = budget - venue_cost - menu_cost;

    let tier = "basic";
    if (remaining >= 50000) tier = "premium";
    else if (remaining >= 25000) tier = "standard";

    const [decos] = await pool.query("SELECT * FROM decorations WHERE theme = ? AND tier = ? LIMIT 1", [theme, tier]);
    const deco_cost = decos.length ? decos[0].cost : 10000;
    const deco_name = decos.length ? decos[0].name : "Basic Decoration Package";

    const total = venue_cost + menu_cost + deco_cost;
    const within_budget = total <= budget;

    if (!within_budget) {
      result.warnings.push(`Budget insufficient by LKR ${(total - budget).toLocaleString()}. Consider a smaller venue, fewer guests, or a lower menu tier.`);
    } else if (budget - total > budget * 0.30) {
      const [pkgs] = await pool.query("SELECT name, add_on_cost FROM event_packages WHERE event_type = ?", [event_type]);
      for (const pkg of pkgs) {
        result.suggestions.push(`You have surplus budget — add ${pkg.name} (+LKR ${pkg.add_on_cost.toLocaleString()})?`);
      }
    }

    if (event_date) {
      const [conflict] = await pool.query(
        "SELECT COUNT(*) AS n FROM event_bookings WHERE venue_id = ? AND event_date = ? AND status != 'cancelled'",
        [venue.id, event_date]
      );
      if (conflict[0].n > 0) {
        result.warnings.push(`'${venue.name}' is already booked on ${event_date}. Please choose another date.`);
      }
    }

    Object.assign(result, {
      venue: { name: venue.name, cost: venue_cost },
      menu: { name: menu.name, price_per_head: menu.price_per_head, cost: menu_cost },
      decoration: { name: deco_name, cost: deco_cost },
      total_cost: total,
      within_budget,
      guests,
      budget
    });

    return result;
  } catch (e) {
    return { error: `Database error: ${e.message}` };
  }
}
