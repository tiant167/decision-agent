"use client";

import { useState } from "react";
import Image from "next/image";
import { useDecisionStream } from "@/hooks/useDecisionStream";
import { InputForm } from "@/components/InputForm";
import { ChatThread } from "@/components/ChatThread";
import { ExampleScenarios } from "@/components/ExampleScenarios";
import { DecisionInput, ExampleScenario } from "@/lib/types";

interface ClientHomeProps {
  examples: ExampleScenario[];
}

export function ClientHome({ examples }: ClientHomeProps) {
  const { state, startDecision, submitAnswer, reset } = useDecisionStream();
  const [formValues, setFormValues] = useState<DecisionInput | undefined>();

  const handleStart = (input: DecisionInput) => {
    startDecision(input);
  };

  const handleAnswer = (answer: string) => {
    submitAnswer(answer);
  };

  const handleExampleSelect = (input: DecisionInput) => {
    setFormValues(input);
  };

  const isInputPhase = state.phase === "idle";
  const isLoading = state.phase === "initializing" || state.phase === "streaming";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-10">
          {/* Logo Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-5 p-3">
            <Image
              src="/icon.png"
              alt="Decision Agent"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Decision Agent
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            AI-Powered Decision Making Assistant
            <br className="hidden sm:block" />
            <span className="text-sm md:text-base">Make better choices through guided conversation</span>
          </p>

          {/* Decorative Line */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {isInputPhase ? (
            <>
              {/* Example Scenarios - Now above the form */}
              <div className="mb-6">
                <ExampleScenarios examples={examples} onSelect={handleExampleSelect} />
              </div>

              {/* Input Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 p-6 md:p-8 border border-gray-100 dark:border-gray-700">
                <InputForm
                  onSubmit={handleStart}
                  isLoading={isLoading}
                  initialValues={formValues}
                />
              </div>

              {/* Features */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-500">✨</span>
                  <span>AI-Powered Analysis</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500">🌐</span>
                  <span>Real-time Web Search</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500">⚡</span>
                  <span>5-Step Quick Decision</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Chat Thread */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
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
                  className="w-full py-3 px-6 rounded-xl
                             bg-gray-100 dark:bg-gray-700
                             hover:bg-gray-200 dark:hover:bg-gray-600
                             text-gray-700 dark:text-gray-300 font-medium
                             transition-all duration-200
                             hover:-translate-y-0.5"
                >
                  Start New Decision
                </button>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Powered by Gemini 3.1 Pro + Tavily Search
          </p>
        </footer>
      </div>
    </div>
  );
}
