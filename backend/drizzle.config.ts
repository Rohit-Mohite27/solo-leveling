import { defineConfig } from "drizzle-kit";
import "dotenv/config";

/** TiDB Cloud rejects non-TLS connections; mysql2 JSON-parses the `ssl` URL param. */
function withSsl(raw: string): string {
  if (!raw) return raw;
  const wants_ssl =
    process.env.DATABASE_SSL === "true" ||
    (process.env.DATABASE_SSL !== "false" &&
      (process.env.NODE_ENV === "production" || raw.includes("tidbcloud.com")));
  if (!wants_ssl) return raw;
  const url = new URL(raw);
  if (!url.searchParams.has("ssl")) {
    url.searchParams.set("ssl", JSON.stringify({ rejectUnauthorized: true }));
  }
  return url.toString();
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: withSsl(process.env.DATABASE_URL ?? ""),
  },
});
