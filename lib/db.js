import mysql from "mysql2/promise";

export function getPool() {
  if (!global.__slPool) {
    global.__slPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "event_coordinator",
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
    });
  }
  return global.__slPool;
}
