// Session helper — reads or generates an anonymous shopper id.
// sessionId is passed via the `x-session-id` header on every cart/favorites/order request.

export function getSessionId(req: Request): string {
  const header = req.headers.get("x-session-id");
  if (header && header.trim().length > 0) return header.trim();
  // crypto.randomUUID() is available in all modern Node/Bun/edge runtimes
  return crypto.randomUUID();
}
