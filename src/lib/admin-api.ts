/** Admin dashboard API — separate token from hunter session. */

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
  .trim()
  .replace(/\/$/, "");

const ADMIN_TOKEN_KEY = "solo_admin_token";

export type AdminOverview = {
  huntersTotal: number;
  activeToday: number;
  active7d: number;
  submitsToday: number;
  otpsToday: number;
  todayKey: string;
};

export type AdminHunterRow = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
};

export type AdminHunterDetail = {
  hunter: AdminHunterRow;
  quests: Array<{
    id: number;
    name: string;
    kind: string;
    target: string;
    unit: string;
    isActive: boolean;
  }>;
  recentLogs: Array<{
    id: number;
    dateKey: string;
    status: string;
    submitted: boolean;
  }>;
};

export type AdminHunterDay = {
  dateKey: string;
  status: string;
  submitted: boolean;
  tasks: Array<{
    questId: number;
    name: string;
    kind: string | null;
    unit: string | null;
    target: string | null;
    value: string;
    cleared: boolean;
    active: boolean;
  }>;
};

export type AdminHealth = {
  service: string;
  database: "up" | "down";
  message: string;
  timestamp: string;
};

export class AdminApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (!token) sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    else sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new AdminApiError("NETWORK_ERROR", "Cannot reach the API", 0);
  }

  type Ok = { success: true; data: T };
  type Err = { success: false; code: string; message: string };
  let json: Ok | Err | null = null;
  try {
    json = (await res.json()) as Ok | Err;
  } catch {
    // ignore
  }

  if (!res.ok || !json || json.success !== true) {
    if (res.status === 401) setAdminToken(null);
    const errBody = json && json.success === false ? json : null;
    throw new AdminApiError(
      errBody?.code ?? "HTTP_ERROR",
      errBody?.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }

  return json.data;
}

export async function adminLogin(password: string) {
  const data = await adminFetch<{ ok: boolean; sessionToken?: string }>("/api/v1/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (data.sessionToken) setAdminToken(data.sessionToken);
  return data;
}

export async function adminLogout() {
  try {
    await adminFetch<{ ok: boolean }>("/api/v1/admin/logout", { method: "POST" });
  } finally {
    setAdminToken(null);
  }
}

export async function adminMe() {
  return adminFetch<{ admin: boolean }>("/api/v1/admin/me");
}

export async function fetchAdminOverview() {
  return adminFetch<AdminOverview>("/api/v1/admin/overview");
}

export async function fetchAdminHunters(q?: string) {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return adminFetch<AdminHunterRow[]>(`/api/v1/admin/hunters${qs}`);
}

export async function fetchAdminHunter(id: number) {
  return adminFetch<AdminHunterDetail>(`/api/v1/admin/hunters/${id}`);
}

export async function fetchAdminHunterDay(id: number, dateKey: string) {
  return adminFetch<AdminHunterDay>(
    `/api/v1/admin/hunters/${id}/days/${encodeURIComponent(dateKey)}`,
  );
}

export async function resetAdminHunter(id: number) {
  return adminFetch<AdminHunterDetail>(`/api/v1/admin/hunters/${id}/reset`, {
    method: "POST",
  });
}

export async function resetAdminHunterDates(id: number, dateKeys: string[]) {
  return adminFetch<AdminHunterDetail & { clearedDates: string[]; clearedCount: number }>(
    `/api/v1/admin/hunters/${id}/reset-dates`,
    {
      method: "POST",
      body: JSON.stringify({ dateKeys }),
    },
  );
}

export async function deleteAdminHunter(id: number) {
  return adminFetch<{ id: number; name: string; deleted: true }>(
    `/api/v1/admin/hunters/${id}`,
    { method: "DELETE" },
  );
}

export async function fetchAdminHealth() {
  return adminFetch<AdminHealth>("/api/v1/admin/health");
}
