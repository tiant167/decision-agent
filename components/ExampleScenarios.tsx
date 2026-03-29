"use client";

import { DecisionInput, ExampleScenario } from "@/lib/types";

interface ExampleScenariosProps {
  examples: ExampleScenario[];
  onSelect: (input: DecisionInput) => void;
}

export function ExampleScenarios({ examples, onSelect }: ExampleScenariosProps) {
  const handleSelect = (scenario: ExampleScenario) => {
    onSelect({
      scenario: scenario.scenario,
      optionA: scenario.optionA,
      optionB: scenario.optionB,
    });
  };

  return (
    <div className="mt-8">
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
        🔥 Trending Today
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
        Hot topics people are deciding on right now
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {examples.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleSelect(scenario)}
            className="group flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50
                       border border-gray-200 dark:border-gray-600
                       hover:bg-white dark:hover:bg-gray-700
                       hover:border-indigo-300 dark:hover:border-indigo-500
                       hover:shadow-md transition-all duration-200
                       hover:-translate-y-0.5"
          >
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
              {scenario.emoji}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {scenario.title}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center leading-tight line-clamp-2" title={`${scenario.optionA} vs ${scenario.optionB}`}>
              {scenario.optionA} vs {scenario.optionB}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
