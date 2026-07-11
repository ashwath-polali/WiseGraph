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
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          {teacher?.name ? `Welcome back, ${teacher.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {teacher?.school || 'Psychoeducational Assessment Management'}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total Evaluations</p>
              <p className="font-mono data-numeric text-2xl font-bold text-foreground">{evaluationCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-psych/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-psych" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Recent (7 days)</p>
              <p className="font-mono data-numeric text-2xl font-bold text-foreground">{recentCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Actions</p>
              <div className="flex gap-2 mt-1">
                <Link href="/psych/new-evaluation">
                  <Button className="text-sm py-1.5 h-auto">+ New Evaluation</Button>
                </Link>
                <Link href="/psych/universal-categories">
                  <Button variant="secondary" className="text-sm py-1.5 h-auto">⚙ Categories</Button>
                </Link>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Evaluations List */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Recent Evaluations
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
            No Evaluations Yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first psychoeducational evaluation
          </p>
          <Link href="/psych/new-evaluation">
            <Button className="text-sm">Create Your First Evaluation</Button>
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
