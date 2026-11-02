/**
 * Reset a hunter's progress + quest pack by name (e.g. Rohit).
 * Usage: npx tsx scripts/reset-hunter-by-name.ts Rohit
 */
import "dotenv/config";
import { eq, like, or } from "drizzle-orm";
import { db } from "../src/db/client.js";
import {
  ally_unlocks,
  daily_log_items,
  daily_logs,
  hunters,
  quests,
} from "../src/db/schema.js";

const STARTER = [
  { name: "Push-ups", kind: "count" as const, target: "50", unit: "reps", accent: "#7c6cf0", sort_order: 0 },
  { name: "Sit-ups", kind: "count" as const, target: "50", unit: "reps", accent: "#5b9cf5", sort_order: 1 },
  { name: "Run", kind: "distance" as const, target: "3", unit: "km", accent: "#f0a05a", sort_order: 2 },
  { name: "No Fap", kind: "yesno" as const, target: "1", unit: "done", accent: "#e85a7a", sort_order: 3 },
  { name: "Steps", kind: "steps" as const, target: "10000", unit: "steps", accent: "#5ec4a8", sort_order: 4 },
];

async function main() {
  const needle = (process.argv[2] ?? "Rohit").trim();
  if (!needle) {
    console.error("Pass a name, e.g. npx tsx scripts/reset-hunter-by-name.ts Rohit");
    process.exit(1);
  }

  const matches = await db
    .select()
    .from(hunters)
    .where(or(eq(hunters.name, needle), like(hunters.name, `${needle} %`), like(hunters.name, `% ${needle}`)));

  if (matches.length === 0) {
    console.log(`No hunters found matching "${needle}"`);
    process.exit(0);
  }

  for (const hunter of matches) {
    console.log(`Resetting hunter #${hunter.id} (${hunter.name})…`);

    const logs = await db.select().from(daily_logs).where(eq(daily_logs.hunter_id, hunter.id));
    for (const log of logs) {
      await db.delete(daily_log_items).where(eq(daily_log_items.daily_log_id, log.id));
    }
    await db.delete(daily_logs).where(eq(daily_logs.hunter_id, hunter.id));
    await db.delete(ally_unlocks).where(eq(ally_unlocks.hunter_id, hunter.id));
    await db.delete(quests).where(eq(quests.hunter_id, hunter.id));

    await db
      .update(hunters)
      .set({ level: 1, xp: 0, streak: 0 })
      .where(eq(hunters.id, hunter.id));

    for (const q of STARTER) {
      await db.insert(quests).values({
        hunter_id: hunter.id,
        name: q.name,
        kind: q.kind,
        target: q.target,
        unit: q.unit,
        accent: q.accent,
        sort_order: q.sort_order,
        is_active: true,
      });
    }

    console.log(`  → level 1, xp 0, streak 0, starter quests restored`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
