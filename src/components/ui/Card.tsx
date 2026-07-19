import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-card text-card-foreground",
        "shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_12px_32px_-16px_oklch(0.245_0.015_75/0.14)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
