/**
 * scripts/verify-fixes.mjs
 * Integration checks for the bug fixes. Runs against the real database and
 * cleans up every row it creates.
 *
 *   node scripts/verify-fixes.mjs
 */
import "dotenv/config";
import { getPool } from "../lib/db.js";
import { generateConfirmationCode, computeCharges } from "../lib/invoice.js";
import { assertTransition, validateStayDates, parseDateOnly } from "../lib/validation.js";
import { createStayBooking, getRoomAvailability } from "../lib/rooms.js";
import { createDiningReservation, getAvailableTimeSlots } from "../lib/restaurant.js";

let pass = 0, fail = 0;
const created = { stay: [], dining: [] };

function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const pool = getPool();

// ---------------------------------------------------------------- 1
console.log("\n[1] Confirmation code format");
{
  let allValid = true;
  let shortCount = 0;
  for (let i = 0; i < 2000; i++) {
    const code = generateConfirmationCode("SB");
    if (!/^SB-\d{8}-[A-Z0-9]{5}$/.test(code)) { allValid = false; }
    if (code.split("-")[2].length !== 5) shortCount++;
  }
  check("2000 codes all match /^SB-\\d{8}-[A-Z0-9]{5}$/", allValid);
  check("no code has a short random segment", shortCount === 0, `${shortCount} malformed`);
}

// ---------------------------------------------------------------- 2
console.log("\n[2] Tax maths is consistent");
{
  const c = computeCharges(100000);
  check("subtotal preserved", c.subtotal === 100000);
  check("levy 5% = 5000", c.tax === 5000);
  check("service 10% = 10000", c.service_charge === 10000);
  check("grand total = 115000", c.grand_total === 115000);
  check("negative input floors at 0", computeCharges(-50).grand_total === 0);
}

// ---------------------------------------------------------------- 3
console.log("\n[3] Status transition state machine");
{
  check("stay pending->confirmed allowed", assertTransition("stay_bookings", "pending", "confirmed").ok);
  check("stay checked_out->confirmed REJECTED", !assertTransition("stay_bookings", "checked_out", "confirmed").ok);
  check("stay cancelled is terminal", !assertTransition("stay_bookings", "cancelled", "confirmed").ok);
  check("order received->ready REJECTED (skips a step)", !assertTransition("dining_orders", "received", "ready").ok);
  check("order received->preparing allowed", assertTransition("dining_orders", "received", "preparing").ok);
  check("order preparing->ready allowed", assertTransition("dining_orders", "preparing", "ready").ok);
  check("bogus status rejected", !assertTransition("stay_bookings", "pending", "teleported").ok);
  check("event->completed rejected (not in ENUM)", !assertTransition("event_bookings", "confirmed", "completed").ok);
}

// ---------------------------------------------------------------- 4
console.log("\n[4] Date validation");
{
  check("2027-02-31 rejected as impossible", parseDateOnly("2027-02-31") === null);
  check("2027-02-28 accepted", parseDateOnly("2027-02-28") !== null);
  check("garbage rejected", parseDateOnly("not-a-date") === null);
  check("past check-in rejected", !validateStayDates("2020-01-01", "2020-01-05").ok);
  check("checkout before checkin rejected", !validateStayDates(futureDate(10), futureDate(8)).ok);
  check("same-day checkout rejected", !validateStayDates(futureDate(10), futureDate(10)).ok);
  check("31-night stay rejected", !validateStayDates(futureDate(10), futureDate(42)).ok);
  const ok = validateStayDates(futureDate(10), futureDate(13));
  check("valid 3-night stay accepted", ok.ok && ok.nights === 3, `nights=${ok.nights}`);
}

// ---------------------------------------------------------------- 5
console.log("\n[5] Room booking guards (live DB)");
{
  const [users] = await pool.query("SELECT id FROM users WHERE role='customer' LIMIT 1");
  const [rts] = await pool.query("SELECT id, name, max_occupancy, base_rate_per_night FROM room_types WHERE is_active=1 ORDER BY max_occupancy ASC LIMIT 1");

  if (!users[0] || !rts[0]) {
    console.log("  SKIP  no customer/room_type seed rows present");
  } else {
    const uid = users[0].id, rt = rts[0];

    const noUser = await createStayBooking({
      userId: null, roomTypeId: rt.id, checkIn: futureDate(20), checkOut: futureDate(22), guestsAdult: 1,
    });
    check("anonymous booking rejected", !noUser.ok);

    const overOcc = await createStayBooking({
      userId: uid, roomTypeId: rt.id, checkIn: futureDate(20), checkOut: futureDate(22),
      guestsAdult: rt.max_occupancy + 5,
    });
    check(`over-occupancy rejected (${rt.max_occupancy + 5} > ${rt.max_occupancy})`, !overOcc.ok, overOcc.error);

    const pastB = await createStayBooking({
      userId: uid, roomTypeId: rt.id, checkIn: "2020-01-01", checkOut: "2020-01-03", guestsAdult: 1,
    });
    check("past-dated booking rejected", !pastB.ok);

    const good = await createStayBooking({
      userId: uid, roomTypeId: rt.id, checkIn: futureDate(400), checkOut: futureDate(403), guestsAdult: 1,
    });
    check("valid booking succeeds", good.ok, good.error);

    if (good.ok) {
      created.stay.push(good.booking.id);
      const b = good.booking;
      check("code well-formed", /^SB-\d{8}-[A-Z0-9]{5}$/.test(b.confirmation_code), b.confirmation_code);
      check("nights computed = 3", b.nights === 3);
      const expected = computeCharges(b.rate_per_night * 3);
      check("stored total is tax-inclusive", b.total_amount === expected.grand_total,
        `got ${b.total_amount}, expected ${expected.grand_total}`);

      const [row] = await pool.query("SELECT user_id, total_amount FROM stay_bookings WHERE id=?", [b.id]);
      check("user_id persisted (not NULL)", row[0].user_id === uid, `got ${row[0].user_id}`);
      check("DB total matches returned total", Number(row[0].total_amount) === b.total_amount);
    }
  }
}

// ---------------------------------------------------------------- 6
console.log("\n[6] Dining guards (live DB)");
{
  const [users] = await pool.query("SELECT id FROM users WHERE role='customer' LIMIT 1");
  if (!users[0]) {
    console.log("  SKIP  no customer seed row");
  } else {
    const uid = users[0].id;

    const oversize = await createDiningReservation({
      userId: uid, date: futureDate(30), timeSlot: "19:00", covers: 25,
    });
    check("party of 25 rejected with private-dining message", !oversize.ok && /private-dining/i.test(oversize.error), oversize.error);

    const badSlot = await createDiningReservation({
      userId: uid, date: futureDate(30), timeSlot: "03:33", covers: 2,
    });
    check("invalid time slot rejected", !badSlot.ok, badSlot.error);

    const zero = await createDiningReservation({
      userId: uid, date: futureDate(30), timeSlot: "19:00", covers: 0,
    });
    check("zero covers rejected", !zero.ok);

    const past = await createDiningReservation({
      userId: uid, date: "2020-05-05", timeSlot: "19:00", covers: 2,
    });
    check("past-dated reservation rejected", !past.ok);

    const good = await createDiningReservation({
      userId: uid, date: futureDate(45), timeSlot: "12:30", covers: 2,
    });
    check("valid reservation succeeds", good.ok, good.error);
    if (good.ok) {
      created.dining.push(good.reservation.id);
      check("dining code well-formed", /^DR-\d{8}-[A-Z0-9]{5}$/.test(good.reservation.confirmation_code));
      const [row] = await pool.query("SELECT user_id FROM dining_reservations WHERE id=?", [good.reservation.id]);
      check("dining user_id persisted", row[0].user_id === uid, `got ${row[0].user_id}`);
    }

    const slots = await getAvailableTimeSlots(futureDate(45), 2);
    check("time slots returned for valid query", Array.isArray(slots) && slots.length > 0, `${slots.length} slots`);
    check("past-date slot query returns empty", (await getAvailableTimeSlots("2020-01-01", 2)).length === 0);
  }
}

// ---------------------------------------------------------------- 7
console.log("\n[7] Availability aggregate query");
{
  const avail = await getRoomAvailability(futureDate(60), futureDate(63));
  const keys = Object.keys(avail);
  check("returns a map of room types", keys.length > 0, `${keys.length} types`);
  check("counts are non-negative and consistent",
    keys.every((k) => avail[k].available >= 0 && avail[k].available === Math.max(0, avail[k].total - avail[k].booked)));
  check("invalid range returns empty", Object.keys(await getRoomAvailability("2020-01-05", "2020-01-01")).length === 0);
}

// ---------------------------------------------------------------- cleanup
console.log("\n[cleanup]");
if (created.stay.length) {
  await pool.query(`DELETE FROM stay_bookings WHERE id IN (${created.stay.map(() => "?").join(",")})`, created.stay);
  console.log(`  removed ${created.stay.length} test stay booking(s)`);
}
if (created.dining.length) {
  await pool.query(`DELETE FROM dining_reservations WHERE id IN (${created.dining.map(() => "?").join(",")})`, created.dining);
  console.log(`  removed ${created.dining.length} test dining reservation(s)`);
}

console.log(`\n${"=".repeat(46)}`);
console.log(`  PASSED: ${pass}    FAILED: ${fail}`);
console.log("=".repeat(46));
await pool.end();
process.exit(fail === 0 ? 0 : 1);
