"use client";

import { useEffect, useState } from "react";
import { DecisionInput } from "@/lib/types";

interface InputFormProps {
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
  initialValues?: Partial<DecisionInput> & { scenario?: string };
}

export function InputForm({ onSubmit, isLoading, initialValues }: InputFormProps) {
  // Parse scenario to extract verb if it follows "Which one should I [verb]" pattern
  const parseScenarioToVerb = (scenario?: string): string => {
    if (!scenario) return "";
    const match = scenario.match(/^Which one should I (\w+)/i);
    return match ? match[1] : "";
  };

  const [verb, setVerb] = useState(parseScenarioToVerb(initialValues?.scenario));
  const [optionA, setOptionA] = useState(initialValues?.optionA || "");
  const [optionB, setOptionB] = useState(initialValues?.optionB || "");

  // Update form when initialValues change (from example scenarios)
  useEffect(() => {
    if (initialValues) {
      setVerb(parseScenarioToVerb(initialValues.scenario));
      setOptionA(initialValues.optionA || "");
      setOptionB(initialValues.optionB || "");
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedVerb = verb.trim();
    const scenario = trimmedVerb ? `Which one should I ${trimmedVerb}` : "";

    onSubmit({
      optionA,
      optionB,
      scenario,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          What decision are you struggling with?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tell us your two options and let AI help you analyze
        </p>
      </div>

      <div className="space-y-6">
        {/* Verb Input - Full width with better layout */}
        <div>
          <label
            htmlFor="verb"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            What do you want to decide?
          </label>
          <input
            type="text"
            id="verb"
            name="verb"
            value={verb}
            onChange={(e) => setVerb(e.target.value)}
            required
            placeholder="buy, choose, use, learn, start..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800
                       text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       focus:shadow-lg focus:shadow-indigo-500/10
                       transition-all duration-200"
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Enter a verb that describes your decision scenario
          </p>
        </div>

        {/* Options Container */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Compare two options
          </label>

          <div className="relative">
            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    A
                  </span>
                </div>
                <input
                  type="text"
                  id="optionA"
                  name="optionA"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  required
                  placeholder="e.g., MacBook Pro"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800
                             text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             focus:shadow-lg focus:shadow-indigo-500/10
                             transition-all duration-200"
                />
              </div>

              {/* Option B */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-bold">
                    B
                  </span>
                </div>
                <input
                  type="text"
                  id="optionB"
                  name="optionB"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  required
                  placeholder="e.g., Dell XPS 15"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800
                             text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             focus:shadow-lg focus:shadow-indigo-500/10
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* VS Badge - Centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden sm:flex">
              <span className="flex items-center justify-center w-10 h-10 rounded-full
                             bg-gradient-to-br from-indigo-500 to-purple-600
                             text-white text-xs font-bold shadow-lg">
                VS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 rounded-xl
                   bg-gradient-to-r from-indigo-600 to-purple-600
                   hover:from-indigo-700 hover:to-purple-700
                   text-white font-semibold text-lg
                   shadow-lg shadow-indigo-500/25
                   hover:shadow-xl hover:shadow-indigo-500/30
                   hover:-translate-y-0.5
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                   transition-all duration-200"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Starting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🚀</span>
            <span>Start Smart Decision</span>
          </span>
        )}
      </button>
    </form>
  );
}
