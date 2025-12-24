import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6">
        {children}
      </Card>
    </div>
  );
}
