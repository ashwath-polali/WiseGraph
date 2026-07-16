"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";

interface Props {
  studentName: string;
}

export function ExportChartButtons({ studentName }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  function inlineStyles(svg: SVGElement): SVGElement {
    const svgClone = svg.cloneNode(true) as SVGElement;

    const originalElements = svg.querySelectorAll<HTMLElement>("*");
    const clonedElements = svgClone.querySelectorAll<HTMLElement>("*");

    clonedElements.forEach((cloned, i) => {
      const original = originalElements[i];
      if (!original) return;

      const computedStyle = window.getComputedStyle(original);

      const stylesToCopy = [
        "fill",
        "stroke",
        "stroke-width",
        "stroke-dasharray",
        "opacity",
        "font-family",
        "font-size",
        "font-weight",
        "text-anchor",
        "dominant-baseline",
        "color",
        // gradient stops carry the wedge wash color as CSS var tokens; without
        // inlining the resolved color, var(--chart-n) is unresolvable in the
        // standalone exported SVG and the fills render transparent.
        "stop-color",
        "stop-opacity",
      ];

      stylesToCopy.forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop);
        if (value) {
          cloned.style.setProperty(prop, value);
        }
      });
    });

    return svgClone;
  }

  // Resolve any CSS color (oklch/lab tokens included) to concrete sRGB by
  // painting one pixel and reading it back — the SVG-as-Image render path can't
  // be trusted with wide-gamut color across browsers, and we never want a
  // blank/black export.
  function toSrgb(color: string, fallback: string): string {
    try {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      if (!ctx) return fallback;
      ctx.fillStyle = fallback;
      ctx.fillStyle = color; // invalid input silently keeps the fallback
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return fallback;
    }
  }

  // The export canvas background follows the live theme: white paper in light,
  // the warm near-black card in dark. Reads the --card token so it can never
  // regress to a hardcoded dark slate the way the old export did.
  function resolveExportBg(): string {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--card")
      .trim();
    return toSrgb(raw || "#ffffff", "#ffffff");
  }

  // Export at the chart's own coordinate space (viewBox), not its on-screen
  // pixel size — the chart can render at ~82vh, and a 2× capture of that would
  // be a needlessly huge, oddly-scaled image. viewBox gives a stable, print-
  // friendly resolution regardless of how large the chart is shown.
  function exportSize(svg: SVGSVGElement): { width: number; height: number } {
    const vb = svg.viewBox?.baseVal;
    if (vb && vb.width > 0 && vb.height > 0) {
      return { width: vb.width, height: vb.height };
    }
    const bbox = svg.getBoundingClientRect();
    return { width: bbox.width, height: bbox.height };
  }

  function normalizeExportSvg(svgClone: SVGElement, bg: string) {
    // Explicit overall background (matches canvas), theme-aware
    svgClone.style.backgroundColor = bg;
    // Ensure the SVG itself does not inject a global fill
    svgClone.setAttribute("fill", "none");
  }

  async function exportToPNG() {
    setIsExporting(true);
    try {
      const chartContainer = document.getElementById("chart-container");
      if (!chartContainer) {
        alert("Chart not found");
        return;
      }

      const svg = chartContainer.querySelector("svg");
      if (!svg) {
        alert("Chart SVG not found");
        return;
      }

      const bg = resolveExportBg();
      const svgClone = inlineStyles(svg);
      normalizeExportSvg(svgClone, bg);

      const { width, height } = exportSize(svg);

      svgClone.setAttribute("width", width.toString());
      svgClone.setAttribute("height", height.toString());
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement("a");
          link.download = `${studentName.replace(
            /\s+/g,
            "-"
          )}-performance-profile.png`;
          link.href = URL.createObjectURL(blob);
          link.click();

          URL.revokeObjectURL(url);
          URL.revokeObjectURL(link.href);
        }, "image/png");
      };

      img.onerror = () => {
        alert("Failed to load SVG for export");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error("Export PNG error:", error);
      alert("Failed to export PNG. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function exportToPDF() {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const chartContainer = document.getElementById("chart-container");
      if (!chartContainer) {
        alert("Chart not found");
        return;
      }

      const svg = chartContainer.querySelector("svg");
      if (!svg) {
        alert("Chart SVG not found");
        return;
      }

      const bg = resolveExportBg();
      const svgClone = inlineStyles(svg);
      normalizeExportSvg(svgClone, bg);

      const { width, height } = exportSize(svg);

      svgClone.setAttribute("width", width.toString());
      svgClone.setAttribute("height", height.toString());
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: width > height ? "landscape" : "portrait",
          unit: "px",
          format: [width, height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(
          `${studentName.replace(/\s+/g, "-")}-performance-profile.pdf`
        );

        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        alert("Failed to load SVG for export");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={exportToPNG}
        disabled={isExporting}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isExporting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        Export PNG
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={exportToPDF}
        disabled={isExporting}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isExporting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )}
        Export PDF
      </Button>
    </div>
  );
}
