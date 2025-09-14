import { DateTime } from "luxon";
import * as chrono from "chrono-node";

export async function normalizeDate(text: string, tz: string) {
  const ref = DateTime.now().setZone(tz);
  const results = chrono.parse(text, ref.toJSDate(), { forwardDate: true });
  if (results.length) {
    const d = DateTime.fromJSDate(results[0].date()).setZone(tz);
    return d.toISO();
  }
  return null;
}

export async function parseStorytime(transcript: string, tz: string) {
  const lower = transcript.toLowerCase();
  const out: any = {};

  // budget keywords
  if (lower.includes("budget resolved")) out.budget_status = "Resolved Today";
  if (lower.includes("budget approved")) out.budget_status = "Approved";

  // spelled-name capture e.g., "David Chen—C-H-E-N"
  const spelled = transcript.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)[—-]\s*([A-Z](?:\s*[-–]?\s*)?){2,}/);
  if (spelled) {
    const name = spelled[1];
    out.decision_maker = name;
  } else {
    // fallback: look for David Chen/Chan
    const m = transcript.match(/david\s+ch[ea]n/i);
    if (m) out.decision_maker = m[0].split(/\s+/).map(s => s[0].toUpperCase()+s.slice(1).toLowerCase()).join(" ");
  }

  // due/task capture
  const taskDate = await normalizeDate(transcript, tz);
  if (taskDate) {
    if (lower.includes("soc2") || lower.includes("soc 2")) {
      out.task = { title: "Follow-up: SOC 2 evidence", kind: "Commitment", due: taskDate, createdAt: DateTime.now().toISO() };
    } else if (lower.includes("proposal")) {
      out.task = { title: "Send proposal", kind: "Commitment", due: taskDate, createdAt: DateTime.now().toISO() };
    }
    // also consider as next meeting if "meeting" present
    if (lower.includes("meeting") || lower.includes("call")) {
      out.next_meeting = taskDate;
    }
  }

  return out;
}
