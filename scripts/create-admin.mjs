/**
 * Creates (or updates) the admin account.
 *
 * The password is never written in source code or committed anywhere — you
 * provide it via environment variables when you run this script, and only
 * its bcrypt hash is stored in the database. The app itself never reads
 * ADMIN_EMAIL / ADMIN_PASSWORD at runtime — only this one-off script does.
 *
 * Usage (from the hotel-react folder):
 *
 *   Windows (PowerShell):
 *     $env:ADMIN_EMAIL="you@stlachland.lk"; $env:ADMIN_PASSWORD="choose-a-strong-one"; npm run create-admin
 *
 *   macOS/Linux:
 *     ADMIN_EMAIL="you@stlachland.lk" ADMIN_PASSWORD="choose-a-strong-one" npm run create-admin
 *
 * Also reads DB_HOST / DB_USER / DB_PASSWORD / DB_NAME from .env.local,
 * same as the app.
 */

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config({ path: ".env.local" });

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  let name = process.env.ADMIN_NAME || "Estate Admin";

  if (!email) email = await ask("Admin email: ");
  if (!password) password = await ask("Admin password (min 8 chars): ");

  if (!email || !password || password.length < 8) {
    console.error("\n✗ Need a valid email and a password of at least 8 characters.");
    process.exit(1);
  }

  const pool = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "event_coordinator",
  });

  const password_hash = await bcrypt.hash(password, 12);

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    await pool.query(
      "UPDATE users SET password_hash = ?, role = 'admin', name = ? WHERE email = ?",
      [password_hash, name, email]
    );
    console.log(`\n✓ Updated existing account "${email}" to admin with the new password.`);
  } else {
    await pool.query(
      "INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, 'admin', ?)",
      [name, email, password_hash]
    );
    console.log(`\n✓ Created admin account "${email}".`);
  }

  console.log("You can now log in at /admin/login with that email and password.");
  await pool.end();
}

main().catch((e) => {
  console.error("\n✗ Failed:", e.message);
  process.exit(1);
});
