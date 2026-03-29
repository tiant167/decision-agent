/**
 * Local script to test example generation
 * Run: npm run examples:test
 */

// ⚠️ CRITICAL: Must load dotenv BEFORE importing any server modules
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

// Now import other modules
async function main() {
  console.log("🔧 Environment check:");
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ Set (" + process.env.GEMINI_API_KEY.slice(0, 8) + "...)" : "❌ Missing"}`);
  console.log(`  TAVILY_API_KEY: ${process.env.TAVILY_API_KEY ? "✅ Set (" + process.env.TAVILY_API_KEY.slice(0, 8) + "...)" : "❌ Missing"}`);
  console.log();

  // Dynamic import after env is loaded
  const { generateTrendingExamples } = await import("../lib/examples-generator");

  console.log("🚀 Generating trending examples...\n");

  try {
    const examples = await generateTrendingExamples();

    console.log("✅ Successfully generated examples:\n");
    examples.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.emoji} ${ex.title}`);
      console.log(`   ${ex.scenario}: ${ex.optionA} vs ${ex.optionB}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to generate examples:");
    if (error instanceof Error) {
      console.error(`  Name: ${error.name}`);
      console.error(`  Message: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack.split("\n").slice(0, 3).join("\n         ")}`);
      }
    } else {
      console.error(`  Unknown error: ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
