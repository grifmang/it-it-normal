import { config } from "../config";

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  source: "brave-search";
  timestamp: string;
}

export async function searchBrave(query: string): Promise<BraveSearchResult[]> {
  if (!config.braveSearchApiKey) {
    console.log("[BraveSearch] Skipped — no API key configured");
    return [];
  }

  const results: BraveSearchResult[] = [];

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      headers: {
        "X-Subscription-Token": config.braveSearchApiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[BraveSearch] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    for (const result of data.web?.results || []) {
      results.push({
        title: result.title || "",
        url: result.url || "",
        description: result.description || "",
        source: "brave-search",
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[BraveSearch] Found ${results.length} results for "${query}"`);
  } catch (error) {
    console.error("[BraveSearch] Error:", error);
  }

  return results;
}
