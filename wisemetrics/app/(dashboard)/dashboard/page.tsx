import { getClassScoreSummary } from "@/lib/classSummary";
import { ClassConcentricGraph } from "@/components/charts/ClassConcentricGraph";

export default async function DashboardPage() {
  const cls = await getClassScoreSummary();

  if (!cls) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">Class dashboard</h1>
        <p className="text-sm text-slate-400">
          No classes found yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 h-[420px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">{cls.name}</h1>
            <p className="text-sm text-slate-400">
              {cls.subject} • Grade {cls.gradeLevel}
            </p>
          </div>
        </div>
        <div className="h-[320px]">
          <ClassConcentricGraph cls={cls} />
        </div>
      </section>

      <aside className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <h2 className="text-sm font-semibold mb-2">Students</h2>
        <ul className="space-y-1 text-sm text-slate-200 max-h-[360px] overflow-y-auto">
          {cls.students.map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span>{s.name}</span>
              <span className="text-xs text-slate-400">{s.overallScore}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
