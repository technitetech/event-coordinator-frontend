"use server";

/**
 * Reservation server actions.
 *
 * The rule engine (the estimate) has been ported from Flask to this file,
 * so this Next.js app is now completely self-contained!
 *
 *   getEstimate(plan)        -> applies business rules to generate an estimate
 *   createReservation(plan)  -> saves a booking (requires a logged-in user)
 *   getMyBookings()          -> the current customer's reservations
 */

import { getPool } from "../../../lib/db";
import { getSession } from "../auth-actions";

export async function createReservation(plan) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in to make a reservation.", needsLogin: true };
  if (!plan.event_date) return { ok: false, error: "Please choose an event date before reserving." };

  const pool = getPool();

  // The Flask estimate returns the venue by name, so resolve its id here for
  // the foreign key and the date-conflict check.
  let venue_id = null;
  if (plan.venue_name) {
    const [v] = await pool.query("SELECT id FROM venues WHERE name = ? LIMIT 1", [plan.venue_name]);
    if (v.length) venue_id = v[0].id;
  }

  if (venue_id) {
    const [conflict] = await pool.query(
      "SELECT COUNT(*) AS n FROM event_bookings WHERE venue_id = ? AND event_date = ? AND status != 'cancelled'",
      [venue_id, plan.event_date]
    );
    if (conflict[0].n > 0) return { ok: false, error: "That venue is already booked on that date. Please choose another date." };
  }

  await pool.query(
    `INSERT INTO event_bookings
       (user_id, customer_name, event_type, event_date, venue_id, guests,
        total_cost, theme, venue_name, menu_name, decoration_name, budget, status, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      session.id, session.name, plan.event_type, plan.event_date, venue_id,
      plan.guests, plan.total_cost, plan.theme, plan.venue_name, plan.menu_name,
      plan.decoration_name, plan.budget, plan.image_url || null,
    ]
  );
  return { ok: true };
}

export async function getMyBookings() {
  const session = await getSession();
  if (!session) return [];
  const [rows] = await getPool().query(
    `SELECT id, event_type, event_date, venue_name, guests, total_cost, status, created_at, image_url
     FROM event_bookings WHERE user_id = ? ORDER BY created_at DESC`,
    [session.id]
  );
  return rows;
}

export async function getEstimate({ event_type, guests, budget, theme, event_date }) {
  const pool = getPool();
  const result = { warnings: [], suggestions: [] };

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
