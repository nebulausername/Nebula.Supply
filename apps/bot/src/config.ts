import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
  resolve(process.cwd(), ".env"),
  resolve(moduleDir, "../../.env"),
  resolve(moduleDir, "../.env")
];

for (const path of candidatePaths) {
  if (!existsSync(path)) continue;
  loadEnv({ path, override: false });
  break;
}

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  BOT_NAME: z.string().min(1).default("NebulaOrderBot"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ADMIN_IDS: z.string().optional(),
  API_BASE_URL: z.string().url().optional(),
  IDENTITY_BASE_URL: z.string().url().optional(),
  PAYMENTS_BASE_URL: z.string().url().optional(),
  TICKETS_BASE_URL: z.string().url().optional(),
  WEB_APP_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional().or(z.literal("")),
  REDIS_PREFIX: z.string().default("nebula:bot:"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  USE_WEBHOOKS: z.string().transform(val => val === "true").default("false"),
  WEBHOOK_DOMAIN: z.string().url().optional().or(z.literal("")),
  WEBHOOK_PATH: z.string().default("/webhook"),
  JWT_SECRET: z.string().min(32).optional(),
  SESSION_TTL: z.string().transform(Number).default("86400"),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default("60"),
  RATE_LIMIT_MAX: z.string().transform(Number).default("30"),
  ANALYTICS_ENABLED: z.string().transform(val => val === "true").default("false"),
  MIXPANEL_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  ENABLE_VERIFICATION: z.string().transform(val => val !== "false").default("true"),
  ENABLE_INVITE_SYSTEM: z.string().transform(val => val !== "false").default("true"),
  ENABLE_SUPPORT_TICKETS: z.string().transform(val => val !== "false").default("true"),
  ENABLE_ADMIN_DASHBOARD: z.string().transform(val => val !== "false").default("true")
});

const rawEnv = envSchema.parse({
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_NAME: process.env.BOT_NAME ?? undefined,
  LOG_LEVEL: process.env.LOG_LEVEL,
  ADMIN_IDS: process.env.ADMIN_IDS,
  API_BASE_URL: process.env.API_BASE_URL,
  IDENTITY_BASE_URL: process.env.IDENTITY_BASE_URL,
  PAYMENTS_BASE_URL: process.env.PAYMENTS_BASE_URL,
  TICKETS_BASE_URL: process.env.TICKETS_BASE_URL,
  WEB_APP_URL: process.env.WEB_APP_URL,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PREFIX: process.env.REDIS_PREFIX,
  NODE_ENV: process.env.NODE_ENV,
  USE_WEBHOOKS: process.env.USE_WEBHOOKS,
  WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN,
  WEBHOOK_PATH: process.env.WEBHOOK_PATH,
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_TTL: process.env.SESSION_TTL,
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED,
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ENABLE_VERIFICATION: process.env.ENABLE_VERIFICATION,
  ENABLE_INVITE_SYSTEM: process.env.ENABLE_INVITE_SYSTEM,
  ENABLE_SUPPORT_TICKETS: process.env.ENABLE_SUPPORT_TICKETS,
  ENABLE_ADMIN_DASHBOARD: process.env.ENABLE_ADMIN_DASHBOARD
});

export interface AppConfig {
  botToken: string;
  botName: string;
  logLevel: "debug" | "info" | "warn" | "error";
  adminIds: string[];
  apiBaseUrl?: string;
  identityBaseUrl?: string;
  paymentsBaseUrl?: string;
  ticketsBaseUrl?: string;
  webAppUrl?: string;
  redisUrl?: string;
  redisPrefix: string;
  nodeEnv: "development" | "production" | "test";
  useWebhooks: boolean;
  webhookDomain?: string;
  webhookPath: string;
  jwtSecret?: string;
  sessionTtl: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  analyticsEnabled: boolean;
  mixpanelToken?: string;
  sentryDsn?: string;
  enableVerification: boolean;
  enableInviteSystem: boolean;
  enableSupportTickets: boolean;
  enableAdminDashboard: boolean;
}

const parseAdminIds = (value?: string | null): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

export const appConfig: AppConfig = {
  botToken: rawEnv.BOT_TOKEN,
  botName: rawEnv.BOT_NAME,
  logLevel: rawEnv.LOG_LEVEL,
  adminIds: parseAdminIds(rawEnv.ADMIN_IDS),
  apiBaseUrl: rawEnv.API_BASE_URL,
  identityBaseUrl: rawEnv.IDENTITY_BASE_URL,
  paymentsBaseUrl: rawEnv.PAYMENTS_BASE_URL,
  ticketsBaseUrl: rawEnv.TICKETS_BASE_URL,
  webAppUrl: rawEnv.WEB_APP_URL || "http://localhost:5173",
  redisUrl: rawEnv.REDIS_URL,
  redisPrefix: rawEnv.REDIS_PREFIX,
  nodeEnv: rawEnv.NODE_ENV,
  useWebhooks: rawEnv.USE_WEBHOOKS,
  webhookDomain: rawEnv.WEBHOOK_DOMAIN,
  webhookPath: rawEnv.WEBHOOK_PATH,
  jwtSecret: rawEnv.JWT_SECRET,
  sessionTtl: rawEnv.SESSION_TTL,
  rateLimitWindow: rawEnv.RATE_LIMIT_WINDOW,
  rateLimitMax: rawEnv.RATE_LIMIT_MAX,
  analyticsEnabled: rawEnv.ANALYTICS_ENABLED,
  mixpanelToken: rawEnv.MIXPANEL_TOKEN,
  sentryDsn: rawEnv.SENTRY_DSN,
  enableVerification: rawEnv.ENABLE_VERIFICATION,
  enableInviteSystem: rawEnv.ENABLE_INVITE_SYSTEM,
  enableSupportTickets: rawEnv.ENABLE_SUPPORT_TICKETS,
  enableAdminDashboard: rawEnv.ENABLE_ADMIN_DASHBOARD
};
