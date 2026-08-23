// Shared AI helpers — catalog formatting + chat-completion wrapper with model fallback + JSON-block parsing.
// Used by /api/ai/concierge, /api/ai/match.

import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { parseTags } from "@/lib/serialize";

/**
 * Returns a ZAI client. On Vercel (where the .z-ai-config file is absent),
 * builds the config from environment variables. Locally, falls back to the
 * SDK's file-based ZAI.create() which reads /etc/.z-ai-config or ~/.z-ai-config.
 */
export async function getZai(): Promise<Awaited<ReturnType<typeof ZAI.create>>> {
  const envConfig = {
    baseUrl: process.env.ZAI_BASE_URL,
    apiKey: process.env.ZAI_API_KEY,
    token: process.env.ZAI_TOKEN,
    userId: process.env.ZAI_USER_ID,
    chatId: process.env.ZAI_CHAT_ID,
  };
  if (envConfig.baseUrl && envConfig.apiKey) {
    // Use env-var config (Vercel production)
    const ZAIClass = ZAI as any;
    return new ZAIClass(envConfig);
  }
  // Local dev — read from .z-ai-config file
  return ZAI.create();
}

// Pull the donut catalog as a compact JSON list for the system prompt.
export async function getCatalogForPrompt() {
  const donuts = await db.donut.findMany({
    orderBy: [{ featured: "desc" }, { rating: "desc" }],
  });
  return donuts.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    price: d.price,
    tags: parseTags(d.tags),
    rating: d.rating,
    featured: d.featured,
  }));
}

// Chat completion with model fallback: try glm-4.6, fall back to SDK default if it errors.
// Always returns the assistant text (or empty string on hard failure).
export async function callChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> {
  const zai = await getZai();

  let text = "";
  try {
    const completion = await zai.chat.completions.create({
      model: "glm-4.6",
      messages,
      thinking: { type: "disabled" },
    } as any);
    text = completion?.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.warn("[ai] glm-4.6 failed, retrying with default model:", e);
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    } as any);
    text = completion?.choices?.[0]?.message?.content ?? "";
  }
  return text;
}

// Parse the `|||DONUTS||[{...}]|||END|||` block from the assistant's reply.
// Returns the cleaned reply (block stripped) and the list of picks.
export function parseDonutBlock(
  text: string
): { reply: string; picks: { id: string; reason?: string }[] } {
  const openToken = "|||DONUTS||";
  const closeToken = "|||END|||";
  const openIdx = text.indexOf(openToken);
  if (openIdx === -1) return { reply: text.trim(), picks: [] };

  const jsonStart = openIdx + openToken.length;
  const closeIdx = text.indexOf(closeToken, jsonStart);
  const jsonEnd = closeIdx === -1 ? text.length : closeIdx;
  const jsonText = text.slice(jsonStart, jsonEnd).trim();

  let picks: { id: string; reason?: string }[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      picks = parsed
        .map((p: any) => ({
          id: p?.id != null ? String(p.id) : "",
          reason: p?.reason != null ? String(p.reason) : undefined,
        }))
        .filter((p: any) => p.id);
    }
  } catch {
    picks = [];
  }

  const reply = (text.slice(0, openIdx) + (closeIdx === -1 ? "" : text.slice(closeIdx + closeToken.length))).trim();
  return { reply, picks };
}

// Parse a bare JSON array (used by /match). Returns null on failure.
export function parseJsonArray<T = any>(text: string): T[] | null {
  // Strip any markdown code fences if present.
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as T[];
    return null;
  } catch {
    return null;
  }
}
