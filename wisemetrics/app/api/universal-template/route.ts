import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentTeacherId } from '@/lib/currentTeacher';

// GET - Load template
export async function GET() {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.universalTemplate.findUnique({
      where: { teacherId },
    });

    return NextResponse.json({ 
      categories: template?.categories || [] 
    });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// POST - Save template
export async function POST(req: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categories } = await req.json();

    await prisma.universalTemplate.upsert({
      where: { teacherId },
      create: {
        teacherId,
        categories,
      },
      update: {
        categories,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save template:', error);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}
