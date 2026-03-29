"use client";

import { DecisionInput } from "@/lib/types";

interface ExampleScenario {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  optionA: string;
  optionB: string;
}

const scenarios: ExampleScenario[] = [
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

interface ExampleScenariosProps {
  onSelect: (input: DecisionInput) => void;
}

export function ExampleScenarios({ onSelect }: ExampleScenariosProps) {
  const handleSelect = (scenario: ExampleScenario) => {
    onSelect({
      scenario: scenario.scenario,
      optionA: scenario.optionA,
      optionB: scenario.optionB,
    });
  };

  return (
    <div className="mt-8">
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
        Not sure what to choose? Try these examples:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scenarios.map((scenario) => (
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
          </button>
        ))}
      </div>
    </div>
  );
}
