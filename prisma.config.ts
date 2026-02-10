import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const sharedEnvPath = resolve(process.cwd(), ".env");
const developmentEnvPath = resolve(process.cwd(), "development.env");

if (existsSync(sharedEnvPath)) {
  loadEnv({ path: sharedEnvPath, override: false });
}

if (process.env.NODE_ENV !== "production" && existsSync(developmentEnvPath)) {
  loadEnv({ path: developmentEnvPath, override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env["POSTGRES_URL"] ||
      process.env["POSTGRES_URL_NON_POOLING"] ||
      process.env["POSTGRES_PRISMA_URL"],
  },
});
