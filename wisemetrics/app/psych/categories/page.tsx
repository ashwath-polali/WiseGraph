import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UniversalTemplateClient } from '@/components/UniversalTemplateClient';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { accountType: true },
  });

  if (teacher?.accountType !== 'psychologist') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 mb-1">Universal Categories</h1>
          <p className="text-sm text-slate-400">Edit the default assessment framework</p>
        </div>
        <Link href="/psych/dashboard">
          <Button variant="secondary" className="text-sm py-1.5">← Dashboard</Button>
        </Link>
      </div>

      <Card className="p-6">
        <UniversalTemplateClient teacherId={teacherId} />
      </Card>
    </div>
  );
}
