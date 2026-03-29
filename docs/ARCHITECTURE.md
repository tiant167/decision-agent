# Decision Agent - Architecture

## System Overview

The Decision Agent is a single-page Next.js application that helps users make binary decisions through an AI-guided conversation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  InputForm   │  │  ChatThread  │  │   QuestionCard       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│           │                │                    │               │
│           └────────────────┼────────────────────┘               │
│                            ▼                                    │
│              ┌─────────────────────────┐                        │
│              │   useDecisionStream     │                        │
│              │   (React Hook)          │                        │
│              └─────────────────────────┘                        │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP + SSE
┌────────────────────────────┼────────────────────────────────────┐
│                     Server (Vercel Edge)                         │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  page.tsx (Server Component)                              │   │
│  │  ┌────────────────┐   ┌────────────────────────────────┐ │   │
│  │  │  Edge Config   │──▶│  ClientHome (Client Component) │ │   │
│  │  │  (read only)   │   │  └─ ExampleScenarios           │ │   │
│  │  └────────────────┘   └────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│              ┌─────────────┴─────────────┐                     │
│              ▼                           ▼                     │
│    ┌───────────────────┐     ┌───────────────────────────┐    │
│    │ POST /api/decision│     │ POST /api/cron/           │    │
│    │ (Decision SSE)    │     │      update-examples      │    │
│    └───────┬───────────┘     └───────────┬───────────────┘    │
│            ▼                             │                     │
│  ┌─────────────────┐                     ▼                     │
│  │  Gemini 3.1 Pro │           ┌─────────────────────┐        │
│  │  + Func Calling │           │ Tavily → DuckDuckGo │        │
│  └────────┬────────┘           │ ↓ Gemini (generate) │        │
│           │                    │ ↓ Edge Config (write)│        │
│  ┌────┴──────┐                └─────────────────────┘         │
│  ▼           ▼                                                  │
│ ┌──────┐ ┌──────────┐                                         │
│ │Tavily│ │DuckDuckGo│                                         │
│ │Search│ │(Fallback)│                                         │
│ └──────┘ └──────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization Flow

```
User fills form (Option A, B, verb)
    ↓
handleSubmit → startDecision(input)
    ↓
POST /api/decision with DecisionRequest
    ↓
Server: Initialize Gemini chat with system prompt
    ↓
SSE Stream begins
```

### 2. Streaming Flow

```
Server: Gemini function call
    ↓
Client receives SSE event
    ↓
handleEvent() updates React state
    ↓
UI re-renders with new message
    ↓
If question: Pause, show QuestionCard
If final: Show decision, end stream
```

### 3. Answer Flow

```
User selects answer in QuestionCard
    ↓
handleAnswer(answer) → submitAnswer(answer)
    ↓
Add answer to local messages
    ↓
POST /api/decision with userAnswer
    ↓
Resume SSE stream with context
```

## Component Architecture

### Frontend Components

```
page.tsx (Server Component)
├── Reads trending examples from Edge Config (with static fallback)
└── ClientHome (Client Component)
    ├── Header (static with AI-generated icon)
    ├── ExampleScenarios (receives examples as prop)
    │   └── ScenarioCard[] (dynamically loaded from Edge Config)
    │
    ├── InputForm (phase: idle)
    │   ├── Form title and subtitle
    │   ├── verb input ("What do you want to decide?")
    │   ├── Option A input (with A badge)
    │   ├── Option B input (with B badge)
    │   └── VS badge (gradient)
    │
    └── Chat View (phase: active)
        ├── ChatThread
        │   ├── Header (Option A vs Option B)
        │   ├── MessageBubble[]
        │   │   ├── thought (AI reasoning)
        │   │   ├── search (search indicator)
        │   │   ├── search_result (results)
        │   │   ├── question (Q&A history)
        │   │   ├── answer (user response)
        │   │   ├── final (decision)
        │   │   └── error (error message)
        │   ├── Thinking Indicator (loading state)
        │   └──
        └── QuestionCard (active question only)
```

### State Management

**useDecisionStream Hook:**

```typescript
interface DecisionState {
  phase: 'idle' | 'initializing' | 'streaming' | 'waiting' | 'complete' | 'error';
  messages: Message[];           // Display history
  currentQuestion: Question | null;  // Active question
  finalResult: Result | null;    // Final decision
  error: string | null;
  roundCount: number;            // Q&A rounds (max 5)
  searchCount: number;           // Search count (max 5)
  optionA: string;               // Stored for display
  optionB: string;               // Stored for display
}
```

**Message Types:**

```typescript
type MessageType =
  | 'thought'        // AI reasoning
  | 'search'         // Search initiated
  | 'search_result'  // Search completed
  | 'question'       // Q&A in history
  | 'answer'         // User response
  | 'final'          // Decision result
  | 'error';         // Error occurred
```

## Server Architecture

### API Route: `/api/decision`

**Method:** POST
**Content-Type:** application/json
**Response:** text/event-stream (SSE)

**Request Body:**
```typescript
{
  optionA: string;
  optionB: string;
  scenario: string;      // "Which one should I [verb]"
  history?: Message[];   // Previous messages
  roundCount?: number;
  searchCount?: number;
  userAnswer?: string;   // For resuming
}
```

**SSE Events:**

| Event Type | Description | Data |
|------------|-------------|------|
| `thought` | AI reasoning | `{ content: string }` |
| `search` | Search started | `{ query: string, provider: 'tavily' \| 'duckduckgo' }` |
| `search_result` | Search completed | `{ summary: string, sources: string[] }` |
| `question` | Question for user | `{ question: string, options: string[], allowCustom: boolean }` |
| `final` | Decision made | `{ choice: 'A' \| 'B', reason: string }` |
| `error` | Error occurred | `{ message: string }` |

### Gemini Integration

**Model:** `gemini-3.1-pro-preview`

**Function Calling:**

Three functions defined:
1. `search(query, reason)` - Web search
2. `askQuestion(question, options, allowCustom)` - Get user input
3. `finalize(choice, reason)` - Make final decision

**System Prompt:**
- Includes current options and scenario
- Enforces max rounds (5) and max searches (5)
- Guides AI to use appropriate tools

### Search Architecture

**Primary: Tavily**
- API key required
- Structured results with summary
- Source URLs included

**Fallback: DuckDuckGo**
- No API key needed
- HTML scraping
- Simpler results

**Fallback Logic:**
```
try {
  result = await searchWithTavily(query);
} catch (error) {
  result = await searchWithDuckDuckGo(query);
}
```

### Cron API: `/api/cron/update-examples`

**Method:** POST
**Auth:** Vercel Cron (User-Agent) or Bearer token (CRON_SECRET)
**Response:** application/json

Updates homepage trending examples daily. See [CONFIG.md](../CONFIG.md) for setup.

### Edge Config

**Purpose:** Stores trending examples for zero-latency reads at the edge.

**Key:** `trending-examples` → `ExampleScenario[]`

**Write:** Via Vercel API from cron endpoint
**Read:** Via `@vercel/edge-config` `get()` in server component

**Fallback:** Static hardcoded examples if Edge Config unavailable

## Security Considerations

1. **API Keys**: Stored in environment variables, never exposed to client
2. **Cron Auth**: CRON_SECRET validates manual triggers; Vercel Cron auto-authenticated
3. **CORS**: Default Next.js behavior (same-origin)
4. **Input Validation**: Zod validation on API requests
5. **Rate Limiting**: Implicit via Vercel limits
6. **Secret Scanning**: gitleaks pre-commit hook prevents credential leaks

## Performance Considerations

1. **Streaming**: SSE provides real-time updates without polling
2. **Stateless**: No database queries, fast response times
3. **Client-side State**: React state management, no Redux needed
4. **Search Caching**: None (could be added for repeated queries)

## Deployment Architecture

**Platform:** Vercel

**Configuration:**
- Output: `standalone` (optimized for serverless)
- Edge runtime for API routes
- Environment variables for API keys

**Scaling:**
- Stateless design allows horizontal scaling
- No session affinity required
- API limits depend on Gemini/Tavily quotas
