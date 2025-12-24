import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">WiseGraph</h1>
        <p className="text-sm text-slate-400 mb-6">
          Interactive reports for student assessments.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button>Log in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary">Sign up</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
