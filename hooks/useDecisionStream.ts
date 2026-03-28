"use client";

import { useState, useCallback, useRef } from "react";
import {
  DecisionInput,
  DecisionState,
  Message,
  DecisionRequest,
  SSEEvent,
} from "@/lib/types";

export function useDecisionStream() {
  const [state, setState] = useState<DecisionState>({
    phase: "idle",
    messages: [],
    currentQuestion: null,
    finalResult: null,
    error: null,
    roundCount: 0,
    searchCount: 0,
    optionA: "",
    optionB: "",
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingRequestRef = useRef<DecisionRequest | null>(null);
  const idCounterRef = useRef(0);

  const generateId = () => {
    idCounterRef.current += 1;
    return `msg-${idCounterRef.current}`;
  };

  const startDecision = useCallback(async (input: DecisionInput) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      phase: "initializing",
      messages: [],
      currentQuestion: null,
      finalResult: null,
      error: null,
      roundCount: 0,
      searchCount: 0,
      optionA: input.optionA,
      optionB: input.optionB,
    });

    const request: DecisionRequest = {
      optionA: input.optionA,
      optionB: input.optionB,
      scenario: input.scenario,
      history: [],
      roundCount: 0,
      searchCount: 0,
    };

    pendingRequestRef.current = request;
    await connectStream(request);
  }, []);

  const connectStream = async (request: DecisionRequest) => {
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start decision");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      setState((prev) => ({ ...prev, phase: "streaming" }));

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const event: SSEEvent = JSON.parse(line.slice(6));
            handleEvent(event);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const handleEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "thought":
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              type: "thought",
              content: event.content,
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case "search":
        setState((prev) => ({
          ...prev,
          searchCount: prev.searchCount + 1,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              type: "search",
              query: event.query,
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case "search_result":
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              type: "search_result",
              summary: event.summary,
              sources: event.sources,
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case "question":
        setState((prev) => ({
          ...prev,
          phase: "waiting",
          currentQuestion: {
            question: event.question,
            options: event.options,
            allowCustom: event.allowCustom,
          },
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              type: "question",
              content: event.question,
              options: event.options,
              allowCustom: event.allowCustom,
              timestamp: Date.now(),
            },
          ],
        }));
        // Update pending request with current state
        if (pendingRequestRef.current) {
          pendingRequestRef.current = {
            ...pendingRequestRef.current,
            roundCount: (pendingRequestRef.current.roundCount || 0) + 1,
          };
        }
        break;

      case "final":
        setState((prev) => ({
          ...prev,
          phase: "complete",
          currentQuestion: null,
          finalResult: {
            choice: event.choice,
            reason: event.reason,
          },
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              type: "final",
              choice: event.choice,
              reason: event.reason,
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case "error":
        setState((prev) => ({
          ...prev,
          phase: "error",
          error: event.message,
          messages: [
            ...prev.messages,
            {
              id: generateId(),
              type: "error",
              content: event.message,
              timestamp: Date.now(),
            },
          ],
        }));
        break;
    }
  };

  const submitAnswer = useCallback(async (answer: string) => {
    if (!pendingRequestRef.current) return;

    // Add answer to messages
    setState((prev) => ({
      ...prev,
      phase: "streaming",
      currentQuestion: null,
      messages: [
        ...prev.messages,
        {
          id: generateId(),
          type: "answer",
          content: answer,
          timestamp: Date.now(),
        },
      ],
    }));

    // Update history and reconnect
    const updatedRequest: DecisionRequest = {
      ...pendingRequestRef.current,
      history: [
        ...(pendingRequestRef.current.history || []),
        { role: "assistant", content: pendingRequestRef.current.userAnswer || "" },
        { role: "user", content: answer },
      ],
      userAnswer: answer,
    };

    pendingRequestRef.current = updatedRequest;
    await connectStream(updatedRequest);
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    pendingRequestRef.current = null;
    idCounterRef.current = 0;
    setState({
      phase: "idle",
      messages: [],
      currentQuestion: null,
      finalResult: null,
      error: null,
      roundCount: 0,
      searchCount: 0,
      optionA: "",
      optionB: "",
    });
  }, []);

  return {
    state,
    startDecision,
    submitAnswer,
    reset,
  };
}
