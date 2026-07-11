"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ClassScoreSummary } from "@/types/scores";
import { motion } from "motion/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Props {
  evaluation: ClassScoreSummary;
}

export function EditScoresPsychClient({ evaluation }: Props) {
  const router = useRouter();
  const student = evaluation.students[0];

  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    
    if (student?.overallScore != null) {
      init["overall"] = String(student.overallScore);
    }
    
    evaluation.categories.forEach((cat) => {
      init[`cat_${cat.id}`] = String(cat.score);
      cat.subcategories?.forEach((sub) => {
        init[`sub_${sub.id}`] = String(sub.score);
      });
    });
    
    return init;
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  function updateScore(key: string, value: string) {
    setScores((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("idle");
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      const studentId = student.id;

      // Save category scores
      for (const cat of evaluation.categories) {
        const key = `cat_${cat.id}`;
        const rawValue = scores[key];
        const numValue = rawValue ? parseInt(rawValue, 10) : null;
        
        if (numValue != null && !isNaN(numValue)) {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              categoryId: cat.id,
              subcategoryId: null,
              standardScore: numValue,
            }),
          });
        }
      }

      // Save subcategory scores
      for (const cat of evaluation.categories) {
        for (const sub of cat.subcategories || []) {
          const key = `sub_${sub.id}`;
          const rawValue = scores[key];
          const numValue = rawValue ? parseInt(rawValue, 10) : null;
          
          if (numValue != null && !isNaN(numValue)) {
            await fetch("/api/scores", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId,
                categoryId: cat.id,
                subcategoryId: sub.id,
                standardScore: numValue,
              }),
            });
          }
        }
      }

      // Save overall score
      const overallRaw = scores["overall"];
      const overallNum = overallRaw ? parseInt(overallRaw, 10) : null;
      if (overallNum != null && !isNaN(overallNum)) {
        await fetch("/api/studentOverall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            overallScore: overallNum,
          }),
        });
      }

      setSaveStatus("saved");
      router.refresh();
      
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to save scores:", error);
      alert("Failed to save scores. Please try again.");
      setSaveStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <form onSubmit={handleSave} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Edit Scores</h1>
                <p className="text-sm text-muted-foreground">{student?.name}</p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2"
            >
              {saveStatus === "saving" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <Card className="p-6">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Overall Standard Score
            </label>
            <Input
              type="number"
              min={60}
              max={150}
              value={scores["overall"] || ""}
              onChange={(e) => updateScore("overall", e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.currentTarget.select()}
              placeholder="100"
              className="max-w-xs font-mono"
              data-numeric
            />
          </Card>

          {/* Categories */}
          {evaluation.categories.map((cat, index) => {
            const isExpanded = expandedCategories.has(cat.id);
            const subcategories = cat.subcategories || [];
            const hasSubcategories = subcategories.length > 0;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
              >
                <Card className="overflow-hidden">
                  {/* Category Header - Clickable */}
                  <button
                    type="button"
                    onClick={() => hasSubcategories && toggleCategory(cat.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-accent/40 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground">{cat.name}</h3>
                      {hasSubcategories && (
                        <span className="text-xs text-muted-foreground">
                          ({subcategories.length} subcategories)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted-foreground">Score:</label>
                      <Input
                        type="number"
                        min={60}
                        max={150}
                        value={scores[`cat_${cat.id}`] || ""}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateScore(`cat_${cat.id}`, e.target.value);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.currentTarget.select();
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="100"
                        className="w-24 font-mono"
                        data-numeric
                      />
                      {hasSubcategories && (
                        <svg
                          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Subcategories - Only show when expanded */}
                  {isExpanded && hasSubcategories && (
                    <div className="border-t border-border bg-muted/40 p-6">
                      <div className="grid grid-cols-3 gap-4">
                        {subcategories.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-3">
                            <label className="text-sm text-foreground flex-1">
                              {sub.name}
                            </label>
                            <Input
                              type="number"
                              min={60}
                              max={150}
                              value={scores[`sub_${sub.id}`] || ""}
                              onChange={(e) => updateScore(`sub_${sub.id}`, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => e.currentTarget.select()}
                              placeholder="100"
                              className="w-20 font-mono"
                              data-numeric
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </form>
    </div>
  );
}
