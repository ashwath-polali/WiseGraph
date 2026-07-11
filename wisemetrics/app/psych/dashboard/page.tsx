import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { PsychDashboardClient } from '@/components/PsychDashboardClient';

export default async function PsychDashboardPage() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');
  
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { name: true, school: true, accountType: true },
  });

  if (teacher?.accountType !== 'psychologist') {
    redirect('/dashboard');
  }
  
  const evaluations = await prisma.class.findMany({
    where: { teacherId },
    include: {
      students: {
        take: 1,
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          overallScore: true,
        },
      },
      categories: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const evaluationCount = evaluations.length;
  const recentCount = evaluations.filter(
    (e) => new Date(e.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Header: title + primary actions */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground mb-1">
            {teacher?.name ? `Welcome back, ${teacher.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {teacher?.school || 'Your evaluations, ready for the next conference.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/psych/universal-categories">
            <Button variant="outline" size="sm">Categories</Button>
          </Link>
          <Link href="/psych/new-evaluation">
            <Button size="sm">New evaluation</Button>
          </Link>
        </div>
      </div>

      {/* One condensed stat strip, not a row of cards */}
      <div className="mb-6 inline-flex items-center gap-5 rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono data-numeric text-xl font-semibold text-foreground">{evaluationCount}</span>
          <span className="text-sm text-muted-foreground">evaluations</span>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-baseline gap-2">
          <span className="font-mono data-numeric text-xl font-semibold text-foreground">{recentCount}</span>
          <span className="text-sm text-muted-foreground">added this week</span>
        </div>
      </div>

      {/* Evaluations List */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Recent evaluations
        </h2>
      </div>

      {evaluations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-display text-base font-semibold text-foreground mb-1">
            No evaluations yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start a new evaluation and its scores will show up here.
          </p>
          <Link href="/psych/new-evaluation">
            <Button className="text-sm">Start your first evaluation</Button>
          </Link>
        </Card>
      ) : (
        <PsychDashboardClient 
          evaluations={evaluations.map((e) => ({
            id: e.id,
            name: e.name,
            subject: e.subject,
            gradeLevel: e.gradeLevel,
            createdAt: e.createdAt.toISOString(),
            student: e.students[0] || null,
            categoryCount: e.categories.length,
          }))}
        />
      )}
    </div>
  );
}
