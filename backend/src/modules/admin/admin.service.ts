import { timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { getHealthStatus } from "../health/health.service.js";
import * as dailyLogsService from "../daily-logs/daily-logs.service.js";
import * as adminRepository from "./admin.repository.js";

export class AdminError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** IST calendar day YYYY-MM-DD */
function todayKeyIst(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDateKey(key: string, deltaDays: number): string {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function passwordsMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function assertAdminPassword(password: string) {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) {
    throw new AdminError("ADMIN_DISABLED", "Admin login is not configured", 503);
  }
  if (!passwordsMatch(password, expected)) {
    throw new AdminError("INVALID_PASSWORD", "Incorrect admin password", 401);
  }
}

export async function getOverview() {
  const today = todayKeyIst();
  const week_start = shiftDateKey(today, -6);
  // Approximate "today" OTP volume as last 24 hours (challenge rows have no IST date_key)
  const since_24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [hunters_total, active_today, active_7d, submits_today, otps_today] =
    await Promise.all([
      adminRepository.countHunters(),
      adminRepository.countActiveSince(today),
      adminRepository.countActiveSince(week_start),
      adminRepository.countSubmittedOnDate(today),
      adminRepository.countOtpsSince(since_24h),
    ]);

  return {
    huntersTotal: hunters_total,
    activeToday: active_today,
    active7d: active_7d,
    submitsToday: submits_today,
    otpsToday: otps_today,
    todayKey: today,
  };
}

/** Rebuild every hunter streak from No Fap hold history. */
export async function recalcAllNoFapStreaks() {
  const rows = await adminRepository.listHunters();
  const results: Array<{
    id: number;
    name: string;
    previousStreak: number;
    streak: number;
  }> = [];
  for (const h of rows) {
    const out = await dailyLogsService.recalcHunterNoFapStreak(h.id);
    results.push({
      id: h.id,
      name: h.name,
      previousStreak: out.previous_streak,
      streak: out.streak,
    });
  }
  return { updated: results.length, hunters: results };
}

export async function listHunters(search?: string) {
  const rows = await adminRepository.listHunters(search);
  return rows.map((h) => ({
    id: h.id,
    name: h.name,
    phone: h.phone,
    email: h.email,
    level: h.level,
    xp: h.xp,
    streak: h.streak,
    createdAt: h.created_at,
  }));
}

export async function getHunterDetail(hunter_id: number) {
  const hunter = await adminRepository.findHunter(hunter_id);
  if (!hunter) throw new AdminError("NOT_FOUND", "Hunter not found", 404);

  const [quest_rows, log_rows] = await Promise.all([
    adminRepository.listQuests(hunter_id),
    adminRepository.listRecentLogs(hunter_id),
  ]);

  return {
    hunter: {
      id: hunter.id,
      name: hunter.name,
      phone: hunter.phone,
      email: hunter.email,
      level: hunter.level,
      xp: hunter.xp,
      streak: hunter.streak,
      createdAt: hunter.created_at,
    },
    quests: quest_rows.map((q) => ({
      id: q.id,
      name: q.name,
      kind: q.kind,
      target: q.target,
      unit: q.unit,
      isActive: q.is_active,
    })),
    recentLogs: log_rows.map((l) => ({
      id: l.id,
      dateKey: l.date_key,
      status: l.status,
      submitted: l.submitted,
    })),
  };
}

export async function getHunterDay(hunter_id: number, date_key: string) {
  const hunter = await adminRepository.findHunter(hunter_id);
  if (!hunter) throw new AdminError("NOT_FOUND", "Hunter not found", 404);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_key)) {
    throw new AdminError("BAD_REQUEST", "Invalid date key", 400);
  }

  const log = await adminRepository.findLogByDate(hunter_id, date_key);
  if (!log) {
    return {
      dateKey: date_key,
      status: "empty" as const,
      submitted: false,
      tasks: [] as Array<{
        questId: number;
        name: string;
        kind: string | null;
        unit: string | null;
        target: string | null;
        value: string;
        cleared: boolean;
        active: boolean;
      }>,
    };
  }

  const items = await adminRepository.listItemsForLog(log.id);
  return {
    dateKey: log.date_key,
    status: log.status,
    submitted: log.submitted,
    tasks: items.map((i) => ({
      questId: i.quest_id,
      name: i.quest_name ?? `Quest #${i.quest_id}`,
      kind: i.quest_kind,
      unit: i.quest_unit,
      target: i.quest_target,
      value: i.value,
      cleared: i.cleared,
      active: Boolean(i.quest_active),
    })),
  };
}

export async function resetHunter(hunter_id: number) {
  const hunter = await adminRepository.findHunter(hunter_id);
  if (!hunter) throw new AdminError("NOT_FOUND", "Hunter not found", 404);
  await adminRepository.resetHunterProgress(hunter_id);
  await adminRepository.insertStarterQuests(hunter_id);
  return getHunterDetail(hunter_id);
}

const date_key_re = /^\d{4}-\d{2}-\d{2}$/;

export async function resetHunterDates(hunter_id: number, date_keys: string[]) {
  const hunter = await adminRepository.findHunter(hunter_id);
  if (!hunter) throw new AdminError("NOT_FOUND", "Hunter not found", 404);

  const cleaned = [...new Set(date_keys.map((k) => k.trim()).filter(Boolean))];
  if (cleaned.length === 0) {
    throw new AdminError("BAD_REQUEST", "Pick at least one date (YYYY-MM-DD)", 400);
  }
  for (const key of cleaned) {
    if (!date_key_re.test(key)) {
      throw new AdminError("BAD_REQUEST", `Invalid date key: ${key}`, 400);
    }
  }

  const result = await adminRepository.deleteHunterLogsByDates(hunter_id, cleaned);
  const detail = await getHunterDetail(hunter_id);
  return { ...detail, clearedDates: result.dateKeys, clearedCount: result.deleted };
}

export async function deleteHunter(hunter_id: number) {
  const hunter = await adminRepository.findHunter(hunter_id);
  if (!hunter) throw new AdminError("NOT_FOUND", "Hunter not found", 404);
  const ok = await adminRepository.deleteHunter(hunter_id);
  if (!ok) throw new AdminError("NOT_FOUND", "Hunter not found", 404);
  return { id: hunter_id, name: hunter.name, deleted: true as const };
}

export async function adminHealth() {
  return getHealthStatus();
}
