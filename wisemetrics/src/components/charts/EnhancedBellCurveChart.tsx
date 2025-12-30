"use client";

import { useMemo, useState } from "react";
import type { ClassScoreSummary, CategoryScore, SubcategoryScore } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";

const MEAN = 100;
const SD = 15;
const SCORE_MIN = 60;
const SCORE_MAX = 150;

type Props = {
  cls: ClassScoreSummary;
  viewMode?: 'polar' | 'bell';
  onExpand?: () => void;
};

type SelectedItem = {
  type: 'overall' | 'category' | 'subcategory';
  id: string;
  categoryId?: string;
  name: string;
  score: number;
};

function normalPdf(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd;
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

function jitterForKey(key: string, jitter = 6): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const v = (hash % 1000) / 1000; // 0..1
  return (v * 2 - 1) * jitter;
}

export function EnhancedBellCurveChart({ cls, onExpand }: Props) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showFullNames, setShowFullNames] = useState(false);

  // Get student (for psychologist there's only 1)
  const student = cls.students[0];

  const width = 520;
  const height = 270;
  const marginLeft = 42;
  const marginRight = 24;
  const marginTop = 26;
  const marginBottom = 54;

  function xScale(score: number): number {
    const t = (clampScore(score) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
    return marginLeft + t * (width - marginLeft - marginRight);
  }

  const sampleXs: number[] = [];
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = SCORE_MIN + t * (SCORE_MAX - SCORE_MIN);
    sampleXs.push(s);
  }

  const pdfValues = sampleXs.map((s) => normalPdf(s, MEAN, SD));
  const maxPdf = Math.max(...pdfValues, 1e-6);

  function yScaleFromPdf(pdf: number): number {
    const t = pdf / maxPdf;
    const usableHeight = height - marginTop - marginBottom;
    return marginTop + (1 - t) * usableHeight;
  }

  const curvePath = (() => {
    const pts: string[] = [];
    sampleXs.forEach((s, i) => {
      const x = xScale(s);
      const pdf = pdfValues[i];
      const y = yScaleFromPdf(pdf);
      pts.push(`${x},${y}`);
    });
    if (!pts.length) return "";
    return "M " + pts.join(" L ");
  })();

  const handleOverallClick = () => {
    if (!student) return;
    setSelectedItem({
      type: 'overall',
      id: 'overall',
      name: 'Overall Score',
      score: student.overallScore,
    });
  };

  const handleCategoryClick = (cat: CategoryScore) => {
    setSelectedItem({
      type: 'category',
      id: cat.id,
      name: cat.name,
      score: cat.score,
    });
  };

  const handleSubcategoryClick = (sub: SubcategoryScore, cat: CategoryScore) => {
    setSelectedItem({
      type: 'subcategory',
      id: sub.id,
      categoryId: cat.id,
      name: sub.name,
      score: sub.score,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900/40 to-slate-950 p-4 shadow-[0_20px_60px_rgba(8,47,73,0.6)] ring-1 ring-slate-800/40 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/40 pb-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400/80">
            Standard Score Distribution
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-slate-50">
              {student?.name || cls.name}
            </h2>
            <span className="rounded-full bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-medium text-slate-300 ring-1 ring-slate-700/50">
              {cls.subject} · Grade {cls.gradeLevel}
            </span>
          </div>
        </div>

        {student && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Overall Score
            </span>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-400">
                {Math.round(student.overallScore)}
              </div>
              <div className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.8)]" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-h-[300px] flex-1 gap-5">
        {/* Chart */}
        <div className="relative flex-[3] min-w-[320px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
            {/* Gradients */}
            <defs>
              <linearGradient id="bell-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#020617" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="bell-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect x={0} y={0} width={width} height={height} fill="url(#bell-bg)" rx="8" />

            {/* X-axis */}
            <line
              x1={marginLeft}
              y1={height - marginBottom}
              x2={width - marginRight}
              y2={height - marginBottom}
              className="stroke-slate-700/60"
              strokeWidth={1.5}
            />

            {/* X ticks */}
            {Array.from({ length: 10 }).map((_, i) => {
              const score = SCORE_MIN + i * ((SCORE_MAX - SCORE_MIN) / 9);
              const x = xScale(score);
              const isKeyScore = score === 100;
              return (
                <g key={score}>
                  <line
                    x1={x}
                    y1={height - marginBottom}
                    x2={x}
                    y2={height - marginBottom + 5}
                    className={isKeyScore ? "stroke-slate-600" : "stroke-slate-700/50"}
                    strokeWidth={isKeyScore ? 1.5 : 1}
                  />
                  <text
                    x={x}
                    y={height - marginBottom + 16}
                    className={isKeyScore ? "fill-slate-400 text-[10px] font-semibold" : "fill-slate-500 text-[9px]"}
                    textAnchor="middle"
                  >
                    {Math.round(score)}
                  </text>
                </g>
              );
            })}

            {/* Bell curve fill */}
            {curvePath && (
              <path
                d={
                  curvePath +
                  ` L ${xScale(SCORE_MAX)},${height - marginBottom}` +
                  ` L ${xScale(SCORE_MIN)},${height - marginBottom} Z`
                }
                fill="url(#bell-fill)"
                opacity={0.3}
              />
            )}

            {/* Bell curve outline */}
            {curvePath && (
              <path
                d={curvePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={2.5}
                opacity={0.95}
                filter="url(#glow)"
              />
            )}

            {/* Mean line (100) */}
            <line
              x1={xScale(MEAN)}
              y1={marginTop}
              x2={xScale(MEAN)}
              y2={height - marginBottom}
              className="stroke-slate-600/60"
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />

            {/* Student overall score line */}
            {student && (
              <>
                <line
                  x1={xScale(student.overallScore)}
                  y1={marginTop}
                  x2={xScale(student.overallScore)}
                  y2={height - marginBottom}
                  className="stroke-orange-400"
                  strokeWidth={2.5}
                  opacity={0.9}
                  filter="url(#glow)"
                />

                {/* Overall score dot on curve - CLICKABLE */}
                {(() => {
                  const x = xScale(student.overallScore);
                  const pdf = normalPdf(student.overallScore, MEAN, SD);
                  const y = yScaleFromPdf(pdf);
                  const isSelected = selectedItem?.type === 'overall';
                  return (
                    <g
                      onClick={handleOverallClick}
                      className="cursor-pointer transition-all duration-200"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 5.5 : 4.5}
                        fill={isSelected ? "#fed7aa" : "#fb923c"}
                        stroke="#fff"
                        strokeWidth={isSelected ? 2 : 1.5}
                        style={{
                          filter: isSelected
                            ? "drop-shadow(0 0 14px rgba(251,146,60,1))"
                            : "drop-shadow(0 0 10px rgba(251,146,60,1))",
                          transition: "all 0.2s ease",
                        }}
                      />
                      {showFullNames && (
                        <text
                          x={x}
                          y={y - 14}
                          className="fill-orange-300 text-[8px] font-semibold"
                          textAnchor="middle"
                          style={{
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                          }}
                        >
                          Overall
                        </text>
                      )}
                    </g>
                  );
                })()}
              </>
            )}

            {/* Category scores as dots with labels */}
            {student &&
              student.categories.map((cat) => {
                const x = xScale(cat.score);
                const pdf = normalPdf(cat.score, MEAN, SD);
                const baseY = yScaleFromPdf(pdf);
                const y = baseY + jitterForKey(`cat-${cat.id}`, 4);
                const isSelected = selectedItem?.type === 'category' && selectedItem.id === cat.id;
                const initial = cat.name.charAt(0).toUpperCase();

                return (
                  <g
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="cursor-pointer transition-all duration-200"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 5.5 : 4}
                      className={isSelected ? "fill-emerald-300" : "fill-emerald-400"}
                      stroke="#fff"
                      strokeWidth={isSelected ? 2 : 1.5}
                      opacity={isSelected ? 1 : 0.95}
                      style={{
                        filter: isSelected
                          ? "drop-shadow(0 0 12px rgba(52,211,153,1))"
                          : "drop-shadow(0 0 6px rgba(52,211,153,0.8))",
                        transition: "all 0.2s ease",
                      }}
                    />
                    {showFullNames ? (
                      <text
                        x={x}
                        y={y - 12}
                        className="fill-emerald-300 text-[8px] font-semibold"
                        textAnchor="middle"
                        style={{
                          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                        }}
                      >
                        {cat.name}
                      </text>
                    ) : (
                      <text
                        x={x}
                        y={y - 8}
                        className="fill-emerald-300 text-[9px] font-bold"
                        textAnchor="middle"
                        style={{
                          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                        }}
                      >
                        {initial}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* Subcategory scores as smaller dots with labels */}
            {student &&
              student.categories.flatMap((cat) =>
                (cat.subcategories ?? []).map((sub) => {
                  const x = xScale(sub.score);
                  const pdf = normalPdf(sub.score, MEAN, SD);
                  const baseY = yScaleFromPdf(pdf);
                  const y = baseY + jitterForKey(`sub-${sub.id}`, 3);
                  const isSelected = selectedItem?.type === 'subcategory' && selectedItem.id === sub.id;
                  const initial = sub.name.charAt(0).toUpperCase();

                  return (
                    <g
                      key={`sub-${sub.id}`}
                      onClick={() => handleSubcategoryClick(sub, cat)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 4 : 2.8}
                        className={isSelected ? "fill-violet-300" : "fill-violet-400"}
                        stroke="#fff"
                        strokeWidth={isSelected ? 1.5 : 1}
                        opacity={isSelected ? 1 : 0.85}
                        style={{
                          filter: isSelected
                            ? "drop-shadow(0 0 10px rgba(167,139,250,1))"
                            : "drop-shadow(0 0 4px rgba(167,139,250,0.7))",
                          transition: "all 0.2s ease",
                        }}
                      />
                      {showFullNames ? (
                        <text
                          x={x}
                          y={y - 10}
                          className="fill-violet-300 text-[7px] font-medium"
                          textAnchor="middle"
                          style={{
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                          }}
                        >
                          {sub.name}
                        </text>
                      ) : (
                        <text
                          x={x}
                          y={y - 7}
                          className="fill-violet-300 text-[8px] font-bold"
                          textAnchor="middle"
                          style={{
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                          }}
                        >
                          {initial}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
          </svg>

          {/* Bottom controls */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <button
              onClick={() => setShowFullNames(!showFullNames)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 text-[10px] font-medium text-slate-300 shadow-lg backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800/90 hover:text-slate-100"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {showFullNames ? 'Abbreviate' : 'Full Names'}
            </button>

            {onExpand && (
              <button
                onClick={onExpand}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 text-[10px] font-medium text-slate-300 shadow-lg backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800/90 hover:text-slate-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Expand
              </button>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-[1.5] shrink-0">
          <div className="flex h-full flex-col rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-950/60 to-slate-900/80 p-4 shadow-xl backdrop-blur-sm ring-1 ring-slate-800/40">
            <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-800/50 pb-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-50">
                  Selection Details
                </h3>
                {student && !selectedItem && (
                  <p className="text-[11px] text-slate-400">
                    Overall{" "}
                    <span className="font-mono font-semibold text-orange-400">
                      {Math.round(student.overallScore)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {!selectedItem ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-2xl bg-slate-800/40 p-4 ring-1 ring-slate-700/30">
                  <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-400">
                    Click any dot to view details
                  </p>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      <span>Overall</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>Category</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-violet-400" />
                      <span>Subskill</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-[11px]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      {selectedItem.type === 'overall' ? 'Overall' : selectedItem.type === 'category' ? 'Category' : 'Subcategory'}
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-50">
                      {selectedItem.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400">
                      Standard Score
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        selectedItem.type === 'overall' ? 'bg-orange-400' :
                        selectedItem.type === 'category' ? 'bg-emerald-400' : 'bg-violet-400'
                      }`} />
                      <span className="text-xl font-bold text-slate-50">
                        {Math.round(selectedItem.score)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedItem.type === 'category' && (() => {
                  const category = student?.categories.find(c => c.id === selectedItem.id);
                  return category?.subcategories && category.subcategories.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Related Subcategories
                      </div>
                      <div className="space-y-1">
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubcategoryClick(sub, category)}
                            className="flex w-full items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-2.5 py-1.5 text-left transition-all hover:border-violet-500/40 hover:bg-slate-900/60"
                          >
                            <span className="truncate text-[10px] text-slate-300">
                              {sub.name}
                            </span>
                            <span className="ml-2 font-mono text-[10px] font-semibold text-violet-400">
                              {Math.round(sub.score)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="mt-4 rounded-lg bg-slate-900/40 p-2.5 ring-1 ring-slate-800/40">
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    {selectedItem.type === 'overall'
                      ? 'The overall score represents the comprehensive performance across all assessment categories and subcategories.'
                      : selectedItem.type === 'category' 
                      ? 'Category scores represent the average performance across all subcategories within this assessment domain.'
                      : 'Subcategory scores measure specific skills within their parent category domain.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 border-t border-slate-800/40 pt-3 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
          <span className="font-medium text-slate-400">Overall Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="font-medium text-slate-400">Categories</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
          <span className="font-medium text-slate-400">Subcategories</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded bg-sky-400" />
          <span className="font-medium text-slate-400">Normal Distribution (μ=100, σ=15)</span>
        </div>
      </div>
    </div>
  );
}
