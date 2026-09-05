import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  prepareSqliteDatabaseUrl,
  resolveDatabaseUrl,
} from "@/lib/sqlite-path";

const testRoots: string[] = [];

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("prepareSqliteDatabaseUrl", () => {
  test("normalizes a relative file URL and creates its parent", () => {
    const root = mkdtempSync(join(tmpdir(), "dohnut-sqlite-"));
    testRoots.push(root);

    const result = prepareSqliteDatabaseUrl("file:./db/custom.db", root);
    const portableRoot = root.replaceAll("\\", "/");

    expect(result).toBe(`file:${portableRoot}/db/custom.db`);
    expect(existsSync(join(root, "db"))).toBe(true);
  });

  test("preserves query parameters and creates an absolute parent", () => {
    const root = mkdtempSync(join(tmpdir(), "dohnut-sqlite-"));
    testRoots.push(root);
    const databasePath = join(root, "nested", "app.db");

    const result = prepareSqliteDatabaseUrl(
      `file:${databasePath}?connection_limit=1`,
    );

    expect(result).toEndWith("/nested/app.db?connection_limit=1");
    expect(existsSync(dirname(databasePath))).toBe(true);
  });

  test("does not alter non-SQLite URLs", () => {
    const url = "postgresql://example.invalid/app";
    expect(prepareSqliteDatabaseUrl(url)).toBe(url);
  });

  test("rejects malformed percent-encoding without attempting filesystem access", () => {
    expect(() => prepareSqliteDatabaseUrl("file:./db/%ZZ.db")).toThrow(
      "Invalid SQLite DATABASE_URL",
    );
  });

  test("rejects null bytes in decoded SQLite paths", () => {
    expect(() => prepareSqliteDatabaseUrl("file:./db/%00.db")).toThrow(
      "Invalid SQLite DATABASE_URL",
    );
  });
});

describe("resolveDatabaseUrl", () => {
  test("retains a safe local development fallback", () => {
    expect(resolveDatabaseUrl({ NODE_ENV: "development" })).toBe(
      "file:./db/custom.db",
    );
  });

  test("uses /tmp/dowgnut.db on Vercel when no database URL is set", () => {
    expect(
      resolveDatabaseUrl({ NODE_ENV: "production", VERCEL: "1" }),
    ).toBe("file:/tmp/dowgnut.db");
  });

  test("routes file-backed URLs to /tmp/dowgnut.db on Vercel", () => {
    expect(
      resolveDatabaseUrl({
        NODE_ENV: "production",
        VERCEL: "1",
        DATABASE_URL: "file:./db/custom.db",
      }),
    ).toBe("file:/tmp/dowgnut.db");
  });

  test("preserves an explicitly configured persistent production URL on Vercel", () => {
    const url = "postgresql://database.example/dowgnut";
    expect(
      resolveDatabaseUrl({
        NODE_ENV: "production",
        VERCEL: "1",
        DATABASE_URL: url,
      }),
    ).toBe(url);
  });
});
