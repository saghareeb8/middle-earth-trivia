import { NextResponse } from "next/server";
import { fetchOpenTdbQuestions } from "@/lib/opentdb";
import { QUESTIONS } from "@/data/questions";

// Always run on each request (don't cache the route) so each game gets a
// fresh random batch.
export const dynamic = "force-dynamic";

// GET /api/questions?amount=30&category=9
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = Math.min(50, Math.max(1, Number(searchParams.get("amount")) || 30));
  const category = Number(searchParams.get("category")) || 9; // General Knowledge

  try {
    const questions = await fetchOpenTdbQuestions(amount, category);
    return NextResponse.json({ questions, source: "opentdb" });
  } catch (err) {
    // Never let a flaky upstream block a game — fall back to the bundled bank.
    return NextResponse.json({
      questions: QUESTIONS,
      source: "fallback",
      error: err instanceof Error ? err.message : "unknown error",
    });
  }
}
