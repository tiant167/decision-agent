# Decision Agent - Project Goals

## Overview
An AI-powered decision assistant that helps users choose between two options through an interactive, multi-turn conversation. The agent uses search capabilities and targeted questions to gather context, ultimately providing a clear recommendation with reasoning.

## Core Value Proposition
- **Simplify complex decisions** by breaking them down into structured comparisons
- **Reduce decision fatigue** through guided, step-by-step reasoning
- **Provide confidence** in choices through transparent AI reasoning and research

## Target Users
- Individuals facing everyday decisions (purchase decisions, lifestyle choices, etc.)
- Professionals weighing options (tools, strategies, approaches)
- Anyone wanting structured guidance for binary choices

## Success Criteria
1. User can input any two comparable options and get a clear recommendation
2. AI asks relevant, contextual questions to narrow down preferences
3. Search integration provides real-world data to inform decisions
4. Final output includes both the choice and concise justification
5. Entire interaction completes within 5 user Q&A rounds
6. Streamed responses create engaging, transparent experience

## Non-Goals
- Multi-option comparison (strictly binary)
- Persistent user accounts or history
- Social sharing features
- Multi-language support (English only)

## Technical Constraints
- Deploy on Vercel (free tier)
- Use Gemini 2.5 Pro Preview for reasoning
- Tavily as primary search, DuckDuckGo as fallback
- Stateless architecture (no database)
- Single-page application
