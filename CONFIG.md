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

Optional environment variables for trending examples feature:

```bash
# Vercel Edge Config (stores trending examples)
# Format: https://edge-config.vercel.com/ecfg_<id>?token=<token>
# Copy from Vercel Dashboard → Storage → Edge Config → Connect
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_your_config_id?token=your_token

# Vercel API Token (for writing to Edge Config via Cron API)
# Create at: Vercel Dashboard → Settings → Tokens
VERCEL_TOKEN=your_vercel_api_token

# Cron Secret (secures the update endpoint)
CRON_SECRET=your_random_secret_here
```

## Trending Examples Feature

The Decision Agent can automatically update homepage examples with trending topics.

### Setup

1. Create Edge Config in Vercel Dashboard
2. Add `EDGE_CONFIG` environment variable with the connection string
3. Generate a random `CRON_SECRET` for API security
4. Deploy to Vercel (cron jobs only work on deployed environments)

### Manual Update

Trigger example update manually:
```bash
npm run examples:update
```

Or via curl:
```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/update-examples
```

### Cron Schedule

Examples are automatically updated daily at 9:00 AM UTC.
Configure in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/update-examples",
    "schedule": "0 9 * * *"
  }]
}
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
