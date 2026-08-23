import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReady } from "@/lib/ensure-ready";
import type { ChatMessage, Donut } from "@/lib/types";
import {
  getCatalogForPrompt,
  callChat,
  parseDonutBlock,
} from "@/lib/ai";
import { serializeDonut } from "@/lib/serialize";

// POST /api/ai/concierge  { messages: ChatMessage[], sessionId? }
// Returns { reply: string, donuts: Donut[] }
export async function POST(request: Request) {
  try {
    await ensureReady();
    const body = await request.json();
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const catalog = await getCatalogForPrompt();

    const systemPrompt = `You are "DowgNut Concierge", a fun, energetic, hype-tastic donut expert working at the DowgNut donut shop. Your vibe is "GOOD VIBES & GOOD DOWG" — bold, playful, authentic. You recommend donuts from the catalog below, suggest pairings, answer flavor questions, and hype the customer up.

CATALOG (real products you may recommend — only ever recommend IDs from this list):
${JSON.stringify(catalog)}

RULES:
- Keep replies short and punchy (2-4 sentences). Use at most 1 emoji per reply.
- When you recommend one or more donuts, append — at the very end of your reply — a JSON block in EXACTLY this format:
  |||DONUTS||[{"id":"<donutId>","reason":"<short reason>"}]|||END|||
- The JSON block must be the last thing in your message. Never wrap it in markdown.
- If you are not recommending specific donuts, do NOT include the block.
- Never invent donut IDs. Only use IDs from the CATALOG.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] =
      [
        { role: "system", content: systemPrompt },
        ...incoming.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
      ];

    const fullText = await callChat(messages);
    const { reply, picks } = parseDonutBlock(fullText);

    let donuts: Donut[] = [];
    if (picks.length > 0) {
      const ids = picks.map((p) => p.id);
      const rows = await db.donut.findMany({
        where: { id: { in: ids } },
      });
      // preserve the order the model recommended them in
      const byId = new Map(rows.map((r) => [r.id, r]));
      donuts = ids
        .map((id) => byId.get(id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .map(serializeDonut);
    }

    return NextResponse.json({ reply, donuts });
  } catch (err) {
    console.error("[api/ai/concierge POST]", err);
    return NextResponse.json(
      { error: "Concierge failed to respond" },
      { status: 500 }
    );
  }
}
