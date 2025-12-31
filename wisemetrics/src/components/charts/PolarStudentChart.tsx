'use client';

import { useMemo, useState, useEffect } from 'react';
import type {
  ClassScoreSummary,
  CategoryScore,
  SubcategoryScore,
} from '@/types/scores';
import { clampScore } from '@/lib/chartScaling';

type Props = {
  evaluation: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
  showFullNames?: boolean;
  onToggleNames?: () => void;
  onExpand?: () => void;
  comparisonSnapshotId?: string | null;
};

type SelectedItem = {
  type: 'category' | 'subcategory' | 'overall';
  name: string;
  score: number;
  categoryName?: string;
  categoryId?: string;
  subcategoryId?: string;
  snapshotScore?: number;
};

type SnapshotData = {
  id: string;
  name: string;
  scores: {
    categoryId: string;
    categoryName: string;
    subcategoryId: string | null;
    subcategoryName: string | null;
    standardScore: number;
    overallScore: number;
  }[];
};

type SubcategoryPoint = {
  id: string;
  x: number;
  y: number;
  angle: number;
  snapshotScore: number | null;
  isBookend: boolean;
  name?: string;
  score?: number;
  firstLetter?: string;
};

export function PolarStudentChart({
  evaluation,
  svgRef,
  showFullNames = false,
  onToggleNames,
  onExpand,
  comparisonSnapshotId,
}: Props) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [isOverallHovered, setIsOverallHovered] = useState(false);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);

  const size = 600;
  const cx = size / 2;
  const cy = size / 2;

  const SCORE_MIN = 60;
  const SCORE_MAX = 150;
  const SCORE_MEAN = 100;

  const scoreRings = [60, 70, 85, 100, 115, 130, 150];

  const baseInner = 0;
  const maxRadius = 240;

  // Fetch snapshot data when comparisonSnapshotId changes
  useEffect(() => {
    if (!comparisonSnapshotId) {
      setSnapshotData(null);
      return;
    }

    async function fetchSnapshot() {
      try {
        const res = await fetch(`/api/snapshots/${comparisonSnapshotId}`);
        if (!res.ok) throw new Error('Failed to fetch snapshot');
        const data = await res.json();
        setSnapshotData(data);
      } catch (error) {
        console.error('Error fetching snapshot:', error);
        setSnapshotData(null);
      }
    }

    fetchSnapshot();
  }, [comparisonSnapshotId]);

  function scoreToRadius(score: number): number {
    const clamped = clampScore(score);
    const t = (clamped - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
    return baseInner + t * maxRadius;
  }

  function polarPoint(r: number, angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  const overallScore = useMemo(() => {
    if (evaluation.students.length === 1 && evaluation.students[0].overallScore) {
      return evaluation.students[0].overallScore;
    }
    if (evaluation.categories.length > 0) {
      const sum = evaluation.categories.reduce((acc, cat) => acc + cat.score, 0);
      return sum / evaluation.categories.length;
    }
    return SCORE_MEAN;
  }, [evaluation]);

  // Get snapshot overall score
  const snapshotOverallScore = useMemo(() => {
    if (!snapshotData || snapshotData.scores.length === 0) return null;
    return snapshotData.scores[0].overallScore;
  }, [snapshotData]);

  const categories = evaluation.categories;
  const numCategories = Math.max(categories.length, 1);
  const anglePer = (2 * Math.PI) / numCategories;

  const categoryWedges = useMemo(() => {
    return categories.map((cat, idx) => {
      const angleStart = idx * anglePer - Math.PI / 2;
      const angleEnd = (idx + 1) * anglePer - Math.PI / 2;
      const mid = (angleStart + angleEnd) / 2;

      const r = scoreToRadius(cat.score);
      const innerR = baseInner + 10;

      const startOuter = polarPoint(r, angleStart);
      const endOuter = polarPoint(r, angleEnd);
      const startInner = polarPoint(innerR, angleStart);
      const endInner = polarPoint(innerR, angleEnd);

      const largeArc = angleEnd - angleStart > Math.PI ? 1 : 0;

      const path = [
        'M',
        startInner.x,
        startInner.y,
        'L',
        startOuter.x,
        startOuter.y,
        'A',
        r,
        r,
        0,
        largeArc,
        1,
        endOuter.x,
        endOuter.y,
        'L',
        endInner.x,
        endInner.y,
        'A',
        innerR,
        innerR,
        0,
        largeArc,
        0,
        startInner.x,
        startInner.y,
        'Z',
      ].join(' ');

      const labelRadius = maxRadius + 45;
      const labelPoint = polarPoint(labelRadius, mid);

      // Get snapshot score for this category
      const snapshotCategoryScores =
        snapshotData?.scores.filter((s) => s.categoryId === cat.id && s.subcategoryId === null) ||
        [];
      const snapshotCategoryScore =
        snapshotCategoryScores.length > 0 ? snapshotCategoryScores[0].standardScore : null;

      const subcategories = cat.subcategories || [];

      // Add bookend points at category overall score
      const categoryOverallR = scoreToRadius(cat.score);
      const subcategoryPoints: SubcategoryPoint[] = [
        // Start bookend at category overall score
        {
          id: `${cat.id}-start-bookend`,
          x: polarPoint(categoryOverallR, angleStart).x,
          y: polarPoint(categoryOverallR, angleStart).y,
          angle: angleStart,
          isBookend: true,
          snapshotScore: snapshotCategoryScore,
        },
        // Actual subcategories distributed evenly between bookends
        ...subcategories.map((sub, subIdx) => {
          const subAngleFraction =
            subcategories.length === 1 ? 0.5 : (subIdx + 1) / (subcategories.length + 1);
          const subAngle = angleStart + subAngleFraction * (angleEnd - angleStart);

          const subR = scoreToRadius(sub.score);
          const point = polarPoint(subR, subAngle);

          const snapshotSubScore =
            snapshotData?.scores.find((s) => s.categoryId === cat.id && s.subcategoryId === sub.id)
              ?.standardScore || null;

          return {
            id: sub.id,
            name: sub.name,
            score: sub.score,
            snapshotScore: snapshotSubScore,
            x: point.x,
            y: point.y,
            angle: subAngle,
            firstLetter: sub.name.charAt(0).toUpperCase(),
            isBookend: false,
          };
        }),
        // End bookend at category overall score
        {
          id: `${cat.id}-end-bookend`,
          x: polarPoint(categoryOverallR, angleEnd).x,
          y: polarPoint(categoryOverallR, angleEnd).y,
          angle: angleEnd,
          isBookend: true,
          snapshotScore: snapshotCategoryScore,
        },
      ];

      return {
        id: cat.id,
        name: cat.name,
        score: cat.score,
        snapshotScore: snapshotCategoryScore,
        path,
        angleStart,
        angleEnd,
        mid,
        labelPoint,
        subcategories: subcategoryPoints,
        color: getCategoryColor(idx),
      };
    });
  }, [categories, anglePer, maxRadius, snapshotData]);

  const drillCategory = drillCategoryId
    ? categoryWedges.find((c) => c.id === drillCategoryId)
    : null;

  function handleDrillToggle(id: string) {
    setDrillCategoryId((prev) => (prev === id ? null : id));
    setSelectedItem(null);
  }

  function radialRingPath(
    cx: number,
    cy: number,
    rInner: number,
    rOuter: number,
    angleStart: number,
    angleEnd: number
  ): string {
    const largeArc = angleEnd - angleStart > Math.PI ? 1 : 0;
    const startOuter = polarPoint(rOuter, angleStart);
    const endOuter = polarPoint(rOuter, angleEnd);
    const startInner = polarPoint(rInner, angleEnd);
    const endInner = polarPoint(rInner, angleStart);

    return [
      'M',
      startOuter.x,
      startOuter.y,
      'A',
      rOuter,
      rOuter,
      0,
      largeArc,
      1,
      endOuter.x,
      endOuter.y,
      'L',
      startInner.x,
      startInner.y,
      'A',
      rInner,
      rInner,
      0,
      largeArc,
      0,
      endInner.x,
      endInner.y,
      'Z',
    ].join(' ');
  }

  return (
    <div className="flex h-full w-full rounded-2xl border border-slate-800/50 bg-slate-950/70 shadow-[0_20px_50px_rgba(8,_47,_73,_0.7)] relative overflow-hidden">
      {/* Main Chart Area - Full width container */}
      <div className="flex-1 flex flex-col relative">
        {/* SVG Container - centered with padding */}
        <div className="flex-1 flex items-center justify-center p-8">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${size} ${size}`}
            className="h-full w-full"
            style={{ maxHeight: '600px', maxWidth: '600px' }}
          >
            <defs>
              <radialGradient id="polar-bg" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.15" />
                <stop offset="70%" stopColor="#020617" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </radialGradient>

              <filter id="wedge-glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect x={0} y={0} width={size} height={size} fill="url(#polar-bg)" opacity={0.9} />

            {/* Score rings */}
            {scoreRings.map((score) => {
              const r = scoreToRadius(score);
              return (
                <g key={score}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    className="fill-none stroke-slate-700/40"
                    strokeWidth={score === SCORE_MEAN ? 1.2 : 0.6}
                    strokeDasharray={score === SCORE_MEAN ? 'none' : '3 5'}
                    opacity={score === SCORE_MEAN ? 0.8 : 0.5}
                  />
                  <text
                    x={cx + r + 8}
                    y={cy}
                    className={
                      score === SCORE_MEAN
                        ? 'fill-slate-300 text-[10px] font-medium'
                        : 'fill-slate-600 text-[9px]'
                    }
                    textAnchor="start"
                    alignmentBaseline="middle"
                  >
                    {score}
                  </text>
                </g>
              );
            })}

            {/* DRILL MODE - Single expanded wedge */}
            {drillCategory ? (
              <g>
                {(() => {
                  const angleSpan = (160 * Math.PI) / 180;
                  const angleStart = -Math.PI / 2 - angleSpan / 2;
                  const angleEnd = -Math.PI / 2 + angleSpan / 2;
                  const mid = -Math.PI / 2;

                  const rOuter = scoreToRadius(drillCategory.score);
                  const rInner = baseInner + 10;

                  const path = radialRingPath(cx, cy, rInner, rOuter, angleStart, angleEnd);

                  const labelPoint = polarPoint(maxRadius + 45, mid);

                  // Snapshot comparison wedge
                  const snapshotPath = drillCategory.snapshotScore
                    ? radialRingPath(
                        cx,
                        cy,
                        rInner,
                        scoreToRadius(drillCategory.snapshotScore),
                        angleStart,
                        angleEnd
                      )
                    : null;

                  return (
                    <>
                      {/* Snapshot wedge (baseline) */}
                      {snapshotPath && (
                        <path
                          d={snapshotPath}
                          fill="rgba(148,163,184,0.2)"
                          stroke="rgba(148,163,184,0.6)"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          opacity={0.7}
                        />
                      )}

                      {/* Current wedge */}
                      <path
                        d={path}
                        fill={drillCategory.color.fill}
                        stroke={drillCategory.color.stroke}
                        strokeWidth={2}
                        filter="url(#wedge-glow)"
                        opacity={0.9}
                      />

                      {/* Label */}
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y}
                        className="fill-slate-100 text-[12px] font-semibold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {drillCategory.name}
                      </text>

                      {/* Score badges */}
                      <g
                        transform={`translate(${cx + Math.cos(mid) * (rOuter + 22)},${
                          cy + Math.sin(mid) * (rOuter + 22)
                        })`}
                      >
                        <rect
                          x={-18}
                          y={-10}
                          width={36}
                          height={20}
                          rx={10}
                          className="fill-slate-950/90"
                          stroke={drillCategory.color.stroke}
                          strokeWidth={1}
                        />
                        <text
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          className="fill-slate-100 text-[10px] font-semibold"
                        >
                          {Math.round(drillCategory.score)}
                        </text>
                      </g>

                      {/* Snapshot score badge */}
                      {drillCategory.snapshotScore && (
                        <g
                          transform={`translate(${
                            cx + Math.cos(mid) * (scoreToRadius(drillCategory.snapshotScore) + 22)
                          },${cy + Math.sin(mid) * (scoreToRadius(drillCategory.snapshotScore) + 22)})`}
                        >
                          <rect
                            x={-18}
                            y={-10}
                            width={36}
                            height={20}
                            rx={10}
                            className="fill-slate-950/90"
                            stroke="rgba(148,163,184,0.6)"
                            strokeWidth={1}
                          />
                          <text
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="fill-slate-400 text-[10px] font-semibold"
                          >
                            {Math.round(drillCategory.snapshotScore)}
                          </text>
                        </g>
                      )}

                      {/* Subcategory polygon and points */}
                      {drillCategory.subcategories.length > 0 &&
                        (() => {
                          type DrillPoint = {
                            id: string;
                            x: number;
                            y: number;
                            angle: number;
                            snapshotPoint: { x: number; y: number } | null;
                            isBookend: boolean;
                            name?: string;
                            score?: number;
                            snapshotScore?: number | null;
                            firstLetter?: string;
                          };

                          // Get non-bookend subcategories
                          const actualSubcategories = drillCategory.subcategories.filter(
                            (sub) => !sub.isBookend
                          );

                          // Recalculate positions for expanded drill view
                          const categoryOverallR = scoreToRadius(drillCategory.score);
                          const redistributed: DrillPoint[] = [
                            // Start bookend
                            {
                              id: `${drillCategory.id}-drill-start`,
                              x: polarPoint(categoryOverallR, angleStart).x,
                              y: polarPoint(categoryOverallR, angleStart).y,
                              angle: angleStart,
                              isBookend: true,
                              snapshotScore: drillCategory.snapshotScore,
                              snapshotPoint: drillCategory.snapshotScore
                                ? polarPoint(scoreToRadius(drillCategory.snapshotScore), angleStart)
                                : null,
                            },
                            // Actual subcategories redistributed in expanded view
                            ...actualSubcategories.map((sub, idx) => {
                              const subAngleFraction =
                                actualSubcategories.length === 1
                                  ? 0.5
                                  : (idx + 1) / (actualSubcategories.length + 1);
                              const subAngle =
                                angleStart + subAngleFraction * (angleEnd - angleStart);
                              const subR = scoreToRadius(sub.score || 100);
                              const point = polarPoint(subR, subAngle);

                              const snapshotPoint = sub.snapshotScore
                                ? polarPoint(scoreToRadius(sub.snapshotScore), subAngle)
                                : null;

                              return {
                                id: sub.id,
                                x: point.x,
                                y: point.y,
                                angle: subAngle,
                                snapshotPoint,
                                isBookend: false,
                                name: sub.name,
                                score: sub.score,
                                snapshotScore: sub.snapshotScore,
                                firstLetter: sub.firstLetter,
                              };
                            }),
                            // End bookend
                            {
                              id: `${drillCategory.id}-drill-end`,
                              x: polarPoint(categoryOverallR, angleEnd).x,
                              y: polarPoint(categoryOverallR, angleEnd).y,
                              angle: angleEnd,
                              isBookend: true,
                              snapshotScore: drillCategory.snapshotScore,
                              snapshotPoint: drillCategory.snapshotScore
                                ? polarPoint(scoreToRadius(drillCategory.snapshotScore), angleEnd)
                                : null,
                            },
                          ];

                          return (
                            <>
                              {/* Snapshot baseline polyline */}
                              {comparisonSnapshotId && (
                                <polyline
                                  points={redistributed
                                    .filter((s) => s.snapshotPoint)
                                    .map((s) => `${s.snapshotPoint!.x},${s.snapshotPoint!.y}`)
                                    .join(' ')}
                                  stroke="rgba(148,163,184,0.5)"
                                  strokeWidth={2}
                                  fill="none"
                                  strokeDasharray="4 4"
                                />
                              )}

                              {/* Current polyline */}
                              <polyline
                                points={redistributed.map((s) => `${s.x},${s.y}`).join(' ')}
                                stroke="rgba(139,92,246,0.6)"
                                strokeWidth={2}
                                fill="none"
                                strokeDasharray="4 4"
                              />

                              {/* Snapshot points */}
                              {comparisonSnapshotId &&
                                redistributed.map(
                                  (sub) =>
                                    sub.snapshotPoint && (
                                      <circle
                                        key={`snapshot-${sub.id}`}
                                        cx={sub.snapshotPoint.x}
                                        cy={sub.snapshotPoint.y}
                                        r={3.5}
                                        className="fill-slate-400"
                                        stroke="rgba(148,163,184,0.7)"
                                        strokeWidth={1.5}
                                        opacity={0.6}
                                      />
                                    )
                                )}

                              {/* Current points */}
                              {redistributed.map((sub) => (
                                <g key={sub.id}>
                                  <circle
                                    cx={sub.x}
                                    cy={sub.y}
                                    r={sub.isBookend ? 3 : 4.5}
                                    className={
                                      sub.isBookend
                                        ? 'fill-slate-600 stroke-slate-700'
                                        : 'fill-violet-400 cursor-pointer stroke-rgba(167,139,250,0.8)'
                                    }
                                    strokeWidth={1.5}
                                    style={
                                      sub.isBookend
                                        ? {}
                                        : { filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.6))' }
                                    }
                                    {...(!sub.isBookend &&
                                      sub.name &&
                                      sub.score !== undefined && {
                                        onClick: () =>
                                          setSelectedItem({
                                            type: 'subcategory',
                                            name: sub.name!,
                                            score: sub.score!,
                                            snapshotScore: sub.snapshotScore || undefined,
                                            categoryName: drillCategory.name,
                                            categoryId: drillCategory.id,
                                            subcategoryId: sub.id,
                                          }),
                                      })}
                                  />
                                  {/* Only show labels for actual tests, not bookends */}
                                  {!sub.isBookend && sub.name && (
                                    <text
                                      x={sub.x + Math.cos(sub.angle) * 22}
                                      y={sub.y + Math.sin(sub.angle) * 22}
                                      className="fill-slate-300 text-[9px] font-medium pointer-events-none"
                                      textAnchor="middle"
                                      alignmentBaseline="middle"
                                    >
                                      {showFullNames ? sub.name : sub.firstLetter}
                                    </text>
                                  )}
                                </g>
                              ))}
                            </>
                          );
                        })()}

                      {/* Back to all categories button - in graph */}
                      <g
                        transform="translate(50, 50)"
                        className="cursor-pointer"
                        onClick={() => setDrillCategoryId(null)}
                      >
                        <rect
                          x={0}
                          y={0}
                          width={140}
                          height={32}
                          rx={6}  // slight rounding, not big pill
                          className="fill-slate-900/90"
                          stroke="rgba(148,163,184,0.3)"
                          strokeWidth={1}
                        />
                        <text
                          x={70}  // center of width 140
                          y={16}  // vertical middle of height 32
                          className="fill-slate-300 text-[11px] font-medium"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          ← All Categories
                        </text>
                      </g>
                    </>
                  );
                })()}
              </g>
            ) : (
              /* NORMAL MODE - All wedges */
              <>
                {categoryWedges.map((wedge) => (
                  <g key={wedge.id}>
                    {/* Snapshot wedge (baseline) */}
                    {wedge.snapshotScore &&
                      (() => {
                        const r = scoreToRadius(wedge.snapshotScore);
                        const innerR = baseInner + 10;
                        const snapshotPath = radialRingPath(
                          cx,
                          cy,
                          innerR,
                          r,
                          wedge.angleStart,
                          wedge.angleEnd
                        );

                        return (
                          <path
                            d={snapshotPath}
                            fill="rgba(148,163,184,0.15)"
                            stroke="rgba(148,163,184,0.5)"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            opacity={0.6}
                          />
                        );
                      })()}

                    {/* Current wedge */}
                    <path
                      d={wedge.path}
                      fill={wedge.color.fill}
                      stroke={wedge.color.stroke}
                      strokeWidth={1.2}
                      opacity={0.85}
                      filter="url(#wedge-glow)"
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                      onClick={() => handleDrillToggle(wedge.id)}
                    />

                    {/* Boundary lines */}
                    <line
                      x1={cx}
                      y1={cy}
                      x2={polarPoint(maxRadius + 30, wedge.angleStart).x}
                      y2={polarPoint(maxRadius + 30, wedge.angleStart).y}
                      className="stroke-slate-700/30 pointer-events-none"
                      strokeWidth={0.6}
                    />

                    {/* Label */}
                    <text
                      x={wedge.labelPoint.x}
                      y={wedge.labelPoint.y}
                      className="fill-slate-200 text-[10px] font-semibold pointer-events-none"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {wedge.name}
                    </text>

                    {/* Snapshot category score dot */}
                    {wedge.snapshotScore && (
                      <circle
                        cx={polarPoint(scoreToRadius(wedge.snapshotScore), wedge.mid).x}
                        cy={polarPoint(scoreToRadius(wedge.snapshotScore), wedge.mid).y}
                        r={3.5}
                        fill="rgba(148,163,184,0.6)"
                        stroke="rgba(148,163,184,0.8)"
                        strokeWidth={1.2}
                        opacity={0.7}
                      />
                    )}

                    {/* Current category score dot */}
                    <circle
                      cx={polarPoint(scoreToRadius(wedge.score), wedge.mid).x}
                      cy={polarPoint(scoreToRadius(wedge.score), wedge.mid).y}
                      r={4.5}
                      fill={wedge.color.stroke}
                      stroke="rgba(248,250,252,0.6)"
                      strokeWidth={1.5}
                      className="cursor-pointer"
                      style={{ filter: `drop-shadow(0 0 4px ${wedge.color.stroke})` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem({
                          type: 'category',
                          name: wedge.name,
                          score: wedge.score,
                          snapshotScore: wedge.snapshotScore || undefined,
                          categoryId: wedge.id,
                        });
                      }}
                    />

                    {/* Subcategory polygon */}
                    {wedge.subcategories.length > 0 && (
                      <>
                        {/* Snapshot subcategory polyline */}
                        {comparisonSnapshotId && wedge.subcategories.some((s) => s.snapshotScore) && (
                          <polyline
                            points={wedge.subcategories
                              .filter((sub) => sub.snapshotScore)
                              .map((sub) => {
                                const pt = polarPoint(
                                  scoreToRadius(sub.snapshotScore!),
                                  sub.angle
                                );
                                return `${pt.x},${pt.y}`;
                              })
                              .join(' ')}
                            stroke="rgba(148,163,184,0.4)"
                            strokeWidth={1.2}
                            fill="none"
                            strokeDasharray="3 3"
                            className="pointer-events-none"
                          />
                        )}

                        {/* Current subcategory polyline */}
                        <polyline
                          points={wedge.subcategories.map((sub) => `${sub.x},${sub.y}`).join(' ')}
                          stroke="rgba(139,92,246,0.5)"
                          strokeWidth={1.5}
                          fill="none"
                          strokeDasharray="3 3"
                          className="pointer-events-none"
                        />

                        {/* Snapshot subcategory dots */}
                        {comparisonSnapshotId &&
                          wedge.subcategories.map(
                            (sub) =>
                              sub.snapshotScore && (
                                <circle
                                  key={`snapshot-${sub.id}`}
                                  cx={polarPoint(scoreToRadius(sub.snapshotScore), sub.angle).x}
                                  cy={polarPoint(scoreToRadius(sub.snapshotScore), sub.angle).y}
                                  r={2.5}
                                  className="fill-slate-400"
                                  stroke="rgba(148,163,184,0.7)"
                                  strokeWidth={1}
                                  opacity={0.6}
                                />
                              )
                          )}

                        {/* Current subcategory dots */}
                        {wedge.subcategories.map((sub) => (
                          <g key={sub.id}>
                            <circle
                              cx={sub.x}
                              cy={sub.y}
                              r={sub.isBookend ? 2.5 : 3.5}
                              className={
                                sub.isBookend
                                  ? 'fill-slate-600 stroke-slate-700'
                                  : 'fill-violet-400 cursor-pointer stroke-rgba(167,139,250,0.7)'
                              }
                              strokeWidth={sub.isBookend ? 1 : 1.2}
                              style={
                                sub.isBookend
                                  ? {}
                                  : { filter: 'drop-shadow(0 0 3px rgba(167,139,250,0.5))' }
                              }
                              {...(!sub.isBookend &&
                                sub.name &&
                                sub.score !== undefined && {
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    setSelectedItem({
                                      type: 'subcategory',
                                      name: sub.name!,
                                      score: sub.score!,
                                      snapshotScore: sub.snapshotScore || undefined,
                                      categoryName: wedge.name,
                                      categoryId: wedge.id,
                                      subcategoryId: sub.id,
                                    });
                                  },
                                })}
                            />

                            {/* Only show labels for actual tests, not bookends */}
                            {!sub.isBookend && sub.name && (
                              <text
                                x={sub.x + Math.cos(sub.angle) * 18}
                                y={sub.y + Math.sin(sub.angle) * 18}
                                className="fill-slate-400 text-[8px] font-medium pointer-events-none"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                              >
                                {showFullNames ? sub.name : sub.firstLetter}
                              </text>
                            )}
                          </g>
                        ))}
                      </>
                    )}
                  </g>
                ))}
              </>
            )}

            {/* Snapshot Overall Score Circle */}
            {comparisonSnapshotId && snapshotOverallScore && (
              <circle
                cx={cx}
                cy={cy}
                r={scoreToRadius(snapshotOverallScore)}
                className="fill-none stroke-slate-400"
                strokeWidth={2}
                opacity={0.5}
                strokeDasharray="6 4"
              />
            )}

            {/* Current Overall Score Circle - YELLOW HIGHLIGHT ON HOVER */}
            <circle
              cx={cx}
              cy={cy}
              r={scoreToRadius(overallScore)}
              className={`fill-none cursor-pointer transition-all ${
                isOverallHovered ? 'stroke-yellow-400' : 'stroke-slate-400'
              }`}
              strokeWidth={isOverallHovered ? 3 : 2}
              opacity={isOverallHovered ? 1 : 0.6}
              strokeDasharray="6 4"
              style={
                isOverallHovered ? { filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))' } : {}
              }
              onClick={() =>
                setSelectedItem({
                  type: 'overall',
                  name: 'Overall Score',
                  score: overallScore,
                  snapshotScore: snapshotOverallScore || undefined,
                })
              }
              onMouseEnter={() => setIsOverallHovered(true)}
              onMouseLeave={() => setIsOverallHovered(false)}
            />

            {/* Center origin */}
            <circle
              cx={cx}
              cy={cy}
              r={5}
              className="fill-sky-500"
              style={{ filter: 'drop-shadow(0 0 6px rgba(14,165,233,0.7))' }}
            />

            {/* Overall text - ONLY SHOW WHEN showFullNames is true */}
            {showFullNames && (
              <>
                <text
                  x={cx}
                  y={cy + 22}
                  className="fill-slate-300 text-[10px] font-semibold pointer-events-none"
                  textAnchor="middle"
                >
                  Current: {Math.round(overallScore)}
                </text>
                {comparisonSnapshotId && snapshotOverallScore && (
                  <text
                    x={cx}
                    y={cy + 34}
                    className="fill-slate-500 text-[9px] font-medium pointer-events-none"
                    textAnchor="middle"
                  >
                    Before: {Math.round(snapshotOverallScore)}
                  </text>
                )}
              </>
            )}
          </svg>
        </div>

        {/* Controls at bottom left */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <button
            onClick={onToggleNames}
            className="px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/90 backdrop-blur-sm text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-all text-xs font-medium"
          >
            {showFullNames ? 'First Letter' : 'Full Names'}
          </button>

          <button
            onClick={onExpand}
            className="px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/90 backdrop-blur-sm text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-all text-xs font-medium flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Expand
          </button>
        </div>
      </div>

      {/* Modern Side Panel */}
      {selectedItem && (
        <div className="w-80 border-l border-slate-800/50 bg-gradient-to-br from-slate-900/98 via-slate-950/98 to-slate-900/98 backdrop-blur-xl flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-800/40">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/40 border border-slate-700/30 mb-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedItem.type === 'overall'
                      ? 'bg-slate-400'
                      : selectedItem.type === 'category'
                      ? 'bg-sky-400'
                      : 'bg-violet-400'
                  }`}
                />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                  {selectedItem.type}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-50 mb-0.5 leading-tight">
                {selectedItem.name}
              </h3>

              {selectedItem.categoryName && (
                <p className="text-xs text-slate-500 mt-1">in {selectedItem.categoryName}</p>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-800/40 rounded-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Score Display */}
          <div className="p-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-violet-500/5 to-blue-500/5 rounded-xl blur-2xl" />
              <div className="relative rounded-xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-5 text-center">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">
                  {comparisonSnapshotId && selectedItem.snapshotScore
                    ? 'Current Score'
                    : 'Standard Score'}
                </div>
                <div className="text-5xl font-bold bg-gradient-to-br from-slate-100 to-slate-300 bg-clip-text text-transparent mb-3">
                  {Math.round(selectedItem.score)}
                </div>

                {/* Comparison delta */}
                {comparisonSnapshotId && selectedItem.snapshotScore && (
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/50 mb-2">
                    <span className="text-xs text-slate-500">Previous:</span>
                    <span className="text-sm font-semibold text-slate-400">
                      {Math.round(selectedItem.snapshotScore)}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        selectedItem.score > selectedItem.snapshotScore
                          ? 'text-emerald-400'
                          : selectedItem.score < selectedItem.snapshotScore
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedItem.score > selectedItem.snapshotScore && '+'}
                      {Math.round(selectedItem.score - selectedItem.snapshotScore)}
                    </span>
                  </div>
                )}

                {/* Performance indicator */}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/50">
                  {selectedItem.score >= 115 && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Above Average</span>
                    </>
                  )}
                  {selectedItem.score >= 85 && selectedItem.score < 115 && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-xs text-blue-400 font-medium">Average Range</span>
                    </>
                  )}
                  {selectedItem.score < 85 && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Below Average</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="text-xs text-slate-500 font-medium">Percentile</span>
                <span className="text-sm font-semibold text-slate-200">
                  {selectedItem.score >= 130
                    ? '~98th'
                    : selectedItem.score >= 115
                    ? '~84th'
                    : selectedItem.score >= 100
                    ? '~50th'
                    : selectedItem.score >= 85
                    ? '~16th'
                    : '~2nd'}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="text-xs text-slate-500 font-medium">Classification</span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedItem.score >= 130
                    ? 'Very Superior'
                    : selectedItem.score >= 120
                    ? 'Superior'
                    : selectedItem.score >= 110
                    ? 'High Average'
                    : selectedItem.score >= 90
                    ? 'Average'
                    : selectedItem.score >= 80
                    ? 'Low Average'
                    : selectedItem.score >= 70
                    ? 'Borderline'
                    : 'Extremely Low'}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="text-xs text-slate-500 font-medium">Standard Deviation</span>
                <span className="text-sm font-semibold text-slate-200">
                  {selectedItem.score >= 130
                    ? '+2σ'
                    : selectedItem.score >= 115
                    ? '+1σ'
                    : selectedItem.score >= 85
                    ? '0σ'
                    : selectedItem.score >= 70
                    ? '−1σ'
                    : '−2σ'}
                </span>
              </div>

              {/* Regular Score (deviation from 100) */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="text-xs text-slate-500 font-medium">Regular Score</span>
                <span
                  className={`text-sm font-semibold ${
                    selectedItem.score >= 100 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {selectedItem.score >= 100
                    ? `+${Math.round(selectedItem.score - 100)}`
                    : Math.round(selectedItem.score - 100)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(index: number): { fill: string; stroke: string } {
  const colors = [
    { fill: 'rgba(56,189,248,0.2)', stroke: 'rgba(56,189,248,0.8)' },
    { fill: 'rgba(99,102,241,0.2)', stroke: 'rgba(99,102,241,0.8)' },
    { fill: 'rgba(52,211,153,0.2)', stroke: 'rgba(52,211,153,0.8)' },
    { fill: 'rgba(251,146,60,0.2)', stroke: 'rgba(251,146,60,0.8)' },
    { fill: 'rgba(139,92,246,0.2)', stroke: 'rgba(139,92,246,0.8)' },
    { fill: 'rgba(236,72,153,0.2)', stroke: 'rgba(236,72,153,0.8)' },
    { fill: 'rgba(34,197,94,0.2)', stroke: 'rgba(34,197,94,0.8)' },
    { fill: 'rgba(20,184,166,0.2)', stroke: 'rgba(20,184,166,0.8)' },
  ];
  return colors[index % colors.length];
}
