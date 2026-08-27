import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = "SELECT * FROM hotel_packages ORDER BY price_per_person ASC";
    const params = [];

    if (type && (type === "event_menu" || type === "day_out")) {
      query = "SELECT * FROM hotel_packages WHERE package_type = ? ORDER BY price_per_person ASC";
      params.push(type);
    }

    const [rows] = await pool.query(query, params);

    // Format JSON fields safely
    const formatted = rows.map((row) => {
      let inclusions = [];
      let courses = null;
      let dessert_options = [];

      try {
        inclusions = typeof row.inclusions === "string" ? JSON.parse(row.inclusions) : row.inclusions || [];
      } catch {
        inclusions = [];
      }

      try {
        courses = typeof row.courses === "string" ? JSON.parse(row.courses) : row.courses || null;
      } catch {
        courses = null;
      }

      try {
        dessert_options = typeof row.dessert_options === "string" ? JSON.parse(row.dessert_options) : row.dessert_options || [];
      } catch {
        dessert_options = [];
      }

      return {
        ...row,
        inclusions,
        courses,
        dessert_options,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve hotel packages" },
      { status: 500 }
    );
  }
}
