import { PrismaClient } from "@prisma/client";
import {
  prepareSqliteDatabaseUrl,
  resolveDatabaseUrl,
} from "@/lib/sqlite-path";

process.env.DATABASE_URL = prepareSqliteDatabaseUrl(resolveDatabaseUrl());

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Keep query logging for local dev only — noisy + slow in serverless.
    log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
