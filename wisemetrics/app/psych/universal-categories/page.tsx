import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CategoriesPageClient } from '@/components/CategoriesPageClient';

export const dynamic = 'force-dynamic';

export default async function UniversalCategoriesPage() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { accountType: true },
  });

  if (teacher?.accountType !== 'psychologist') {
    redirect('/dashboard');
  }

  // Get all custom evaluations
  const customEvaluations = await prisma.class.findMany({
    where: {
      teacherId,
      subject: 'Custom Assessment',
    },
    include: {
      students: {
        take: 1,
        select: { name: true },
      },
      categories: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage assessment frameworks</p>
        </div>
        <Link href="/psych/dashboard">
          <Button variant="secondary" className="text-sm py-1.5">← Dashboard</Button>
        </Link>
      </div>

      <CategoriesPageClient
        teacherId={teacherId}
        customEvaluations={customEvaluations.map((e) => ({
          id: e.id,
          name: e.name,
          subject: e.subject,
          gradeLevel: e.gradeLevel,
          student: e.students[0],
          categoryCount: e.categories.length,
        }))}
      />
    </div>
  );
}
