import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/session";

const SESSION_COOKIE = "sl_session";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "admin") throw new Error("Unauthorised");
}

export async function POST(req) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed." }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 8 MB." }, { status: 400 });
    }
    const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
    const filename = `room_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "images", "rooms");
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
    return NextResponse.json({ url: `/images/rooms/${filename}` });
  } catch (err) {
    if (err.message === "Unauthorised") return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    console.error("Room image upload error:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
