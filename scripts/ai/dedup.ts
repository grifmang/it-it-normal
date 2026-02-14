import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Fuse from "fuse.js";
import { ExtractedClaim } from "./extract-claims";

/**
 * Reads all .md files from the given directories, extracts frontmatter titles,
 * and filters out new claims that fuzzy-match existing titles.
 */
export function findDuplicates(
  newClaims: ExtractedClaim[],
  ...dirs: string[]
): ExtractedClaim[] {
  // Collect existing titles from all provided directories
  const existingTitles: { title: string }[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      if (data.title) {
        existingTitles.push({ title: data.title });
      }
    }
  }

  if (existingTitles.length === 0) {
    console.log("[Dedup] No existing claims found — skipping dedup check.");
    return newClaims;
  }

  console.log(
    `[Dedup] Checking ${newClaims.length} new claims against ${existingTitles.length} existing titles`
  );

  const fuse = new Fuse(existingTitles, {
    keys: ["title"],
    threshold: 0.2,
    includeScore: true,
  });

  const unique: ExtractedClaim[] = [];
  let dupCount = 0;

  for (const claim of newClaims) {
    const results = fuse.search(claim.claim);
    if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.2) {
      dupCount++;
      console.log(
        `[Dedup] DUPLICATE — "${claim.claim}" matches existing "${results[0].item.title}" (score: ${results[0].score.toFixed(3)})`
      );
    } else {
      unique.push(claim);
    }
  }

  console.log(
    `[Dedup] Result: ${unique.length} unique, ${dupCount} duplicates skipped\n`
  );

  return unique;
}
