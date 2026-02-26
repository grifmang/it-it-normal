import { config } from "../config";
import { WebSearchResult } from "./search-types";

const GOOGLE_CUSTOM_SEARCH_API = "https://customsearch.googleapis.com/customsearch/v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_RETRIES = 3;
const MAX_CONCURRENCY = 1;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface CacheEntry {
  expiresAt: number;
  data: GoogleCustomSearchResponse;
}

interface GoogleCustomSearchResponse {
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
  }>;
}

const responseCache = new Map<string, CacheEntry>();
let activeRequests = 0;
const requestQueue: Array<() => void> = [];
let dailyQuotaExhausted = false;

async function withLimiter<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      requestQueue.push(resolve);
    });
  }

  activeRequests += 1;

  try {
    return await task();
  } finally {
    activeRequests -= 1;
    const next = requestQueue.shift();
    if (next) {
      next();
    }
  }
}

async function fetchWithRetry(params: URLSearchParams): Promise<GoogleCustomSearchResponse | null> {
  const cacheKey = params.toString();
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const url = `${GOOGLE_CUSTOM_SEARCH_API}?${params.toString()}`;

  const data = await withLimiter(async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; IsThisNormal/1.0)",
          },
        });

        if (response.ok) {
          return (await response.json()) as GoogleCustomSearchResponse;
        }

        const body = await response.text().catch(() => "");

        if (response.status === 429) {
          dailyQuotaExhausted = true;
          console.warn("[Google Custom Search] Daily quota exhausted (HTTP 429). Skipping all subsequent calls.");
          return null;
        }

        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_RETRIES - 1) {
          console.warn(`[Google Custom Search] HTTP ${response.status}: ${body}`);
          return null;
        }

        const backoffMs = Math.min(60_000, (2 ** attempt) * 1000 + Math.floor(Math.random() * 1000));
        console.warn(
          `[Google Custom Search] Retryable HTTP ${response.status}; retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt === MAX_RETRIES - 1) {
          console.warn(`[Google Custom Search] Request error after retries: ${message}`);
          return null;
        }

        const backoffMs = Math.min(60_000, (2 ** attempt) * 1000 + Math.floor(Math.random() * 1000));
        console.warn(
          `[Google Custom Search] Request error "${message}"; retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    return null;
  });

  if (!data) {
    return null;
  }

  responseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return data;
}

export async function searchGoogleCustom(query: string): Promise<WebSearchResult[]> {
  if (!config.googleApiKey || !config.googleCustomSearchEngineId) {
    console.log("[Google Custom Search] API key or Search Engine ID missing; skipping.");
    return [];
  }

  if (dailyQuotaExhausted) {
    console.log("[Google Custom Search] Daily quota exhausted; skipping.");
    return [];
  }

  const params = new URLSearchParams({
    key: config.googleApiKey,
    cx: config.googleCustomSearchEngineId,
    q: query,
    num: "10",
  });

  try {
    const data = await fetchWithRetry(params);
    if (!data) {
      console.warn(`[Google Custom Search] Query "${query}" returned no data after retries.`);
      return [];
    }

    const results: WebSearchResult[] = [];

    for (const item of data.items || []) {
      if (item.link) {
        results.push({
          title: item.title || "",
          url: item.link,
          snippet: item.snippet || "",
          source: "googleCustomSearch",
        });
      }
    }

    console.log(`[Google Custom Search] Found ${results.length} results for "${query}"`);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Google Custom Search] Error: ${message}`);
    return [];
  }
}
