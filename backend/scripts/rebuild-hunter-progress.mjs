/**
 * Rebuild one hunter's level/XP/streak from remaining submitted logs.
 * Usage:
 *   node --env-file=.env scripts/rebuild-hunter-progress.mjs 60001
 *   DATABASE_URL=... node scripts/rebuild-hunter-progress.mjs 60001
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
const hunterId = Number(process.argv[2] || 0);
if (!url || !hunterId) {
  console.error("Usage: DATABASE_URL=... node scripts/rebuild-hunter-progress.mjs <hunterId>");
  process.exit(1);
}

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
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function isNoFapQuest(q) {
  const n = String(q.name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ");
  return (
    q.kind === "yesno" &&
    (n.includes("no fap") || n.includes("nofap") || n === "gym session")
  );
}

function xpForLevel(level) {
  return 100 + (level - 1) * 40;
}

function countNoFapStreak(as_of, held_by_date) {
  let cursor = as_of;
  if (!held_by_date.has(cursor)) cursor = shiftDateKey(cursor, -1);
  let streak = 0;
  for (;;) {
    if (!held_by_date.has(cursor) || !held_by_date.get(cursor)) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
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

const [[hunter]] = await conn.query(
  "SELECT id, name, level, xp, streak FROM hunters WHERE id = ?",
  [hunterId],
);
if (!hunter) {
  console.error("Hunter not found", hunterId);
  process.exit(1);
}

const [quests] = await conn.query(
  "SELECT id, name, kind FROM quests WHERE hunter_id = ?",
  [hunterId],
);
const questById = new Map(quests.map((q) => [q.id, q]));
const noFapIds = new Set(quests.filter(isNoFapQuest).map((q) => q.id));

const [logs] = await conn.query(
  "SELECT id, date_key, submitted, status FROM daily_logs WHERE hunter_id = ? ORDER BY date_key ASC",
  [hunterId],
);

let level = 1;
let xp = 0;
let runStreak = 0;
let prevHeld = null;
const heldByDate = new Map();

for (const log of logs) {
  if (!log.submitted) continue;
  const [items] = await conn.query(
    "SELECT quest_id, cleared FROM daily_log_items WHERE daily_log_id = ?",
    [log.id],
  );
  const clearedCore = items.filter((i) => {
    if (!i.cleared) return false;
    const q = questById.get(i.quest_id);
    return !q || q.kind !== "steps";
  }).length;
  const noFapHeld = items.some((i) => noFapIds.has(i.quest_id) && Boolean(i.cleared));
  heldByDate.set(log.date_key, noFapHeld);

  if (noFapHeld) {
    runStreak = prevHeld && shiftDateKey(prevHeld, 1) === log.date_key ? runStreak + 1 : 1;
    prevHeld = log.date_key;
  } else {
    runStreak = 0;
    prevHeld = null;
  }

  let xpGain = clearedCore * 25;
  const allClear = log.status === "complete";
  if (allClear) {
    xpGain += 40;
    if (runStreak > 1) xpGain += Math.min(50, runStreak * 5);
  } else if (noFapHeld && runStreak > 1) {
    xpGain += Math.min(50, runStreak * 5);
  }

  xp += xpGain;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }
}

const streak = countNoFapStreak(todayKeyIst(), heldByDate);

console.log("before", {
  name: hunter.name,
  level: hunter.level,
  xp: hunter.xp,
  streak: hunter.streak,
});
console.log("after", { level, xp, streak, heldDays: [...heldByDate.entries()] });

await conn.query("UPDATE hunters SET level = ?, xp = ?, streak = ? WHERE id = ?", [
  level,
  xp,
  streak,
  hunterId,
]);

await conn.end();
console.log("updated hunter", hunterId);
