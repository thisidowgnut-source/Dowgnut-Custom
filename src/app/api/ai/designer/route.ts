import { NextResponse } from "next/server";
import { ensureReady } from "@/lib/ensure-ready";
import { getZai } from "@/lib/ai";
import { rateLimit, clientKeyFrom } from "@/lib/rate-limit";

// POST /api/ai/designer  { prompt: string }
// Returns { imageUrl: string }  where imageUrl is a data URI (data:image/png;base64,...)
export async function POST(request: Request) {
  try {
    await ensureReady();

    // Cost guard: image generation is the most expensive public route —
    // hard-cap requests per session/IP so a script can't farm generations.
    const rl = rateLimit(`designer:${clientKeyFrom(request)}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many generations — let the glaze dry for a minute and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const prompt = String(body.prompt ?? "").trim().slice(0, 600);
    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    // DOHNUT Visual DNA (brand-system/06-visual-ai-engine.md):
    // premium tactile squishy look, kuning #FDE047 canvas, aksen merah #EF233C
    // + navy #1D3557. Ganti prefix lama "neon lime" — konsisten dengan rebrand.
    const stylePrefix =
      "premium food photography, glossy tactile squishy 3D-style donut, golden-brown dough, bold bright yellow background (#FDE047), red (#EF233C) and dark navy (#1D3557) accents, thick outlines, playful streetwear energy, centered composition, social-media ready, ";

    const zai = await getZai();
    const response = await zai.images.generations.create({
      prompt: stylePrefix + prompt,
      size: "1024x1024",
    });

    const base64 = response?.data?.[0]?.base64;
    if (!base64) {
      return NextResponse.json(
        { error: "Image generation returned no data" },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/png;base64,${base64}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    // Log full upstream detail server-side; keep the client message generic
    // so SDK/upstream internals never leak to the browser.
    console.error("[api/ai/designer POST]", err);
    return NextResponse.json(
      { error: "Image generation failed — please try a different prompt" },
      { status: 500 }
    );
  }
}
