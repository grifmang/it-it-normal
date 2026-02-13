import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { ExtractedClaim } from "./extract-claims";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

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

Your task: Generate a complete claim page draft in markdown with YAML frontmatter.

CLAIM TO RESEARCH: "${claim.claim}"
TOPIC: ${claim.topic}
SUGGESTED RESEARCH QUERIES: ${claim.searchQueries.join(", ")}
SOURCE CONTEXT: ${claim.sourceItems.join("; ")}

CRITICAL RULES:
- Be STRICTLY NEUTRAL. No adjectives implying judgment. No editorial tone.
- Every factual assertion must reference a source
- For sources you cannot verify right now, use placeholder URLs with [VERIFY] tags
- Status must be one of: verified, mixed, unsupported, unresolved
- If you're uncertain about the status, use "unresolved"
- The summary should be 2-3 sentences, factual, no opinion
- Evidence sections should contain specific, sourced claims
- Timeline should include real dates where known, or [DATE NEEDED] placeholders
- "What This Means" should be structured interpretation, NOT opinion

Generate the complete markdown file with this exact frontmatter structure:

---
title: "The exact claim text"
slug: "url-friendly-slug"
topic: "${claim.topic}"
status: "verified|mixed|unsupported|unresolved"
summary: "2-3 sentence neutral summary"
created: "${today}"
updated: "${today}"
sources:
  - title: "Source name"
    url: "https://... or [VERIFY]"
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

IMPORTANT: Mark any source URL you cannot verify with [VERIFY] so a human reviewer can check it. Mark any date you're uncertain about with [DATE NEEDED]. Mark the status as "unresolved" if you don't have enough information to make a determination.

Return ONLY the markdown content, starting with --- and ending with ---`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract the frontmatter content
  const frontmatterMatch = text.match(/---[\s\S]*---/);
  let markdown = frontmatterMatch ? frontmatterMatch[0] + "\n" : text;

  // Check for unverified items before cleaning
  const verifyCount = (markdown.match(/\[VERIFY\]/g) || []).length;
  const dateNeeded = (markdown.match(/\[DATE NEEDED\]/g) || []).length;
  const hasUnverified = verifyCount > 0 || dateNeeded > 0;

  // Clean up [VERIFY] and [DATE NEEDED] markers
  markdown = markdown.replace(/\[VERIFY\]\s*/g, "");
  markdown = markdown.replace(/\[DATE NEEDED\]/g, "Unknown");

  // Add sourcesVerified flag to frontmatter
  markdown = markdown.replace(
    /^(---\n)/,
    hasUnverified ? "$1sourcesVerified: false\n" : "$1sourcesVerified: true\n"
  );

  // Generate slug from claim text
  const slug = claim.claim
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/-$/, "");

  // Auto-publish directly to claims directory
  const filename = `${slug}.md`;
  const filepath = path.join(config.claimsDir, filename);

  // Ensure claims directory exists
  if (!fs.existsSync(config.claimsDir)) {
    fs.mkdirSync(config.claimsDir, { recursive: true });
  }

  fs.writeFileSync(filepath, markdown, "utf8");
  console.log(`  -> Published: content/claims/${filename}`);

  if (hasUnverified) {
    console.log(
      `  -> Marked as unverified (${verifyCount} URLs, ${dateNeeded} dates)`
    );
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
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`[Draft] Error generating draft for "${claim.claim}":`, error);
    }
  }

  return paths;
}
