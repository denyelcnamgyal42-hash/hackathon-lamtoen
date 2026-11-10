import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { loadConfig } from "../config.js";

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHmac("sha256", loadConfig().sessionSecret).update(token).digest("hex");
}

export function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
