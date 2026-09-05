import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

type DatabaseEnvironment = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  VERCEL?: string;
};

const LOCAL_DATABASE_URL = "file:./db/custom.db";
const VERCEL_DATABASE_URL = "file:/tmp/dowgnut.db";

/**
 * Resolve database configuration.
 * On Vercel (serverless), filesystem is read-only except /tmp.
 * If no persistent DATABASE_URL is set, we resolve to /tmp/dowgnut.db so
 * the app can create and seed the ephemeral SQLite DB on first request
 * (see src/lib/ensure-ready.ts and VERCEL_DEPLOY.md).
 */
export function resolveDatabaseUrl(
  environment: DatabaseEnvironment = process.env,
): string {
  const configuredUrl = environment.DATABASE_URL?.trim();

  // If running on Vercel without a persistent DB or with a local file URL,
  // route to /tmp (the only writable directory in serverless runtime).
  if (environment.VERCEL) {
    if (!configuredUrl || configuredUrl.startsWith("file:")) {
      return VERCEL_DATABASE_URL;
    }
    return configuredUrl;
  }

  if (!configuredUrl) {
    return LOCAL_DATABASE_URL;
  }

  return configuredUrl;
}

/**
 * Ensure a local SQLite URL has a writable parent directory before Prisma
 * opens the database. Remote/database-provider URLs are intentionally ignored.
 */
export function prepareSqliteDatabaseUrl(
  databaseUrl: string,
  cwd = process.cwd(),
): string {
  if (!databaseUrl.startsWith("file:")) return databaseUrl;

  const [configuredPath, query] = databaseUrl.slice("file:".length).split("?", 2);
  if (!configuredPath || configuredPath === ":memory:") return databaseUrl;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(configuredPath);
  } catch {
    throw new Error(
      "Invalid SQLite DATABASE_URL: path contains malformed percent-encoding.",
    );
  }
  if (decodedPath.includes("\0")) {
    throw new Error("Invalid SQLite DATABASE_URL: path contains a null byte.");
  }
  const absolutePath = isAbsolute(decodedPath)
    ? decodedPath
    : resolve(cwd, decodedPath);

  mkdirSync(dirname(absolutePath), { recursive: true });
  const portablePath = absolutePath.replaceAll("\\", "/");
  return `file:${portablePath}${query ? `?${query}` : ""}`;
}
