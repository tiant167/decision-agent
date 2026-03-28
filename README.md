# Decision Agent

AI-powered decision making through guided conversation. An intelligent agent that helps you make binary decisions by asking targeted questions and searching the web for relevant information.

## How It Works

1. Enter two options you're deciding between (e.g., "MacBook Pro" vs "Dell XPS 15")
2. The AI asks clarifying questions to understand your needs (up to 5 rounds)
3. It searches the web for relevant information using Tavily/DuckDuckGo
4. It provides a final recommendation with reasoning

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Model | Gemini 3.1 Pro |
| Search | Tavily (primary), DuckDuckGo (fallback) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Gemini API key
- Tavily API key (optional, DuckDuckGo works as fallback)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test:api     # Run API integration tests
npx tsc --noEmit     # Type check only
```

## Documentation

See [AGENTS.md](AGENTS.md) for the full documentation map, including architecture, API spec, and development guides.

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new). See [Deployment Guide](docs/DEPLOYMENT.md) for details.
