import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(configDir, "../../../.env") });
dotenv.config({ path: path.resolve(configDir, "../../.env") });

const optionalString = () =>
  z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined));

const optionalUrl = () =>
  z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined))
    .pipe(z.string().url().optional());

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),

  // Core Database & Auth (Required)
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Frontend URLs (Optional with dev fallbacks)
  SUPER_ADMIN_FRONTEND_URL: optionalUrl(),
  SUB_ADMIN_FRONTEND_URL: optionalUrl(),
  RECEPTIONIST_FRONTEND_URL: optionalUrl(),
  KITCHEN_FRONTEND_URL: optionalUrl(),
  GUEST_FRONTEND_URL: optionalUrl(),
  SELF_CHECKIN_FRONTEND_URL: optionalUrl(),
  TABLE_ORDER_FRONTEND_URL: optionalUrl(),
  SOCKET_CORS_ORIGINS: optionalString(),

  // Cloudflare R2 (Optional)
  R2_ACCOUNT_ID: optionalString(),
  R2_ACCESS_KEY_ID: optionalString(),
  R2_SECRET_ACCESS_KEY: optionalString(),
  R2_BUCKET_NAME: optionalString(),
  R2_URL_TTL_SECONDS: z.coerce.number().default(900),

  // Razorpay (Optional)
  RAZORPAY_KEY_ID: optionalString(),
  RAZORPAY_KEY_SECRET: optionalString(),

  // Email / SMTP (Optional)
  EMAIL_HOST: optionalString(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_SECURE: optionalString(),
  EMAIL_USER: optionalString(),
  EMAIL_PASSWORD: optionalString(),

  // AI / Groq (Optional)
  GROQ_API_KEY: optionalString(),
  MODEL: z.string().default("qwen/qwen3.8-27b"),

  // Aiosell PMS (Optional)
  AIOSELL_PMS_SLUG: optionalString(),
  AIOSELL_PARTNER_USERNAME: optionalString(),
  AIOSELL_PARTNER_PASSWORD: optionalString(),
  AIOSELL_BASE_URL: optionalUrl(),
  AIOSELL_HOTEL_CODE: optionalString(),
  AIOSELL_ENABLED: optionalString(),

  // Super Admin Password Seed (Optional)
  SUPER_ADMIN_PASSWORD: optionalString(),
});

const parsedResult = envSchema.safeParse(process.env);

if (!parsedResult.success) {
  const formattedErrors = parsedResult.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "ENV"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Environment validation failed:\n${formattedErrors}`);
}

const parsed = parsedResult.data;

const normalizeBaseUrl = (val, defaultUrl) => {
  const raw =
    val && typeof val === "string" && val.trim() !== "" ? val : defaultUrl;
  return raw.trim().replace(/\/+$/, "");
};

export const env = {
  port: parsed.PORT,
  host: parsed.HOST,
  nodeEnv: parsed.NODE_ENV,
  logLevel: parsed.LOG_LEVEL,
  mongoUri: parsed.MONGODB_URI,
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  redisUrl: parsed.REDIS_URL,
  frontendUrls: {
    superAdmin: normalizeBaseUrl(
      parsed.SUPER_ADMIN_FRONTEND_URL,
      "http://localhost:5173",
    ),
    subAdmin: normalizeBaseUrl(
      parsed.SUB_ADMIN_FRONTEND_URL,
      "http://localhost:5174",
    ),
    receptionist: normalizeBaseUrl(
      parsed.RECEPTIONIST_FRONTEND_URL,
      "http://localhost:5175",
    ),
    kitchen: normalizeBaseUrl(
      parsed.KITCHEN_FRONTEND_URL,
      "http://localhost:5176",
    ),
    guest: normalizeBaseUrl(parsed.GUEST_FRONTEND_URL, "http://localhost:5177"),
    selfCheckin: normalizeBaseUrl(
      parsed.SELF_CHECKIN_FRONTEND_URL,
      "http://localhost:5178",
    ),
    tableOrder: normalizeBaseUrl(
      parsed.TABLE_ORDER_FRONTEND_URL,
      "http://localhost:5179",
    ),
  },
  socketCorsOrigins: parsed.SOCKET_CORS_ORIGINS,
  r2: {
    accountId: parsed.R2_ACCOUNT_ID,
    accessKeyId: parsed.R2_ACCESS_KEY_ID,
    secretAccessKey: parsed.R2_SECRET_ACCESS_KEY,
    bucketName: parsed.R2_BUCKET_NAME,
    urlTtlSeconds: parsed.R2_URL_TTL_SECONDS,
  },
  razorpayKeyId: parsed.RAZORPAY_KEY_ID,
  razorpayKeySecret: parsed.RAZORPAY_KEY_SECRET,
  email: {
    host: parsed.EMAIL_HOST,
    port: parsed.EMAIL_PORT,
    secure: parsed.EMAIL_SECURE === "true",
    user: parsed.EMAIL_USER,
    password: parsed.EMAIL_PASSWORD,
  },
  ai: {
    groqApiKey: parsed.GROQ_API_KEY,
    model: parsed.MODEL,
  },
  aiosell: {
    pmsSlug: parsed.AIOSELL_PMS_SLUG,
    partnerUsername: parsed.AIOSELL_PARTNER_USERNAME,
    partnerPassword: parsed.AIOSELL_PARTNER_PASSWORD,
    baseUrl: parsed.AIOSELL_BASE_URL,
    hotelCode: parsed.AIOSELL_HOTEL_CODE,
    enabled: parsed.AIOSELL_ENABLED === "true",
  },
  superAdminPassword: parsed.SUPER_ADMIN_PASSWORD,
};

export default env;
