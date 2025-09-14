# Rox Nexus MVP Demo Script
**Target Duration: 2-3 minutes**

## Pre-Flight Setup (30 seconds)
1. **Show One-Pager with Pre-seeded Conflicts**
   - Point to Budget: CONFLICT indicator
     - CRM: "Approved" (90 days old)
     - Email: "Freeze" (7 days old)
   - Point to Decision Maker: "Mark Delaney" (90 days old)
   - Show Metrics dashboard with zeros

2. **Explain Conflict Resolution Policy**
   - "Every decision is auditable via 'Why?' popovers"
   - "Shows sources, timestamps, confidence scores, and rules"
   - "Recency weights, source priors, agreement boost"

## In-Flight Demo (15 seconds)
3. **Bookmark Demo**
   - Say mock line: "We need to send the proposal by Friday at 5pm"
   - Say: "Bookmark that"
   - **Expected Result**: Banner appears instantly
     - "📌 Commitment bookmarked: Send proposal (Fri 5:00 PM ET)"

## Main Storytime Demo (45 seconds)
4. **Voice Debrief** (30-40 seconds)
   ```
   "Budget resolved today, we got final approval from finance this morning. 
   New decision maker is David Chen—C-H-E-N—he's taking over from Mark. 
   Proposal due this Friday 5pm Eastern. 
   Add follow-up task for SOC2 compliance review Monday 9am."
   ```

5. **Real-time Processing**
   - Show stopwatch starting
   - Show "Listening..." indicator
   - Show "Processing..." state

## Outcome Demonstration (60 seconds)
6. **One-Pager Updates** (appears in <10 seconds)
   - **Actionable Insight** appears first:
     - "Budget likely resolved today → Proposal deadline confirmed for Fri 5:00 PM ET"
   - Point out stopwatch stops when insight renders

7. **Show Auto-Applied Changes**
   - SOC2 follow-up task (auto-applied, show Undo button)
   - Normalized date: "Fri Sep 19, 2025 5:00 PM ET"
   - **Demonstrate Undo**: Click undo on task, show immediate rollback

8. **Show Staged Changes**
   - Decision Maker change: Mark → David Chen
   - Confidence score: 0.76
   - [Apply] and [Discard] buttons visible
   - "auto-apply in 24h" label

9. **Show Provenance**
   - Click "Why?" on Decision Maker change
   - **Popover shows**:
     - Sources: CRM (Mark, 90d), Email (David Chan, 5d), Debrief (David Chen, today)
     - Recency weights: 0.12, 0.85, 1.0
     - Source priors: 0.10, 0.30, 0.40
     - Final confidence: 0.76
     - Rule: "High blast radius: stage if <0.90"

10. **Metrics Dashboard**
    - Conflicts detected: 3
    - Auto-resolved: 2
    - Staged: 1
    - Blocked: 0
    - Time-to-Insight: 7.8s
    - Precision@Apply: 100%

## Key Demo Points to Emphasize
- **Speed**: <10 second time-to-insight
- **Transparency**: Every decision is auditable
- **Safety**: Reversible autonomy with undo/staging
- **Intelligence**: Handles messy, conflicting data
- **Trust**: User has ultimate control

## Fallback Scenarios (if needed)
- **Network Issues**: Show "Processing locally—syncing..." banner
- **ASR Problems**: Demonstrate staging with "Low confidence" note
- **Name Collision**: Show Levenshtein distance in Why? popover

## Closing Points
- "Same pipeline works with SFDC/HubSpot"
- "Demo tenant - all data is sandboxed"
- "Audit log available for governance"
- "Builder log shows 2000+ words transcribed via Wispr"

## Technical Checklist Before Demo
- [ ] Backend running on port 8788
- [ ] Frontend running on port 5174
- [ ] Microphone permissions granted
- [ ] Demo tenant badge visible
- [ ] Seeded conflicts loaded
- [ ] Backup screencast ready (90 seconds)

## Success Metrics (Live Verification)
- [ ] Time-to-Actionable-Insight: ≤10s
- [ ] Autonomous Resolution Rate: ≥2/3
- [ ] Blocking Prompts: ≤1
- [ ] Precision@Apply: 100%
- [ ] Undo Works: Demonstrated live
- [ ] "Why?" Visible: All claims auditable
