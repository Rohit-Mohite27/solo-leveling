import "dotenv/config";
import { z } from "zod";

const env_schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  /** static | textbee (SMS via your phone) | resend | msg91 */
  OTP_MODE: z.enum(["static", "textbee", "resend", "msg91"]).default("static"),
  STATIC_OTP: z.string().regex(/^\d{4,8}$/).default("123456"),
  /** TextBee — SMS gateway through your Android device */
  TEXTBEE_API_KEY: z.string().optional().default(""),
  TEXTBEE_DEVICE_ID: z.string().optional().default(""),
  TEXTBEE_BASE_URL: z.string().default("https://api.textbee.dev/api/v1"),
  /** Country dial code digits for SMS, e.g. 91 */
  SMS_COUNTRY_CODE: z.string().default("91"),
  RESEND_API_KEY: z.string().optional().default(""),
  OTP_FROM_EMAIL: z.string().optional().default("Solo Leveling <onboarding@resend.dev>"),
  MSG91_AUTH_KEY: z.string().optional().default(""),
  MSG91_WIDGET_ID: z.string().optional().default(""),
  MSG91_TEMPLATE_ID: z.string().optional().default(""),
  MSG91_COUNTRY_CODE: z.string().default("91"),
});

const parsed = env_schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend env:", parsed.error.flatten().fieldErrors);
  throw new Error("Backend environment validation failed");
}

const data = parsed.data;

if (data.OTP_MODE === "textbee" && (!data.TEXTBEE_API_KEY || !data.TEXTBEE_DEVICE_ID)) {
  console.error("OTP_MODE=textbee requires TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID");
  throw new Error("Backend environment validation failed");
}

if (data.OTP_MODE === "resend" && !data.RESEND_API_KEY) {
  console.error("OTP_MODE=resend requires RESEND_API_KEY");
  throw new Error("Backend environment validation failed");
}

if (data.OTP_MODE === "msg91" && (!data.MSG91_AUTH_KEY || !data.MSG91_WIDGET_ID)) {
  console.error("OTP_MODE=msg91 requires MSG91_AUTH_KEY and MSG91_WIDGET_ID");
  throw new Error("Backend environment validation failed");
}

if (data.NODE_ENV === "production" && data.OTP_MODE === "static") {
  console.warn("[warn] OTP_MODE=static in production");
}

export const env = data;

export function corsOrigins(): string[] {
  return env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
}

function isPrivateLanHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  const m = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(hostname);
  if (m) {
    const second = Number(m[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = corsOrigins();
  if (allowed.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    // Local/LAN frontends (e.g. http://192.168.x.x:3000) while developing
    if (env.NODE_ENV === "development" && isPrivateLanHost(host)) return true;
    if (url.protocol !== "https:") return false;
    if (host === "solo-leveling-azure-rho.vercel.app") return true;
    if (host.endsWith(".vercel.app") && host.startsWith("solo-leveling")) return true;
  } catch {
    return false;
  }
  return false;
}
