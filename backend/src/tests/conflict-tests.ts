import { resolveConflicts } from "../services/resolver.js";
import { DateTime } from "luxon";

// Test scenarios for conflict resolution
export function runConflictTests() {
  console.log("🧪 Running conflict resolution tests...");
  
  // Test 1: 3-way budget conflict
  test3WayBudgetConflict();
  
  // Test 2: Name disambiguation
  testNameDisambiguation();
  
  // Test 3: Timezone handling
  testTimezoneHandling();
  
  console.log("✅ All conflict tests completed");
}

function test3WayBudgetConflict() {
  console.log("\n📊 Testing 3-way budget conflict...");
  
  const now = DateTime.now();
  const budgetSources = [
    {
      type: "crm" as const,
      value: "Approved",
      timestamp: now.minus({ days: 90 }).toISO(),
      evidence: "CRM field - legacy data"
    },
    {
      type: "email" as const,
      value: "Freeze",
      timestamp: now.minus({ days: 7 }).toISO(),
      evidence: "emails.mbox msg-1 - recent email"
    },
    {
      type: "debrief" as const,
      value: "Resolved Today",
      timestamp: now.toISO(),
      evidence: "storytime - explicit voice input"
    }
  ];
  
  const result = resolveConflicts("budget_status", budgetSources);
  
  console.log("Budget conflict resolution result:");
  console.log(`- Proposed: ${result.proposed}`);
  console.log(`- Confidence: ${result.confidence}`);
  console.log(`- Status: ${result.status}`);
  console.log(`- Blast radius: ${result.blast}`);
  
  // Should resolve to "Resolved Today" due to recency and high debrief prior
  if (result.proposed === "Resolved Today" && result.confidence >= 0.80) {
    console.log("✅ 3-way budget conflict test PASSED");
  } else {
    console.log("❌ 3-way budget conflict test FAILED");
  }
}

function testNameDisambiguation() {
  console.log("\n👤 Testing name disambiguation...");
  
  const now = DateTime.now();
  const nameSources = [
    {
      type: "crm" as const,
      value: "Mark Delaney",
      timestamp: now.minus({ days: 90 }).toISO(),
      evidence: "CRM field - legacy contact"
    },
    {
      type: "email" as const,
      value: "David Chan",
      timestamp: now.minus({ days: 5 }).toISO(),
      evidence: "emails.mbox msg-2 - recent mention"
    },
    {
      type: "debrief" as const,
      value: "David Chen",
      timestamp: now.toISO(),
      evidence: "spelled-name lock - C-H-E-N"
    }
  ];
  
  const result = resolveConflicts("decision_maker", nameSources);
  
  console.log("Name disambiguation result:");
  console.log(`- Proposed: ${result.proposed}`);
  console.log(`- Confidence: ${result.confidence}`);
  console.log(`- Status: ${result.status}`);
  console.log(`- Blast radius: ${result.blast}`);
  
  // Should resolve to "David Chen" but likely staged due to high blast radius
  if (result.proposed === "David Chen" && result.blast === "high") {
    console.log("✅ Name disambiguation test PASSED");
  } else {
    console.log("❌ Name disambiguation test FAILED");
  }
}

function testTimezoneHandling() {
  console.log("\n🕐 Testing timezone handling...");
  
  const now = DateTime.now();
  const meetingSources = [
    {
      type: "debrief" as const,
      value: "2025-09-19T17:00:00-04:00", // Friday 5pm ET
      timestamp: now.toISO(),
      evidence: "storytime date - 'this Friday 5pm'"
    }
  ];
  
  const result = resolveConflicts("next_meeting", meetingSources);
  
  console.log("Timezone handling result:");
  console.log(`- Proposed: ${result.proposed}`);
  console.log(`- Confidence: ${result.confidence}`);
  console.log(`- Status: ${result.status}`);
  
  // Should auto-apply with proper timezone
  if (result.proposed.includes("2025-09-19T17:00:00") && result.status === "auto_applied") {
    console.log("✅ Timezone handling test PASSED");
  } else {
    console.log("❌ Timezone handling test FAILED");
  }
}

// Test with LLM integration
export function testLLMIntegration() {
  console.log("\n🤖 Testing LLM integration...");
  
  const now = DateTime.now();
  const mixedSources = [
    {
      type: "crm" as const,
      value: "Approved",
      timestamp: now.minus({ days: 90 }).toISO(),
      evidence: "CRM field"
    },
    {
      type: "llm" as const,
      value: "Resolved Today",
      timestamp: now.toISO(),
      evidence: "llm extraction"
    },
    {
      type: "debrief" as const,
      value: "Resolved Today",
      timestamp: now.toISO(),
      evidence: "storytime"
    }
  ];
  
  const result = resolveConflicts("budget_status", mixedSources);
  
  console.log("LLM integration result:");
  console.log(`- Proposed: ${result.proposed}`);
  console.log(`- Confidence: ${result.confidence}`);
  console.log(`- Sources: ${result.why.map(s => s.type).join(", ")}`);
  
  // Should use LLM as supporting evidence but not primary
  if (result.proposed === "Resolved Today" && result.why.some(s => s.type === "llm")) {
    console.log("✅ LLM integration test PASSED");
  } else {
    console.log("❌ LLM integration test FAILED");
  }
}
