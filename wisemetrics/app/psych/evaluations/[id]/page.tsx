import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getClassScoreSummary } from '@/lib/classSummary';
import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PsychStudentViewClient } from '@/components/PsychStudentViewClient';
import { PsychEvaluationProvider, ViewModeToggle, ChartDisplay } from '@/components/PsychEvaluationClient';
import { ExportChartButtons } from '@/components/ExportChartButtons';
import { SnapshotManager } from '@/components/SnapshotManager';
import { SyncCategoriesButton } from '@/components/SyncCategoriesButton';

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
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/psych/dashboard"
            className="text-muted-foreground hover:text-psych text-sm mb-4 inline-flex items-center gap-1.5 transition-colors group"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Evaluations
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              {student ? (
                <>
                  <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                    {student.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      {evaluation.subject}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Grade {student.gradeLevel}
                    </span>
                    {overallScore && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-psych/10 text-psych text-sm font-semibold border border-psych/20">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Overall: <span className="font-mono" data-numeric>{overallScore}</span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                    {evaluation.name}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Grade {evaluation.gradeLevel}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        {!hasCategories ? (
          <Card className="p-16 text-center border-dashed border-2 border-border bg-muted/40">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6 ring-1 ring-border">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                No Categories Yet
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Set up assessment categories and subcategories to start tracking scores and visualizing this student's performance profile.
              </p>
              <Link href={`/psych/evaluations/${params.id}/configure`}>
                <Button className="inline-flex items-center gap-2 px-6 py-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Configure Categories
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <PsychEvaluationProvider evaluation={evaluation}>
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar */}
              <div className="col-span-3 space-y-6">
                <Card className="sticky top-6 border border-border bg-card shadow-sm">
                  <div className="p-5 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-psych" />
                      Assessment Areas
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {evaluation.categories.length} {evaluation.categories.length === 1 ? 'category' : 'categories'}
                    </p>
                  </div>
                  <div className="p-4">
                    <PsychStudentViewClient
                      student={student!}
                      evaluation={evaluation}
                      isUniversal={isUniversal}
                      evaluationId={params.id}
                    />
                  </div>
                </Card>

                {/* Snapshot Manager */}
                <SnapshotManager classId={params.id} />
              </div>

              {/* Main Visualization */}
              <div className="col-span-9 space-y-6">
                <Card className="border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <svg className="w-5 h-5 text-psych" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Performance Profile
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Standard score visualization across all assessment areas
                        </p>
                      </div>
                      {/* ONLY VIEW MODE TOGGLE */}
                      <ViewModeToggle />
                    </div>
                  </div>
                  
                  <div className="p-8" id="chart-container">
                    {/* CHART IN THE BODY */}
                    <ChartDisplay evaluation={evaluation} />
                  </div>
                </Card>

                {/* Action Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {student && (
                      <Link href={`/psych/evaluations/${params.id}/edit-scores`}>
                        <Button className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Scores
                        </Button>
                      </Link>
                    )}
                    {isUniversal && (
                      <SyncCategoriesButton evaluationId={params.id} />
                    )}
                    {!isUniversal && (
                      <Link href={`/psych/evaluations/${params.id}/configure`}>
                        <Button variant="secondary" className="inline-flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Configure Categories
                        </Button>
                      </Link>
                    )}
                  </div>

                  <ExportChartButtons studentName={student?.name || evaluation.name} />
                </div>

                {/* Category Breakdown Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {evaluation.categories.slice(0, 4).map((category) => (
                    <Card
                      key={category.id}
                      className="p-5 border border-border bg-card hover:border-foreground/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground mb-1">
                            {category.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {category.subcategories?.length || 0} subcategories
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold font-mono text-foreground" data-numeric>
                            {Math.round(category.score)}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                            Standard Score
                          </div>
                        </div>
                      </div>

                      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all"
                          style={{
                            width: `${((category.score - 60) / (150 - 60)) * 100}%`,
                            backgroundColor: 'var(--chart-4)'
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </PsychEvaluationProvider>
        )}
      </div>
    </div>
  );
}
