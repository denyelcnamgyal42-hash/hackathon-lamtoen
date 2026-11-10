import { createApp } from "./app.js";
import { loadConfig, loadEnvFile } from "./config.js";
import { connectDb, disconnectDb } from "./db.js";

loadEnvFile();

async function main(): Promise<void> {
  const config = loadConfig();
  await connectDb(config.mongodbUri, {
    ...(config.mongodbDbName ? { dbName: config.mongodbDbName } : {}),
  });
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Lamton API listening on port ${config.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Closing Lamton API.`);
    server.close(() => {
      void disconnectDb().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Lamton API failed to start.";
  console.error(message);
  process.exit(1);
});
