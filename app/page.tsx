import { get } from "@vercel/edge-config";
import { ClientHome } from "@/components/ClientHome";
import { ExampleScenario } from "@/lib/types";

/**
 * Fallback examples when Edge Config is not available
 */
const fallbackExamples: ExampleScenario[] = [
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

/**
 * Server component that fetches trending examples from Edge Config
 */
export default async function Home() {
  // Fetch examples from Edge Config
  let examples: ExampleScenario[] = fallbackExamples;

  try {
    const trendingExamples = await get<ExampleScenario[]>("trending-examples");
    if (trendingExamples && trendingExamples.length === 4) {
      examples = trendingExamples;
    }
  } catch (error) {
    console.error("Failed to fetch examples from Edge Config:", error);
    // Use fallback examples
  }

  return <ClientHome examples={examples} />;
}
