// src/components/ExportButtons.tsx
"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  studentName: string;
  view: "polar" | "bell" | "concentric";
}

export function ExportButtons({ studentName, view }: Props) {
  const handleExport = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".student-hero-chart canvas"
    );
    if (!canvas) return;

    const link = document.createElement("a");
    const safeName = studentName.replace(/\s+/g, "-").toLowerCase();
    link.download = `${safeName}-${view}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [studentName, view]);

  return (
    <div className="flex justify-end mt-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleExport}
      >
        Export PNG
      </Button>
    </div>
  );
}
