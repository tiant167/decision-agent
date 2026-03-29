"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchWithTavily } from "./tavily";
import { searchWithDuckDuckGo } from "./duckduckgo";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ExampleScenario {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  optionA: string;
  optionB: string;
}

/**
 * Fetch trending topics using search APIs
 */
async function fetchTrendingTopics(): Promise<string[]> {
  const currentYear = new Date().getFullYear();

  const queries = [
    "trending news today",
    "latest technology releases",
    "popular consumer products",
    "current entertainment releases",
    `latest gadgets ${currentYear}`,
  ];

  const topics: string[] = [];

  for (const query of queries) {
    try {
      const result = await searchWithTavily(query);
      if (result.summary) {
        topics.push(result.summary);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Tavily failed for "${query}": ${errorMessage}`);

      try {
        const result = await searchWithDuckDuckGo(query);
        if (result.summary) {
          topics.push(result.summary);
        }
      } catch (ddgError) {
        const ddgErrorMessage = ddgError instanceof Error ? ddgError.message : String(ddgError);
        console.error(`Both search providers failed for "${query}": ${ddgErrorMessage}`);
      }
    }
  }

  return topics;
}

/**
 * Generate example scenarios using Gemini based on trending topics
 */
async function generateExamplesWithAI(topics: string[]): Promise<ExampleScenario[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro-preview",
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    },
  });

  const currentYear = new Date().getFullYear();

  const prompt = `Based on the following trending topics and news, generate 4 engaging comparison scenarios for ${currentYear}.

Trending Topics:
${topics.join("\n\n")}

Generate exactly 4 comparison scenarios that reflect current trends. Each scenario should be a common decision people might face.

Requirements:
- Each scenario must have two clear options (Option A and Option B)
- Use relevant emojis for each scenario
- Titles should be concise (2-3 words)
- Scenarios should start with "Which one should I" followed by a verb
- Options should be specific and comparable
- Reflect current trends, products, or events from the topics above

Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON.

Example:
[
  {"id":"1","emoji":"📱","title":"Smartphone","scenario":"Which one should I buy","optionA":"iPhone 16 Pro","optionB":"Samsung S24 Ultra"},
  {"id":"2","emoji":"💻","title":"Laptop","scenario":"Which one should I choose","optionA":"MacBook Pro","optionB":"Dell XPS"}
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from the response
  // Try markdown code block first, then plain array
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = codeBlockMatch ? codeBlockMatch[1] : text;
  const jsonMatch = jsonText.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    console.error("Could not find JSON array in response. Raw text:");
    console.error(text.slice(0, 1000));
    throw new Error("Failed to extract JSON from AI response");
  }

  const scenarios = JSON.parse(jsonMatch[0]) as ExampleScenario[];

  // Validate and sanitize
  return scenarios.map((scenario, index) => ({
    id: String(index + 1),
    emoji: scenario.emoji || "🤔",
    title: scenario.title || "Decision",
    scenario: scenario.scenario || "Which one should I choose",
    optionA: scenario.optionA || "Option A",
    optionB: scenario.optionB || "Option B",
  }));
}

/**
 * Fallback examples when generation fails
 */
const fallbackExamples: ExampleScenario[] = [
  {
    id: "1",
    emoji: "🖥️",
    title: "Buy Laptop",
    scenario: "Which one should I buy",
    optionA: "MacBook Pro",
    optionB: "Windows Laptop",
  },
  {
    id: "2",
    emoji: "✈️",
    title: "Travel",
    scenario: "Which one should I choose",
    optionA: "Japan",
    optionB: "Thailand",
  },
  {
    id: "3",
    emoji: "🏃",
    title: "Fitness",
    scenario: "Which one should I start",
    optionA: "Running",
    optionB: "Gym",
  },
  {
    id: "4",
    emoji: "📱",
    title: "New Phone",
    scenario: "Which one should I buy",
    optionA: "iPhone",
    optionB: "Android",
  },
];

/**
 * Generate trending examples
 * Returns fallback examples if generation fails
 */
export async function generateTrendingExamples(): Promise<ExampleScenario[]> {
  try {
    const topics = await fetchTrendingTopics();

    if (topics.length === 0) {
      console.warn("No trending topics fetched, using fallback examples");
      return fallbackExamples;
    }

    const examples = await generateExamplesWithAI(topics);

    if (examples.length < 4) {
      console.warn("Not enough examples generated, supplementing with fallback");
      return [...examples, ...fallbackExamples.slice(examples.length)];
    }

    return examples.slice(0, 4);
  } catch (error) {
    console.error("Failed to generate trending examples:", error);
    return fallbackExamples;
  }
}
