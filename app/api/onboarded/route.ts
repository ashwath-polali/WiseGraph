import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

export const runtime = "nodejs";

/**
 * Marks the current account as having finished the first-run tour (or clears it
 * with { reset: true } so the tour can be replayed). Gated per account, so the
 * tour shows once ever, across devices.
 */
export async function POST(request: Request) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let reset = false;
  try {
    const body = await request.json();
    reset = Boolean(body?.reset);
  } catch {
    /* no body — treat as "mark done" */
  }

  try {
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { onboardedAt: reset ? null : new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "failed" }, { status: 500 });
  }
}
