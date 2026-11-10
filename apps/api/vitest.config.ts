import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 180_000,
    env: {
      NODE_ENV: "test",
      SESSION_SECRET: "test-only-session-secret-with-32-plus",
      WEB_ORIGIN: "http://localhost:5173",
      COOKIE_SECURE: "false",
      PORT: "4000",
      MONGODB_URI: "mongodb://127.0.0.1:9/lamton-tests-not-started",
    },
  },
});
