import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getClassScoreSummary } from '@/lib/classSummary';
import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PsychReport } from '@/components/psych/PsychReport';

type Props = { params: Promise<{ id: string }> };

export default async function PsychEvaluationPage(props: Props) {
  const params = await props.params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');

  const evaluation = await getClassScoreSummary(params.id);
  if (!evaluation) notFound();

  const student = evaluation.students[0];
  const hasCategories = evaluation.categories.length > 0;
  const isUniversal = evaluation.subject === 'Universal Assessment';

  const overallScore = student?.overallScore
    ? student.overallScore
    : evaluation.categories.length > 0
    ? Math.round(
        evaluation.categories.reduce((sum, cat) => sum + cat.score, 0) /
          evaluation.categories.length
      )
    : null;

  const generatedAt = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (!hasCategories) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1500px] px-6 py-8">
          <Link
            href="/psych/dashboard"
            className="group mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-psych"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to evaluations
          </Link>
          <Card className="border-2 border-dashed border-border bg-muted/40 p-16 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
                <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h2 className="mb-3 font-display text-2xl font-bold text-foreground">No categories yet</h2>
              <p className="mb-8 leading-relaxed text-muted-foreground">
                Add categories and subtests, then enter this student&apos;s scores to see their profile.
              </p>
              <Link href={`/psych/evaluations/${params.id}/configure`}>
                <Button className="inline-flex items-center gap-2 px-6 py-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Configure categories
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PsychReport
      evaluation={evaluation}
      student={student}
      overallScore={overallScore}
      isUniversal={isUniversal}
      evaluationId={params.id}
      generatedAt={generatedAt}
    />
  );
}
