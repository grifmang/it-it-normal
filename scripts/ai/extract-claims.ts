import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { AggregatedContent } from "../sources";

export interface ExtractedClaim {
  claim: string;
  topic: string;
  relevanceScore: number;
  sourceItems: string[];
  searchQueries: string[];
}

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function extractClaims(
  content: AggregatedContent
): Promise<ExtractedClaim[]> {
  console.log("=== Extracting claims with AI ===\n");

  // Build a digest of all source material
  const digest = buildDigest(content);

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a claim extraction engine for a political fact-checking site called "Is This Normal?"

Your job: identify specific, checkable political claims from the following aggregated news and social media content.

Rules:
- Extract SPECIFIC claims, not general topics (e.g., "ICE arrested 500 people in a single day" not "immigration enforcement")
- Claims should be statements that can be verified or refuted with evidence
- Focus on claims that are widely repeated, potentially misleading, or of high public interest
- Assign a topic from: immigration, elections, doj, economy, healthcare, foreign_policy, environment, civil_rights
- Score relevance 0-1 based on: public interest, verifiability, recency, potential for misinformation
- Suggest specific search queries that would help research each claim
- Do NOT extract claims that are purely opinion or editorial
- Do NOT extract claims already well-covered by major fact-checkers unless there's a new angle

Return ONLY valid JSON in this exact format:
{
  "claims": [
    {
      "claim": "The exact claim as it would be stated",
      "topic": "topic_key",
      "relevanceScore": 0.85,
      "sourceItems": ["Brief description of where this claim appeared"],
      "searchQueries": ["query 1 for research", "query 2 for research"]
    }
  ]
}

Here is today's aggregated content:

${digest}`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Extract] Could not parse JSON from response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const claims: ExtractedClaim[] = (parsed.claims || [])
      .filter(
        (c: ExtractedClaim) => c.relevanceScore >= config.minRelevanceScore
      )
      .slice(0, config.maxClaimsPerRun);

    console.log(
      `[Extract] Found ${claims.length} claims above relevance threshold\n`
    );
    for (const claim of claims) {
      console.log(
        `  - [${claim.topic}] (${claim.relevanceScore}) "${claim.claim}"`
      );
    }

    return claims;
  } catch (error) {
    console.error("[Extract] Error parsing response:", error);
    return [];
  }
}

function buildDigest(content: AggregatedContent): string {
  const sections: string[] = [];

  if (content.googleTrends.length > 0) {
    sections.push("## Google Trends (Trending Searches)");
    for (const t of content.googleTrends.slice(0, 20)) {
      sections.push(
        `- "${t.title}" (${t.trafficVolume} searches) | Related: ${t.relatedQueries.slice(0, 3).join(", ")}`
      );
    }
  }

  if (content.reddit.length > 0) {
    sections.push("\n## Reddit (High-Engagement Political Posts)");
    for (const p of content.reddit.slice(0, 25)) {
      sections.push(
        `- [r/${p.subreddit}, score: ${p.score}] "${p.title}" ${p.selftext ? `| ${p.selftext.slice(0, 200)}` : ""}`
      );
    }
  }

  if (content.news.length > 0) {
    sections.push("\n## News Headlines");
    for (const a of content.news.slice(0, 30)) {
      sections.push(
        `- [${a.sourceName}] "${a.title}" | ${a.description?.slice(0, 200) || ""}`
      );
    }
  }

  if (content.rss.length > 0) {
    sections.push("\n## RSS Feeds (Fact-checkers, Government, News)");
    for (const r of content.rss.slice(0, 30)) {
      sections.push(
        `- [${r.feedSource}] "${r.title}" | ${r.contentSnippet?.slice(0, 200) || ""}`
      );
    }
  }

  return sections.join("\n");
}
