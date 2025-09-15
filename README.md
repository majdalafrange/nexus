# Nexus MVP

**AI-powered sales deal intelligence with voice-driven conflict resolution**

Nexus automatically detects and resolves conflicts in your sales data using natural language processing, voice commands, and intelligent decision-making algorithms. Perfect for sales teams who need to maintain accurate deal information without manual overhead.


### Prerequisites
- Node.js 18+ 
- npm or yarn
- Claude API key (optional, for enhanced LLM features)

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd -nexus
```

2. **Backend setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

3. **Frontend setup:**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173/
- Backend API: http://localhost:8787/

## Key Features

### Intelligent Conflict Resolution
- **Automatic Detection**: Identifies conflicts between CRM, email, and voice data
- **Smart Weighting**: Prioritizes recent information and reliable sources
- **Confidence Scoring**: Shows certainty levels for all decisions
- **Audit Trail**: Full "Why?" explanations for every change

### Voice-Powered Updates
- **Push-to-Talk**: Web Speech API integration for quick voice commands
- **Flow Integration**: Seamless dictation with Wispr Flow (no SDK required)
- **Bookmark Commands**: "Bookmark that" instantly captures commitments
- **Natural Language**: Speak naturally, system extracts structured data

### Real-Time Intelligence
- **Sub-10s Processing**: Time-to-insight under 10 seconds
- **Live Metrics**: Conflicts detected, auto-resolved, staged, blocked
- **Precision Tracking**: Measures accuracy of auto-applied changes
- **Actionable Insights**: AI-generated next steps and recommendations

## Demo Mode

The application includes pre-seeded demo data for consistent presentations:

### Pre-loaded Scenario
- **Deal**: Acme Corp opportunity
- **Budget Conflict**: CRM "Approved" (90 days) vs Email "Freeze" (7 days)
- **Decision Maker**: Mark Delaney (stale, 90 days old)
- **Metrics**: Starting at zero, ready to increment

### Demo Flow

1. **Show Conflicts** (30 seconds)
   - Point out red CONFLICT indicator on Budget Status
   - Explain staged change with 24h auto-apply timer
   - Show "Why?" popover with sources and confidence

2. **Voice Bookmark** (15 seconds)
   ```
   Say: "We need to send the proposal by Friday at 5pm"
   Then: "Bookmark that"
   ```
   - Banner appears: "Commitment bookmarked: Send proposal (Fri 5:00 PM ET)"

3. **Flow Debrief** (45 seconds)
   - Click "Debrief (Flow)" button
   - Dictate: *"Budget resolved today, we got final approval from finance this morning. New decision maker is David Chen—C-H-E-N—he's taking over from Mark. Proposal due this Friday 5pm Eastern. Add follow-up task for SOC2 compliance review Monday 9am."*
   - Watch real-time processing and conflict resolution

### Expected Results
- Budget status resolves from "Freeze" to "Resolved Today"
- Decision maker updates from Mark Delaney to David Chen
- New tasks appear with proper due dates
- Metrics show 100% Precision@Apply

## Architecture

### Backend (`/backend`)
- **Express.js** API server
- **TypeScript** for type safety
- **Luxon** for date/time handling
- **Claude API** integration for enhanced LLM parsing
- **Rule-based + AI** hybrid conflict resolution

### Frontend (`/frontend`)
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** icons
- **Web Speech API** for voice input

### Key Components
- **Conflict Resolver**: Weighted decision engine
- **Voice Parser**: Natural language to structured data
- **State Manager**: Deal data with audit trail
- **Metrics Engine**: Real-time performance tracking

## 📁 Project Structure

```
-nexus/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── state.ts      # Core state management
│   │   │   ├── resolver.ts   # Conflict resolution logic
│   │   │   ├── parser.ts     # Voice/text parsing
│   │   │   └── llm.ts        # Claude API integration
│   │   └── index.ts          # Express server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── ui/
│   │   │   ├── App.tsx       # Main application
│   │   │   ├── OnePager.tsx  # Deal summary view
│   │   │   ├── FlowDebrief.tsx # Flow integration
│   │   │   └── Metrics.tsx   # Performance dashboard
│   │   └── lib/
│   │       └── wispr.ts      # Voice integration
│   └── package.json
├── data/
│   ├── demo-initial-state.json # Pre-seeded demo data
│   ├── crm.json              # Sample CRM data
│   └── emails.mbox           # Sample email data
└── README.md
```

## Configuration

### Environment Variables

**Backend (`.env`):**
```env
PORT=8787
TIMEZONE=America/New_York
CLAUDE_API_KEY=your_claude_key_here  # Optional
WISPR_ENDPOINT=                      # Optional py endpoint
```

**Frontend:**
- Vite py automatically routes `/api/*` to backend
- No additional configuration required

## API Endpoints

### Core Data
- `GET /api/data` - Current deal state and proposed changes
- `POST /api/reset-demo` - Reset to demo initial state

### Voice Processing  
- `POST /api/storytime` - Process voice debrief transcript
- `POST /api/bookmark` - Create bookmarked commitment

### Change Management
- `POST /api/apply` - Apply staged change by ID
- `POST /api/undo` - Undo last applied change
- `GET /api/audit` - Full audit trail

## Success Metrics

The system tracks key performance indicators:

- **Time-to-Insight**: Target <10 seconds
- **Precision@Apply**: Target >90% accuracy
- **Autonomous Resolution**: Target >66% auto-resolved
- **User Intervention**: Target <1 blocking prompt per session


