"use client";

import { useDecisionStream } from "@/hooks/useDecisionStream";
import { InputForm } from "@/components/InputForm";
import { ChatThread } from "@/components/ChatThread";
import { DecisionInput } from "@/lib/types";

export default function Home() {
  const { state, startDecision, submitAnswer, reset } = useDecisionStream();

  const handleStart = (input: DecisionInput) => {
    startDecision(input);
  };

  const handleAnswer = (answer: string) => {
    submitAnswer(answer);
  };

  const isInputPhase = state.phase === "idle";
  const isLoading = state.phase === "initializing" || state.phase === "streaming";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Decision Agent
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered decision making through guided conversation
          </p>
        </header>

        {/* Main Content */}
        <main>
          {isInputPhase ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <InputForm onSubmit={handleStart} isLoading={isLoading} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chat Thread */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <ChatThread
                  messages={state.messages}
                  currentQuestion={state.currentQuestion}
                  optionA={state.optionA || "Option A"}
                  optionB={state.optionB || "Option B"}
                  onAnswer={handleAnswer}
                  isLoading={isLoading}
                />
              </div>

              {/* Reset button */}
              {state.phase === "complete" && (
                <button
                  onClick={reset}
                  className="w-full py-3 px-6 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  Start New Decision
                </button>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-400 dark:text-gray-600">
          <p>Powered by Gemini 3.1 Pro + Tavily Search</p>
        </footer>
      </div>
    </div>
  );
}
