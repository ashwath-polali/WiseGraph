/**
 * Shared color language for the class charts.
 *
 * Wedges rotate through the categorical chart tokens with clay LAST, so the
 * common 4-category class leaves terracotta free to mean "the focused
 * student" in compare mode. All values are CSS vars, so dark mode and export
 * both resolve them from the active theme.
 */
export const WEDGE_COLORS = [
  "var(--chart-1)", // indigo
  "var(--chart-2)", // moss
  "var(--chart-3)", // ochre
  "var(--chart-5)", // slate blue
  "var(--chart-4)", // clay
] as const;

export function wedgeColor(i: number): string {
  return WEDGE_COLORS[i % WEDGE_COLORS.length];
}

/** Series encodings shared by the radial and bell views. */
export const SERIES = {
  /** The selected student — lines, markers, labels in compare mode. */
  student: "var(--chart-4)",
  /** One student × one category (dots view). */
  category: "var(--chart-2)",
  /** One student × one subskill (dots view + faint class subskill means). */
  subskill: "var(--chart-6)",
  /** Class-average subskill line inside a wedge. */
  classLine: "var(--muted-foreground)",
} as const;
