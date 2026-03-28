"use server";

import { SearchResult } from "./types";

// Simple DuckDuckGo scraping as fallback when Tavily quota is exhausted
// Note: This is a basic implementation and may need adjustments based on DDG's HTML structure
export async function searchWithDuckDuckGo(query: string): Promise<SearchResult> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    const html = await response.text();

    // Parse results from HTML
    const results = parseDuckDuckGoResults(html);

    if (results.length === 0) {
      return {
        query,
        summary: "No search results found.",
        sources: [],
      };
    }

    return {
      query,
      summary: formatDuckDuckGoSummary(results),
      sources: results.map((r) => r.url).slice(0, 5),
    };
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return {
      query,
      summary: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      sources: [],
    };
  }
}

interface DDGResult {
  title: string;
  snippet: string;
  url: string;
}

function parseDuckDuckGoResults(html: string): DDGResult[] {
  const results: DDGResult[] = [];

  // Match result blocks
  const resultRegex =
    /<div class="result results_links[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
  const matches = html.match(resultRegex) || [];

  for (const match of matches.slice(0, 5)) {
    const titleMatch = match.match(
      /<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/
    );
    const snippetMatch = match.match(
      /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/
    );
    const urlMatch = match.match(/<a[^>]*href="([^"]*)"[^>]*class="result__url"/);

    if (titleMatch && snippetMatch) {
      const title = stripHtml(titleMatch[1]);
      const snippet = stripHtml(snippetMatch[1]);
      const url = urlMatch
        ? decodeURIComponent(urlMatch[1].replace(/^\/l\/\?kh=-?\d+&u=/, ""))
        : "";

      results.push({ title, snippet, url });
    }
  }

  return results;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .trim();
}

function formatDuckDuckGoSummary(results: DDGResult[]): string {
  return results
    .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet.slice(0, 200)}...`)
    .join("\n\n");
}
