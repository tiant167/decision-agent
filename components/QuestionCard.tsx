"use client";

import { useState } from "react";

interface QuestionCardProps {
  question: string;
  options: string[];
  allowCustom: boolean;
  onAnswer: (answer: string) => void;
  isLoading: boolean;
}

export function QuestionCard({
  question,
  options,
  allowCustom,
  onAnswer,
  isLoading,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = selectedOption === "__custom__" ? customAnswer : selectedOption;
    if (answer) {
      onAnswer(answer);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {question}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedOption === option
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selectedOption === option}
                onChange={(e) => {
                  setSelectedOption(e.target.value);
                  setCustomAnswer("");
                }}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}

          {allowCustom && (
            <label
              className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedOption === "__custom__"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value="__custom__"
                checked={selectedOption === "__custom__"}
                onChange={() => setSelectedOption("__custom__")}
                className="w-4 h-4 mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="ml-3 flex-1">
                <span className="text-gray-700 dark:text-gray-300">Other:</span>
                {selectedOption === "__custom__" && (
                  <input
                    type="text"
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder="Enter your answer..."
                    autoFocus
                    className="mt-2 w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                )}
              </div>
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={!selectedOption || isLoading || (selectedOption === "__custom__" && !customAnswer.trim())}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
