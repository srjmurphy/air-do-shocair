import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

type Mood = "up" | "down";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const HIGHLAND_SEER_PROMPT = `You are a Highland seer composing image prompts for a Scottish Bitcoin dashboard called Air Do Shocair.
Write one rich, cinematic image prompt. The image must feel like the Scottish Highlands, poetic but concrete, photorealistic, and suitable for a full-screen hero dashboard.
Include a whisky dram as a small but clear foreground detail. Avoid text, logos, UI, people, and brand names.`;

function parseMood(value: string | null): Mood {
  return value === "down" ? "down" : "up";
}

function fallbackPrompt(mood: Mood) {
  const shared =
    "photorealistic cinematic Scottish Highland vista, wide landscape composition, rugged glens, old stone, heather, amber whisky dram in a heavy crystal glass in the foreground, dramatic natural light, rich atmosphere, no text, no logos, no people";

  if (mood === "up") {
    return `${shared}, triumphant sunny glen after rain, golden light on green slopes, bright clouds opening above distant peaks, celebratory warmth, vivid amber highlights`;
  }

  return `${shared}, misty resilient peaks at first light, silver rain moving across the mountains, steadying whisky pour beside weathered wood, calm strength, deep moody contrast`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const mood = parseMood(request.nextUrl.searchParams.get("mood"));

  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "your_openai_api_key_here"
  ) {
    return NextResponse.json(
      { error: "Add a real OPENAI_API_KEY to .env.local before generating vistas." },
      { status: 500 },
    );
  }

  try {
    const promptResponse = await openai.responses.create({
      model: process.env.OPENAI_PROMPT_MODEL ?? "gpt-4.1",
      instructions: HIGHLAND_SEER_PROMPT,
      input:
        mood === "up"
          ? "Bitcoin is up today. Create a triumphant sunny Highland glen with a celebratory whisky dram."
          : "Bitcoin is down today. Create misty resilient Highland peaks with a steadying pour of whisky.",
      temperature: 0.9,
    });

    const craftedPrompt = promptResponse.output_text?.trim() || fallbackPrompt(mood);
    const vividPrompt = `${craftedPrompt}

Style and rendering direction: vivid color grade, 35mm full-frame photography, high dynamic range, tactile weather, amber highlights, cinematic depth, expansive 3:2 landscape, no text or symbols.`;

    const image = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt: vividPrompt,
      n: 1,
      size: "1536x1024",
      quality: "high",
      output_format: "jpeg",
    });

    const base64Image = image.data?.[0]?.b64_json;

    if (!base64Image) {
      throw new Error("OpenAI did not return image data.");
    }

    return NextResponse.json({
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      prompt: craftedPrompt,
      mood,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to generate Highland vista", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate Highland vista.",
        fallbackPrompt: fallbackPrompt(mood),
        mood,
      },
      { status: 502 },
    );
  }
}
