import { NextRequest, NextResponse } from "next/server";
import { parseVoiceInput } from "@/lib/voice-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text transcription string is required." },
        { status: 400 }
      );
    }

    // Process using our high-fidelity local entity extractor
    const parsed = parseVoiceInput(text);

    return NextResponse.json({
      success: true,
      text,
      ...parsed,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Voice AI processing failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
