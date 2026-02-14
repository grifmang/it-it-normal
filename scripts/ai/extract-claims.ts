import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config";
import { AggregatedContent } from "../sources";

const ExtractedClaimSchema = z.object({
  claim: z.string(),
  topic: z.string(),
  relevanceScore: z.number().min(0).max(1),
  sourceItems: z.array(z.string()),
  searchQueries: z.array(z.string()),
});

const ExtractedClaimsResponseSchema = z.object({
  claims: z.array(ExtractedClaimSchema),
});

export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

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
- Assign a short, descriptive topic key that best fits each claim (for example: public_safety, education, immigration, health, elections, courts, foreign_policy, technology).
- Score relevance 0-1 based on: public interest, verifiability, recency, potential for misinformation
- Suggest specific search queries that would help research each claim
- Do NOT extract claims that are purely opinion or editorial
- Use existing fact-check coverage to identify unresolved, disputed, or newly evolving angles worth revisiting
- Prefer claims where there is enough source material to support thorough verification, not just viral repetition

Return ONLY valid JSON in this exact format:
{
  "claims": [
    {
      "claim": "The exact claim as it would be stated",
      "topic": "short_topic_key",
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

    const raw = JSON.parse(jsonMatch[0]);
    const validated = ExtractedClaimsResponseSchema.safeParse(raw);
    if (!validated.success) {
      console.error("[Extract] Zod validation failed:", validated.error.issues);
      return [];
    }

    const claims: ExtractedClaim[] = validated.data.claims
      .filter((c) => c.relevanceScore >= config.minRelevanceScore)
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
    for (const t of content.googleTrends.slice(0, 30)) {
      sections.push(
        `- "${t.title}" (${t.trafficVolume} searches) | Related: ${t.relatedQueries.slice(0, 3).join(", ")}`
      );
    }
  }

  if (content.reddit.length > 0) {
    sections.push("\n## Reddit (High-Engagement Political Posts)");
    for (const p of content.reddit.slice(0, 40)) {
      sections.push(
        `- [r/${p.subreddit}, score: ${p.score}] "${p.title}" ${p.selftext ? `| ${p.selftext.slice(0, 200)}` : ""}`
      );
    }
  }

  if (content.news.length > 0) {
    sections.push("\n## News Headlines");
    for (const a of content.news.slice(0, 50)) {
      sections.push(
        `- [${a.sourceName}] "${a.title}" | ${a.description?.slice(0, 200) || ""}`
      );
    }
  }

  if (content.rss.length > 0) {
    sections.push("\n## RSS Feeds (Fact-checkers, Government, News)");
    for (const r of content.rss.slice(0, 50)) {
      sections.push(
        `- [${r.feedSource}] "${r.title}" | ${r.contentSnippet?.slice(0, 200) || ""}`
      );
    }
  }

  if (content.congress.length > 0) {
    sections.push("\n## Congressional Activity (Recent Bills)");
    for (const c of content.congress.slice(0, 20)) {
      sections.push(
        `- [${c.billNumber}] "${c.title}" | Latest: ${c.latestAction}`
      );
    }
  }

  if (content.courtlistener.length > 0) {
    sections.push("\n## Federal Court Opinions (Recent)");
    for (const o of content.courtlistener.slice(0, 15)) {
      sections.push(
        `- [${o.court}] "${o.caseName}" (${o.dateDecided}) | ${o.summary.slice(0, 200)}`
      );
    }
  }

  if (content.executiveOrders.length > 0) {
    sections.push("\n## Executive Orders (Last 7 Days)");
    for (const eo of content.executiveOrders.slice(0, 20)) {
      sections.push(
        `- [${eo.sourceName}] "${eo.title}" (${eo.publishedAt.slice(0, 10)}) | ${eo.summary.slice(0, 200)}`
      );
    }
  }

  if (content.googleFactChecks.length > 0) {
    sections.push("\n## Google Fact Check Explorer (Recent Claim Reviews)");
    for (const factCheck of content.googleFactChecks.slice(0, 30)) {
      const topPublishers = factCheck.reviews
        .slice(0, 3)
        .map((review) => review.publisher)
        .join(", ");
      const topRatings = factCheck.reviews
        .slice(0, 3)
        .map((review) => review.textualRating)
        .join(", ");
      sections.push(
        `- "${factCheck.text}" | Claimant: ${factCheck.claimant || "Unknown"} | Reviews: ${topPublishers || "n/a"} | Ratings: ${topRatings || "n/a"}`
      );
    }
  }

  if (content.braveSearch.length > 0) {
    sections.push("\n## Brave Search Results");
    for (const r of content.braveSearch.slice(0, 20)) {
      sections.push(`- "${r.title}" | ${r.url} | ${r.description.slice(0, 200)}`);
    }
  }

  return sections.join("\n");
}
