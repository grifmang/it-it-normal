// npm script: "review:auto": "tsx scripts/review-auto.ts"
import fs from "fs";
import path from "path";
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

    // Run AI verification then publish
    try {
      await verifyClaim(filepath);
    } catch (error) {
      console.warn(`  -> Verification error (publishing anyway): ${error}`);
    }

    // Always publish
    const destPath = path.join(config.claimsDir, filename);
    fs.renameSync(filepath, destPath);
    console.log(`  -> Published to content/claims/${filename}`);
    autoPublished++;

    // Rate limit between API calls
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n=== Auto-Review Summary ===`);
  console.log(`  Published: ${autoPublished}\n`);
}

// Self-executing main block
if (process.argv[1] && process.argv[1].includes("review-auto")) {
  main().catch((error) => {
    console.error("Auto-review failed:", error);
    process.exit(1);
  });
}
