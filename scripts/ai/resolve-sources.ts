import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "../config";
import { searchGoogleCustom } from "../sources/google-custom-search";
import { searchDuckDuckGo } from "../sources/duckduckgo";
import { WebSearchResult } from "../sources/search-types";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

interface ResolveResult {
  url: string;
  confidence: "high" | "low";
}

async function cascadeSearch(query: string): Promise<WebSearchResult[]> {
  // Backend 1: Google Custom Search
  const customSearchResults = await searchGoogleCustom(query);
  if (customSearchResults.length > 0) {
    console.log(`[Cascade] Resolved via Google Custom Search (${customSearchResults.length} results)`);
    return customSearchResults;
  }

  // Backend 2: DuckDuckGo
  const ddgResults = await searchDuckDuckGo(query);
  if (ddgResults.length > 0) {
    console.log(`[Cascade] Resolved via DuckDuckGo (${ddgResults.length} results)`);
    return ddgResults;
  }

  console.log(`[Cascade] No results from any backend for "${query}"`);
  return [];
}

export async function searchForSourceUrl(
  sourceTitle: string,
  claimTitle: string
): Promise<ResolveResult | null> {
  // Step 1: Search with source title
  let results = await cascadeSearch(sourceTitle);

  // Step 2: If no results, broaden search with claim title
  if (results.length === 0) {
    results = await cascadeSearch(claimTitle);
  }

  if (results.length === 0) {
    return null;
  }

  try {
    const candidateList = results
      .slice(0, 10)
      .map((r, i) => `${i + 1}. "${r.title}" | ${r.url} | ${r.snippet}`)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Pick the best matching URL for a source titled "${sourceTitle}" related to the claim "${claimTitle}".

Candidates:
${candidateList}

Return ONLY valid JSON: {"index": <1-based number>, "confidence": "high"|"low"}
- Prefer official records and direct reporting over aggregators
- Prefer candidates where title and publisher clearly match
- If none match at all, return {"index": 0, "confidence": "low"}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const index = parsed.index;
    const confidence = parsed.confidence === "high" ? "high" : "low";

    if (index === 0 || index > results.length) return null;

    return {
      url: results[index - 1].url,
      confidence,
    };
  } catch (error) {
    console.warn(`[Resolve] AI matching failed for "${sourceTitle}":`, error);
    return null;
  }
}

export async function resolveEmptySources(
  filepath: string
): Promise<{ resolved: number; unresolved: number }> {
  const raw = fs.readFileSync(filepath, "utf8");
  const parsed = matter(raw);
  const sources = parsed.data.sources as Array<{
    title: string;
    url: string;
    type: string;
    summary: string;
  }>;

  if (!sources || sources.length === 0) {
    return { resolved: 0, unresolved: 0 };
  }

  const claimTitle = parsed.data.title || "";
  let resolved = 0;
  let unresolved = 0;
  let modified = false;

  for (const source of sources) {
    if (source.url && source.url.trim() !== "") continue;

    const result = await searchForSourceUrl(source.title, claimTitle);

    if (result) {
      source.url = result.url;
      resolved++;
      modified = true;
    } else {
      unresolved++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  if (modified) {
    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filepath, updated, "utf8");
  }

  return { resolved, unresolved };
}

async function resolveAll(): Promise<void> {
  console.log("\n=== Resolving Empty Source URLs ===\n");

  const dirs = [config.claimsDir, config.draftsDir];
  let totalResolved = 0;
  let totalUnresolved = 0;
  let filesProcessed = 0;

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filepath = path.join(dir, file);

      try {
        const raw = fs.readFileSync(filepath, "utf8");
        const parsed = matter(raw);
        const sources = parsed.data.sources as Array<{ url: string }> | undefined;

        if (!sources) continue;

        const hasEmpty = sources.some((s) => !s.url || s.url.trim() === "");
        if (!hasEmpty) continue;

        console.log(`Processing: ${file}`);
        const { resolved, unresolved } = await resolveEmptySources(filepath);
        console.log(`  -> Resolved: ${resolved}, Unresolved: ${unresolved}`);

        totalResolved += resolved;
        totalUnresolved += unresolved;
        filesProcessed++;

        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`  -> Error processing ${file}:`, error);
      }
    }
  }

  console.log(`\n=== Resolution Summary ===`);
  console.log(`  Files processed: ${filesProcessed}`);
  console.log(`  URLs resolved: ${totalResolved}`);
  console.log(`  URLs unresolved (left empty): ${totalUnresolved}\n`);
}

if (process.argv[1] && process.argv[1].includes("resolve-sources")) {
  resolveAll().catch((error) => {
    console.error("Source resolution failed:", error);
    process.exit(1);
  });
}
