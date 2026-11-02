import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL before running this script");
  process.exit(1);
}
const needle = process.argv[2] || "Rohit";

const conn = await mysql.createConnection(url);
const [hunters] = await conn.query(
  "SELECT id, name, level, xp, streak FROM hunters WHERE name = ? OR name LIKE ? OR name LIKE ?",
  [needle, `${needle} %`, `% ${needle}`],
);

console.log("matches:", hunters);

for (const h of hunters) {
  const [logs] = await conn.query("SELECT id FROM daily_logs WHERE hunter_id = ?", [h.id]);
  for (const log of logs) {
    await conn.query("DELETE FROM daily_log_items WHERE daily_log_id = ?", [log.id]);
  }
  await conn.query("DELETE FROM daily_logs WHERE hunter_id = ?", [h.id]);
  try {
    await conn.query("DELETE FROM ally_unlocks WHERE hunter_id = ?", [h.id]);
  } catch {
    // table may be missing on older local DBs
  }
  await conn.query("DELETE FROM quests WHERE hunter_id = ?", [h.id]);
  await conn.query("UPDATE hunters SET level = 1, xp = 0, streak = 0 WHERE id = ?", [h.id]);

  const starters = [
    ["Push-ups", "count", "50", "reps", "#7c6cf0", 0],
    ["Sit-ups", "count", "50", "reps", "#5b9cf5", 1],
    ["Run", "distance", "3", "km", "#f0a05a", 2],
    ["No Fap", "yesno", "1", "done", "#e85a7a", 3],
    ["Steps", "steps", "10000", "steps", "#5ec4a8", 4],
  ];
  for (const s of starters) {
    await conn.query(
      "INSERT INTO quests (hunter_id, name, kind, target, unit, accent, sort_order, is_active) VALUES (?,?,?,?,?,?,?,1)",
      [h.id, ...s],
    );
  }
  console.log(`reset #${h.id} ${h.name}`);
}

await conn.end();
console.log("done");
