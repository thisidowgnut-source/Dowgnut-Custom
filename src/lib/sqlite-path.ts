import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

type DatabaseEnvironment = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  VERCEL?: string;
};

const LOCAL_DATABASE_URL = "file:./db/custom.db";

/**
 * Resolve database configuration without silently replacing production data
 * with an instance-local database. In particular, Vercel's filesystem is not
 * durable storage for carts, orders, payments, or inventory.
 */
export function resolveDatabaseUrl(
  environment: DatabaseEnvironment = process.env,
): string {
  const configuredUrl = environment.DATABASE_URL?.trim();
  const isProduction = environment.NODE_ENV === "production";

  if (!configuredUrl) {
    if (isProduction) {
      throw new Error(
        "Production requires a persistent DATABASE_URL; refusing local SQLite fallback.",
      );
    }
    return LOCAL_DATABASE_URL;
  }

  if (isProduction && environment.VERCEL && configuredUrl.startsWith("file:")) {
    throw new Error(
      "Vercel production cannot use a file-backed database; configure a persistent DATABASE_URL.",
    );
  }

  if (isProduction && isEphemeralSqliteUrl(configuredUrl)) {
    throw new Error(
      "Production cannot use ephemeral SQLite storage; configure a persistent DATABASE_URL.",
    );
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

function isEphemeralSqliteUrl(databaseUrl: string): boolean {
  if (!databaseUrl.startsWith("file:")) return false;

  const configuredPath = databaseUrl.slice("file:".length).split("?", 1)[0];
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(configuredPath);
  } catch {
    throw new Error(
      "Invalid SQLite DATABASE_URL: path contains malformed percent-encoding.",
    );
  }

  const normalizedPath = decodedPath.replaceAll("\\", "/").toLowerCase();
  return normalizedPath === "/tmp" || normalizedPath.startsWith("/tmp/");
}
