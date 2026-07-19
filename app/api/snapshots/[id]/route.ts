import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentTeacherId } from '@/lib/currentTeacher';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Fetch a single snapshot by ID
export async function GET(req: Request, context: RouteContext) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    // Fetch the snapshot with all its scores
    const snapshot = await prisma.scoreSnapshot.findUnique({
      where: { id },
      include: {
        scores: true,
      },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    // Verify ownership
    if (snapshot.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshot' },
      { status: 500 }
    );
  }
}
