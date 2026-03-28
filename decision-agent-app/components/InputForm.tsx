"use client";

import { DecisionInput } from "@/lib/types";

interface InputFormProps {
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const verb = (formData.get("verb") as string).trim();
    const optionA = formData.get("optionA") as string;
    const optionB = formData.get("optionB") as string;

    // Build scenario: "Which one should I [verb]"
    const scenario = verb ? `Which one should I ${verb}` : "";

    onSubmit({
      optionA,
      optionB,
      scenario,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Which one should I [verb] */}
        <div>
          <label
            htmlFor="verb"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            What are you deciding?
          </label>
          <div className="flex items-center">
            <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap mr-2">
              Which one should I
            </span>
            <input
              type="text"
              id="verb"
              name="verb"
              required
              placeholder="buy, choose, use..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter a verb that describes your decision
          </p>
        </div>

        {/* Option A and B in one row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="optionA"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Option A
            </label>
            <input
              type="text"
              id="optionA"
              name="optionA"
              required
              placeholder="e.g., MacBook Pro"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="optionB"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Option B
            </label>
            <input
              type="text"
              id="optionB"
              name="optionB"
              required
              placeholder="e.g., Dell XPS 15"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* VS separator between options */}
        <div className="flex items-center justify-center -my-2">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider bg-white dark:bg-gray-800 px-2">
            VS
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          "Help Me Decide"
        )}
      </button>
    </form>
  );
}
