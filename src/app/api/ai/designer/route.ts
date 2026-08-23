import { NextResponse } from "next/server";
import { ensureReady } from "@/lib/ensure-ready";
import { getZai } from "@/lib/ai";

// POST /api/ai/designer  { prompt: string }
// Returns { imageUrl: string }  where imageUrl is a data URI (data:image/png;base64,...)
export async function POST(request: Request) {
  try {
    await ensureReady();
    const body = await request.json();
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const stylePrefix =
      "vibrant graffiti-style donut illustration, bold colors, neon lime background, drip details, product photography style, centered, ";

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
  } catch (err: any) {
    console.error("[api/ai/designer POST]", err);
    return NextResponse.json(
      {
        error:
          err?.message ??
          "Image generation failed — please try a different prompt",
      },
      { status: 500 }
    );
  }
}
