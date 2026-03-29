import { NextRequest, NextResponse } from "next/server";
import { generateTrendingExamples } from "@/lib/examples-generator";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job endpoint to update trending examples
 * Vercel Cron uses GET, manual triggers use POST with Bearer token
 */
export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}

export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${CRON_SECRET}`;

  // Allow Vercel Cron (no auth header) or manual trigger with secret
  const isVercelCron = request.headers.get("User-Agent")?.includes("Vercel");
  const isValidAuth = authHeader === expectedToken;

  if (!isVercelCron && !isValidAuth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Generate new trending examples
    const examples = await generateTrendingExamples();

    // Parse Edge Config ID from EDGE_CONFIG connection string
    const edgeConfigUrl = process.env.EDGE_CONFIG || "";
    const edgeConfigMatch = edgeConfigUrl.match(/ecfg_[a-zA-Z0-9]+/);
    const edgeConfigId = edgeConfigMatch ? edgeConfigMatch[0] : process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_TOKEN;

    if (!edgeConfigId || !vercelToken) {
      return NextResponse.json(
        { error: "Edge Config not configured. Set EDGE_CONFIG and VERCEL_TOKEN" },
        { status: 500 }
      );
    }

    // Update Edge Config via Vercel API
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "upsert",
              key: "trending-examples",
              value: examples,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Edge Config update failed: ${error}`);
    }

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      examplesCount: examples.length,
      examples: examples.map((e) => e.title),
    });
  } catch (error) {
    console.error("Failed to update examples:", error);
    return NextResponse.json(
      {
        error: "Failed to update examples",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
