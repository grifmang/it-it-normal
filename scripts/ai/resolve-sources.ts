import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { config } from "../config";
import { searchGoogleFactCheck } from "../sources/google-fact-check";
import { searchDuckDuckGo } from "../sources/duckduckgo-search";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

interface ResolveResult {
  url: string;
  confidence: "high" | "low";
}

export async function searchForSourceUrl(
  sourceTitle: string,
  claimTitle: string
): Promise<ResolveResult | null> {
  // Use Google Fact Check API first, then DuckDuckGo as fallback.
  let googleResults = await searchGoogleFactCheck(sourceTitle);

  if (googleResults.length === 0) {
    googleResults = await searchGoogleFactCheck(claimTitle);
  }

  const duckResults = await searchDuckDuckGo(sourceTitle);
  const combined = [
    ...googleResults.map((r) => ({
      title: r.title,
      url: r.url,
      publisher: r.publisher,
      rating: r.rating,
      source: "google-fact-check",
      snippet: "",
    })),
    ...duckResults.map((r) => ({
      title: r.title,
      url: r.url,
      publisher: "Unknown",
      rating: "Unrated",
      source: "duckduckgo",
      snippet: r.snippet,
    })),
  ];

  const deduped = Array.from(new Map(combined.map((r) => [r.url, r])).values());

  if (deduped.length === 0) {
    return null;
  }

  try {
    const candidateList = deduped
      .slice(0, 12)
      .map(
        (r, i) =>
          `${i + 1}. [${r.source}] "${r.title}" | ${r.url} | Publisher: ${r.publisher}${
            r.snippet ? ` | Snippet: ${r.snippet}` : ""
          }`
      )
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

    if (index === 0 || index > deduped.length) return null;

    return {
      url: deduped[index - 1].url,
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
