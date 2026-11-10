import { pathToFileURL } from "node:url";
import { z } from "zod";
import { emailSchema } from "@lamton/shared";
import { loadConfig, loadEnvFile } from "../config.js";
import { connectDb, disconnectDb } from "../db.js";
import { hashPassword } from "../lib/password.js";
import { User } from "../models/User.js";

const WEAK_FRAGMENTS = ["password", "changeme", "qwerty", "letmein", "welcome1"];

const adminEnvSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2, { message: "ADMIN_NAME must be at least 2 characters." }).max(80),
  ADMIN_EMAIL: emailSchema,
  ADMIN_PASSWORD: z.string().min(1, { message: "ADMIN_PASSWORD is required." }),
});

export async function provisionAdminFromEnv(): Promise<"created" | "exists"> {
  const parsed = adminEnvSchema.safeParse({
    ADMIN_NAME: emptyToUndefined(process.env.ADMIN_NAME),
    ADMIN_EMAIL: emptyToUndefined(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Missing or invalid admin credentials. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in the environment. No default credentials are used.\n${details}`,
    );
  }

  assertStrongAdminPassword(parsed.data.ADMIN_PASSWORD, parsed.data.ADMIN_EMAIL);

  const existing = await User.findOne({ email: parsed.data.ADMIN_EMAIL });
  if (existing) {
    if (existing.role === "admin") return "exists";
    throw new Error(
      `An account already exists for ${parsed.data.ADMIN_EMAIL} with role ${existing.role}. This command will not change an existing account's role. Use a dedicated admin email.`,
    );
  }

  await User.create({
    name: parsed.data.ADMIN_NAME,
    email: parsed.data.ADMIN_EMAIL,
    passwordHash: await hashPassword(parsed.data.ADMIN_PASSWORD),
    role: "admin",
    accountState: "active",
  });
  return "created";
}

function assertStrongAdminPassword(password: string, email: string): void {
  if (password.length < 12 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error(
      "ADMIN_PASSWORD must be 12 to 128 characters and include a letter and a number. No default password is provided.",
    );
  }
  const lowered = password.toLowerCase();
  if (WEAK_FRAGMENTS.some((fragment) => lowered.includes(fragment))) {
    throw new Error("ADMIN_PASSWORD is too easy to guess. Choose a unique passphrase. No default password is provided.");
  }
  const local = email.split("@")[0]?.toLowerCase();
  if (local && local.length >= 3 && lowered.includes(local)) {
    throw new Error("ADMIN_PASSWORD must not contain the email name.");
  }
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function main(): Promise<void> {
  loadEnvFile();
  const config = loadConfig();
  await connectDb(config.mongodbUri, {
    ...(config.mongodbDbName ? { dbName: config.mongodbDbName } : {}),
  });
  try {
    const result = await provisionAdminFromEnv();
    if (result === "created") {
      console.log(`Admin account created for ${process.env.ADMIN_EMAIL?.trim().toLowerCase()}.`);
    } else {
      console.log(`Admin already provisioned for ${process.env.ADMIN_EMAIL?.trim().toLowerCase()}. The password was left unchanged.`);
    }
  } finally {
    await disconnectDb();
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin provisioning failed.");
    process.exit(1);
  });
}
