import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}

const parsed = new URL(url);
const conn = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port || 4000),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, "") || undefined,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

function isNoFap(q) {
  const n = String(q.name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ");
  return q.kind === "yesno" && (n.includes("no fap") || n.includes("nofap") || n === "gym session");
}

const [hunters] = await conn.query(
  "SELECT id, name, level, xp, streak, updated_at FROM hunters WHERE id = 60001 OR LOWER(name) LIKE '%rohit%'",
);
console.log("hunters", hunters);

for (const h of hunters) {
  const [quests] = await conn.query(
    "SELECT id, name, kind, is_active FROM quests WHERE hunter_id = ?",
    [h.id],
  );
  const noFap = quests.filter(isNoFap);
  console.log(
    "nofap quests",
    noFap.map((q) => ({ id: q.id, name: q.name, active: q.is_active })),
  );
  const noFapIds = new Set(noFap.map((q) => q.id));

  const [logs] = await conn.query(
    "SELECT id, date_key, submitted, status, updated_at FROM daily_logs WHERE hunter_id = ? ORDER BY date_key DESC LIMIT 14",
    [h.id],
  );
  for (const log of logs) {
    const [items] = await conn.query(
      "SELECT quest_id, cleared, value FROM daily_log_items WHERE daily_log_id = ?",
      [log.id],
    );
    const held = items.some((i) => noFapIds.has(i.quest_id) && Boolean(i.cleared));
    console.log({
      date: log.date_key,
      submitted: Boolean(log.submitted),
      status: log.status,
      noFapHeld: held,
      itemCount: items.length,
      updated: log.updated_at,
    });
  }
}

await conn.end();
