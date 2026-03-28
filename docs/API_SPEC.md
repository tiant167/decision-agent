# Decision Agent - API Specification

## Endpoint: `POST /api/decision`

The main (and only) API endpoint for the Decision Agent.

### Request

**URL:** `/api/decision`
**Method:** `POST`
**Headers:**
```
Content-Type: application/json
```

**Body:**

```typescript
interface DecisionRequest {
  optionA: string;        // First option to compare
  optionB: string;        // Second option to compare
  scenario: string;       // "Which one should I [verb]"
  history?: Array<{       // Previous conversation (optional)
    role: 'assistant' | 'user';
    content: string;
  }>;
  roundCount?: number;    // Current round (optional, default 0)
  searchCount?: number;   // Searches used (optional, default 0)
  userAnswer?: string;    // User's answer (for resuming)
}
```

**Example - Initial Request:**

```json
{
  "optionA": "MacBook Pro",
  "optionB": "Dell XPS 15",
  "scenario": "Which one should I buy",
  "history": [],
  "roundCount": 0,
  "searchCount": 0
}
```

**Example - Resume with Answer:**

```json
{
  "optionA": "MacBook Pro",
  "optionB": "Dell XPS 15",
  "scenario": "Which one should I buy",
  "history": [
    { "role": "assistant", "content": "What is your budget?" }
  ],
  "roundCount": 1,
  "searchCount": 1,
  "userAnswer": "Around $2000"
}
```

### Response

**Type:** `text/event-stream` (Server-Sent Events)

Each event is formatted as:

```
data: {"type": "...", ...}\n\n
```

**Event Types:**

#### 1. `thought`

AI is thinking/processing.

```json
{
  "type": "thought",
  "content": "I need to compare the performance of these laptops..."
}
```

#### 2. `search`

Search has been initiated.

```json
{
  "type": "search",
  "query": "MacBook Pro vs Dell XPS 15 performance comparison",
  "provider": "tavily"
}
```

#### 3. `search_result`

Search completed with results.

```json
{
  "type": "search_result",
  "summary": "1. MacBook Pro M3 scores 15000 on Geekbench...",
  "sources": ["https://example.com/review", "https://benchmarks.com/..."]
}
```

#### 4. `question`

AI needs user input.

```json
{
  "type": "question",
  "question": "What is your budget?",
  "options": ["Under $1000", "$1000-2000", "Over $2000"],
  "allowCustom": true
}
```

**Note:** When this event is received, the stream pauses. Client should:
1. Display the question
2. Wait for user answer
3. Make new request with `userAnswer`

#### 5. `final`

Decision has been made.

```json
{
  "type": "final",
  "choice": "A",
  "reason": "Better performance for development work"
}
```

**Note:** This ends the stream.

#### 6. `error`

Something went wrong.

```json
{
  "type": "error",
  "message": "API quota exceeded"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Missing required fields: optionA and optionB"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Example Flow

```
Client                                          Server
  │                                               │
  │ POST /api/decision                            │
  │ { optionA: "Tea", optionB: "Coffee", ... }   │
  │──────────────────────────────────────────────>│
  │                                               │
  │<──────────────────────────────────────────────│ data: {"type":"thought",...}
  │<──────────────────────────────────────────────│ data: {"type":"search",...}
  │<──────────────────────────────────────────────│ data: {"type":"search_result",...}
  │<──────────────────────────────────────────────│ data: {"type":"question",...}
  │ [STREAM PAUSES]                               │
  │                                               │
  │ POST /api/decision                            │
  │ { ..., userAnswer: "I prefer morning" }      │
  │──────────────────────────────────────────────>│
  │                                               │
  │<──────────────────────────────────────────────│ data: {"type":"thought",...}
  │<──────────────────────────────────────────────│ data: {"type":"final",...}
  │ [STREAM ENDS]                                 │
```

### Constraints

| Limit | Value | Description |
|-------|-------|-------------|
| Max rounds | 5 | Q&A rounds before forced decision |
| Max searches | 5 | API calls to search per session |
| Option length | N/A | No hard limit, but keep reasonable |
| Scenario length | N/A | No hard limit |
| SSE timeout | 60s | Default Next.js timeout |

### Testing with cURL

**Initial request:**

```bash
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{
    "optionA": "Tea",
    "optionB": "Coffee",
    "scenario": "Which one should I drink"
  }'
```

**Resume with answer:**

```bash
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{
    "optionA": "Tea",
    "optionB": "Coffee",
    "scenario": "Which one should I drink",
    "roundCount": 1,
    "userAnswer": "Morning"
  }'
```

### JavaScript Client Example

```javascript
async function startDecision(optionA, optionB, scenario) {
  const response = await fetch('/api/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionA, optionB, scenario })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));
        handleEvent(event);  // Your event handler
      }
    }
  }
}
```
