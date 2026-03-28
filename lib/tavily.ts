"use server";

import { SearchResult } from "./types";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const MAX_RESULTS = 5;

export async function searchWithTavily(query: string): Promise<SearchResult> {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: MAX_RESULTS,
      include_answer: true,
      include_sources: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily API error: ${error}`);
  }

  const data = await response.json();

  return {
    query,
    summary: data.answer || formatResultsSummary(data.results),
    sources: data.results?.map((r: { url: string; title: string }) => r.url) || [],
  };
}

function formatResultsSummary(results: Array<{ title: string; content: string }>): string {
  if (!results || results.length === 0) {
    return "No results found.";
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}: ${r.content.slice(0, 200)}...`)
    .join("\n\n");
}