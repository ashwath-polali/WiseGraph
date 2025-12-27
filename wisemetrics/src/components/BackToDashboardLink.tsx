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
      <span className="text-xs text-sky-400 hover:text-sky-300">
        Back to dashboard
      </span>
    </Link>
  );
}
