"use client";

import { useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/Button";

interface Props {
  studentName: string;
  view: "polar" | "bell" | "concentric";
  targetRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportButtons({ studentName, view, targetRef }: Props) {
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    const node = targetRef.current;
    if (!node) return;
    setBusy(true);
    try {
      // html-to-image (not html2canvas) so oklch tokens + SVG charts capture
      // correctly. Paint the card color behind the transparent chart.
      const bg =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--card")
          .trim() || "#ffffff";
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: bg,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${studentName
        .replace(/\s+/g, "-")
        .toLowerCase()}-${view}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // best-effort export
    } finally {
      setBusy(false);
    }
  }, [studentName, view, targetRef]);

  return (
    <div className="mt-2 flex justify-end">
      <Button type="button" variant="secondary" onClick={handleExport} disabled={busy}>
        {busy ? "Exporting…" : "Export PNG"}
      </Button>
    </div>
  );
}
