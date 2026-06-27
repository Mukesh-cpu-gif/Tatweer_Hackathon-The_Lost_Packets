import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db";

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: "Demo seeding is disabled for the real-life app flow." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database seed failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
