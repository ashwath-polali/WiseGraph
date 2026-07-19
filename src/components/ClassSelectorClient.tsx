"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

interface ClassSelectorClientProps {
  classes: {
    id: string;
    name: string;
    subject: string;
    term: string | null;
  }[];
  currentClassId: string;
}

export function ClassSelectorClient({
  classes,
  currentClassId,
}: ClassSelectorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSelect(id: string) {
    // remember the class we're switching to, so coming back to the dashboard
    // from a student, an edit screen, or the nav lands here instead of resetting
    fetch("/api/teacher", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultClassId: id }),
    }).catch(() => {});
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("classId", id);
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {classes.map((cls) => {
        const isActive = cls.id === currentClassId;
        return (
          <Button
            key={cls.id}
            variant={isActive ? "default" : "ghost"}
            className="whitespace-nowrap text-xs"
            disabled={isPending && isActive}
            onClick={() => handleSelect(cls.id)}
          >
            {cls.name}
          </Button>
        );
      })}
    </div>
  );
}
