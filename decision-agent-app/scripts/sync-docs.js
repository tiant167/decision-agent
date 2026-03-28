#!/usr/bin/env node
/**
 * Documentation Sync Checker
 *
 * This script checks if documentation is in sync with the actual code.
 * Run manually with: node scripts/sync-docs.js
 */

const fs = require("fs");
const path = require("path");

// Colors for terminal output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}→${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    return null;
  }
}

// Check if documentation mentions a specific code pattern
function checkDocContains(docPath, patterns, description) {
  const content = readFile(docPath);
  if (!content) {
    log.error(`Cannot read ${docPath}`);
    return false;
  }

  let allFound = true;
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      log.warning(`Missing in ${docPath}: ${pattern}`);
      allFound = false;
    }
  }

  if (allFound) {
    log.success(`${description}`);
  }

  return allFound;
}

// Extract values from code
function extractFromCode(filePath, regex) {
  const content = readFile(filePath);
  if (!content) return [];

  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1] || match[0]);
  }
  return matches;
}

// Main checks
function runChecks() {
  console.log(
    "\n═══════════════════════════════════════════════════════════"
  );
  console.log("  Documentation Sync Checker");
  console.log(
    "═══════════════════════════════════════════════════════════\n"
  );

  let allPassed = true;

  // Check 1: Model name consistency
  log.info("Checking model name consistency...");
  const codeModel = extractFromCode(
    "lib/gemini.ts",
    /model:\s*"([^"]+)"/
  )[0];
  const pitfallsContent = readFile("docs/PITFALLS.md");

  if (codeModel && pitfallsContent) {
    if (pitfallsContent.includes(codeModel)) {
      log.success(`Model name "${codeModel}" documented in PITFALLS.md`);
    } else {
      log.error(`Model name "${codeModel}" NOT documented!`);
      log.info(`  Update docs/PITFALLS.md with the correct model name`);
      allPassed = false;
    }
  }

  // Check 2: API endpoint documented
  log.info("\nChecking API endpoint documentation...");
  const apiRouteExists = fs.existsSync("app/api/decision/route.ts");
  const apiSpecExists = fs.existsSync("docs/API_SPEC.md");

  if (apiRouteExists && apiSpecExists) {
    const routeContent = readFile("app/api/decision/route.ts");
    const specContent = readFile("docs/API_SPEC.md");

    // Check if SSE is documented
    if (specContent.includes("text/event-stream")) {
      log.success("SSE streaming documented");
    } else {
      log.warning("SSE streaming may not be documented");
    }

    // Check if all event types are documented
    const eventTypes = ["thought", "search", "search_result", "question", "final", "error"];
    const missingTypes = eventTypes.filter((type) => !specContent.includes(type));

    if (missingTypes.length === 0) {
      log.success("All event types documented");
    } else {
      log.error(`Missing event types in API_SPEC.md: ${missingTypes.join(", ")}`);
      allPassed = false;
    }
  }

  // Check 3: Components documented
  log.info("\nChecking component documentation...");
  const components = [
    "InputForm",
    "ChatThread",
    "QuestionCard",
    "MessageBubble",
  ];

  const designDoc = readFile("docs/DESIGN.md") || "";
  const archDoc = readFile("docs/ARCHITECTURE.md") || "";

  for (const component of components) {
    if (designDoc.includes(component) || archDoc.includes(component)) {
      log.success(`Component "${component}" documented`);
    } else {
      log.warning(`Component "${component}" not documented`);
    }
  }

  // Check 4: Environment variables documented
  log.info("\nChecking environment variable documentation...");
  const envExample = readFile(".env.example") || "";
  const gettingStarted = readFile("docs/GETTING_STARTED.md") || "";

  const requiredVars = ["GEMINI_API_KEY", "TAVILY_API_KEY"];
  for (const envVar of requiredVars) {
    const inExample = envExample.includes(envVar);
    const inDocs = gettingStarted.includes(envVar);

    if (inExample && inDocs) {
      log.success(`Environment variable ${envVar} documented`);
    } else {
      log.error(`Environment variable ${envVar} not fully documented`);
      if (!inExample) log.info(`  Missing from .env.example`);
      if (!inDocs) log.info(`  Missing from GETTING_STARTED.md`);
      allPassed = false;
    }
  }

  // Check 5: Navigation in AGENTS.md
  log.info("\nChecking AGENTS.md navigation...");
  const agentsDoc = readFile("AGENTS.md");

  if (agentsDoc) {
    const requiredLinks = [
      "ARCHITECTURE.md",
      "PITFALLS.md",
      "DESIGN.md",
      "API_SPEC.md",
    ];

    for (const link of requiredLinks) {
      if (agentsDoc.includes(link)) {
        log.success(`AGENTS.md links to ${link}`);
      } else {
        log.error(`AGENTS.md missing link to ${link}`);
        allPassed = false;
      }
    }
  }

  // Check 6: TypeScript types documented
  log.info("\nChecking type documentation...");
  const typesFile = readFile("lib/types.ts");

  if (typesFile) {
    const typeNames = ["DecisionState", "Message", "SSEEvent"];
    const archContent = readFile("docs/ARCHITECTURE.md") || "";

    for (const typeName of typeNames) {
      if (archContent.includes(typeName)) {
        log.success(`Type "${typeName}" documented in architecture`);
      } else {
        log.warning(`Type "${typeName}" not documented`);
      }
    }
  }

  // Summary
  console.log(
    "\n═══════════════════════════════════════════════════════════"
  );
  if (allPassed) {
    console.log(`${colors.green}  All documentation checks passed!${colors.reset}`);
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );
    process.exit(0);
  } else {
    console.log(
      `${colors.red}  Some documentation checks failed.${colors.reset}`
    );
    console.log(
      "═══════════════════════════════════════════════════════════\n"
    );
    console.log("Please update the documentation before committing.\n");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runChecks();
}

module.exports = { runChecks };
