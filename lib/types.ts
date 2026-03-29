
// SSE Event Types - streamed from server to client
export type SSEEvent =
  | { type: 'thought'; content: string }
  | { type: 'search'; query: string; provider: 'tavily' | 'duckduckgo' }
  | { type: 'search_result'; summary: string; sources: string[] }
  | { type: 'question'; question: string; options: string[]; allowCustom: boolean }
  | { type: 'final'; choice: 'A' | 'B'; reason: string }
  | { type: 'error'; message: string };

// Session State
export interface SessionState {
  optionA: string;
  optionB: string;
  scenario: string;
  history: Array<{ role: 'assistant' | 'user'; content: string }>;
  roundCount: number;
  searchCount: number;
  isComplete: boolean;
}

// Initial input from user
export interface DecisionInput {
  optionA: string;
  optionB: string;
  scenario: string;
}

// Example scenario for homepage
export interface ExampleScenario {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  optionA: string;
  optionB: string;
}

// API Request body
export interface DecisionRequest {
  optionA: string;
  optionB: string;
  scenario: string;
  history?: Array<{ role: 'assistant' | 'user'; content: string }>;
  roundCount?: number;
  searchCount?: number;
  userAnswer?: string;
}

// Tool definitions for Gemini function calling
export interface SearchToolCall {
  name: 'search';
  args: {
    query: string;
    reason: string;
  };
}

export interface AskQuestionToolCall {
  name: 'askQuestion';
  args: {
    question: string;
    options: string[];
    allowCustom?: boolean;
  };
}

export interface FinalizeToolCall {
  name: 'finalize';
  args: {
    choice: 'A' | 'B';
    reason: string;
  };
}

export type ToolCall = SearchToolCall | AskQuestionToolCall | FinalizeToolCall;

// Search result types
export interface SearchResult {
  summary: string;
  sources: string[];
  query: string;
}

// Frontend message types for display
export interface Message {
  id: string;
  type: 'thought' | 'search' | 'search_result' | 'question' | 'answer' | 'final' | 'error';
  content?: string;
  query?: string;
  summary?: string;
  sources?: string[];
  options?: string[];
  allowCustom?: boolean;
  choice?: 'A' | 'B';
  reason?: string;
  timestamp: number;
}

// Frontend state
export type DecisionPhase = 'idle' | 'initializing' | 'streaming' | 'waiting' | 'complete' | 'error';

export interface DecisionState {
  phase: DecisionPhase;
  messages: Message[];
  currentQuestion: {
    question: string;
    options: string[];
    allowCustom: boolean;
  } | null;
  finalResult: {
    choice: 'A' | 'B';
    reason: string;
  } | null;
  error: string | null;
  roundCount: number;
  searchCount: number;
  optionA: string;
  optionB: string;
}
