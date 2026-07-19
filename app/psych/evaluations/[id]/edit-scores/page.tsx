import { notFound, redirect } from 'next/navigation';
import { getClassScoreSummary } from '@/lib/classSummary';
import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { EditScoresPsychClient } from '@/components/EditScoresPsychClient';

type Props = { params: Promise<{ id: string }> };

export default async function EditPsychScoresPage(props: Props) {
  const params = await props.params;
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');
  
  const evaluation = await getClassScoreSummary(params.id);
  if (!evaluation) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* EditScoresPsychClient render everything */}
        <EditScoresPsychClient evaluation={evaluation} />
      </div>
    </div>
  );
}
