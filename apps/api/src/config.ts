import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const webOriginSchema = z
  .string()
  .trim()
  .min(1)
  .default("http://localhost:5173")
  .superRefine((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "WEB_ORIGIN must be an absolute URL." });
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: "WEB_ORIGIN must use http or https." });
    }
  })
  .transform((value) => new URL(value).origin);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is required. Lamton does not start without MongoDB." })
    .trim()
    .min(1, { message: "MONGODB_URI is required. Lamton does not start without MongoDB." })
    .refine((value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"), {
      message: "MONGODB_URI must be a mongodb:// or mongodb+srv:// connection string.",
    }),
  MONGODB_DB_NAME: z.string().trim().min(1).optional(),
  SESSION_SECRET: z
    .string({ error: "SESSION_SECRET is required." })
    .min(32, { message: "SESSION_SECRET must be at least 32 characters." }),
  WEB_ORIGIN: webOriginSchema,
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  mongodbUri: string;
  mongodbDbName?: string;
  sessionSecret: string;
  webOrigin: string;
  cookieSecure: boolean;
}

let cached: AppConfig | undefined;

export function resolveCookieSecure(
  nodeEnv: AppConfig["nodeEnv"],
  flag: "true" | "false" | undefined,
): boolean {
  if (flag === "true") return true;
  if (flag === "false") return false;
  return nodeEnv === "production";
}

export function loadEnvFile(): void {
  if (process.env.NODE_ENV === "test") return;
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path });
      return;
    }
  }
}

export function resetConfigForTests(): void {
  cached = undefined;
}

export function loadConfig(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: emptyToUndefined(process.env.PORT),
    MONGODB_URI: emptyToUndefined(process.env.MONGODB_URI),
    MONGODB_DB_NAME: emptyToUndefined(process.env.MONGODB_DB_NAME),
    SESSION_SECRET: emptyToUndefined(process.env.SESSION_SECRET),
    WEB_ORIGIN: emptyToUndefined(process.env.WEB_ORIGIN),
    COOKIE_SECURE: emptyToUndefined(process.env.COOKIE_SECURE),
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Lamton configuration is invalid.\n${details}`);
  }

  if (parsed.data.MONGODB_URI.includes("USER:PASSWORD") || parsed.data.MONGODB_URI.includes("@CLUSTER")) {
    throw new Error(
      "MONGODB_URI is still the example placeholder. Replace it with your MongoDB Atlas connection string. The API will not start with the sample value.",
    );
  }

  if (/change-me|replace-with|your-session-secret/i.test(parsed.data.SESSION_SECRET)) {
    throw new Error("SESSION_SECRET is still a placeholder. Generate a random value of at least 32 characters.");
  }

  if (/^(.)\1+$/.test(parsed.data.SESSION_SECRET)) {
    throw new Error("SESSION_SECRET must not be a repeated character.");
  }

  cached = {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    mongodbUri: parsed.data.MONGODB_URI,
    ...(parsed.data.MONGODB_DB_NAME ? { mongodbDbName: parsed.data.MONGODB_DB_NAME } : {}),
    sessionSecret: parsed.data.SESSION_SECRET,
    webOrigin: parsed.data.WEB_ORIGIN,
    cookieSecure: resolveCookieSecure(parsed.data.NODE_ENV, parsed.data.COOKIE_SECURE),
  };
  return cached;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
