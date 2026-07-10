"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function BackToDashboardLink() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const href = classId
    ? `/dashboard?classId=${encodeURIComponent(classId)}`
    : "/dashboard";

  return (
    <Link href={href}>
      <span className="inline-flex h-8 items-center rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground">
        Back to dashboard
      </span>
    </Link>
  );
}
