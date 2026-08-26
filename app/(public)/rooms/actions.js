"use server";
/**
 * app/(public)/rooms/actions.js — Server Actions for room booking
 */
import { getPool } from "../../../lib/db";
import { getSession } from "../auth-actions";
import {
  getRoomTypes, getRoomTypeBySlug, getRoomAvailability,
  createStayBooking, getStayBookingsForUser, cancelStayBooking
} from "../../../lib/rooms";


export async function fetchRoomTypes() {
  return getRoomTypes();
}

export async function fetchRoomTypeBySlug(slug) {
  return getRoomTypeBySlug(slug);
}

export async function checkRoomAvailability(checkIn, checkOut) {
  if (!checkIn || !checkOut) return {};
  return getRoomAvailability(checkIn, checkOut);
}

export async function bookRoom({ roomTypeId, checkIn, checkOut, guestsAdult, guestsChild, specialRequests }) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in to make a reservation." };

  if (!roomTypeId || !checkIn || !checkOut) {
    return { ok: false, error: "Please provide all required booking details." };
  }

  // Date-range rules, occupancy limits and the locked availability check all
  // live in createStayBooking so they hold no matter which caller invokes it.
  return createStayBooking({
    userId: session.id,
    roomTypeId: Number(roomTypeId),
    checkIn,
    checkOut,
    guestsAdult: guestsAdult ?? 1,
    guestsChild: guestsChild ?? 0,
    specialRequests,
  });
}

export async function fetchMyStayBookings() {
  const session = await getSession();
  if (!session) return [];
  return getStayBookingsForUser(session.id);
}

export async function requestCancellation(bookingId, reason) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  return cancelStayBooking(bookingId, session.id, reason);
}

export async function getStayBookingDetail(bookingId) {
  const session = await getSession();
  if (!session) return null;
  const db = getPool();
  const [rows] = await db.query(
    `SELECT sb.*, rt.name AS room_type_name, rt.slug, rt.description AS room_type_description,
            rt.amenities_json, r.room_number,
            u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
     FROM stay_bookings sb
     JOIN room_types rt ON rt.id = sb.room_type_id
     JOIN rooms r ON r.id = sb.room_id
     JOIN users u ON u.id = sb.user_id
     WHERE sb.id = ? AND sb.user_id = ?
     LIMIT 1`,
    [bookingId, session.id]
  );
  if (!rows[0]) return null;
  const booking = rows[0];
  booking.amenities_json = typeof booking.amenities_json === "string"
    ? JSON.parse(booking.amenities_json) : (booking.amenities_json || []);
  return booking;
}
