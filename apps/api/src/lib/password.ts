import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { HttpError } from "./errors.js";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const MAX_N = 131_072;

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length > 128) {
    throw new HttpError(400, "VALIDATION_ERROR", "Password must be at most 128 characters.");
  }
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (password.length > 128) return false;
  const [algorithm, nRaw, rRaw, pRaw, saltRaw, hashRaw, extra] = encoded.split("$");
  if (extra !== undefined || algorithm !== "scrypt" || !nRaw || !rRaw || !pRaw || !saltRaw || !hashRaw) {
    return false;
  }

  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(n) || n < SCRYPT_N || n > MAX_N) return false;
  if (!Number.isInteger(r) || r < 1 || r > 16) return false;
  if (!Number.isInteger(p) || p < 1 || p > 4) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltRaw, "base64url");
    expected = Buffer.from(hashRaw, "base64url");
  } catch {
    return false;
  }
  if (salt.length < 16 || expected.length !== KEY_LENGTH) return false;

  const actual = await scryptAsync(password, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
