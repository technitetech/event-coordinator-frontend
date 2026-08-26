"use server";
/**
 * app/(public)/dining/actions.js — Server Actions for restaurant/dining
 */
import { getSession } from "../auth-actions";
import {
  getMenuWithCategories, getAvailableTimeSlots,
  createDiningReservation, getDiningReservationsForUser, submitDiningOrder,
  cancelDiningReservation,
} from "../../../lib/restaurant";

export async function fetchMenu() {
  return getMenuWithCategories();
}

export async function fetchTimeSlots(date, covers) {
  if (!date || !covers) return [];
  return getAvailableTimeSlots(date, Number(covers));
}

export async function makeReservation({ date, timeSlot, covers, specialRequests, dietary, occasion }) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in to make a reservation." };

  if (!date || !timeSlot || !covers) {
    return { ok: false, error: "Please provide date, time, and party size." };
  }

  // Full validation (calendar-valid date, allowed time slot, party-size
  // bounds) plus the locked availability check happens in the library layer.
  return createDiningReservation({
    userId: session.id,
    date,
    timeSlot,
    covers,
    specialRequests,
    dietary,
    occasion,
  });
}

export async function cancelMyDiningReservation(reservationId, reason) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  return cancelDiningReservation(reservationId, session.id, reason);
}

export async function fetchMyDiningReservations() {
  const session = await getSession();
  if (!session) return [];
  return getDiningReservationsForUser(session.id);
}

export async function placeOrder({ reservationId, items }) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "No items selected." };
  }
  if (items.length > 60) {
    return { ok: false, error: "That is too many line items for a single order." };
  }
  if (items.some((i) => !Number.isInteger(Number(i?.menu_item_id)))) {
    return { ok: false, error: "One or more items in your order are invalid." };
  }

  return submitDiningOrder({
    reservationId: reservationId || null,
    userId: session.id,
    items,
  });
}
