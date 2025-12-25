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
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", id);

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {classes.map((cls) => {
        const active = cls.id === currentClassId;
        return (
          <Button
            key={cls.id}
            variant={active ? "primary" : "ghost"}
            onClick={() => handleSelect(cls.id)}
            disabled={isPending}
            className="text-xs"
          >
            {cls.name} · {cls.subject}
            {cls.term ? ` · ${cls.term}` : ""}
          </Button>
        );
      })}
    </div>
  );
}
