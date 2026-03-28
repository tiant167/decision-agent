# Decision Agent Configuration

## Model Configuration

**Gemini Model:** `gemini-3.1-pro-preview`

This is the specific model version required for the Decision Agent. Do NOT change this model name without explicit user approval.

Location: `lib/gemini.ts` line 135

## Environment Variables

Required environment variables:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

## API Testing

Run integration tests:
```bash
npm run test:api
```

Tests verify:
1. Request validation (empty fields return 400)
2. SSE stream initialization
3. Search functionality
4. Question/Answer flow
5. Final decision output
