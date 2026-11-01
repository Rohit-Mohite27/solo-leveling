/** Browser API client — cookie when possible, Bearer token fallback for cross-site. */

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
  .trim()
  .replace(/\/$/, "");

const TOKEN_KEY = "solo_session_token";

export type ApiHunter = {
  id: number;
  name: string;
  phone: string;
  level: number;
  xp: number;
  streak: number;
};

export type ApiQuest = {
  id: number;
  hunter_id: number;
  name: string;
  kind: "count" | "distance" | "duration" | "yesno" | "steps";
  target: string;
  unit: string;
  accent: string;
  sort_order: number;
  is_active: boolean;
};

export type ApiLogItem = {
  id: number;
  daily_log_id: number;
  quest_id: number;
  value: string;
  cleared: boolean;
};

export type ApiDailyLog = {
  id: number;
  hunter_id: number;
  date_key: string;
  status: "complete" | "partial" | "failed" | "empty";
  submitted: boolean;
};

type ApiOk<T> = { success: true; data: T };
type ApiErr = { success: false; code: string; message: string };

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null): void {
  try {
    if (!token) sessionStorage.removeItem(TOKEN_KEY);
    else sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
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
    throw new ApiError(
      "NETWORK_ERROR",
      "Cannot reach the API (Render may be waking up — wait ~30s and retry)",
      0,
    );
  }

  let json: ApiOk<T> | ApiErr | null = null;
  try {
    json = (await res.json()) as ApiOk<T> | ApiErr;
  } catch {
    // non-JSON (e.g. Render 502 HTML)
  }

  if (!res.ok || !json || json.success !== true) {
    const err = json && "code" in json ? json : null;
    if (res.status === 401) setSessionToken(null);
    const fallback =
      res.status === 502 || res.status === 503
        ? "API is starting up — wait a moment and try again"
        : `Request failed (${res.status})`;
    throw new ApiError(err?.code ?? "HTTP_ERROR", err?.message ?? fallback, res.status);
  }

  return json.data;
}

export function getApiBaseUrl() {
  return API_URL;
}

export async function requestOtp(phone: string) {
  return apiFetch<{ phone: string; expires_in_sec: number }>("/api/v1/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(input: { phone: string; otp: string; name: string }) {
  const data = await apiFetch<{
    hunter: ApiHunter;
    created: boolean;
    sessionToken?: string;
  }>("/api/v1/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (data.sessionToken) setSessionToken(data.sessionToken);
  return data;
}

export async function logoutApi() {
  try {
    return await apiFetch<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST" });
  } finally {
    setSessionToken(null);
  }
}

export async function fetchMe() {
  return apiFetch<{ hunter: ApiHunter }>("/api/v1/auth/me");
}

export async function fetchQuests(hunterId: number) {
  return apiFetch<ApiQuest[]>(`/api/v1/quests/hunter/${hunterId}`);
}

export async function fetchToday(hunterId: number) {
  return apiFetch<{ log: ApiDailyLog; items: ApiLogItem[]; date_key: string }>(
    `/api/v1/daily-logs/hunter/${hunterId}/today`,
  );
}

export async function fetchRecentLogs(hunterId: number) {
  return apiFetch<ApiDailyLog[]>(`/api/v1/daily-logs/hunter/${hunterId}`);
}

export async function patchTodayItem(
  hunterId: number,
  questId: number,
  body: { value: number; cleared: boolean },
) {
  return apiFetch<ApiLogItem>(
    `/api/v1/daily-logs/hunter/${hunterId}/today/items/${questId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function submitTodayApi(hunterId: number) {
  return apiFetch<{
    hunter: ApiHunter;
    status?: string;
    xp_gain?: number;
    leveled: boolean;
    already_submitted: boolean;
  }>(`/api/v1/daily-logs/hunter/${hunterId}/today/submit`, { method: "POST" });
}

export async function createQuestApi(
  hunterId: number,
  body: {
    name: string;
    kind: string;
    target: number;
    unit: string;
    accent?: string;
  },
) {
  return apiFetch<ApiQuest>(`/api/v1/quests/hunter/${hunterId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteQuestApi(questId: number) {
  return apiFetch<{ id: number }>(`/api/v1/quests/${questId}`, { method: "DELETE" });
}
