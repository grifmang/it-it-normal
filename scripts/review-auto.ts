// npm script: "review:auto": "tsx scripts/review-auto.ts"
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "./config";
import { verifyClaim } from "./ai/verify-claim";

async function main() {
  console.log("\n=== Auto-Review Pipeline ===\n");

  if (!fs.existsSync(config.draftsDir)) {
    console.log("No drafts directory found.");
    return;
  }

  const drafts = fs
    .readdirSync(config.draftsDir)
    .filter((f) => f.endsWith(".md"));

  if (drafts.length === 0) {
    console.log("No drafts to review.");
    return;
  }

  console.log(`Found ${drafts.length} draft(s) to auto-review.\n`);

  // Ensure claims directory exists
  if (!fs.existsSync(config.claimsDir)) {
    fs.mkdirSync(config.claimsDir, { recursive: true });
  }

  let autoPublished = 0;
  let needsReview = 0;

  for (const filename of drafts) {
    const filepath = path.join(config.draftsDir, filename);
    console.log(`Reviewing: ${filename}`);

    // Read and parse frontmatter
    const raw = fs.readFileSync(filepath, "utf8");
    const parsed = matter(raw);
    const frontmatter = parsed.data;

    const isVerified = frontmatter.sourcesVerified === true;
    const isNotUnresolved = frontmatter.status !== "unresolved";
    const sources = (frontmatter.sources || []) as Array<{ needsResolution?: boolean }>;
    const hasUnresolvedSources = sources.some((s) => s.needsResolution === true);

    if (hasUnresolvedSources) {
      console.log(`  -> Needs manual review (unresolved source URLs)`);
      needsReview++;
      continue;
    }

    if (isVerified && isNotUnresolved) {
      // Already verified and has a resolved status — auto-publish
      const destPath = path.join(config.claimsDir, filename);
      fs.renameSync(filepath, destPath);
      console.log(`  -> Auto-published to content/claims/${filename}`);
      autoPublished++;
      continue;
    }

    // Not yet verified — run AI verification
    console.log(`  -> Running AI verification...`);
    try {
      const result = await verifyClaim(filepath);

      // Re-read the file after verification (verifyClaim updates it)
      const updatedRaw = fs.readFileSync(filepath, "utf8");
      const updatedParsed = matter(updatedRaw);
      const updatedFrontmatter = updatedParsed.data;

      const nowVerified = updatedFrontmatter.sourcesVerified === true;
      const nowNotUnresolved = updatedFrontmatter.status !== "unresolved";

      if (nowVerified && nowNotUnresolved) {
        const destPath = path.join(config.claimsDir, filename);
        fs.renameSync(filepath, destPath);
        console.log(`  -> Verified and auto-published to content/claims/${filename}`);
        autoPublished++;
      } else {
        console.log(`  -> Needs manual review`);
        if (!nowVerified) {
          console.log(`     Reason: sources not verified (${result.issueCount} issue(s))`);
        }
        if (!nowNotUnresolved) {
          console.log(`     Reason: status is "unresolved"`);
        }
        needsReview++;
      }

      // Rate limit between API calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`  -> Error during verification: ${error}`);
      needsReview++;
    }
  }

  console.log(`\n=== Auto-Review Summary ===`);
  console.log(`  Auto-published: ${autoPublished}`);
  console.log(`  Needs manual review: ${needsReview}\n`);
}

// Self-executing main block
if (process.argv[1] && process.argv[1].includes("review-auto")) {
  main().catch((error) => {
    console.error("Auto-review failed:", error);
    process.exit(1);
  });
}
