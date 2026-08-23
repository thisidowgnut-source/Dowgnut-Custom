import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Fail-closed admin key check.
 *
 * Rules:
 *   - No ADMIN_API_KEY configured → reject (500) — never fail open.
 *   - Missing/wrong key → 401.
 *   - Comparison is constant-time.
 *
 * Usage inside a route handler:
 *   const auth = requireAdmin(request);
 *   if (auth) return auth; // it IS an error response
 */
export function requireAdmin(request: Request): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    // Server misconfigured — deny loudly instead of opening the door.
    console.error("[admin] ADMIN_API_KEY is not configured — refusing request");
    return NextResponse.json(
      { error: "Server misconfigured: admin key missing" },
      { status: 500 },
    );
  }
  const provided = request.headers.get("x-admin-key");
  if (!provided || !safeEqual(provided, adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // authorized
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
