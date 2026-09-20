"use server";

import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/session";
import { getPool } from "../../../../lib/db";
import {
  getAllRoomTypesAdmin, getRoomsForType,
  createRoomType, updateRoomType, deleteRoomType,
  createRoom, updateRoom, deleteRoom,
  adminCancelStayBooking, updateStayBookingStatus,
} from "../../../../lib/rooms";
import { getAdminStayBookings } from "../../../../lib/rooms";

const SESSION_COOKIE = "sl_session";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "admin") throw new Error("Unauthorised");
  const [rows] = await getPool().query(
    "SELECT id, name, role FROM users WHERE id = ? LIMIT 1", [payload.userId]
  );
  if (!rows[0] || rows[0].role !== "admin") throw new Error("Unauthorised");
  return rows[0];
}

export async function adminGetAllRoomTypes() {
  await requireAdmin();
  return getAllRoomTypesAdmin();
}

export async function adminGetRoomsForType(roomTypeId) {
  await requireAdmin();
  return getRoomsForType(roomTypeId);
}

export async function adminCreateRoomType(data) {
  await requireAdmin();
  return createRoomType(data);
}

export async function adminUpdateRoomType(id, data) {
  await requireAdmin();
  return updateRoomType(id, data);
}

export async function adminDeleteRoomType(id) {
  await requireAdmin();
  return deleteRoomType(id);
}

export async function adminCreateRoom(data) {
  await requireAdmin();
  return createRoom(data);
}

export async function adminUpdateRoom(id, data) {
  await requireAdmin();
  return updateRoom(id, data);
}

export async function adminDeleteRoom(id) {
  await requireAdmin();
  return deleteRoom(id);
}

export async function adminGetStayBookings(filters) {
  await requireAdmin();
  return getAdminStayBookings(filters);
}

export async function adminUpdateBookingStatus(bookingId, newStatus) {
  const admin = await requireAdmin();
  return updateStayBookingStatus(bookingId, newStatus, admin.id, admin.name);
}

export async function adminCancelBooking(bookingId, reason) {
  await requireAdmin();
  return adminCancelStayBooking(bookingId, reason);
}
