// DowgNut — centralised fetch helper.
// Injects the `x-session-id` header from localStorage on every call so that
// cart / favorites / orders stay scoped to the same anonymous browser session.

export const SESSION_KEY = "dowgnut-session";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (window.crypto && "randomUUID" in window.crypto
          ? window.crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const sid = getSessionId();
  if (sid) headers.set("x-session-id", sid);

  const res = await fetch(path, { ...init, headers });
  const isJson =
    res.headers.get("content-type")?.includes("application/json") ?? false;
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String((data as any).error)) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return (data as T) ?? (undefined as unknown as T);
}
