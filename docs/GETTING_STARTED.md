# Decision Agent - Getting Started

Welcome to the Decision Agent project! This guide will get you up and running in minutes.

## Prerequisites

- Node.js 18+ (check with `node --version`)
- npm or yarn
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd decision-agent/decision-agent-app
npm install
```

### 2. Configure Environment

Copy the example file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```bash
# Get from https://ai.google.dev/
GEMINI_API_KEY=your_gemini_api_key_here

# Get from https://tavily.com/
TAVILY_API_KEY=your_tavily_api_key_here
```

**Note:** Tavily has a free tier with generous limits. Gemini also offers free tier.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Run Tests

In another terminal:

```bash
npm run test:api
```

All 5 tests should pass.

## Project Structure Overview

```
decision-agent-app/
├── app/                  # Next.js App Router
│   ├── api/decision/     # SSE API endpoint
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/           # React components
├── hooks/                # Custom hooks
├── lib/                  # Utilities & integrations
├── tests/                # Test files
└── docs/                 # Documentation
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/gemini.ts` | AI integration (Gemini) |
| `lib/tavily.ts` | Search integration |
| `hooks/useDecisionStream.ts` | Core state management |
| `app/api/decision/route.ts` | API endpoint |

## Development Workflow

### Making Changes

1. **Start dev server:** `npm run dev`
2. **Make your changes**
3. **Check TypeScript:** `npx tsc --noEmit`
4. **Run tests:** `npm run test:api`
5. **Test manually** at `http://localhost:3000`

### Before Committing

```bash
# Check types
npx tsc --noEmit

# Run tests
npm run test:api

# Lint (optional)
npm run lint
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server

# Testing
npm run test:api     # Run API tests

# Utilities
npx tsc --noEmit     # Type check only
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Node Modules Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check specific file
npx tsc --noEmit --project tsconfig.json
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `TAVILY_API_KEY` | Yes | Tavily search API key |

## Next Steps

- Read [Architecture](ARCHITECTURE.md) to understand the system
- Read [Pitfalls](PITFALLS.md) to avoid common mistakes
- Read [Design](DESIGN.md) for UI/UX decisions

## Getting Help

- Check [Common Mistakes](COMMON_MISTAKES.md)
- Review [Pitfalls](PITFALLS.md)
- Check server logs for errors
- Run tests to verify setup
