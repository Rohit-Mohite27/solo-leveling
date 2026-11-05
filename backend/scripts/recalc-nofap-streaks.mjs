/**
 * Rebuild every hunter's streak from submitted daily logs.
 * Rule: consecutive IST days with No Fap Held; a miss or broken hold restarts the count.
 *
 * Usage (from backend/):
 *   node --env-file=.env scripts/recalc-nofap-streaks.mjs
 *   node --env-file=.env scripts/recalc-nofap-streaks.mjs --dry-run
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL (e.g. node --env-file=.env …)");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

function todayKeyIst(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDateKey(date_key, delta_days) {
  const [y, m, d] = date_key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta_days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function isNoFapQuest(quest) {
  const n = String(quest.name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ");
  return (
    quest.kind === "yesno" &&
    (n.includes("no fap") || n.includes("nofap") || n === "gym session")
  );
}

function countNoFapStreak(as_of, held_by_date) {
  let cursor = as_of;
  if (!held_by_date.has(cursor)) {
    cursor = shiftDateKey(cursor, -1);
  }
  let streak = 0;
  for (;;) {
    if (!held_by_date.has(cursor)) break;
    if (!held_by_date.get(cursor)) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

const parsed = new URL(url);
const needsSsl =
  parsed.hostname.includes("tidbcloud.com") ||
  url.includes("sslMode=") ||
  url.includes("ssl=true");

const conn = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port || 3306),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, "") || undefined,
  ...(needsSsl ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
});

const asOf = todayKeyIst();
const [hunters] = await conn.query(
  "SELECT id, name, streak FROM hunters ORDER BY id ASC",
);

console.log(
  `${dryRun ? "[dry-run] " : ""}Recalc No Fap streaks as of ${asOf} for ${hunters.length} hunters`,
);

const updates = [];

for (const h of hunters) {
  const [quests] = await conn.query(
    "SELECT id, name, kind FROM quests WHERE hunter_id = ? AND is_active = 1",
    [h.id],
  );
  const noFapIds = new Set(quests.filter(isNoFapQuest).map((q) => q.id));

  const held_by_date = new Map();
  if (noFapIds.size > 0) {
    const [logs] = await conn.query(
      "SELECT id, date_key, submitted FROM daily_logs WHERE hunter_id = ? ORDER BY date_key DESC LIMIT 400",
      [h.id],
    );
    for (const log of logs) {
      if (!log.submitted) continue;
      const [items] = await conn.query(
        "SELECT quest_id, cleared FROM daily_log_items WHERE daily_log_id = ?",
        [log.id],
      );
      const ok = items.some((i) => noFapIds.has(i.quest_id) && Boolean(i.cleared));
      held_by_date.set(log.date_key, ok);
    }
  }

  const streak = countNoFapStreak(asOf, held_by_date);
  const changed = streak !== h.streak;
  updates.push({
    id: h.id,
    name: h.name,
    old: h.streak,
    next: streak,
    heldDays: [...held_by_date.entries()].filter(([, v]) => v).length,
    brokeDays: [...held_by_date.entries()].filter(([, v]) => !v).length,
    changed,
  });

  if (!dryRun && changed) {
    await conn.query("UPDATE hunters SET streak = ? WHERE id = ?", [streak, h.id]);
  }
}

await conn.end();

for (const u of updates) {
  const mark = u.changed ? "*" : " ";
  console.log(
    `${mark} #${u.id} ${u.name}: ${u.old} → ${u.next} (held=${u.heldDays}, broke=${u.brokeDays})`,
  );
}

const changedCount = updates.filter((u) => u.changed).length;
console.log(
  dryRun
    ? `Dry run done — would update ${changedCount} hunters`
    : `Done — updated ${changedCount} hunters`,
);
