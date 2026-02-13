import fs from "fs";
import path from "path";
import readline from "readline";
import { config } from "./config";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("\n=== Draft Review Tool ===\n");

  if (!fs.existsSync(config.draftsDir)) {
    console.log("No drafts directory found.");
    rl.close();
    return;
  }

  const drafts = fs
    .readdirSync(config.draftsDir)
    .filter((f) => f.endsWith(".md"));

  if (drafts.length === 0) {
    console.log("No drafts to review. Run `npm run pipeline` first.");
    rl.close();
    return;
  }

  console.log(`Found ${drafts.length} draft(s):\n`);

  for (let i = 0; i < drafts.length; i++) {
    const filename = drafts[i];
    const filepath = path.join(config.draftsDir, filename);
    const content = fs.readFileSync(filepath, "utf8");

    // Count review items
    const verifyCount = (content.match(/\[VERIFY\]/g) || []).length;
    const dateNeeded = (content.match(/\[DATE NEEDED\]/g) || []).length;

    // Extract title from frontmatter
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : filename;

    // Extract status
    const statusMatch = content.match(/status:\s*"([^"]+)"/);
    const status = statusMatch ? statusMatch[1] : "unknown";

    console.log(`── Draft ${i + 1}/${drafts.length} ──`);
    console.log(`  File:   ${filename}`);
    console.log(`  Claim:  "${title}"`);
    console.log(`  Status: ${status}`);
    if (verifyCount > 0)
      console.log(`  ⚠ ${verifyCount} unverified URL(s)`);
    if (dateNeeded > 0)
      console.log(`  ⚠ ${dateNeeded} missing date(s)`);
    console.log();

    const action = await ask(
      "  Action: [p]ublish / [s]kip / [d]elete / [v]iew / [q]uit > "
    );

    switch (action.toLowerCase()) {
      case "p":
      case "publish": {
        if (verifyCount > 0 || dateNeeded > 0) {
          const confirm = await ask(
            "  This draft has unverified items. Publish anyway? [y/n] > "
          );
          if (confirm.toLowerCase() !== "y") {
            console.log("  Skipped.\n");
            break;
          }
        }
        const destPath = path.join(config.claimsDir, filename);
        fs.renameSync(filepath, destPath);
        console.log(`  Published to content/claims/${filename}\n`);
        break;
      }
      case "v":
      case "view": {
        console.log("\n" + "─".repeat(60));
        console.log(content);
        console.log("─".repeat(60) + "\n");
        // Re-ask after viewing
        const actionAfter = await ask(
          "  Action: [p]ublish / [s]kip / [d]elete > "
        );
        if (actionAfter.toLowerCase() === "p") {
          const destPath = path.join(config.claimsDir, filename);
          fs.renameSync(filepath, destPath);
          console.log(`  Published to content/claims/${filename}\n`);
        } else if (actionAfter.toLowerCase() === "d") {
          fs.unlinkSync(filepath);
          console.log(`  Deleted.\n`);
        } else {
          console.log("  Skipped.\n");
        }
        break;
      }
      case "d":
      case "delete": {
        fs.unlinkSync(filepath);
        console.log("  Deleted.\n");
        break;
      }
      case "q":
      case "quit": {
        console.log("\nExiting review.\n");
        rl.close();
        return;
      }
      default: {
        console.log("  Skipped.\n");
      }
    }
  }

  console.log("Review complete.\n");
  rl.close();
}

main().catch((error) => {
  console.error("Review failed:", error);
  rl.close();
  process.exit(1);
});
