import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { Card } from '@/components/ui/Card';
import { ConfigureAssessmentClient } from '@/components/ConfigureAssessmentClient';

type Props = { params: Promise<{ id: string }> };

export default async function ConfigureEvaluationPage(props: Props) {
  const params = await props.params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');
  
  // Verify this class belongs to the current teacher
  const classData = await prisma.class.findFirst({
    where: {
      id: params.id,
      teacherId,
    },
    include: {
      categories: {
        include: {
          subcategories: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
  
  if (!classData) notFound();
  
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href={`/psych/evaluations/${params.id}`}
        className="text-muted-foreground hover:text-psych text-sm mb-4 inline-block transition-colors"
      >
        ← Back to evaluation
      </Link>

      <h1 className="text-3xl font-display font-bold text-foreground mb-2">
        Configure assessment
      </h1>
      <p className="text-muted-foreground mb-8">
        {classData.name}
      </p>
      
      <Card className="p-6">
        <ConfigureAssessmentClient
          classId={params.id}
          initialCategories={classData.categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            score: 100, // Placeholder
            subcategories: cat.subcategories.map((sub) => ({
              id: sub.id,
              name: sub.name,
              score: 100, // Placeholder
            })),
          }))}
        />
      </Card>
    </div>
  );
}
