import "dotenv/config";
import { z } from "zod";

const env_schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Comma-separated allowed origins for credentialed CORS */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  /** HMAC secret for session JWT cookie */
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  /** static = fixed OTP for local/dev; msg91 = real SMS */
  OTP_MODE: z.enum(["static", "msg91"]).default("static"),
  /** Used when OTP_MODE=static */
  STATIC_OTP: z.string().regex(/^\d{4,8}$/).default("123456"),
  MSG91_AUTH_KEY: z.string().optional().default(""),
  MSG91_TEMPLATE_ID: z.string().optional().default(""),
  /** Country dial code digits, e.g. 91 for India */
  MSG91_COUNTRY_CODE: z.string().default("91"),
});

const parsed = env_schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend env:", parsed.error.flatten().fieldErrors);
  throw new Error("Backend environment validation failed");
}

const data = parsed.data;

if (data.OTP_MODE === "msg91" && (!data.MSG91_AUTH_KEY || !data.MSG91_TEMPLATE_ID)) {
  console.error("OTP_MODE=msg91 requires MSG91_AUTH_KEY and MSG91_TEMPLATE_ID");
  throw new Error("Backend environment validation failed");
}

if (data.NODE_ENV === "production" && data.OTP_MODE === "static") {
  console.warn(
    "[warn] OTP_MODE=static in production — use MSG91 before sharing with friends",
  );
}

export const env = data;

export function corsOrigins(): string[] {
  return env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Exact CORS_ORIGIN entries, plus Vercel preview/prod aliases for this app. */
export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = corsOrigins();
  if (allowed.includes(origin)) return true;
  // Vercel gives a new *.vercel.app host per deploy; allow this project's hosts.
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    const host = url.hostname;
    if (host === "solo-leveling-azure-rho.vercel.app") return true;
    if (host.endsWith(".vercel.app") && host.startsWith("solo-leveling")) return true;
  } catch {
    return false;
  }
  return false;
}
