import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const sharedEnvPath = resolve(process.cwd(), ".env");
const developmentEnvPath = resolve(process.cwd(), "development.env");

if (existsSync(sharedEnvPath)) {
  loadEnv({ path: sharedEnvPath, override: false });
}

if (process.env.NODE_ENV !== "production" && existsSync(developmentEnvPath)) {
  loadEnv({ path: developmentEnvPath, override: true });
}

function resolveConnectionString() {
  const rawConnectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL;

  if (!rawConnectionString) {
    throw new Error("Missing PostgreSQL connection string.");
  }

  const connectionUrl = new URL(rawConnectionString);
  const sslMode = connectionUrl.searchParams.get("sslmode");
  const hasCompatFlag = connectionUrl.searchParams.has("uselibpqcompat");

  // Keep SSL enabled while matching libpq behavior for local/dev cert chains.
  if (sslMode === "require" && !hasCompatFlag) {
    connectionUrl.searchParams.set("uselibpqcompat", "true");
  }

  return connectionUrl.toString();
}

const connectionString = resolveConnectionString();

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
export { prisma };
