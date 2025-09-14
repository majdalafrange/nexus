import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

type FieldKey = "budget_status" | "decision_maker" | "tasks" | "next_meeting" | "stage";

type SourceType = "crm" | "email" | "bookmark" | "debrief" | "llm";

interface SourceSpan {
  type: SourceType;
  value: any;
  timestamp: string;
  evidence?: string;
}

const PRIORS: Record<SourceType, number> = {
  debrief: 0.40,
  email: 0.30,
  llm: 0.25,     // advisory; lower than explicit debrief
  bookmark: 0.20,
  crm: 0.10
};

export function blastRuleForField(field: FieldKey): { level: "low"|"medium"|"high", threshold: number } {
  if (field === "tasks") return { level: "low", threshold: 0.80 };
  if (field === "budget_status" || field === "next_meeting" || field === "stage") return { level: "medium", threshold: 0.80 };
  if (field === "decision_maker") return { level: "high", threshold: 0.90 };
  return { level: "medium", threshold: 0.80 };
}

function recencyWeight(iso: string) {
  const ageDays = Math.max(0, DateTime.now().diff(DateTime.fromISO(iso)).as("days"));
  return Math.pow(0.5, ageDays / 45.0); // true 45-day half-life
}

export function resolveConflicts(field: FieldKey, spans: SourceSpan[]) {
  // Aggregate per candidate value
  const grouped = new Map<string, { score: number, sources: SourceSpan[] }>();
  for (const s of spans) {
    const key = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
    const inc = recencyWeight(s.timestamp) * PRIORS[s.type];
    if (!grouped.has(key)) grouped.set(key, { score: 0, sources: [] });
    const g = grouped.get(key)!;
    g.score += inc;
    g.sources.push(s);
  }

  // Agreement boost if ≥2 recent (≤30d) non-LLM sources match
  const beta = 0.10;
  for (const [key, g] of grouped) {
    const recent = g.sources.filter(s =>
      s.type !== "llm" &&
      DateTime.now().diff(DateTime.fromISO(s.timestamp)).as("days") <= 30
    ).length;
    if (recent >= 2) g.score += beta;
    // cap
    g.score = Math.min(1, g.score);
  }

  // Choose best
  let bestKey = "";
  let best = { score: -1, sources: [] as SourceSpan[] };
  for (const [k, v] of grouped) {
    if (v.score > (best as any).score) { bestKey = k; best = v as any; }
  }

  // Decision
  const rule = blastRuleForField(field);
  let status: "auto_applied" | "staged" | "blocked" = "staged";
  if (best.score >= rule.threshold) {
    status = rule.level === "high" && best.score < 0.95 ? "staged" : "auto_applied";
  } else if (best.score < 0.50) {
    status = "blocked";
  }

  const proposed = (() => {
    try { return JSON.parse(bestKey); } catch { return bestKey; }
  })();

  return {
    id: uuid(),
    field,
    proposed,
    previous: null,
    confidence: Number(best.score.toFixed(2)),
    blast: rule.level,
    status,
    rule: `${rule.level}: auto ≥${rule.threshold.toFixed(2)}`,
    why: best.sources
  };
}
