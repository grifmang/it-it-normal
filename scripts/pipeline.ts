import { config, validateConfig } from "./config";
import { aggregateAllSources } from "./sources";
import { extractClaims } from "./ai/extract-claims";
import { findDuplicates } from "./ai/dedup";
import { generateAllDrafts } from "./ai/draft-claim";
import { recordMetrics } from "./metrics";

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
  const rawClaims = await extractClaims(content);

  if (rawClaims.length === 0) {
    console.log("\nNo actionable claims extracted. Exiting.");
    return;
  }

  // Step 3: Deduplicate against existing claims
  const claims = findDuplicates(rawClaims, config.claimsDir, config.draftsDir);

  if (claims.length === 0) {
    console.log("\nAll extracted claims are duplicates. Exiting.");
    return;
  }

  // Step 4: Generate draft claim pages
  const drafts = await generateAllDrafts(claims);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║            Pipeline Complete          ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`  Sources checked: ${content.all.length} items`);
  console.log(`  Claims extracted: ${rawClaims.length}`);
  console.log(`  Duplicates skipped: ${rawClaims.length - claims.length}`);
  console.log(`  Claims generated: ${drafts.length}`);
  console.log(`  Time: ${elapsed}s`);
  if (config.autoPublish) {
    console.log(`\n  Claims auto-published to: content/claims/`);
    console.log(`  Unverified sources are flagged on the site.`);
  } else {
    console.log(`\n  Claims saved to: content/drafts/`);
    console.log(`  Run 'npm run review' to review and publish drafts.`);
  }
  console.log();

  // Record pipeline metrics for observability
  const durationMs = Date.now() - startTime;
  recordMetrics({
    timestamp: new Date().toISOString(),
    sourcesCount: content.all.length,
    claimsExtracted: rawClaims.length,
    claimsGenerated: drafts.length,
    claimsSkipped: rawClaims.length - claims.length,
    errors: claims.length - drafts.filter((d) => d !== "").length,
    durationMs,
  });
}

main().catch((error) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
