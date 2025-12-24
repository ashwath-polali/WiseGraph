import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassScoreSummary } from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";

type RouteParams = {
  id: string;
};

type Props = {
  params: Promise<RouteParams>;
};

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params; // ⬅ unwrap the Promise

  const summary = await getClassScoreSummary();
  if (!summary) notFound();

  const student = summary.students.find((s) => s.id === id);
  if (!student) notFound();

  const { name: className, subject } = summary;

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            {student.name}
          </h1>
          <p className="text-sm text-slate-400">
            {className} · {subject}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-sky-400 hover:underline"
        >
          ← Back to class
        </Link>
      </header>

      <Card className="p-4 bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-200">
            Performance vs class
          </h2>
          <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 text-xs text-slate-300">
            <span className="px-2 py-1 bg-slate-800 text-slate-50">
              Polar
            </span>
            <span className="px-2 py-1">Bell</span>
            <span className="px-2 py-1">Concentric</span>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
          Polar chart placeholder (wire up real chart next)
        </div>
      </Card>

      <Card className="p-4 bg-slate-900/80 border border-slate-800">
        <h2 className="mb-3 text-sm font-medium text-slate-200">
          Subcategory details
        </h2>
        <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
          Subcategory diamond chart placeholder
        </div>
      </Card>
    </main>
  );
}
