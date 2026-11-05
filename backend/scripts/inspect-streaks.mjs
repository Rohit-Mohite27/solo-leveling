import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}

const parsed = new URL(url);
const needsSsl =
  parsed.hostname.includes("tidbcloud.com") ||
  url.includes("sslMode=") ||
  url.includes("ssl=true");

console.log({
  host: parsed.hostname,
  port: parsed.port,
  db: parsed.pathname,
  user: `${decodeURIComponent(parsed.username).split(".")[0]}…`,
});

const conn = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port || 3306),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, "") || undefined,
  ...(needsSsl ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
});

const [hunters] = await conn.query("SELECT id, name, streak, level FROM hunters");
console.log("hunters", hunters);

const [logs] = await conn.query(
  "SELECT hunter_id, date_key, submitted, status FROM daily_logs ORDER BY date_key DESC LIMIT 30",
);
console.log("recent logs", logs);

const [quests] = await conn.query(
  "SELECT hunter_id, id, name, kind FROM quests WHERE kind = 'yesno' OR LOWER(name) LIKE '%fap%' OR LOWER(name) LIKE '%gym%'",
);
console.log("nofap-ish quests", quests);

if (logs.length) {
  const logIdRows = await conn.query(
    "SELECT id, hunter_id, date_key FROM daily_logs ORDER BY date_key DESC LIMIT 5",
  );
  for (const log of logIdRows[0]) {
    const [items] = await conn.query(
      `SELECT i.quest_id, i.cleared, i.value, q.name, q.kind
       FROM daily_log_items i
       LEFT JOIN quests q ON q.id = i.quest_id
       WHERE i.daily_log_id = ?`,
      [log.id],
    );
    console.log(`items for hunter ${log.hunter_id} ${log.date_key}`, items);
  }
}

await conn.end();
