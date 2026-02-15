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

  for (const filename of drafts) {
    const filepath = path.join(config.draftsDir, filename);
    console.log(`Reviewing: ${filename}`);

    // Read and parse frontmatter
    const raw = fs.readFileSync(filepath, "utf8");
    const parsed = matter(raw);
    const frontmatter = parsed.data;

    const isVerified = frontmatter.sourcesVerified === true;

    if (isVerified) {
      // Already verified — publish immediately
      const destPath = path.join(config.claimsDir, filename);
      fs.renameSync(filepath, destPath);
      console.log(`  -> Auto-published to content/claims/${filename}`);
      autoPublished++;
      continue;
    }

    // Run AI verification then publish regardless
    console.log(`  -> Running AI verification...`);
    try {
      await verifyClaim(filepath);

      const destPath = path.join(config.claimsDir, filename);
      fs.renameSync(filepath, destPath);
      console.log(`  -> Verified and auto-published to content/claims/${filename}`);
      autoPublished++;

      // Rate limit between API calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      // Publish even if verification errors — automation first
      console.warn(`  -> Verification error (publishing anyway): ${error}`);
      const destPath = path.join(config.claimsDir, filename);
      fs.renameSync(filepath, destPath);
      console.log(`  -> Auto-published to content/claims/${filename}`);
      autoPublished++;
    }
  }

  console.log(`\n=== Auto-Review Summary ===`);
  console.log(`  Auto-published: ${autoPublished}\n`);
}

// Self-executing main block
if (process.argv[1] && process.argv[1].includes("review-auto")) {
  main().catch((error) => {
    console.error("Auto-review failed:", error);
    process.exit(1);
  });
}
