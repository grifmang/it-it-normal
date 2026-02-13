import { validateConfig } from "./config";
import { aggregateAllSources } from "./sources";
import { extractClaims } from "./ai/extract-claims";
import { generateAllDrafts } from "./ai/draft-claim";

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║   Is This Normal? — Claim Pipeline   ║");
  console.log("╚══════════════════════════════════════╝\n");

  // Validate configuration
  const errors = validateConfig();
  if (errors.length > 0) {
    console.error("Configuration errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error("\nCopy .env.example to .env and fill in your API keys.");
    process.exit(1);
  }

  const startTime = Date.now();

  // Step 1: Aggregate sources
  const content = await aggregateAllSources();

  if (content.all.length === 0) {
    console.log("\nNo content found from any source. Exiting.");
    return;
  }

  // Step 2: Extract claims using AI
  const claims = await extractClaims(content);

  if (claims.length === 0) {
    console.log("\nNo actionable claims extracted. Exiting.");
    return;
  }

  // Step 3: Generate draft claim pages
  const drafts = await generateAllDrafts(claims);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║            Pipeline Complete          ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`  Sources checked: ${content.all.length} items`);
  console.log(`  Claims extracted: ${claims.length}`);
  console.log(`  Claims published: ${drafts.length}`);
  console.log(`  Time: ${elapsed}s`);
  console.log(`\n  Claims auto-published to: content/claims/`);
  console.log(`  Unverified sources are flagged on the site.\n`);
}

main().catch((error) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
