import type { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig, resetConfigForTests, resolveCookieSecure } from "../src/config.js";
import { connectDb, disconnectDb } from "../src/db.js";
import { hashPassword, verifyPassword } from "../src/lib/password.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";
import { provisionAdminFromEnv } from "../src/scripts/provision-admin.js";

const founder = {
  name: "  Pema Dorji  ",
  email: "Pema@Example.com",
  password: "riverstone42",
};

let app: Express;
let mongod: MongoMemoryServer | undefined;
let memoryUri = "";

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  memoryUri = mongod.getUri();
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.MONGODB_URI = memoryUri;
  process.env.SESSION_SECRET = "test-only-session-secret-with-32-plus";
  process.env.WEB_ORIGIN = "http://localhost:5173";
  process.env.COOKIE_SECURE = "false";
  delete process.env.ADMIN_NAME;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  resetConfigForTests();
  await connectDb(memoryUri);
  app = createApp();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectDb();
  if (mongod) await mongod.stop();
});

describe("configuration and database safety", () => {
  it("refuses to start with a placeholder database uri", () => {
    const previous = process.env.MONGODB_URI;
    process.env.MONGODB_URI = "mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/lamton";
    resetConfigForTests();
    try {
      expect(() => loadConfig()).toThrow(/placeholder/);
    } finally {
      process.env.MONGODB_URI = previous;
      resetConfigForTests();
    }
  });

  it("refuses to start without a database uri", () => {
    const previous = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    resetConfigForTests();
    try {
      expect(() => loadConfig()).toThrow(/MONGODB_URI/);
    } finally {
      process.env.MONGODB_URI = previous;
      resetConfigForTests();
    }
  });

  it("uses a secure cookie in production unless explicitly disabled", () => {
    expect(resolveCookieSecure("production", undefined)).toBe(true);
    expect(resolveCookieSecure("development", undefined)).toBe(false);
    expect(resolveCookieSecure("production", "false")).toBe(false);
    expect(resolveCookieSecure("development", "true")).toBe(true);
  });

  it("stores a password hash instead of the password", async () => {
    const hash = await hashPassword("riverstone42");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("riverstone42");
    expect(await verifyPassword("riverstone42", hash)).toBe(true);
    expect(await verifyPassword("other-password-1", hash)).toBe(false);
  });

  it("fails explicitly when MongoDB cannot be reached", async () => {
    await disconnectDb();
    try {
      await expect(
        connectDb("mongodb://127.0.0.1:1/lamton_unreachable", { serverSelectionTimeoutMS: 1500 }),
      ).rejects.toThrow(/MongoDB connection failed/);
    } finally {
      await connectDb(memoryUri);
    }
  });
});

describe("health", () => {
  it("reports application and database health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      application: "ok",
      database: "ok",
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("reports the database as down without pretending it is healthy", async () => {
    await disconnectDb();
    try {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: "degraded",
        application: "ok",
        database: "down",
      });
    } finally {
      await connectDb(memoryUri);
    }
  });
});

describe("registration and login", () => {
  it("registers a founder, sets an HttpOnly session, and keeps the session", async () => {
    const response = await request(app).post("/api/auth/register").send(founder);
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: "Pema Dorji",
      email: "pema@example.com",
      role: "founder",
      accountState: "active",
    });
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body.csrfToken).toEqual(expect.any(String));

    const cookie = sessionCookie(response.headers["set-cookie"]);
    expect(cookie).toMatch(/lamton\.sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Max-Age=604800/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).not.toMatch(/;\s*Secure/i);

    const stored = await User.findOne({ email: "pema@example.com" }).select("+passwordHash");
    expect(stored?.role).toBe("founder");
    expect(stored?.passwordHash?.startsWith("scrypt$")).toBe(true);
    expect(stored?.passwordHash).not.toContain("riverstone42");

    const me = await request(app).get("/api/auth/me").set("Cookie", cookiePair(cookie));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("pema@example.com");
    expect(me.body.csrfToken).toBe(response.body.csrfToken);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(founder);
    const duplicate = await request(app).post("/api/auth/register").send({
      ...founder,
      name: "Pema Again",
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("EMAIL_IN_USE");
    expect(await User.countDocuments({ email: "pema@example.com" })).toBe(1);
  });

  it("rejects invalid registration input", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "A",
      email: "not-an-email",
      password: "short",
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fields.name).toBeTruthy();
    expect(response.body.error.details.fields.email).toBeTruthy();
    expect(response.body.error.details.fields.password).toBeTruthy();
    expect(await User.countDocuments()).toBe(0);
  });

  it("rejects client-supplied admin or mentor privileges", async () => {
    const adminAttempt = await request(app)
      .post("/api/auth/register")
      .send({ ...founder, role: "admin" });
    expect(adminAttempt.status).toBe(400);
    expect(adminAttempt.body.error.code).toBe("PRIVILEGE_FIELD");

    const mentorAttempt = await request(app)
      .post("/api/auth/register")
      .send({ ...founder, email: "mentor@example.com", role: "mentor", accountState: "active" });
    expect(mentorAttempt.status).toBe(400);
    expect(mentorAttempt.body.error.code).toBe("PRIVILEGE_FIELD");
    expect(await User.countDocuments()).toBe(0);
  });

  it("logs in with the session cookie and rejects a wrong password", async () => {
    await request(app).post("/api/auth/register").send(founder);
    const success = await request(app).post("/api/auth/login").send({
      email: "pema@example.com",
      password: founder.password,
    });
    expect(success.status).toBe(200);
    expect(success.body.user.role).toBe("founder");
    expect(sessionCookie(success.headers["set-cookie"])).toMatch(/HttpOnly/i);

    const failure = await request(app).post("/api/auth/login").send({
      email: "pema@example.com",
      password: "wrong-password-1",
    });
    expect(failure.status).toBe(401);
    expect(failure.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(failure.body.error.message).toBe("Email or password is incorrect.");

    const unknown = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "wrong-password-1",
    });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.message).toBe("Email or password is incorrect.");
  });

  it("does not sign in a suspended account after the password matches", async () => {
    await request(app).post("/api/auth/register").send(founder);
    await User.updateOne({ email: "pema@example.com" }, { accountState: "suspended" });
    const response = await request(app).post("/api/auth/login").send({
      email: "pema@example.com",
      password: founder.password,
    });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });

  it("rejects malformed JSON", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("rejects a cross-origin mutation", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example")
      .send({ email: "pema@example.com", password: founder.password });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_ORIGIN");
  });
});

describe("sessions, authorization, and object access", () => {
  it("requires authentication for the current user", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires a CSRF token to log out and then ends the session", async () => {
    const agent = request.agent(app);
    const registered = await agent.post("/api/auth/register").send(founder);
    const cookie = sessionCookie(registered.headers["set-cookie"]);

    const blocked = await agent.post("/api/auth/logout");
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("CSRF_INVALID");

    const loggedOut = await agent.post("/api/auth/logout").set("x-csrf-token", registered.body.csrfToken);
    expect(loggedOut.status).toBe(204);
    expect(await Session.countDocuments()).toBe(0);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookiePair(cookie));
    expect(me.status).toBe(401);
  });

  it("forbids a founder from admin routes and allows a provisioned admin", async () => {
    const founderAgent = request.agent(app);
    await founderAgent.post("/api/auth/register").send(founder);
    const forbidden = await founderAgent.get("/api/admin/summary");
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");

    const anonymous = await request(app).get("/api/admin/summary");
    expect(anonymous.status).toBe(401);

    await User.create({
      name: "Dechen Admin",
      email: "dechen.admin@example.com",
      passwordHash: await hashPassword("juniper-ridge-48"),
      role: "admin",
      accountState: "active",
    });
    const adminAgent = request.agent(app);
    const login = await adminAgent.post("/api/auth/login").send({
      email: "dechen.admin@example.com",
      password: "juniper-ridge-48",
    });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("admin");

    const summary = await adminAgent.get("/api/admin/summary");
    expect(summary.status).toBe(200);
    expect(summary.body.counts).toEqual({ founders: 1, mentors: 0, admins: 1, suspended: 0 });
  });

  it("lets a user read their own record and blocks another founder's record", async () => {
    const first = await request(app).post("/api/auth/register").send(founder);
    const second = await request(app).post("/api/auth/register").send({
      name: "Karma Lhamo",
      email: "karma@example.com",
      password: "cedarpath17",
    });

    const own = await request(app)
      .get(`/api/users/${first.body.user.id}`)
      .set("Cookie", cookiePair(sessionCookie(first.headers["set-cookie"])));
    expect(own.status).toBe(200);
    expect(own.body.user.email).toBe("pema@example.com");
    expect(own.body.user).not.toHaveProperty("passwordHash");

    const other = await request(app)
      .get(`/api/users/${second.body.user.id}`)
      .set("Cookie", cookiePair(sessionCookie(first.headers["set-cookie"])));
    expect(other.status).toBe(403);
    expect(other.body.error.code).toBe("FORBIDDEN");

    const missingAuth = await request(app).get(`/api/users/${first.body.user.id}`);
    expect(missingAuth.status).toBe(401);
  });

  it("returns an honest empty founder workspace and hides it from admins", async () => {
    const registered = await request(app).post("/api/auth/register").send(founder);
    const workspace = await request(app)
      .get("/api/founder/workspace")
      .set("Cookie", cookiePair(sessionCookie(registered.headers["set-cookie"])));
    expect(workspace.status).toBe(200);
    expect(workspace.body.profile.email).toBe("pema@example.com");
    expect(workspace.body.venture).toBeNull();
    expect(workspace.body.mentorship).toBeNull();
    expect(workspace.body.research).toBeNull();

    await User.create({
      name: "Dechen Admin",
      email: "dechen.admin@example.com",
      passwordHash: await hashPassword("juniper-ridge-48"),
      role: "admin",
      accountState: "active",
    });
    const login = await request(app).post("/api/auth/login").send({
      email: "dechen.admin@example.com",
      password: "juniper-ridge-48",
    });
    const blocked = await request(app)
      .get("/api/founder/workspace")
      .set("Cookie", cookiePair(sessionCookie(login.headers["set-cookie"])));
    expect(blocked.status).toBe(403);
  });

  it("has no public admin provisioning route", async () => {
    const created = await request(app).post("/api/admin/provision").send({
      name: "Sneaky Admin",
      email: "sneaky@example.com",
      password: "juniper-ridge-48",
      role: "admin",
    });
    expect(created.status).not.toBe(201);
    expect(await User.countDocuments({ role: "admin" })).toBe(0);

    const missing = await request(app).get("/api/admin/provision");
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns a JSON 404 for an unknown route", async () => {
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});

describe("admin provisioning command", () => {
  it("creates an admin from the environment and will not promote a founder", async () => {
    delete process.env.ADMIN_NAME;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await expect(provisionAdminFromEnv()).rejects.toThrow(/ADMIN_NAME/);
    expect(await User.countDocuments()).toBe(0);

    process.env.ADMIN_NAME = "Dechen Admin";
    process.env.ADMIN_EMAIL = "dechen.admin@example.com";
    process.env.ADMIN_PASSWORD = "password1234";
    await expect(provisionAdminFromEnv()).rejects.toThrow(/too easy to guess/);
    expect(await User.countDocuments()).toBe(0);

    process.env.ADMIN_PASSWORD = "short1";
    await expect(provisionAdminFromEnv()).rejects.toThrow(/12 to 128/);

    process.env.ADMIN_PASSWORD = "juniper-ridge-48";
    await expect(provisionAdminFromEnv()).resolves.toBe("created");
    const admin = await User.findOne({ email: "dechen.admin@example.com" }).select("+passwordHash");
    expect(admin?.role).toBe("admin");
    expect(admin?.passwordHash).not.toContain("juniper-ridge-48");
    await expect(provisionAdminFromEnv()).resolves.toBe("exists");

    await request(app).post("/api/auth/register").send({
      name: "Karma Lhamo",
      email: "karma@example.com",
      password: "cedarpath17",
    });
    process.env.ADMIN_NAME = "Karma Lhamo";
    process.env.ADMIN_EMAIL = "karma@example.com";
    process.env.ADMIN_PASSWORD = "another-passphrase-77";
    await expect(provisionAdminFromEnv()).rejects.toThrow(/will not change/);
    const founderUser = await User.findOne({ email: "karma@example.com" });
    expect(founderUser?.role).toBe("founder");
  });
});

function sessionCookie(value: string | string[] | undefined): string {
  const headers = Array.isArray(value) ? value : value ? [value] : [];
  const match = headers.find((entry) => entry.startsWith("lamton.sid="));
  if (!match) throw new Error("Expected a lamton.sid session cookie.");
  return match;
}

function cookiePair(header: string): string {
  const pair = header.split(";")[0];
  if (!pair) throw new Error("Expected a cookie pair.");
  return pair;
}
