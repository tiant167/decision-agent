# Decision Agent - Pitfalls & Lessons Learned

This document captures hard-earned lessons from building this project. Read this before debugging!

## Critical Issues

### 1. Model Name Mismatch

**Problem:** Gemini API returns 404 for model names

**Error:**
```
[404 Not Found] models/gemini-2.5-pro-preview-05-06 is not found
```

**Solution:**
Use the exact model name: `gemini-3.1-pro-preview`

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-3.1-pro-preview",  // ✓ Correct
  // model: "gemini-2.5-pro-preview-05-06",  // ✗ Wrong
  // model: "gemini-1.5-pro",  // ✗ Wrong
  // model: "gemini-pro",  // ✗ Wrong
});
```

**Location:** `lib/gemini.ts:135`

**Note:** This is explicitly set by user requirements. Do NOT change without explicit approval.

---

### 2. AsyncGenerator Type Issues

**Problem:** TypeScript `AsyncGenerator<>` type causes Next.js compilation errors

**Error:**
```
Expression expected
yield { type: "error", data: { message: "..." } };
^^^^^
```

**Solution:**
Use `any` type for generator functions:

```typescript
// ✓ Correct
export async function* runDecisionStream(
  request: DecisionRequest
): any {
  // ...
}

// ✗ Causes compilation error
export async function* runDecisionStream(
  request: DecisionRequest
): AsyncGenerator<{ type: string; data?: unknown }> {
  // ...
}
```

**Location:** `lib/gemini.ts:130`, `lib/gemini.ts:274`

**Root Cause:** Next.js 16 Turbopack has issues with complex generator type annotations.

---

### 3. Generator Function Syntax

**Problem:** Missing `*` in async generator function declaration

**Error:**
```
Expression expected
yield { type: "error", data: { message: "..." } };
```

**Solution:**
Must use `function*` syntax:

```typescript
// ✓ Correct
export async function* resumeWithAnswer(
  request: DecisionRequest
): any {
  // ...
}

// ✗ Missing asterisk
export async function resumeWithAnswer(
  request: DecisionRequest
): any {
  // ...
}
```

**Location:** `lib/gemini.ts:274`

---

### 4. SchemaType.Enum Issue

**Problem:** Gemini FunctionDeclaration enum type causes TypeScript errors

**Error:**
```
Type '{ type: SchemaType.STRING; enum: string[]; description: string; }' is not assignable
Property 'format' is missing in type '...' but required in type 'EnumStringSchema'
```

**Solution:**
Remove `enum` field, use description instead:

```typescript
// ✓ Correct
choice: {
  type: SchemaType.STRING,
  description: "The chosen option: 'A' or 'B'. Must be either 'A' or 'B'.",
}

// ✗ Causes TypeScript error
choice: {
  type: SchemaType.STRING,
  enum: ["A", "B"],
  description: "The chosen option: 'A' or 'B'",
}
```

**Location:** `lib/gemini.ts:69-76`

---

## Configuration Issues

### 5. Invalid next.config.ts Options

**Problem:** Using experimental features that don't exist

**Warning:**
```
Unrecognized key(s) in object: 'streamingMetadata' at "experimental"
```

**Solution:**
Remove invalid options:

```typescript
// ✓ Correct
const nextConfig: NextConfig = {
  output: "standalone",
};

// ✗ Invalid option
const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    streamingMetadata: true,  // Doesn't exist
  },
};
```

**Location:** `next.config.ts`

---

## Environment Issues

### 6. Missing Environment Variables

**Problem:** API calls fail without clear error

**Solution:**
Always check `.env.local` exists with required keys:

```bash
GEMINI_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

**Test:** `npm run test:api` will fail with clear error if missing.

---

## Search Implementation

### 7. Tavily Quota Exhaustion

**Problem:** Tavily API has usage limits

**Solution:**
Implemented DuckDuckGo fallback:

```typescript
let searchResult: SearchResult;
try {
  searchResult = await searchWithTavily(query);
} catch (error) {
  // Fallback to DuckDuckGo
  searchResult = await searchWithDuckDuckGo(query);
}
```

**Note:** DuckDuckGo fallback uses HTML scraping and may break if DDG changes their layout.

**Location:** `lib/gemini.ts:194-205`

---

## Testing Issues

### 8. Port Conflicts

**Problem:** Next.js dev server port already in use

**Log:**
```
Port 3000 is in use by process XXXXX
```

**Solution:**
Either:
1. Kill existing process: `kill 49870`
2. Let Next.js auto-select new port (3001, etc.)
3. Update test API_URL: `API_URL=http://localhost:3001/api/decision npm run test:api`

---

### 9. Module Type Issues in Tests

**Problem:** ts-node module resolution issues

**Warning:**
```
Module type of file is not specified and it doesn't parse as CommonJS
```

**Solution:**
This warning is harmless. The code runs correctly as ESM.

To eliminate warning, could add `"type": "module"` to package.json, but not necessary.

---

## API Integration Issues

### 10. SSE Event Parsing

**Problem:** SSE events must be parsed correctly

**Format:**
```
data: {"type":"thought","content":"..."}\n\n
```

**Note:** Must split on `\n\n` (double newline), handle partial chunks.

**Location:** `tests/api.test.ts:19-46`

---

## Debugging Tips

### Enable Debug Logging

```typescript
// Add to lib/gemini.ts
console.log("Function call:", name, args);
console.log("Search result:", searchResult);
```

### Check Server Logs

```bash
tail -f server.log  # If running in background
# or
npm run dev  # For foreground with full logs
```

### Test API in Isolation

```bash
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"optionA":"A","optionB":"B","scenario":"test"}'
```

---

## File Locations Quick Reference

| Component | File |
|-----------|------|
| AI Integration | `lib/gemini.ts` |
| Search (Primary) | `lib/tavily.ts` |
| Search (Fallback) | `lib/duckduckgo.ts` |
| Types | `lib/types.ts` |
| API Route | `app/api/decision/route.ts` |
| State Hook | `hooks/useDecisionStream.ts` |
| Input Form | `components/InputForm.tsx` |
| Chat Display | `components/ChatThread.tsx` |
| Tests | `tests/api.test.ts` |
| Config | `next.config.ts`, `.env.local` |
