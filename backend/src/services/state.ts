import fs from "fs/promises";
import path from "path";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import { parseStorytime, normalizeDate } from "./parser.js";
import { resolveConflicts, blastRuleForField } from "./resolver.js";
import { extractWithLLM } from "./llm.js";

const DATA_DIR = path.resolve(process.cwd(), "../data");

type SourceType = "crm" | "email" | "bookmark" | "debrief" | "llm";

type FieldKey = "budget_status" | "decision_maker" | "tasks" | "next_meeting" | "stage";

interface SourceSpan {
  type: SourceType;
  value: any;
  timestamp: string;
  evidence?: string;
}

interface Change {
  id: string;
  field: FieldKey;
  proposed: any;
  confidence: number;
  blast: "low" | "medium" | "high";
  status: "auto_applied" | "staged" | "blocked";
  rule: string;
  why: SourceSpan[];
  autoApplyAt?: string | null;
  appliedAt?: string | null;
  previous?: any;
}

let state: any = {
  onePager: {} as any,
  proposed: [] as Change[],
  audit: [] as any[],
  builderLog: { words: 0 }
};

export async function loadDatasets() {
  // Load demo initial state for consistent demo experience
  try {
    const demoStateRaw = await fs.readFile(path.join(DATA_DIR, "demo-initial-state.json"), "utf-8");
    const demoState = JSON.parse(demoStateRaw);
    state = { ...demoState };
    console.log("🎭 Loaded demo initial state with pre-seeded conflicts");
    return;
  } catch (error) {
    console.log("⚠️ Demo state not found, loading regular datasets");
  }

  // Fallback to regular data loading
  const crmRaw = await fs.readFile(path.join(DATA_DIR, "crm.json"), "utf-8");
  const crm = JSON.parse(crmRaw);
  const emails = await fs.readFile(path.join(DATA_DIR, "emails.mbox"), "utf-8");
  const priorTranscript = await fs.readFile(path.join(DATA_DIR, "prior_transcript.txt"), "utf-8");
  state.onePager = {
    account: crm.account,
    timezone: crm.timezone,
    opportunity: crm.opportunity,
    sources: {
      crmUpdatedAt: DateTime.now().minus({ days: 90 }).toISO(),
      emailMbox: emails.length,
      priorTranscript
    }
  };
  // Seed visible conflicts
  await seedConflicts();
}

async function seedConflicts() {
  // Build three candidate sources for budget
  const now = DateTime.now();
  const sources: SourceSpan[] = [
    { type: "crm", value: "Approved", timestamp: now.minus({ days: 90 }).toISO(), evidence: "CRM field" },
    { type: "email", value: "Freeze", timestamp: now.minus({ days: 7 }).toISO(), evidence: "emails.mbox msg-1" },
  ];
  const decision = resolveConflicts("budget_status", sources);
  pushProposed(decision);
}

export function getState() {
  return state;
}

function pushProposed(change: Change) {
  // Apply auto if rule says so
  if (change.status === "auto_applied") {
    apply(change);
  } else {
    // stage sets auto-apply in 24h
    if (change.status === "staged") {
      change.autoApplyAt = DateTime.now().plus({ hours: 24 }).toISO();
    }
    state.proposed.unshift(change);
  }
}

function apply(change: Change) {
  // Handle both nested (onePager.opportunity) and flat (onePager) structures
  const opp = state.onePager.opportunity ?? state.onePager;
  const appliedAt = DateTime.now().toISO();

  // Ensure opp exists and has required structure
  if (!opp) {
    console.error("No onePager data found in state");
    return;
  }

  // Ensure opp has the required structure for tasks
  if (!opp.tasks && change.field === "tasks") {
    opp.tasks = [];
  }

  // capture previous BEFORE applying
  if (change.field === "tasks") {
    change.previous = null;
  } else if (change.field in opp) {
    change.previous = opp[change.field]?.value ?? null;
  }

  // write new value
  if (change.field === "tasks") {
    opp.tasks = opp.tasks || [];
    opp.tasks.unshift(change.proposed);
  } else if (change.field in opp) {
    opp[change.field] = { value: change.proposed, last_updated: appliedAt };
  }

  change.appliedAt = appliedAt;
  state.audit.unshift({
    at: appliedAt,
    type: "APPLY",
    field: change.field,
    previous: change.previous,
    new: change.proposed,
    confidence: change.confidence,
    rule: change.rule
  });
}


export function applyChange(changeId: string) {
  const idx = state.proposed.findIndex((c: Change) => c.id === changeId);
  if (idx === -1) return { ok: false, error: "not_found" };
  const change = state.proposed[idx];
  change.status = "auto_applied";
  apply(change);
  state.proposed.splice(idx, 1);
  return { ok: true, change };
}

export function undoLast() {
  const last = state.audit.find((a: any) => a.type === "APPLY");
  if (!last) return { ok: false, error: "nothing_to_undo" };
  
  // Handle both nested and flat structures
  const opp = state.onePager.opportunity ?? state.onePager;
  if (!opp) {
    console.error("No onePager data found in state for undo");
    return { ok: false, error: "no_data" };
  }
  
  state.audit.unshift({ at: DateTime.now().toISO(), type: "UNDO", field: last.field, revertedTo: last.previous });
  if (last.field === "tasks") {
    opp.tasks = (opp.tasks || []).filter((t: any) => t.title !== last.new.title);
  } else if (last.field in opp) {
    opp[last.field] = { value: last.previous, last_updated: DateTime.now().toISO() };
  }
  return { ok: true };
}

export function getAudit() { return state.audit; }
export function getBuilderLog() { return state.builderLog; }

export async function addBookmark(transcript: string, context: string) {
  // Clean transcript by removing "bookmark that" command
  const cleanTranscript = transcript
    .replace(/\s*bookmark\s+that\s*$/i, '')
    .replace(/\s*bookmark\s+that\s+/i, ' ')
    .trim();
  
  // trivial classifier
  const lower = cleanTranscript.toLowerCase();
  let kind: "Commitment" | "Objection" | "Question" = "Commitment";
  if (lower.includes("block") || lower.includes("risk") || lower.includes("can't")) kind = "Objection";
  if (lower.endsWith("?") || lower.includes("what about")) kind = "Question";
    // extract rough due like "Friday 5pm"
  const due = await normalizeDate(cleanTranscript, getTz());
  const item = { title: cleanTranscript || "Bookmarked item", kind, due, createdAt: DateTime.now().toISO() };
  const change: Change = {
    id: uuid(),
    field: "tasks",
    proposed: item,
    previous: null,
    confidence: 0.95,
    blast: "low",
    status: "auto_applied",
    rule: "low: auto ≥0.80",
    why: [{ type: "bookmark", value: transcript, timestamp: DateTime.now().toISO() }]
  };
  pushProposed(change);
  return { ok: true, banner: `📌 ${kind} bookmarked`, item };
}

function getTz() {
  return state.onePager.timezone || "America/New_York";
}

export async function runStorytime(transcript: string) {
  console.log("🚀 runStorytime called with:", transcript);
  
  // Update builder log
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  state.builderLog.words += words;

  // Check for special voice commands
  const lower = transcript.toLowerCase();
  console.log("🔍 Checking transcript:", transcript);
  console.log("🔍 Lowercase:", lower);
  
  // Fun voice commands for enhanced UX
  if (lower.includes("tell me a joke") || lower.includes("make me laugh")) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "Why don't eggs tell jokes? They'd crack each other up!",
      "What do you call a fake noodle? An impasta!",
      "Why did the math book look so sad? Because it had too many problems!"
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return { ok: true, actionableInsight: `😂 Here's a joke for you: ${joke}`, parsed: { joke } };
  }
  
  if (lower.includes("what's the weather") || lower.includes("how's the weather")) {
    return { ok: true, actionableInsight: "🌤️ I'd love to help with weather, but I'm focused on your sales opportunities! Try asking about your deal status or next steps.", parsed: { weather_request: true } };
  }
  
  if (lower.includes("sing me a song") || lower.includes("sing something")) {
    const song = "🎵 Rox Nexus, Rox Nexus, helping you close deals! Voice to text is working great, now let's make some sales! 🎵";
    return { ok: true, actionableInsight: song, parsed: { song: true } };
  }
  
  if (lower.includes("what's my word count") || lower.includes("how many words") || lower.includes("word count")) {
    const totalWords = state.builderLog.words;
    const target = 2000;
    const progress = Math.round((totalWords / target) * 100);
    const emoji = progress >= 100 ? "🎉" : progress >= 75 ? "🚀" : progress >= 50 ? "📈" : "📝";
    return { 
      ok: true, 
      actionableInsight: `${emoji} You've logged ${totalWords} words out of ${target} (${progress}% complete)! Keep talking to reach your goal!`, 
      parsed: { wordCount: totalWords, progress } 
    };
  }
  
  if (lower.includes("help") || lower.includes("what can you do")) {
    const helpText = `🎤 Voice Commands Available:
    • "Bookmark that" - Save important items
    • "Tell me a joke" - Get a laugh
    • "What's my word count" - Check progress
    • "Sing me a song" - Musical interlude
    • Regular speech - Extract insights and tasks
    
    Keep talking to reach 2,000 words!`;
    return { ok: true, actionableInsight: helpText, parsed: { help: true } };
  }

  // Use LLM for enhanced parsing
  console.log("🤖 Analyzing transcript with Claude...");
  const llmExtract = await extractWithLLM(transcript);
  
  // Fallback to rule-based parsing
  const parsed = await parseStorytime(transcript, getTz());
  
  // Merge LLM results with rule-based results (LLM takes precedence)
  const finalParsed = {
    ...parsed,
    ...llmExtract
  };
  
  const sources: SourceSpan[] = [];

  if (finalParsed.budget_status) {
    sources.push({ 
      type: llmExtract?.budget_status ? "llm" : "debrief", 
      value: finalParsed.budget_status, 
      timestamp: DateTime.now().toISO(), 
      evidence: llmExtract?.budget_status ? "claude analysis" : "storytime" 
    });
  }
  
  if (finalParsed.decision_maker) {
    sources.push({ 
      type: llmExtract?.decision_maker ? "llm" : "debrief", 
      value: finalParsed.decision_maker, 
      timestamp: DateTime.now().toISO(), 
      evidence: llmExtract?.decision_maker ? "claude name extraction" : "spelled-name" 
    });
  }
  if (finalParsed.task) {
    const changeTask: Change = {
      id: uuid(),
      field: "tasks",
      proposed: finalParsed.task,
      previous: null,
      confidence: 0.92,
      blast: "low",
      status: "auto_applied",
      rule: "low: auto ≥0.80",
      why: [{ type: "debrief", value: finalParsed.task, timestamp: DateTime.now().toISO(), evidence: "storytime" }]
    };
    pushProposed(changeTask);
  }
  
  if (finalParsed.next_meeting) {
    const nm = finalParsed.next_meeting;
    const nmChange = resolveConflicts("next_meeting", [
      { type: "debrief", value: nm, timestamp: DateTime.now().toISO(), evidence: "storytime date" }
    ]);
    pushProposed(nmChange);
  }

  // Budget resolution conflict (email freeze, crm approved, debrief resolved)
  const now = DateTime.now();
  const budgetDecision = resolveConflicts("budget_status", [
    { type: "email", value: "Freeze", timestamp: now.minus({ days: 7 }).toISO(), evidence: "emails.mbox msg-1" },
    { type: "crm", value: "Approved", timestamp: now.minus({ days: 90 }).toISO(), evidence: "CRM field" },
    ...(finalParsed.budget_status ? [{ type: "debrief", value: finalParsed.budget_status, timestamp: now.toISO(), evidence: "storytime" } as any] : [])
  ]);
  pushProposed(budgetDecision);

  if (parsed.decision_maker) {
    const dmDecision = resolveConflicts("decision_maker", [
      { type: "crm", value: "Mark Delaney", timestamp: now.minus({ days: 90 }).toISO(), evidence: "CRM field" },
      { type: "email", value: "David Chan", timestamp: now.minus({ days: 5 }).toISO(), evidence: "emails.mbox msg-2" },
      { type: "debrief", value: finalParsed.decision_maker, timestamp: now.toISO(), evidence: "spelled-name lock" }
    ]);
    pushProposed(dmDecision);
  }

  // Generate enhanced insights using LLM analysis
  const insight = makeEnhancedInsight(finalParsed, llmExtract);
  
  return { 
    ok: true ,
    actionableInsight: insight, 
    parsed: finalParsed,
    llmAnalysis: llmExtract
  };
}

function makeEnhancedInsight(parsed: any, llmExtract: any): string {
  // Enhanced insights using LLM analysis
  if (llmExtract?.sentiment === "positive" && parsed.budget_status === "Resolved Today") {
    return "🎉 Excellent! Positive conversation with budget resolved. Follow up with proposal within 24 hours.";
  }
  
  if (llmExtract?.sentiment === "negative") {
    return "⚠️ Conversation had negative tone. Consider addressing concerns before next meeting.";
  }
  
  if (llmExtract?.key_insights && llmExtract.key_insights.length > 0) {
    return `💡 Key insights: ${llmExtract.key_insights.join(", ")}. Review and plan follow-up actions.`;
  }
  
  if (llmExtract?.action_items && llmExtract.action_items.length > 0) {
    return `📋 Action items identified: ${llmExtract.action_items.join(", ")}. Prioritize these tasks.`;
  }
  
  // Fallback to original logic
  const lastBudget = state.proposed.find((c: any) => c.field === "budget_status");
  if (lastBudget) {
    if (lastBudget.proposed === "Resolved Today") {
      return "Budget likely resolved today → add Agenda Q1 to confirm authority & timing.";
    }
  }
  
  return "High-signal updates available. Review staged changes and Undo if needed.";
}

function makeInsight(): string {
  // Super simple example
  const lastBudget = state.proposed.find((c: any) => c.field === "budget_status");
  if (lastBudget) {
    if (lastBudget.proposed === "Resolved Today") {
      return "Budget likely resolved today → add Agenda Q1 to confirm authority & timing.";
    }
  }
  return "High-signal updates available. Review staged changes and Undo if needed.";
}
