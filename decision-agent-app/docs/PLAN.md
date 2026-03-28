# Decision Agent - Implementation Plan

## Overview

This document describes the implementation plan for the Decision Agent application.

## Architecture

```
┌─────────────────┐     SSE Stream      ┌─────────────────────────────┐
│   Next.js App   │ ◄──────────────────► │    Gemini 3.1 Pro           │
│  (Vercel Edge)  │                     │    + Function Calling         │
└────────┬────────┘                     └──────────────┬──────────────┘
         │                                            │
         │                                     ┌──────┴──────┐
         │                                     ▼             ▼
         │                               ┌─────────┐   ┌──────────┐
         │                               │ Tavily  │   │ DuckDuck │
         │                               │ Search  │   │   Go     │
         │                               └─────────┘   └──────────┘
         │
    ┌────┴─────────────────────────────────────────┐
    │ Frontend State (React)                        │
    │ - Options A & B                               │
    │ - Decision context/scenario                   │
    │ - Conversation history                        │
    │ - Current round count (max 5)                 │
    │ - Search count (max 5)                        │
    └───────────────────────────────────────────────┘
```

## Core Flow

```
User Input (Option A, B, verb)
    ↓
POST /api/decision
    ↓
SSE Stream Started
    ↓
[thought] → AI reasoning
    ↓
[search] → Query execution (Tavily/DDG)
    ↓
[search_result] → Results summary
    ↓
[question] → User Q&A (or [final])
    ↓
User Answer → Resume Stream
    ↓
... (repeat up to 5 rounds)
    ↓
[final] → Decision + Reason
```

## Implementation Phases

### Phase 1: Project Setup ✓
- [x] Initialize Next.js with TypeScript + Tailwind
- [x] Install dependencies (@google/generative-ai, zod)
- [x] Configure environment variables

### Phase 2: Core Types & Utilities ✓
- [x] TypeScript interfaces (types.ts)
- [x] Search utilities (tavily.ts, duckduckgo.ts)
- [x] Gemini integration (gemini.ts)

### Phase 3: API Layer ✓
- [x] SSE endpoint (/api/decision)
- [x] Function calling integration
- [x] Stream event handling

### Phase 4: Frontend Components ✓
- [x] InputForm - Initial decision input
- [x] QuestionCard - Q&A interaction
- [x] ChatThread - Message display
- [x] MessageBubble - Individual messages

### Phase 5: State Management ✓
- [x] useDecisionStream hook
- [x] Message history tracking
- [x] Round/search counting

### Phase 6: Polish & Testing ✓
- [x] UI styling (Tailwind)
- [x] API integration tests
- [x] Bug fixes

## Key Technical Decisions

### 1. SSE over WebSocket
- **Why**: Unidirectional flow, simpler implementation, works well with Vercel
- **Trade-off**: No true bidirectional communication (client reconnects for each answer)

### 2. Stateless Design
- **Why**: Simpler deployment, no database needed
- **Trade-off**: Session lost on page refresh

### 3. Function Calling
- **Why**: Structured control over AI behavior
- **Implementation**: Three tools (search, askQuestion, finalize)

### 4. Search Fallback
- **Why**: Tavily has quota limits
- **Implementation**: DuckDuckGo scraping as backup

## File Structure

```
decision-agent-app/
├── app/
│   ├── api/decision/route.ts      # SSE API endpoint
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── InputForm.tsx              # Initial form (verb + options)
│   ├── QuestionCard.tsx           # Active question UI
│   ├── ChatThread.tsx             # Message container
│   └── ...
├── hooks/
│   └── useDecisionStream.ts       # Core logic + SSE handling
├── lib/
│   ├── types.ts                   # All TypeScript types
│   ├── gemini.ts                  # AI integration
│   ├── tavily.ts                  # Primary search
│   └── duckduckgo.ts              # Fallback search
├── tests/
│   └── api.test.ts                # Integration tests
└── docs/                          # Documentation
```

## Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| Max Rounds | 5 | Prevent infinite loops |
| Max Searches | 5 | Control API costs |
| Max Reason Length | 200 chars | Concise output |
| Options | Exactly 2 | Binary decision focus |

## Testing Strategy

1. **API Tests** (`npm run test:api`)
   - Validation tests
   - SSE stream tests
   - Resume flow tests

2. **Manual Testing**
   - Various decision scenarios
   - Edge cases (empty inputs, long text)
   - Error conditions

## Future Enhancements (Out of Scope)

- Multi-option comparison (3+ options)
- User accounts & history
- Share decisions
- Mobile app
- Voice input
