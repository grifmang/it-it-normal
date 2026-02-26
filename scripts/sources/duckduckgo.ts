import { search, SafeSearchType } from "duck-duck-scrape";
import { WebSearchResult } from "./search-types";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_RETRIES = 3;
const MIN_REQUEST_GAP_MS = 3000;

interface CacheEntry {
  expiresAt: number;
  data: WebSearchResult[];
}

const responseCache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

export async function searchDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  const cached = responseCache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const msSinceLast = Date.now() - lastRequestAt;
  if (msSinceLast < MIN_REQUEST_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_GAP_MS - msSinceLast));
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      lastRequestAt = Date.now();
      const searchResults = await search(query, {
        safeSearch: SafeSearchType.MODERATE,
      });

      const results: WebSearchResult[] = [];

      for (const item of (searchResults.results || []).slice(0, 10)) {
        if (item.url) {
          results.push({
            title: item.title || "",
            url: item.url,
            snippet: item.description || "",
            source: "duckduckgo",
          });
        }
      }

      responseCache.set(query, {
        data: results,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      console.log(`[DuckDuckGo] Found ${results.length} results for "${query}"`);
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (attempt === MAX_RETRIES - 1) {
        console.warn(`[DuckDuckGo] Search failed after ${MAX_RETRIES} retries: ${message}`);
        return [];
      }

      const backoffMs = Math.min(60_000, (2 ** attempt) * 1000 + Math.floor(Math.random() * 1000));
      console.warn(
        `[DuckDuckGo] Search error "${message}"; retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return [];
}
