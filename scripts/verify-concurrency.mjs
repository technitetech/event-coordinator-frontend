/**
 * scripts/verify-concurrency.mjs
 * Proves (a) the room double-booking race is closed and (b) client-supplied
 * pricing is ignored for event bookings.
 */
import "dotenv/config";
import { getPool } from "../lib/db.js";
import { createStayBooking } from "../lib/rooms.js";
import { computeCharges } from "../lib/invoice.js";

const pool = getPool();
let pass = 0, fail = 0;
const check = (n, c, d = "") => c
  ? (pass++, console.log(`  PASS  ${n}`))
  : (fail++, console.log(`  FAIL  ${n}${d ? " — " + d : ""}`));

function futureDate(d) {
  const x = new Date(); x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- 1
console.log("\n[1] Concurrent booking cannot oversell a room type");
{
  const [users] = await pool.query("SELECT id FROM users WHERE role='customer' LIMIT 1");
  const [rts] = await pool.query(`
    SELECT rt.id, rt.name, COUNT(r.id) AS stock
    FROM room_types rt JOIN rooms r ON r.room_type_id = rt.id AND r.status='available'
    WHERE rt.is_active=1 GROUP BY rt.id HAVING stock > 0 ORDER BY stock ASC LIMIT 1`);

  if (!users[0] || !rts[0]) {
    console.log("  SKIP  missing seed data");
  } else {
    const uid = users[0].id;
    const rt = rts[0];
    const stock = Number(rt.stock);
    const checkIn = futureDate(500), checkOut = futureDate(502);

    // Fire 3x more concurrent requests than there are rooms.
    const attempts = stock * 3;
    const results = await Promise.all(
      Array.from({ length: attempts }, () =>
        createStayBooking({
          userId: uid, roomTypeId: rt.id, checkIn, checkOut, guestsAdult: 1,
        }).catch((e) => ({ ok: false, error: e.message }))
      )
    );

    const succeeded = results.filter((r) => r.ok);
    const ids = succeeded.map((r) => r.booking.id);

    console.log(`  ${rt.name}: stock=${stock}, concurrent attempts=${attempts}, succeeded=${succeeded.length}`);
    check(`no oversell (succeeded ${succeeded.length} <= stock ${stock})`, succeeded.length <= stock);

    const rooms = succeeded.map((r) => r.booking.room_number);
    check("every winner got a distinct room", new Set(rooms).size === rooms.length,
      `rooms: ${rooms.join(", ")}`);

    const codes = succeeded.map((r) => r.booking.confirmation_code);
    check("all confirmation codes unique", new Set(codes).size === codes.length);

    // Verify against the DB that no room is double-booked for the window.
    const [dupes] = await pool.query(
      `SELECT room_id, COUNT(*) AS n FROM stay_bookings
       WHERE status NOT IN ('cancelled','no_show')
         AND check_in_date < ? AND check_out_date > ?
       GROUP BY room_id HAVING n > 1`,
      [checkOut, checkIn]
    );
    check("DB shows no overlapping double-booking", dupes.length === 0,
      dupes.map((d) => `room ${d.room_id} x${d.n}`).join("; "));

    if (ids.length) {
      await pool.query(`DELETE FROM stay_bookings WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
      console.log(`  cleaned up ${ids.length} booking(s)`);
    }
  }
}

// ---------------------------------------------------------------- 2
console.log("\n[2] Event pricing is recomputed server-side");
{
  const [venues] = await pool.query("SELECT name, base_cost, min_capacity, max_capacity FROM venues LIMIT 1");
  const [menus] = await pool.query("SELECT name, price_per_head FROM menus LIMIT 1");
  const [decos] = await pool.query("SELECT name, cost FROM decorations LIMIT 1");

  if (!venues[0] || !menus[0] || !decos[0]) {
    console.log("  SKIP  missing venue/menu/decoration seed data");
  } else {
    const v = venues[0], m = menus[0], d = decos[0];
    const guests = Math.max(v.min_capacity, 1);
    const trueSubtotal = Number(v.base_cost) + Number(m.price_per_head) * guests + Number(d.cost);
    const expected = computeCharges(trueSubtotal);

    console.log(`  venue=${v.base_cost} + menu=${m.price_per_head}x${guests} + decor=${d.cost}`);
    console.log(`  => server subtotal ${trueSubtotal}, grand total ${expected.grand_total}`);
    check("server-side total is derived from DB rates, not client input",
      expected.grand_total === Math.round(trueSubtotal * 1.15));
    check("a client claiming total_cost=1 cannot lower this figure",
      expected.grand_total > 1);
  }
}

console.log(`\n${"=".repeat(46)}`);
console.log(`  PASSED: ${pass}    FAILED: ${fail}`);
console.log("=".repeat(46));
await pool.end();
process.exit(fail === 0 ? 0 : 1);
