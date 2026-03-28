# Decision Agent - Implementation Plan

## Architecture Overview

```
┌─────────────────┐     SSE Stream      ┌─────────────────────────────┐
│   Next.js App   │ ◄──────────────────► │    Gemini 2.5 Pro Preview   │
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

## Phase 1: Project Setup

### 1.1 Initialize Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false
```

### 1.2 Install Dependencies
```bash
npm install @google/generative-ai zod
npm install -D @types/node
```

### 1.3 Environment Setup
Create `.env.local`:
```
GEMINI_API_KEY=
TAVILY_API_KEY=
```

## Phase 2: Core Types & Utilities

### 2.1 Type Definitions (`lib/types.ts`)
```typescript
// SSE Event Types
type SSEEvent =
  | { type: 'thought'; content: string }
  | { type: 'search'; query: string }
  | { type: 'search_result'; summary: string; sources: string[] }
  | { type: 'question'; question: string; options: string[]; allowCustom: boolean }
  | { type: 'final'; choice: 'A' | 'B'; reason: string }
  | { type: 'error'; message: string };

// Session State
type SessionState = {
  optionA: string;
  optionB: string;
  scenario: string;
  history: Array<{ role: 'assistant' | 'user'; content: string }>;
  roundCount: number;
  searchCount: number;
};

// Tool Definitions
const searchTool = {
  name: 'search',
  description: 'Search for information to inform the decision',
  parameters: z.object({ query: z.string() })
};

const askQuestionTool = {
  name: 'askQuestion',
  description: 'Ask the user a multiple-choice question',
  parameters: z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(4),
    allowCustom: z.boolean().default(true)
  })
};

const finalizeTool = {
  name: 'finalize',
  description: 'Make the final decision',
  parameters: z.object({
    choice: z.enum(['A', 'B']),
    reason: z.string().max(200)
  })
};
```

### 2.2 Search Utilities

**Tavily Search (`lib/tavily.ts`)**
- Primary search provider
- Returns: summary, sources[]
- Error handling with fallback

**DuckDuckGo Fallback (`lib/duckduckgo.ts`)**
- Used when Tavily quota exceeded
- Simpler results, no API key needed

## Phase 3: API Route Implementation

### 3.1 SSE Endpoint (`app/api/decision/route.ts`)

**Request Format:**
```typescript
{
  optionA: string;
  optionB: string;
  scenario?: string;
  history?: Array<{ role: string; content: string }>;
  roundCount?: number;
  searchCount?: number;
  userAnswer?: string; // Only for subsequent requests
}
```

**Implementation Flow:**
1. Validate request body with Zod
2. Initialize Gemini client with function calling
3. Build system prompt with constraints
4. Stream response handling:
   - On `thought`: Emit `thought` event
   - On `search` call: Execute search, emit events, return result to model
   - On `askQuestion` call: Emit `question` event, close stream
   - On `finalize` call: Emit `final` event, close stream

### 3.2 System Prompt Design

```
You are a Decision Agent helping users choose between two options.

Current Decision:
- Option A: {optionA}
- Option B: {optionB}
- Context: {scenario}

Constraints:
- Maximum 5 rounds of user Q&A
- Maximum 5 searches total
- Current round: {roundCount}/5
- Current searches: {searchCount}/5

Your goal:
1. Use search to gather relevant information
2. Ask targeted questions to understand user preferences
3. When confident, make a clear final choice

Available tools:
- search: Use when you need factual information
- askQuestion: Use to get user input (max 4 options + custom)
- finalize: Use when ready to make the decision

Guidelines:
- Explain your reasoning as you go (thoughts)
- Be concise but thorough
- If search quota exhausted, rely on general knowledge
- Always justify your final decision
```

## Phase 4: Frontend Components

### 4.1 Main Page (`app/page.tsx`)

**States:**
1. `idle` - Show input form
2. `streaming` - Show chat with thinking/search states
3. `waiting` - Show question card, waiting for user
4. `complete` - Show final result

### 4.2 Input Form (`components/InputForm.tsx`)
- Two text inputs: Option A, Option B
- One optional input: Decision scenario/context
- Submit button → Initialize SSE connection

### 4.3 Chat Thread (`components/ChatThread.tsx`)
- Displays conversation history
- Renders different message types:
  - User messages (right-aligned)
  - AI thoughts (italic, muted)
  - Search queries (with loading spinner)
  - Search results (collapsible)
  - Questions (styled cards)
  - Final result (highlighted)

### 4.4 Question Card (`components/QuestionCard.tsx`)
- Radio button group for options
- Text input for custom answer
- Submit button
- Emits answer back to parent

### 4.5 Thinking Bubble (`components/ThinkingBubble.tsx`)
- Animated dots or spinner
- Shows "Analyzing...", "Searching...", etc.

## Phase 5: State Management

### 5.1 Custom Hook (`hooks/useDecisionStream.ts`)

```typescript
function useDecisionStream() {
  const [state, setState] = useState<DecisionState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  const startDecision = async (options: DecisionInput) => {
    // Initialize SSE connection
    // Handle incoming events
    // Update state accordingly
  };

  const submitAnswer = (answer: string) => {
    // Resume SSE with answer
  };

  return { state, messages, currentQuestion, startDecision, submitAnswer };
}
```

## Phase 6: Styling & UX

### 6.1 Design System
- **Colors:** Neutral slate background, indigo primary, emerald for final choice
- **Typography:** Inter font, clear hierarchy
- **Spacing:** Consistent 4px grid
- **Animations:** Subtle fade-ins, pulse for loading states

### 6.2 Responsive Design
- Mobile-first approach
- Full-width cards on mobile
- Max-width container on desktop (640px)

### 6.3 Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible states

## Phase 7: Testing & Polish

### 7.1 Test Scenarios
1. Simple comparison ("iPhone vs Samsung")
2. Complex decision with multiple searches
3. Edge case: API failures
4. Max rounds exhaustion

### 7.2 Performance
- Optimize bundle size
- Ensure fast initial load
- Smooth streaming experience

## Implementation Order

1. ✓ Project setup & types
2. ✓ Search utilities (Tavily + DDG)
3. ✓ Gemini integration with function calling
4. ✓ SSE API route
5. ✓ Input form component
6. ✓ Chat thread with message types
7. ✓ Question card component
8. ✓ State management hook
9. ✓ Main page integration
10. ✓ Styling & animations
11. ✓ Error handling & edge cases
12. ✓ Testing & deployment

## File Structure

```
decision-agent/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── decision/
│           └── route.ts
├── components/
│   ├── InputForm.tsx
│   ├── ChatThread.tsx
│   ├── MessageBubble.tsx
│   ├── QuestionCard.tsx
│   ├── ThinkingIndicator.tsx
│   └── FinalResult.tsx
├── hooks/
│   └── useDecisionStream.ts
├── lib/
│   ├── types.ts
│   ├── gemini.ts
│   ├── tavily.ts
│   ├── duckduckgo.ts
│   └── utils.ts
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```
