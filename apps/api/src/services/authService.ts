import { PUBLIC_SIGNUP_ROLE, type LoginRequest, type PublicUser, type RegisterRequest } from "@lamton/shared";
import { HttpError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { hashToken, randomToken } from "../lib/tokens.js";
import { Session, SESSION_TTL_MS } from "../models/Session.js";
import { toPublicUser, User } from "../models/User.js";

let dummyHash: Promise<string> | undefined;

function equalizerHash(): Promise<string> {
  dummyHash ??= hashPassword("not-a-real-account-equalizer");
  return dummyHash;
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

export async function registerFounder(input: RegisterRequest): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: PUBLIC_SIGNUP_ROLE,
      accountState: "active",
    });
    return toPublicUser(user);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new HttpError(409, "EMAIL_IN_USE", "An account with this email already exists.");
    }
    throw error;
  }
}

export async function authenticate(input: LoginRequest): Promise<PublicUser> {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    await verifyPassword(input.password, await equalizerHash());
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const matches = await verifyPassword(input.password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  if (user.accountState !== "active") {
    throw new HttpError(403, "ACCOUNT_SUSPENDED", "This account is suspended.");
  }
  return toPublicUser(user);
}

export async function createSession(userId: string): Promise<{ token: string; csrfToken: string }> {
  const token = randomToken();
  const csrfToken = randomToken();
  await Session.create({
    userId,
    tokenHash: hashToken(token),
    csrfToken,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return { token, csrfToken };
}

export async function revokeToken(token: string | undefined): Promise<void> {
  if (!token) return;
  await Session.deleteOne({ tokenHash: hashToken(token) });
}
