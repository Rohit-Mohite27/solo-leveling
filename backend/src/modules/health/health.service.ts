import { pingDatabase } from "../../db/client.js";

export async function getHealthStatus() {
  let database: "up" | "down" = "down";
  let message = "ok";

  try {
    const ok = await pingDatabase();
    database = ok ? "up" : "down";
    if (!ok) message = "Database ping failed";
  } catch (err) {
    database = "down";
    message = err instanceof Error ? err.message : "Database unreachable";
  }

  return {
    service: "solo-leveling-api",
    database,
    message,
    timestamp: new Date().toISOString(),
  };
}
