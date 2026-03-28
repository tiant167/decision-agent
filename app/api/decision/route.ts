import { NextRequest } from "next/server";
import { DecisionRequest, SSEEvent } from "@/lib/types";
import { runDecisionStream, resumeWithAnswer } from "@/lib/gemini";

// Mark this route as dynamic since it uses server-sent events
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: DecisionRequest = await request.json();

    // Validate required fields
    if (!body.optionA || !body.optionB) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: optionA and optionB" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const isResuming = !!body.userAnswer;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          // Helper to send SSE event
          const sendEvent = (event: SSEEvent) => {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          };

          // Choose the appropriate generator based on whether we're resuming
          const generator = isResuming
            ? resumeWithAnswer(body)
            : runDecisionStream(body);

          // Process events from the generator
          for await (const event of generator) {
            switch (event.type) {
              case "thought":
                sendEvent({
                  type: "thought",
                  content: (event.data as { content: string }).content,
                });
                break;

              case "search":
                sendEvent({
                  type: "search",
                  query: (event.data as { query: string; provider: "tavily" | "duckduckgo" }).query,
                  provider: (event.data as { query: string; provider: "tavily" | "duckduckgo" }).provider,
                });
                break;

              case "search_result":
                sendEvent({
                  type: "search_result",
                  summary: (event.data as { summary: string; sources: string[] }).summary,
                  sources: (event.data as { summary: string; sources: string[] }).sources,
                });
                break;

              case "question":
                sendEvent({
                  type: "question",
                  question: (event.data as { question: string; options: string[]; allowCustom: boolean }).question,
                  options: (event.data as { question: string; options: string[]; allowCustom: boolean }).options,
                  allowCustom: (event.data as { question: string; options: string[]; allowCustom: boolean }).allowCustom,
                });
                // Close stream after question - client will reconnect with answer
                controller.close();
                return;

              case "final":
                sendEvent({
                  type: "final",
                  choice: (event.data as { choice: "A" | "B"; reason: string }).choice,
                  reason: (event.data as { choice: "A" | "B"; reason: string }).reason,
                });
                controller.close();
                return;

              case "error":
                sendEvent({
                  type: "error",
                  message: (event.data as { message: string }).message,
                });
                controller.close();
                return;
            }
          }

          // If generator ends without explicit close
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
