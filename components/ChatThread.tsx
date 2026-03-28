"use client";

import { Message } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";

interface ChatThreadProps {
  messages: Message[];
  currentQuestion: {
    question: string;
    options: string[];
    allowCustom: boolean;
  } | null;
  optionA: string;
  optionB: string;
  onAnswer: (answer: string) => void;
  isLoading: boolean;
}

export function ChatThread({
  messages,
  currentQuestion,
  optionA,
  optionB,
  onAnswer,
  isLoading,
}: ChatThreadProps) {
  return (
    <div className="space-y-4">
      {/* Header with options */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Option A</span>
          <p className="font-semibold text-gray-900 dark:text-white">{optionA}</p>
        </div>
        <div className="px-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">VS</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Option B</span>
          <p className="font-semibold text-gray-900 dark:text-white">{optionB}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} optionA={optionA} optionB={optionB} />
        ))}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion.question}
          options={currentQuestion.options}
          allowCustom={currentQuestion.allowCustom}
          onAnswer={onAnswer}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function MessageBubble({ message, optionA, optionB }: { message: Message; optionA: string; optionB: string }) {
  switch (message.type) {
    case "thought":
      return (
        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm italic">{message.content}</p>
        </div>
      );

    case "search":
      return (
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
          <svg className="animate-spin h-4 w-4 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Searching: {message.query}</span>
        </div>
      );

    case "search_result":
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Search Results</span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">{message.summary}</p>
          {message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.sources.slice(0, 3).map((source, i) => (
                <a
                  key={i}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Source {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      );

    case "answer":
      return (
        <div className="flex justify-end">
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      );

    case "final": {
      const chosenOption = message.choice === "A" ? optionA : optionB;
      return (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-1">
            Decision: {chosenOption}
          </h3>
          <p className="text-emerald-700 dark:text-emerald-300">{message.reason}</p>
        </div>
      );
    }

    case "error":
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message.content}</p>
        </div>
      );

    case "question":
      return (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{message.content}</p>
              {message.options && message.options.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.options.map((option, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      {option}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
  }
}