import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma + pg need the Node runtime, and this must actually hit the DB every
// time (never served from cache).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Keep-alive endpoint for the Vercel Cron (see vercel.json). It runs one tiny
 * query, which is real database activity — that resets Supabase's free-tier
 * inactivity timer, so the project never pauses and WiseGraph never "goes
 * offline every 7 days."
 *
 * If a CRON_SECRET env var is set on Vercel, the platform sends it as a Bearer
 * token on cron requests and we require it, so only the scheduler can trigger
 * this. Without the secret it stays open (the query is harmless either way).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const rows = await prisma.$queryRaw<{ now: Date }[]>`select now()`;
    return NextResponse.json({ ok: true, ranAt: rows[0]?.now ?? null });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "query failed" },
      { status: 500 },
    );
  }
}
