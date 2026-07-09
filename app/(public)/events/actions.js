"use server";

/**
 * Reservation server actions.
 *
 * The rule engine (the estimate) lives in the Flask backend and is called by
 * the Events page directly. Reserving, however, writes to MySQL and belongs to
 * a logged-in customer, and Flask has no reservation endpoint — so these two
 * database actions stay here in Next.js.
 *
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
        total_cost, theme, venue_name, menu_name, decoration_name, budget, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      session.id, session.name, plan.event_type, plan.event_date, venue_id,
      plan.guests, plan.total_cost, plan.theme, plan.venue_name, plan.menu_name,
      plan.decoration_name, plan.budget,
    ]
  );
  return { ok: true };
}

export async function getMyBookings() {
  const session = await getSession();
  if (!session) return [];
  const [rows] = await getPool().query(
    `SELECT id, event_type, event_date, venue_name, guests, total_cost, status, created_at
     FROM event_bookings WHERE user_id = ? ORDER BY created_at DESC`,
    [session.id]
  );
  return rows;
}
