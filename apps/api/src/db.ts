import mongoose from "mongoose";

export interface ConnectOptions {
  dbName?: string;
  serverSelectionTimeoutMS?: number;
}

export function assertTestDatabaseIsIsolated(uri: string): void {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("Refusing to connect in tests: MONGODB_URI is not a valid URL.");
  }
  const host = parsed.hostname;
  const local = host === "127.0.0.1" || host === "localhost" || host === "::1";
  if (parsed.protocol !== "mongodb:" || !local) {
    throw new Error(
      "Refusing to run tests against a non-local database. Tests use an in-memory MongoDB instance and must not touch Atlas or other shared data.",
    );
  }
}

export function sanitizeDbMessage(message: string, uri?: string): string {
  let output = message.replace(/mongodb(\+srv)?:\/\/\S+/gi, "mongodb://***");
  if (!uri) return output;
  try {
    const parsed = new URL(uri);
    if (parsed.password) output = output.split(decodeURIComponent(parsed.password)).join("***");
    if (parsed.username) output = output.split(decodeURIComponent(parsed.username)).join("***");
  } catch {
    return output;
  }
  return output;
}

let listenersAttached = false;

export async function connectDb(uri: string, options: ConnectOptions = {}): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    assertTestDatabaseIsIsolated(uri);
  }

  mongoose.set("bufferCommands", false);
  if (!listenersAttached) {
    listenersAttached = true;
    mongoose.connection.on("error", (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown database error";
      console.error(`MongoDB error: ${sanitizeDbMessage(message, uri)}`);
    });
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? 8_000,
      ...(options.dbName ? { dbName: options.dbName } : {}),
    });
  } catch (error) {
    await mongoose.disconnect().catch(() => undefined);
    const detail = sanitizeDbMessage(error instanceof Error ? error.message : "Unknown database error", uri);
    throw new Error(
      `MongoDB connection failed. The API will not start, and it will not fall back to local files or mock data. ${detail}`,
    );
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(`MongoDB connected (database: ${mongoose.connection.name}).`);
    if (mongoose.connection.name === "test") {
      console.warn(
        'MongoDB is using the database named "test". Add a database name to MONGODB_URI, for example /lamton, if that was not intentional.',
      );
    }
  }
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

export async function checkDb(): Promise<"ok" | "down"> {
  const database = mongoose.connection.db;
  if (mongoose.connection.readyState !== 1 || !database) return "down";
  try {
    await database.command({ ping: 1 });
    return "ok";
  } catch {
    return "down";
  }
}
