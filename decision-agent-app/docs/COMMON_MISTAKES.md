# Decision Agent - Common Mistakes

Frequently encountered issues when working on this codebase. Check here first when something breaks!

## React / Next.js Issues

### 1. Hydration Mismatch

**Symptom:**
```
Uncaught Error: Hydration failed because the server rendered text didn't match the client.
```

**Causes & Solutions:**

#### A. Using `Math.random()` in render

**Bad:**
```typescript
// hooks/useDecisionStream.ts
const generateId = () => Math.random().toString(36).substring(2, 9);
```

**Good:**
```typescript
const idCounterRef = useRef(0);
const generateId = () => {
  idCounterRef.current += 1;
  return `msg-${idCounterRef.current}`;
};
```

#### B. Using `Date.now()` in render

**Bad:**
```typescript
const id = `msg-${Date.now()}`;
```

**Good:**
Use deterministic ID generation (counter, UUID v1, etc.)

#### C. Browser-specific APIs without checks

**Bad:**
```typescript
const width = window.innerWidth;
```

**Good:**
```typescript
const width = typeof window !== 'undefined' ? window.innerWidth : 0;
```

**Location:** `hooks/useDecisionStream.ts:28`

---

### 2. Missing "use client" Directive

**Symptom:**
```
Error: useState is not defined
```

**Cause:** Using React hooks in a Server Component

**Solution:**
Add `"use client"` at top of file:

```typescript
"use client";  // Required for React hooks

import { useState } from "react";
// ...
```

**Files that need this:**
- `components/InputForm.tsx`
- `components/ChatThread.tsx`
- `components/QuestionCard.tsx`
- `hooks/useDecisionStream.ts`
- `app/page.tsx`

---

### 3. Incorrect File Path in Import

**Symptom:** Module not found errors

**Common mistakes:**
```typescript
// ✗ Wrong
import { Something } from "@/lib/types";  // If not in tsconfig paths

// ✓ Correct
import { Something } from "../lib/types";
// or if tsconfig configured:
import { Something } from "@/lib/types";
```

**Check:** `tsconfig.json` paths configuration

---

## TypeScript Issues

### 4. Type Mismatch in Event Handlers

**Bad:**
```typescript
const handleSubmit = (e) => {  // Missing type
  e.preventDefault();
}
```

**Good:**
```typescript
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
}
```

---

### 5. Not Reading File Before Writing

**Symptom:**
```
File has not been read yet. Read it first before writing to it.
```

**Solution:**
Always use Read tool before Edit/Write on existing files.

---

## State Management Issues

### 6. Stale State in Async Functions

**Bad:**
```typescript
const handleClick = async () => {
  await fetchData();
  console.log(state.value);  // May be stale
};
```

**Good:**
```typescript
const handleClick = async () => {
  const result = await fetchData();
  setState(prev => ({ ...prev, value: result }));
};
```

**Or use functional updates:**
```typescript
setState(prev => ({ ...prev, count: prev.count + 1 }));
```

---

### 7. Forgetting to Reset State

**Symptom:** Old data persists when starting new decision

**Bad:**
```typescript
const reset = () => {
  setState({
    phase: "idle",
    messages: [],
    // Forgot to reset optionA/optionB!
  });
};
```

**Good:**
```typescript
const reset = () => {
  idCounterRef.current = 0;  // Reset ID counter too!
  setState({
    phase: "idle",
    messages: [],
    currentQuestion: null,
    finalResult: null,
    error: null,
    roundCount: 0,
    searchCount: 0,
    optionA: "",
    optionB: "",
  });
};
```

**Location:** `hooks/useDecisionStream.ts:261-278`

---

## SSE / API Issues

### 8. Not Handling SSE Stream End

**Symptom:** Tests hang waiting for data

**Bad:**
```typescript
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  // Forgot to check done!
}
```

**Good:**
```typescript
while (true) {
  const { done, value } = await reader.read();
  if (done) break;  // Important!
  // Process value
}
```

---

### 9. Incorrect Content-Type Header

**Bad:**
```typescript
fetch("/api/decision", {
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});
```

**Good:**
```typescript
fetch("/api/decision", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

---

### 10. Forgetting to Parse SSE Events

**Bad:**
```typescript
const text = await response.text();
const data = JSON.parse(text);  // SSE is not valid JSON!
```

**Good:**
```typescript
const events = [];
const reader = response.body.getReader();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  buffer += new TextDecoder().decode(value);
  const lines = buffer.split("\n\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      events.push(JSON.parse(line.slice(6)));
    }
  }

  if (done) break;
}
```

---

## UI Issues

### 11. Option Values Not Displaying

**Symptom:** Shows "Option A" instead of actual value

**Cause:** Not passing values to ChatThread or not storing them

**Solution:**
```typescript
// page.tsx
<ChatThread
  optionA={state.optionA || "Option A"}  // Fallback if empty
  optionB={state.optionB || "Option B"}
/>
```

**Also check:** `useDecisionStream.ts` saves optionA/optionB on start

---

### 12. Question History Not Showing

**Symptom:** Old questions disappear after answering

**Cause:** Not saving question to messages array

**Solution:**
```typescript
// useDecisionStream.ts - handleEvent
case "question":
  setState((prev) => ({
    ...prev,
    messages: [
      ...prev.messages,
      {
        id: generateId(),
        type: "question",
        content: event.question,
        options: event.options,
        timestamp: Date.now(),
      },
    ],
  }));
```

---

## Environment Issues

### 13. API Key Not Working

**Checklist:**
1. File named `.env.local` (not `.env`)
2. No spaces around `=`
3. No quotes around values
4. Server restarted after changes

**Wrong:**
```bash
GEMINI_API_KEY = "your_key_here"
```

**Correct:**
```bash
GEMINI_API_KEY=your_key_here
```

---

### 14. Node Modules Out of Sync

**Symptom:** Weird import errors, type mismatches

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Testing Issues

### 15. Tests Fail Due to Port Change

**Symptom:**
```
connect ECONNREFUSED 127.0.0.1:3000
```

**Cause:** Next.js chose different port (3001, etc.)

**Solution:**
```bash
# Check actual port in server logs
# Then run tests with correct port:
API_URL=http://localhost:3001/api/decision npm run test:api
```

---

## Performance Issues

### 16. Unnecessary Re-renders

**Bad:**
```typescript
const handleChange = () => {
  setState({ ...state, value: newValue });  // New object every time
};
```

**Better:**
```typescript
const handleChange = useCallback((newValue) => {
  setState(prev => ({ ...prev, value: newValue }));
}, []);
```

**Or use React.memo for components:**
```typescript
export const MessageBubble = React.memo(function MessageBubble({ message }) {
  // ...
});
```

---

## Debugging Checklist

When something breaks:

1. [ ] Check browser console for errors
2. [ ] Check server logs (`server.log` or terminal)
3. [ ] Run TypeScript check: `npx tsc --noEmit`
4. [ ] Run API tests: `npm run test:api`
5. [ ] Verify environment variables in `.env.local`
6. [ ] Check network tab for API request/response
7. [ ] Add console.log statements in suspect functions
8. [ ] Verify all files are saved
9. [ ] Restart dev server: `Ctrl+C`, `npm run dev`
10. [ ] Clear browser cache / hard refresh

---

## Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Hydration error | Replace `Math.random()` with counter |
| Module not found | Check import path, run `npm install` |
| Type error | Run `npx tsc --noEmit`, fix all red squiggles |
| API 500 error | Check server logs, verify env vars |
| Tests hanging | Check port, kill existing node processes |
| Styles not applying | Check Tailwind class names, rebuild |
