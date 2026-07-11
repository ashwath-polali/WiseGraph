import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh bg-background text-foreground">
      <div className="fixed bottom-5 right-5 z-50 rounded-full border border-border bg-card/80 p-0.5 shadow-sm backdrop-blur-md">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
