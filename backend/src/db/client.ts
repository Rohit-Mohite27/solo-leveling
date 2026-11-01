import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

/** TiDB Cloud / many hosted MySQL require TLS. Set DATABASE_SSL=false for local plain MySQL. */
const use_ssl =
  process.env.DATABASE_SSL === "true" ||
  (process.env.DATABASE_SSL !== "false" &&
    (env.NODE_ENV === "production" ||
      env.DATABASE_URL.includes("tidbcloud.com") ||
      env.DATABASE_URL.includes("sslMode=VERIFY_IDENTITY") ||
      env.DATABASE_URL.includes("ssl=true")));

const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  ...(use_ssl ? { ssl: { rejectUnauthorized: true } } : {}),
});

export const db = drizzle(pool, { schema, mode: "default" });

export async function pingDatabase(): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
