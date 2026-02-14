// npm script: "verify": "tsx scripts/ai/verify-claim.ts"
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { config } from "../config";

const VerificationResultSchema = z.object({
  allSourcesVerified: z.boolean(),
  issueCount: z.number(),
  issues: z.array(z.string()),
  suggestedFixes: z.array(
    z.object({
      sourceIndex: z.number(),
      fixedUrl: z.string().optional(),
      fixedSummary: z.string().optional(),
    })
  ),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function verifyClaim(
  filepath: string
): Promise<VerificationResult> {
  const raw = fs.readFileSync(filepath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parsed.data;

  const sources = frontmatter.sources || [];
  const timeline = frontmatter.timeline || [];

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a source verification assistant for a political fact-checking site called "Is This Normal?"

Your task: Evaluate the following claim's sources and timeline for plausibility and accuracy.

CLAIM TITLE: "${frontmatter.title || ""}"
STATUS: ${frontmatter.status || "unknown"}
SUMMARY: ${frontmatter.summary || ""}

SOURCES:
${sources
  .map(
    (s: { title: string; url: string; type: string; summary: string }, i: number) =>
      `[${i}] title: "${s.title}", url: "${s.url}", type: "${s.type}", summary: "${s.summary}"`
  )
  .join("\n")}

TIMELINE:
${timeline
  .map((t: { date: string; description: string }) => `- ${t.date}: ${t.description}`)
  .join("\n")}

For each source, evaluate:
1. Is the source title plausible for its type? (e.g., a "court" source should reference a real court or legal proceeding)
2. Does the URL look fabricated or suspicious? (e.g., made-up paths, nonsensical domains)
3. Is the summary internally consistent with the title and type?
4. Are there timeline issues? (e.g., dates in the future, "Unknown" dates that could be estimated)

Return ONLY valid JSON in this exact format:
{
  "allSourcesVerified": true/false,
  "issueCount": 0,
  "issues": ["Description of each issue found"],
  "suggestedFixes": [
    {
      "sourceIndex": 0,
      "fixedUrl": "corrected URL if applicable",
      "fixedSummary": "corrected summary if applicable"
    }
  ]
}

If all sources look plausible and consistent, return allSourcesVerified: true with issueCount: 0 and empty arrays.
If you find issues, describe each one clearly and suggest fixes where possible.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`[Verify] Could not parse JSON response for ${filepath}`);
    return {
      allSourcesVerified: false,
      issueCount: 1,
      issues: ["Failed to parse AI verification response"],
      suggestedFixes: [],
    };
  }

  const raw_json = JSON.parse(jsonMatch[0]);
  const validated = VerificationResultSchema.safeParse(raw_json);

  if (!validated.success) {
    console.error(
      `[Verify] Zod validation failed for ${filepath}:`,
      validated.error.issues
    );
    return {
      allSourcesVerified: false,
      issueCount: 1,
      issues: ["Verification response failed schema validation"],
      suggestedFixes: [],
    };
  }

  const result = validated.data;

  // Apply suggested fixes to the file
  if (result.suggestedFixes.length > 0) {
    const sources = parsed.data.sources || [];
    for (const fix of result.suggestedFixes) {
      if (fix.sourceIndex >= 0 && fix.sourceIndex < sources.length) {
        if (fix.fixedUrl) {
          sources[fix.sourceIndex].url = fix.fixedUrl;
        }
        if (fix.fixedSummary) {
          sources[fix.sourceIndex].summary = fix.fixedSummary;
        }
      }
    }
    parsed.data.sources = sources;
  }

  // Update sourcesVerified flag
  parsed.data.sourcesVerified = result.allSourcesVerified;
  const updated = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filepath, updated, "utf8");

  return result;
}

export async function verifyAllDrafts(): Promise<void> {
  console.log("\n=== Verifying all drafts ===\n");

  if (!fs.existsSync(config.draftsDir)) {
    console.log("No drafts directory found.");
    return;
  }

  const drafts = fs
    .readdirSync(config.draftsDir)
    .filter((f) => f.endsWith(".md"));

  if (drafts.length === 0) {
    console.log("No drafts to verify.");
    return;
  }

  console.log(`Found ${drafts.length} draft(s) to verify.\n`);

  let verified = 0;
  let issues = 0;

  for (const filename of drafts) {
    const filepath = path.join(config.draftsDir, filename);
    console.log(`Verifying: ${filename}`);

    try {
      const result = await verifyClaim(filepath);

      if (result.allSourcesVerified) {
        console.log(`  -> All sources verified`);
        verified++;
      } else {
        console.log(`  -> ${result.issueCount} issue(s) found:`);
        for (const issue of result.issues) {
          console.log(`     - ${issue}`);
        }
        issues++;
      }

      // Rate limit between API calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`[Verify] Error verifying ${filename}:`, error);
      issues++;
    }
  }

  console.log(`\n=== Verification complete ===`);
  console.log(`  Verified: ${verified}`);
  console.log(`  With issues: ${issues}\n`);
}

// Self-executing main block
if (process.argv[1] && process.argv[1].includes("verify-claim")) {
  verifyAllDrafts().catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
}
