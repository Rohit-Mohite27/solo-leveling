import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const pool = mysql.createPool(env.DATABASE_URL);

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
