<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Decision Agent - Documentation Map

This document serves as a navigation hub for all project documentation.

## Quick Links

### For New Team Members (Read These First)
1. [Architecture Overview](docs/ARCHITECTURE.md) - System design and data flow
2. [Getting Started](docs/GETTING_STARTED.md) - Setup and first run
3. [Pitfalls & Lessons Learned](docs/PITFALLS.md) - Avoid these mistakes
4. [Common Mistakes](docs/COMMON_MISTAKES.md) - Frequently encountered issues

### Development References
- [Implementation Plan](docs/PLAN.md) - Step-by-step implementation guide
- [Design Decisions](docs/DESIGN.md) - UI/UX rationale and choices
- [API Specification](docs/API_SPEC.md) - Endpoint details and examples
- [Testing Guide](docs/TESTING.md) - How to test the application

### Configuration & Deployment
- [Configuration Guide](CONFIG.md) - Environment variables and settings
- [Deployment Guide](docs/DEPLOYMENT.md) - Deploy to Vercel

## Project Structure

```
decision-agent/
├── app/                      # Next.js App Router
│   ├── api/decision/         # SSE API endpoint
│   ├── api/cron/             # Cron job endpoints
│   │   └── update-examples/  # Daily trending examples update
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page (Server Component)
├── components/               # React components
│   ├── ClientHome.tsx        # Client-side home wrapper
│   ├── InputForm.tsx         # Initial input form
│   ├── ExampleScenarios.tsx  # Dynamic example grid
│   ├── QuestionCard.tsx      # Question display
│   ├── ChatThread.tsx        # Message thread
│   └── ...
├── hooks/                    # Custom React hooks
│   └── useDecisionStream.ts  # Core state management
├── lib/                      # Utilities
│   ├── types.ts              # TypeScript definitions
│   ├── gemini.ts             # Gemini AI integration
│   ├── examples-generator.ts # Trending examples generation
│   ├── tavily.ts             # Tavily search
│   └── duckduckgo.ts         # Fallback search
├── scripts/                  # Utility scripts
│   └── test-examples.ts      # Test example generation locally
├── tests/                    # Test files
│   └── api.test.ts           # API integration tests
├── docs/                     # Documentation (this folder)
└── ...config files
```

## Technology Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Model | Gemini 3.1 Pro |
| Search | Tavily (primary), DuckDuckGo (fallback) |
| Config Storage | Vercel Edge Config |
| Scheduled Tasks | Vercel Cron Jobs |
| Deployment | Vercel |
| Git Hooks | Husky + gitleaks |

## Available Scripts

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run test:api       # Run API integration tests
npm run examples:test  # Test trending examples generation locally
npm run examples:update # Manually trigger example update (requires dev server)
npm run docs:check     # Verify documentation sync
npx tsc --noEmit       # Type check only
```

## Key Decisions

- **Stateless Architecture**: No database, session stored in React state
- **SSE Streaming**: Real-time updates via Server-Sent Events
- **Single Page**: All interaction happens in one view
- **Max 5 Rounds**: Hard limit on Q&A rounds to ensure timely decisions
- **Dynamic Examples**: Homepage examples auto-update daily via Vercel Cron + Edge Config

## Important Notes

⚠️ **Model Name**: Always use `gemini-3.1-pro-preview` - see [Pitfalls](docs/PITFALLS.md#model-name)

⚠️ **Hydration**: Avoid `Math.random()` in render - use deterministic IDs - see [Common Mistakes](docs/COMMON_MISTAKES.md#hydration-errors)

⚠️ **AsyncGenerator**: Type annotation issues with Next.js compiler - use `any` type - see [Pitfalls](docs/PITFALLS.md#typescript-issues)

## Contributing

Before making changes:
1. Read the [Architecture](docs/ARCHITECTURE.md) doc
2. Check [Pitfalls](docs/PITFALLS.md) for known issues
3. Run tests: `npm run test:api`
4. Ensure TypeScript compiles: `npx tsc --noEmit`
5. **Verify documentation is in sync**: `npm run docs:check`

### Manual Documentation Check

To check documentation sync manually:

```bash
npm run docs:check
```

This will verify:
- All required docs exist and are not empty
- Model names match between code and docs
- API events are documented
- Navigation links are valid
