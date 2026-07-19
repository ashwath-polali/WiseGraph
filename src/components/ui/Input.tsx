import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "h-9 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground/70",
        "transition-[border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
