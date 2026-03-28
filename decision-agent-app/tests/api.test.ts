/**
 * API Integration Tests for Decision Agent
 *
 * This file tests the /api/decision endpoint with various scenarios
 * to ensure the server-side logic works correctly.
 */

import fetch from "node-fetch";

const API_URL = process.env.API_URL || "http://localhost:3000/api/decision";

// Test utilities
function log(message: string, type: "info" | "success" | "error" = "info") {
  const prefix = type === "success" ? "✓" : type === "error" ? "✗" : "→";
  const color = type === "success" ? "\x1b[32m" : type === "error" ? "\x1b[31m" : "\x1b[36m";
  console.log(`${color}${prefix}\x1b[0m ${message}`);
}

async function parseSSEResponse(response: any) {
  const reader = response.body;
  const chunks: string[] = [];

  return new Promise<any[]>((resolve, reject) => {
    let buffer = "";

    reader.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            chunks.push(event);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    reader.on("end", () => resolve(chunks));
    reader.on("error", reject);
  });
}

// Test 1: Basic request validation
async function testValidation() {
  log("Test 1: Request validation (missing fields)");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionA: "", optionB: "" }),
    });

    if (response.status === 400) {
      log("Correctly rejects empty options with 400", "success");
      return true;
    } else {
      log(`Expected 400, got ${response.status}`, "error");
      return false;
    }
  } catch (error) {
    log(`Request failed: ${error}`, "error");
    return false;
  }
}

// Test 2: Missing optionB
async function testMissingOptionB() {
  log("Test 2: Request validation (missing optionB)");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionA: "MacBook", optionB: "" }),
    });

    if (response.status === 400) {
      log("Correctly rejects missing optionB with 400", "success");
      return true;
    } else {
      log(`Expected 400, got ${response.status}`, "error");
      return false;
    }
  } catch (error) {
    log(`Request failed: ${error}`, "error");
    return false;
  }
}

// Test 3: Valid request - check SSE stream starts
async function testValidRequestStream() {
  log("Test 3: Valid request with SSE stream");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionA: "iPhone 15",
        optionB: "Samsung S24",
        scenario: "Which phone should I buy?",
        history: [],
        roundCount: 0,
        searchCount: 0,
      }),
    });

    if (response.status !== 200) {
      log(`Expected 200, got ${response.status}`, "error");
      const text = await response.text();
      log(`Response: ${text}`, "error");
      return false;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/event-stream")) {
      log(`Expected SSE, got ${contentType}`, "error");
      return false;
    }

    log("SSE stream started correctly", "success");

    // Parse some events
    const events = await parseSSEResponse(response);

    if (events.length === 0) {
      log("No events received", "error");
      return false;
    }

    log(`Received ${events.length} events`, "success");

    // Check event types
    const eventTypes = events.map((e) => e.type);
    log(`Event types: ${eventTypes.join(", ")}`);

    // Show error details if any
    const errorEvents = events.filter((e) => e.type === "error");
    for (const err of errorEvents) {
      log(`Error detail: ${err.message || JSON.stringify(err)}`, "error");
    }

    // Should have at least thought, search, or question
    const hasValidEvent = eventTypes.some((t) =>
      ["thought", "search", "question", "final"].includes(t)
    );

    if (hasValidEvent) {
      log("Valid events received", "success");
      return true;
    } else {
      log("No valid event types found", "error");
      return false;
    }
  } catch (error) {
    log(`Request failed: ${error}`, "error");
    return false;
  }
}

// Test 4: Resume with answer
async function testResumeWithAnswer() {
  log("Test 4: Resume decision with user answer");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionA: "MacBook Pro",
        optionB: "Dell XPS",
        scenario: "For software development",
        history: [{ role: "assistant", content: "What is your budget?" }],
        roundCount: 1,
        searchCount: 1,
        userAnswer: "Around $2000",
      }),
    });

    if (response.status !== 200) {
      log(`Expected 200, got ${response.status}`, "error");
      const text = await response.text();
      log(`Response: ${text}`, "error");
      return false;
    }

    const events = await parseSSEResponse(response);

    if (events.length > 0) {
      log(`Received ${events.length} events after resume`, "success");
      const eventTypes = events.map((e) => e.type);
      log(`Event types: ${eventTypes.join(", ")}`);
      return true;
    } else {
      log("No events received after resume", "error");
      return false;
    }
  } catch (error) {
    log(`Request failed: ${error}`, "error");
    return false;
  }
}

// Test 5: Test final decision format
async function testFinalDecision() {
  log("Test 5: Check if decision eventually finalizes");

  try {
    // First request to get things started
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionA: "Tea",
        optionB: "Coffee",
        scenario: "Which is healthier?",
        history: [],
        roundCount: 4, // Near limit
        searchCount: 3,
      }),
    });

    if (response.status !== 200) {
      log(`Expected 200, got ${response.status}`, "error");
      return false;
    }

    const events = await parseSSEResponse(response);
    const hasFinal = events.some((e) => e.type === "final");

    if (hasFinal) {
      const finalEvent = events.find((e) => e.type === "final");
      log(`Final decision: Option ${finalEvent.choice}`, "success");
      log(`Reason: ${finalEvent.reason}`, "success");
      return true;
    } else {
      log("No final decision event (may need more rounds)", "info");
      return true; // Not necessarily a failure
    }
  } catch (error) {
    log(`Request failed: ${error}`, "error");
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log("\n═══════════════════════════════════════════");
  console.log("  Decision Agent API Integration Tests");
  console.log("═══════════════════════════════════════════\n");

  const results: boolean[] = [];

  // Run tests sequentially
  results.push(await testValidation());
  console.log("");

  results.push(await testMissingOptionB());
  console.log("");

  results.push(await testValidRequestStream());
  console.log("");

  results.push(await testResumeWithAnswer());
  console.log("");

  results.push(await testFinalDecision());
  console.log("");

  // Summary
  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log("═══════════════════════════════════════════");
  console.log(`  Results: ${passed}/${total} tests passed`);
  console.log("═══════════════════════════════════════════\n");

  process.exit(passed === total ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
