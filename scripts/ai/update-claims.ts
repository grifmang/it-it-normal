// npm script: "update-claims": "tsx scripts/ai/update-claims.ts"

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { config } from "../config";

const ClaimUpdateSchema = z.object({
  hasUpdates: z.boolean(),
  newEvidenceFor: z.array(z.string()).optional(),
  newEvidenceAgainst: z.array(z.string()).optional(),
  newTimelineEvents: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  suggestedStatus: z
    .enum(["verified", "mixed", "unsupported", "unresolved"])
    .optional(),
  updateSummary: z.string(),
});

type ClaimUpdate = z.infer<typeof ClaimUpdateSchema>;

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function checkForUpdates(
  filepath: string
): Promise<ClaimUpdate | null> {
  const raw = fs.readFileSync(filepath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data;

  // Skip if updated within the last 7 days
  const updatedDate = new Date(data.updated);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (updatedDate > sevenDaysAgo) {
    return null;
  }

  const title = data.title || "Unknown claim";
  const summary = data.summary || "";
  const status = data.status || "unresolved";
  const evidenceFor = (data.evidenceFor || []).join("\n- ");
  const evidenceAgainst = (data.evidenceAgainst || []).join("\n- ");
  const timeline = (data.timeline || [])
    .map((e: { date: string; description: string }) => `${e.date}: ${e.description}`)
    .join("\n- ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a research assistant for "Is This Normal?", a neutral, evidence-based political claim analysis site.

Review this existing claim and determine if there are significant new developments since the last update.

CLAIM: "${title}"
SUMMARY: ${summary}
CURRENT STATUS: ${status}
LAST UPDATED: ${data.updated}

CURRENT EVIDENCE FOR:
- ${evidenceFor || "None"}

CURRENT EVIDENCE AGAINST:
- ${evidenceAgainst || "None"}

CURRENT TIMELINE:
- ${timeline || "None"}

Are there any significant new developments related to this claim since ${data.updated}? Consider recent news, court decisions, policy changes, or new data.

Respond with ONLY valid JSON in this exact format:
{
  "hasUpdates": true/false,
  "newEvidenceFor": ["New supporting evidence point 1", ...],
  "newEvidenceAgainst": ["New contrary evidence point 1", ...],
  "newTimelineEvents": [{"date": "YYYY-MM-DD", "description": "What happened"}, ...],
  "suggestedStatus": "verified|mixed|unsupported|unresolved" (only if status should change),
  "updateSummary": "Brief description of what changed"
}

If there are no significant updates, respond with:
{
  "hasUpdates": false,
  "updateSummary": "No significant new developments found."
}`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        `[Update] Could not parse JSON from response for "${title}"`
      );
      return null;
    }

    const raw = JSON.parse(jsonMatch[0]);
    const validated = ClaimUpdateSchema.safeParse(raw);
    if (!validated.success) {
      console.error(
        `[Update] Zod validation failed for "${title}":`,
        validated.error.issues
      );
      return null;
    }

    if (!validated.data.hasUpdates) {
      return null;
    }

    return validated.data;
  } catch (error) {
    console.error(`[Update] Error parsing response for "${title}":`, error);
    return null;
  }
}

export async function updateAllClaims(): Promise<void> {
  console.log("=== Checking claims for updates ===\n");

  if (!fs.existsSync(config.claimsDir)) {
    console.log("[Update] No claims directory found. Nothing to update.");
    return;
  }

  const files = fs
    .readdirSync(config.claimsDir)
    .filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.log("[Update] No claim files found.");
    return;
  }

  // Sort: prioritize unresolved and mixed status claims first
  const sorted = files
    .map((f) => {
      const filepath = path.join(config.claimsDir, f);
      const parsed = matter(fs.readFileSync(filepath, "utf8"));
      return { file: f, filepath, status: parsed.data.status as string };
    })
    .sort((a, b) => {
      const priority: Record<string, number> = {
        unresolved: 0,
        mixed: 1,
        unsupported: 2,
        verified: 3,
      };
      return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
    });

  let checked = 0;
  let updated = 0;
  let skipped = 0;

  for (const { file, filepath } of sorted) {
    const parsed = matter(fs.readFileSync(filepath, "utf8"));
    const title = parsed.data.title || file;

    // Check if too recent
    const updatedDate = new Date(parsed.data.updated);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (updatedDate > sevenDaysAgo) {
      console.log(`  [SKIP] "${title}" — updated ${parsed.data.updated}`);
      skipped++;
      continue;
    }

    console.log(`  [CHECK] "${title}" (status: ${parsed.data.status})`);
    checked++;

    try {
      const result = await checkForUpdates(filepath);

      if (result) {
        // Merge new evidence
        if (result.newEvidenceFor?.length) {
          parsed.data.evidenceFor = [
            ...(parsed.data.evidenceFor || []),
            ...result.newEvidenceFor,
          ];
        }
        if (result.newEvidenceAgainst?.length) {
          parsed.data.evidenceAgainst = [
            ...(parsed.data.evidenceAgainst || []),
            ...result.newEvidenceAgainst,
          ];
        }

        // Merge new timeline events
        if (result.newTimelineEvents?.length) {
          parsed.data.timeline = [
            ...(parsed.data.timeline || []),
            ...result.newTimelineEvents,
          ];
          // Sort timeline by date
          parsed.data.timeline.sort(
            (a: { date: string }, b: { date: string }) =>
              a.date.localeCompare(b.date)
          );
        }

        // Update status if suggested
        if (result.suggestedStatus) {
          console.log(
            `    Status: ${parsed.data.status} -> ${result.suggestedStatus}`
          );
          parsed.data.status = result.suggestedStatus;
        }

        // Update the updated date
        parsed.data.updated = new Date().toISOString().split("T")[0];

        // Write back
        const newContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(filepath, newContent, "utf8");

        console.log(`    [UPDATED] ${result.updateSummary}`);
        updated++;
      } else {
        console.log(`    [NO UPDATES]`);
      }

      // Rate limit: 2s between API calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`    [ERROR] ${error}`);
    }
  }

  console.log(`\n=== Update Summary ===`);
  console.log(`  Claims checked: ${checked}`);
  console.log(`  Claims updated: ${updated}`);
  console.log(`  Claims skipped (too recent): ${skipped}`);
}

// Self-executing main
(async () => {
  try {
    await updateAllClaims();
  } catch (error) {
    console.error("[Update] Fatal error:", error);
    process.exit(1);
  }
})();
