import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentTeacherId } from '@/lib/currentTeacher';

// GET - List all snapshots for a class or psych student
export async function GET(req: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const psychStudentId = searchParams.get('psychStudentId');

    // For psych evaluations, they're stored with classId
    const whereClause: any = { teacherId };
    
    if (classId || psychStudentId) {
      // Both map to classId since psych evaluations are stored as Class records
      whereClause.classId = classId || psychStudentId;
    }

    const snapshots = await prisma.scoreSnapshot.findMany({
      where: whereClause,
      orderBy: { snapshotDate: 'desc' },
      include: {
        scores: true,
        _count: {
          select: { scores: true },
        },
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

// POST - Create a new snapshot
export async function POST(req: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, classId, psychStudentId } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Snapshot name is required' }, { status: 400 });
    }

    // Determine which ID we're using (both map to classId in the database)
    const evaluationId = psychStudentId || classId;
    
    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Either classId or psychStudentId is required' },
        { status: 400 }
      );
    }

    // Get the class/evaluation
    const evaluation = await prisma.class.findFirst({
      where: { 
        id: evaluationId,
        teacherId 
      },
      include: {
        students: {
          include: {
            scores: {
              include: {
                category: true,
                subcategory: true,
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const students = evaluation.students;

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found in this evaluation' },
        { status: 400 }
      );
    }

    // Check if there are any scores to snapshot
    const totalScores = students.reduce((sum, s) => sum + s.scores.length, 0);
    if (totalScores === 0) {
      return NextResponse.json(
        { error: 'No scores to snapshot' },
        { status: 400 }
      );
    }

    // Create snapshot with classId (not psychStudentId)
    const snapshot = await prisma.scoreSnapshot.create({
      data: {
        name,
        classId: evaluationId, // Use classId for both teacher and psych mode
        teacherId,
        scores: {
          create: students.flatMap((student) =>
            student.scores.map((score) => ({
              studentId: student.id,
              studentName: student.name,
              categoryId: score.categoryId,
              categoryName: score.category?.name || 'Unknown',
              subcategoryId: score.subcategoryId,
              subcategoryName: score.subcategory?.name || null,
              standardScore: score.standardScore,
              overallScore: student.overallScore,
            }))
          ),
        },
      },
      include: {
        scores: true,
      },
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ 
      error: 'Failed to create snapshot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a snapshot
export async function DELETE(req: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const snapshotId = searchParams.get('id');

    if (!snapshotId) {
      return NextResponse.json({ error: 'Snapshot ID required' }, { status: 400 });
    }

    // Verify ownership
    const snapshot = await prisma.scoreSnapshot.findFirst({
      where: { id: snapshotId, teacherId },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    await prisma.scoreSnapshot.delete({
      where: { id: snapshotId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    return NextResponse.json({ error: 'Failed to delete snapshot' }, { status: 500 });
  }
}

// PATCH - Update snapshot name
export async function PATCH(req: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.scoreSnapshot.findFirst({
      where: { id, teacherId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const snapshot = await prisma.scoreSnapshot.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error updating snapshot:', error);
    return NextResponse.json({ error: 'Failed to update snapshot' }, { status: 500 });
  }
}
