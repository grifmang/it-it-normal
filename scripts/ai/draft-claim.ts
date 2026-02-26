import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { config } from "../config";
import { ExtractedClaim } from "./extract-claims";
import { resolveEmptySources } from "./resolve-sources";

const ClaimFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  topic: z.string(),
  status: z.enum(["verified", "mixed", "unsupported"]),
  summary: z.string(),
  created: z.string(),
  updated: z.string(),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      type: z.string(),
      summary: z.string(),
    })
  ),
  evidenceFor: z.array(z.string()),
  evidenceAgainst: z.array(z.string()),
  timeline: z.array(
    z.object({
      date: z.string(),
      description: z.string(),
    })
  ),
  whatThisMeans: z.array(z.string()),
});

const client = new Anthropic({ apiKey: config.anthropicApiKey });

/**
 * Find up to 3 existing claims with the same topic to use as relatedSlugs.
 */
function findRelatedClaims(topic: string, currentSlug: string): string[] {
  const dirs = [config.claimsDir, config.draftsDir];
  const slugs: string[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      if (slugs.length >= 3) break;
      try {
        const content = fs.readFileSync(path.join(dir, file), "utf8");
        const parsed = matter(content);
        if (
          parsed.data.topic === topic &&
          parsed.data.slug !== currentSlug
        ) {
          slugs.push(parsed.data.slug);
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
    if (slugs.length >= 3) break;
  }

  return slugs.slice(0, 3);
}

export async function generateDraft(claim: ExtractedClaim): Promise<string> {
  console.log(`\n=== Generating draft for: "${claim.claim}" ===`);

  const today = new Date().toISOString().split("T")[0];

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a research assistant for "Is This Normal?", a neutral, evidence-based political claim analysis site.

Your task: Generate a complete, PUBLISH-READY claim page in markdown with YAML frontmatter. This will be published immediately with no human review.

CLAIM TO RESEARCH: "${claim.claim}"
TOPIC: ${claim.topic}
SUGGESTED RESEARCH QUERIES: ${claim.searchQueries.join(", ")}
SOURCE CONTEXT: ${claim.sourceItems.join("; ")}

CRITICAL RULES:
- Be STRICTLY NEUTRAL. No adjectives implying judgment. No editorial tone.
- Every factual assertion must reference a source
- Prefer .gov and .edu sources when available — they are more authoritative
- NEVER fabricate URLs. If Fact Check results are provided above, USE those real URLs as sources.
- If you don't have a real URL for a source, leave the url field as an empty string ""
- DO NOT use placeholder tags like [VERIFY] or [DATE NEEDED] — this is fully automated
- You MUST pick a definitive status: "verified", "mixed", or "unsupported". NEVER use "unresolved".
  - "verified" = the evidence strongly supports the claim as stated
  - "mixed" = the claim has some truth but is misleading, exaggerated, or missing context
  - "unsupported" = the evidence does not support the claim, or contradicts it
- If you're uncertain, lean toward "mixed" rather than leaving it unresolved
- The summary should be 2-3 sentences, factual, no opinion
- Evidence sections should contain specific, sourced claims
- Timeline dates: use real dates where known, use approximate dates like "2025-02" for month-level, or "Unknown" if truly unknown
- "What This Means" should be structured interpretation, NOT opinion

Generate the complete markdown file with this exact frontmatter structure:

---
title: "The exact claim text"
slug: "url-friendly-slug"
topic: "${claim.topic}"
status: "verified|mixed|unsupported"
summary: "2-3 sentence neutral summary"
created: "${today}"
updated: "${today}"
sources:
  - title: "Source name"
    url: "https://real-url-here or empty string"
    type: "court|news|official|transcript|report"
    summary: "What this source says"
evidenceFor:
  - "Specific point supporting the claim"
evidenceAgainst:
  - "Specific point against or adding context"
timeline:
  - date: "YYYY-MM-DD"
    description: "What happened"
whatThisMeans:
  - "Structured interpretation point"
---

Return ONLY the markdown content, starting with --- and ending with ---`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract the frontmatter content
  const frontmatterMatch = text.match(/---[\s\S]*---/);
  let markdown = frontmatterMatch ? frontmatterMatch[0] + "\n" : text;

  // Clean up any stray placeholder markers the model might still produce
  markdown = markdown.replace(/\[VERIFY\]\s*/g, "");
  markdown = markdown.replace(/\[DATE NEEDED\]/g, "Unknown");

  // Parse frontmatter with gray-matter and validate with Zod
  const parsed = matter(markdown);

  // Force status to a valid value if the model used "unresolved"
  if (parsed.data.status === "unresolved") {
    parsed.data.status = "mixed";
  }

  const validated = ClaimFrontmatterSchema.safeParse(parsed.data);
  if (!validated.success) {
    console.error(
      `[Draft] Frontmatter validation failed for "${claim.claim}":`,
      validated.error.issues
    );
    return "";
  }

  // Auto-populate relatedSlugs by finding existing claims with the same topic
  const relatedSlugs = findRelatedClaims(parsed.data.topic, parsed.data.slug);
  if (relatedSlugs.length > 0) {
    parsed.data.relatedSlugs = relatedSlugs;
  }

  markdown = matter.stringify(parsed.content, parsed.data);

  // Generate slug from claim text
  const slug = claim.claim
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/-$/, "");

  // Always publish directly to claims
  const filename = `${slug}.md`;
  const filepath = path.join(config.claimsDir, filename);

  if (!fs.existsSync(config.claimsDir)) {
    fs.mkdirSync(config.claimsDir, { recursive: true });
  }

  fs.writeFileSync(filepath, markdown, "utf8");
  console.log(`  -> Published: content/claims/${filename}`);

  // Attempt to resolve any empty source URLs
  try {
    const { resolved, unresolved } = await resolveEmptySources(filepath);
    if (resolved > 0 || unresolved > 0) {
      console.log(`  -> Source resolution: ${resolved} resolved, ${unresolved} left empty`);
    }
  } catch (error) {
    console.warn(`  -> Source resolution skipped: ${error}`);
  }

  return filepath;
}

export async function generateAllDrafts(
  claims: ExtractedClaim[]
): Promise<string[]> {
  const paths: string[] = [];

  for (const claim of claims) {
    try {
      const filepath = await generateDraft(claim);
      paths.push(filepath);

      // Rate limiting between API calls
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`[Draft] Error generating draft for "${claim.claim}":`, error);
    }
  }

  return paths;
}
