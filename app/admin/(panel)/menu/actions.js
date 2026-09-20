"use server";

import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/session";
import { getPool } from "../../../../lib/db";
import {
  getMenuItemsAdmin, getRestaurantCategories,
  createMenuItem, updateMenuItem, deleteMenuItem,
  toggleMenuItemAvailability,
} from "../../../../lib/restaurant";

const SESSION_COOKIE = "sl_session";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "admin") throw new Error("Unauthorised");
  const [rows] = await getPool().query(
    "SELECT id, role FROM users WHERE id = ? LIMIT 1", [payload.userId]
  );
  if (!rows[0] || rows[0].role !== "admin") throw new Error("Unauthorised");
  return payload;
}

export async function adminGetMenuItems() {
  await requireAdmin();
  return getMenuItemsAdmin();
}

export async function adminGetCategories() {
  await requireAdmin();
  return getRestaurantCategories();
}

export async function adminCreateMenuItem(data) {
  await requireAdmin();
  return createMenuItem(data);
}

export async function adminUpdateMenuItem(id, data) {
  await requireAdmin();
  return updateMenuItem(id, data);
}

export async function adminDeleteMenuItem(id) {
  await requireAdmin();
  return deleteMenuItem(id);
}

export async function adminToggleAvailability(id) {
  await requireAdmin();
  return toggleMenuItemAvailability(id);
}
