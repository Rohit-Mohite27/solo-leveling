import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/** One hunter (friend / account) */
export const hunters = mysqlTable(
  "hunters",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    /** Login email (normalized lowercase) */
    email: varchar("email", { length: 255 }),
    /** Optional legacy mobile */
    phone: varchar("phone", { length: 15 }),
    level: int("level").notNull().default(1),
    xp: int("xp").notNull().default(0),
    streak: int("streak").notNull().default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("hunters_email_uq").on(t.email),
    uniqueIndex("hunters_phone_uq").on(t.phone),
  ],
);

/** OTP challenge keyed by email (or legacy phone) */
export const otp_challenges = mysqlTable(
  "otp_challenges",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Email or phone used to request OTP */
    identifier: varchar("identifier", { length: 255 }).notNull(),
    code_hash: varchar("code_hash", { length: 128 }).notNull(),
    expires_at: timestamp("expires_at").notNull(),
    attempts: int("attempts").notNull().default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("otp_challenges_identifier_uq").on(t.identifier),
    index("otp_challenges_expires_idx").on(t.expires_at),
  ],
);

/** Personal quest pack items */
export const quests = mysqlTable(
  "quests",
  {
    id: int("id").autoincrement().primaryKey(),
    hunter_id: int("hunter_id")
      .notNull()
      .references(() => hunters.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    kind: mysqlEnum("kind", ["count", "distance", "duration", "yesno", "steps"]).notNull(),
    target: decimal("target", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 32 }).notNull(),
    accent: varchar("accent", { length: 16 }).notNull().default("#7c6cf0"),
    sort_order: int("sort_order").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("quests_hunter_idx").on(t.hunter_id)],
);

/** One calendar day (IST date_key) for a hunter */
export const daily_logs = mysqlTable(
  "daily_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    hunter_id: int("hunter_id")
      .notNull()
      .references(() => hunters.id, { onDelete: "cascade" }),
    date_key: varchar("date_key", { length: 10 }).notNull(),
    status: mysqlEnum("status", ["complete", "partial", "failed", "empty"])
      .notNull()
      .default("empty"),
    submitted: boolean("submitted").notNull().default(false),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("daily_logs_hunter_date_uq").on(t.hunter_id, t.date_key),
    index("daily_logs_hunter_idx").on(t.hunter_id),
  ],
);

/** Per-quest values for that day */
export const daily_log_items = mysqlTable(
  "daily_log_items",
  {
    id: int("id").autoincrement().primaryKey(),
    daily_log_id: int("daily_log_id")
      .notNull()
      .references(() => daily_logs.id, { onDelete: "cascade" }),
    quest_id: int("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    value: decimal("value", { precision: 10, scale: 2 }).notNull().default("0"),
    cleared: boolean("cleared").notNull().default(false),
  },
  (t) => [
    uniqueIndex("daily_log_items_uq").on(t.daily_log_id, t.quest_id),
    index("daily_log_items_log_idx").on(t.daily_log_id),
  ],
);

/** Ally unlock events (optional audit / cutscene history) */
export const ally_unlocks = mysqlTable(
  "ally_unlocks",
  {
    id: int("id").autoincrement().primaryKey(),
    hunter_id: int("hunter_id")
      .notNull()
      .references(() => hunters.id, { onDelete: "cascade" }),
    ally_id: varchar("ally_id", { length: 64 }).notNull(),
    unlock_level: int("unlock_level").notNull(),
    unlocked_at: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("ally_unlocks_uq").on(t.hunter_id, t.ally_id),
    index("ally_unlocks_hunter_idx").on(t.hunter_id),
  ],
);

export type Hunter = typeof hunters.$inferSelect;
export type QuestRow = typeof quests.$inferSelect;
export type DailyLog = typeof daily_logs.$inferSelect;
