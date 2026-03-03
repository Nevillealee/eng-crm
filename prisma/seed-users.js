const { existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { config: loadEnv } = require("dotenv");
const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");

const sharedEnvPath = resolve(process.cwd(), ".env");
const developmentEnvPath = resolve(process.cwd(), "development.env");
const SEED_USERS = [
  {
    email: "nevillealee+1@gmail.com",
    password: "Password!",
    isAdmin: true,
  },
  {
    email: "nevillealee@gmail.com",
    password: "Password!",
    isAdmin: false,
  },
];

if (existsSync(sharedEnvPath)) {
  loadEnv({ path: sharedEnvPath, override: false, quiet: true });
}

if (process.env.NODE_ENV !== "production" && existsSync(developmentEnvPath)) {
  loadEnv({ path: developmentEnvPath, override: true, quiet: true });
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

  if (sslMode === "require" && !hasCompatFlag) {
    connectionUrl.searchParams.set("uselibpqcompat", "true");
  }

  return connectionUrl.toString();
}

async function seedUser(prisma, seedUserInput) {
  const passwordHash = await bcrypt.hash(seedUserInput.password, 12);
  const emailVerified = new Date();

  return prisma.user.upsert({
    where: { email: seedUserInput.email },
    update: {
      password: passwordHash,
      isAdmin: seedUserInput.isAdmin,
      emailVerified,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
    create: {
      email: seedUserInput.email,
      name: seedUserInput.email,
      password: passwordHash,
      isAdmin: seedUserInput.isAdmin,
      emailVerified,
      onboardingCompleted: !seedUserInput.isAdmin,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });
}

async function main() {
  const { PrismaClient } = await import("../generated/prisma/client.ts");
  const adapter = new PrismaPg({ connectionString: resolveConnectionString() });
  const prisma = new PrismaClient({ adapter });

  try {
    const seededUsers = [];

    for (const seedUserInput of SEED_USERS) {
      const seededUser = await seedUser(prisma, seedUserInput);
      seededUsers.push(seededUser);
    }

    console.log("Seeded users:");
    for (const seededUser of seededUsers) {
      console.log(
        JSON.stringify(
          {
            id: seededUser.id,
            email: seededUser.email,
            isAdmin: seededUser.isAdmin,
            emailVerified: seededUser.emailVerified,
            onboardingCompleted: seededUser.onboardingCompleted,
          },
          null,
          2
        )
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed users.", error);
  process.exitCode = 1;
});
