"use server";

import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  FunctionCallingMode,
  SchemaType,
} from "@google/generative-ai";
import { DecisionRequest, ToolCall, SearchResult } from "./types";
import { searchWithTavily } from "./tavily";
import { searchWithDuckDuckGo } from "./duckduckgo";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MAX_ROUNDS = 5;
const MAX_SEARCHES = 5;

// Function declarations for Gemini
const searchFunction: FunctionDeclaration = {
  name: "search",
  description:
    "Search for information to help inform the decision between Option A and Option B. Use this when you need real-world data, specifications, reviews, or comparisons.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "The search query to execute",
      },
      reason: {
        type: SchemaType.STRING,
        description: "Why this search is needed for the decision",
      },
    },
    required: ["query", "reason"],
  },
};

const askQuestionFunction: FunctionDeclaration = {
  name: "askQuestion",
  description:
    "Ask the user a multiple-choice question to better understand their preferences or constraints. Use this to gather more context before making a decision.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      question: {
        type: SchemaType.STRING,
        description: "The question to ask the user",
      },
      options: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "2-4 predefined options for the user to choose from",
      },
      allowCustom: {
        type: SchemaType.BOOLEAN,
        description:
          "Whether to allow the user to enter a custom answer (default: true)",
      },
    },
    required: ["question", "options"],
  },
};

const finalizeFunction: FunctionDeclaration = {
  name: "finalize",
  description:
    "Make the final decision between Option A and Option B. Use this when you have gathered enough information and are confident in your recommendation.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      choice: {
        type: SchemaType.STRING,
        description: "The chosen option: 'A' or 'B'. Must be either 'A' or 'B'.",
      },
      reason: {
        type: SchemaType.STRING,
        description:
          "A concise explanation (max 200 characters) for why this option is recommended",
      },
    },
    required: ["choice", "reason"],
  },
};

function buildSystemPrompt(request: DecisionRequest): string {
  const roundCount = request.roundCount || 0;
  const searchCount = request.searchCount || 0;

  return `You are a Decision Agent helping users choose between two options.

Current Decision:
- Option A: ${request.optionA}
- Option B: ${request.optionB}
- Context/Scenario: ${request.scenario || "Not specified"}

Constraints:
- Maximum ${MAX_ROUNDS} rounds of user Q&A (currently at round ${roundCount})
- Maximum ${MAX_SEARCHES} searches total (currently used ${searchCount})
- Decision must be made by the end of round ${MAX_ROUNDS}

Your task:
1. Think through what information you need to make a good recommendation
2. Use search to gather relevant facts, specs, reviews, or comparisons
3. Ask targeted questions to understand user priorities
4. When confident, finalize with a clear choice and concise reason

Available tools:
- search: Use when you need factual information (costs 1 search)
- askQuestion: Use to get user input (advances round count)
- finalize: Use when ready to make the decision

Guidelines:
- Explain your reasoning as you think
- Be concise but thorough
- If search quota exhausted, rely on general knowledge
- Always provide a clear, justified final recommendation
- The final reason should be brief (under 200 characters)

${request.history?.length ? "Previous conversation:\n" + formatHistory(request.history) : ""}`;
}

function formatHistory(
  history: Array<{ role: string; content: string }>
): string {
  return history.map((h) => `${h.role === "assistant" ? "AI" : "User"}: ${h.content}`).join("\n");
}

export async function* runDecisionStream(
  request: DecisionRequest
): any {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-pro-preview",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const chat = model.startChat({
      tools: [
        { functionDeclarations: [searchFunction, askQuestionFunction, finalizeFunction] },
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
    });

    // Send initial system prompt
    const systemPrompt = buildSystemPrompt(request);

    let currentResponse = await chat.sendMessage(systemPrompt);
    let response = currentResponse.response;

    // Process function calls until we get a final response
    while (true) {
      const functionCalls = response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        // No function calls - this shouldn't happen in our design
        yield { type: "error", data: { message: "Unexpected response from AI" } };
        return;
      }

      const functionCall = functionCalls[0];
      const name = functionCall.name;
      const args = functionCall.args as Record<string, unknown>;

      if (name === "search") {
        const query = args.query as string;
        const reason = args.reason as string;

        // Check search limit
        const currentSearches = request.searchCount || 0;
        if (currentSearches >= MAX_SEARCHES) {
          yield {
            type: "thought",
            data: { content: "Search limit reached. Proceeding with available information." },
          };
          const result = await chat.sendMessage(
            "Search quota exhausted. Please proceed with your current knowledge or ask the user a question."
          );
          response = result.response;
          continue;
        }

        yield { type: "thought", data: { content: `Searching: ${reason}` } };
        yield { type: "search", data: { query, provider: "tavily" } };

        // Perform search with fallback
        let searchResult: SearchResult;
        try {
          searchResult = await searchWithTavily(query);
        } catch (error) {
          yield {
            type: "thought",
            data: { content: "Tavily failed, trying DuckDuckGo fallback..." },
          };
          yield { type: "search", data: { query, provider: "duckduckgo" } };
          searchResult = await searchWithDuckDuckGo(query);
        }

        yield {
          type: "search_result",
          data: {
            summary: searchResult.summary,
            sources: searchResult.sources,
          },
        };

        // Send search results back to model
        const result = await chat.sendMessage(
          `Search results for "${query}":\n${searchResult.summary}\n\nSources: ${searchResult.sources.join(", ")}`
        );
        response = result.response;
        request.searchCount = (request.searchCount || 0) + 1;
      } else if (name === "askQuestion") {
        const question = args.question as string;
        const options = args.options as string[];
        const allowCustom = (args.allowCustom as boolean) ?? true;

        // Check round limit
        const currentRound = request.roundCount || 0;
        if (currentRound >= MAX_ROUNDS) {
          yield {
            type: "thought",
            data: {
              content:
                "Maximum rounds reached. Must make a final decision now.",
            },
          };
          const result = await chat.sendMessage(
            "Maximum Q&A rounds reached. You must call finalize() now with your decision."
          );
          response = result.response;
          continue;
        }

        yield {
          type: "question",
          data: { question, options, allowCustom },
        };
        return; // Pause and wait for user answer
      } else if (name === "finalize") {
        const choice = args.choice as "A" | "B";
        const reason = args.reason as string;

        yield { type: "final", data: { choice, reason } };
        return;
      } else {
        yield {
          type: "error",
          data: { message: `Unknown function call: ${name}` },
        };
        return;
      }
    }
  } catch (error) {
    console.error("Decision stream error:", error);
    yield {
      type: "error",
      data: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

export async function* resumeWithAnswer(
  request: DecisionRequest
): any {
  if (!request.userAnswer) {
    yield { type: "error", data: { message: "No answer provided" } };
    return;
  }

  // Add the answer to history and continue
  const updatedRequest = {
    ...request,
    history: [
      ...(request.history || []),
      { role: "user" as const, content: request.userAnswer },
    ],
    roundCount: (request.roundCount || 0) + 1,
    userAnswer: undefined,
  };

  yield* runDecisionStream(updatedRequest);
}
