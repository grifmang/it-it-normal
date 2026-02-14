import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { config } from "../config";
import { ExtractedClaim } from "./extract-claims";
import { searchBrave } from "../sources/brave-search";

const ClaimFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  topic: z.string(),
  status: z.enum(["verified", "mixed", "unsupported", "unresolved"]),
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

  // Search Brave for real URLs related to this claim
  const braveResults = await searchBrave(claim.claim);
  const braveContext = braveResults.length > 0
    ? `\nBRAVE SEARCH RESULTS (use these real URLs as sources):\n${braveResults.map(r => `- "${r.title}" | ${r.url} | ${r.description.slice(0, 150)}`).join("\n")}`
    : "";

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
SOURCE CONTEXT: ${claim.sourceItems.join("; ")}${braveContext}

CRITICAL RULES:
- Be STRICTLY NEUTRAL. No adjectives implying judgment. No editorial tone.
- Every factual assertion must reference a source
- Prefer .gov and .edu sources when available — they are more authoritative
- Never fabricate URLs — always use [VERIFY] tag if you are uncertain about a URL
- When Brave Search results are provided in the source context, use those real URLs instead of guessing
- Cross-reference multiple sources before determining the claim status
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

  // Parse frontmatter with gray-matter and validate with Zod
  const parsed = matter(markdown);
  const validated = ClaimFrontmatterSchema.safeParse(parsed.data);
  if (!validated.success) {
    console.error(
      `[Draft] Frontmatter validation failed for "${claim.claim}":`,
      validated.error.issues
    );
    return "";
  }

  // Add sourcesVerified flag via parsed data
  parsed.data.sourcesVerified = !hasUnverified;

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

  // Route to claims or drafts based on autoPublish config
  const targetDir = config.autoPublish ? config.claimsDir : config.draftsDir;
  const targetLabel = config.autoPublish ? "content/claims" : "content/drafts";
  const filename = `${slug}.md`;
  const filepath = path.join(targetDir, filename);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(filepath, markdown, "utf8");
  console.log(`  -> Saved: ${targetLabel}/${filename}`);

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
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`[Draft] Error generating draft for "${claim.claim}":`, error);
    }
  }

  return paths;
}
