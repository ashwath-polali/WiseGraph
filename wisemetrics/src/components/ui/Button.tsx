// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<Variant, string> = {
    primary:
      "bg-sky-500 text-slate-950 hover:bg-sky-400 active:bg-sky-600",
    secondary:
      "border border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800",
    ghost:
      "text-slate-300 hover:bg-slate-800/60",
  };

  return (
    <button
      className={clsx(base, styles[variant], className)}
      {...props}
    />
  );
}
