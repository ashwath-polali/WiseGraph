// src/components/ClassSelectorClient.tsx
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
    if (id === currentClassId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", id);

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  if (!classes.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {classes.map((cls) => {
        const isActive = cls.id === currentClassId;
        const label = `${cls.name} – ${cls.subject}${
          cls.term ? ` (${cls.term})` : ""
        }`;

        return (
          <Button
            key={cls.id}
            type="button"
            variant={isActive ? "primary" : "ghost"}
            onClick={() => handleSelect(cls.id)}
            disabled={isPending && !isActive}
            className="rounded-full px-3 py-1 text-[11px]"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
