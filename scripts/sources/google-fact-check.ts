import { config } from "../config";

const GOOGLE_FACT_CHECK_API = "https://factchecktools.googleapis.com/v1alpha1/claims:search";
const FACT_CHECK_MAX_CONCURRENCY = 1;
const FACT_CHECK_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FACT_CHECK_MAX_RETRIES = 8;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface FactCheckCacheEntry {
  expiresAt: number;
  data: GoogleFactCheckResponse;
}

const factCheckResponseCache = new Map<string, FactCheckCacheEntry>();
let activeFactCheckRequests = 0;
const factCheckQueue: Array<() => void> = [];

export interface FactCheckReview {
  publisher: string;
  reviewTitle: string;
  textualRating: string;
  reviewUrl: string;
  languageCode: string;
  reviewDate: string;
}

export interface FactCheckClaim {
  text: string;
  claimant: string;
  claimDate: string;
  languageCode: string;
  reviews: FactCheckReview[];
  source: "googleFactCheck";
}

interface GoogleClaimReview {
  publisher?: {
    name?: string;
  };
  title?: string;
  textualRating?: string;
  url?: string;
  languageCode?: string;
  reviewDate?: string;
}

interface GoogleFactCheckClaim {
  text?: string;
  claimant?: string;
  claimDate?: string;
  languageCode?: string;
  claimReview?: GoogleClaimReview[];
}

interface GoogleFactCheckResponse {
  claims?: GoogleFactCheckClaim[];
}

function toCacheKey(params: URLSearchParams): string {
  return params.toString();
}

async function withFactCheckLimiter<T>(task: () => Promise<T>): Promise<T> {
  if (activeFactCheckRequests >= FACT_CHECK_MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      factCheckQueue.push(resolve);
    });
  }

  activeFactCheckRequests += 1;

  try {
    return await task();
  } finally {
    activeFactCheckRequests -= 1;
    const next = factCheckQueue.shift();
    if (next) {
      next();
    }
  }
}

function parseRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date = Date.parse(retryAfter);
  if (Number.isNaN(date)) return null;

  return Math.max(0, date - Date.now());
}

async function fetchFactCheckWithRetry(params: URLSearchParams): Promise<GoogleFactCheckResponse | null> {
  const cacheKey = toCacheKey(params);
  const cached = factCheckResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const url = `${GOOGLE_FACT_CHECK_API}?${params.toString()}`;

  const data = await withFactCheckLimiter(async () => {
    for (let attempt = 0; attempt < FACT_CHECK_MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; IsThisNormal/1.0)",
          },
        });

        if (response.ok) {
          return (await response.json()) as GoogleFactCheckResponse;
        }

        const body = await response.text().catch(() => "");
        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === FACT_CHECK_MAX_RETRIES - 1) {
          console.warn(`[Google Fact Check] HTTP ${response.status}: ${body}`);
          return null;
        }

        const retryAfterMs = parseRetryAfterMs(response);
        const backoffMs = Math.min(60_000, (2 ** attempt) * 1000 + Math.floor(Math.random() * 1000));
        const waitMs = retryAfterMs ?? backoffMs;

        console.warn(
          `[Google Fact Check] Retryable HTTP ${response.status}; retrying in ${waitMs}ms (attempt ${attempt + 1}/${FACT_CHECK_MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, waitMs));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt === FACT_CHECK_MAX_RETRIES - 1) {
          console.warn(`[Google Fact Check] Request error after retries: ${message}`);
          return null;
        }

        const backoffMs = Math.min(60_000, (2 ** attempt) * 1000 + Math.floor(Math.random() * 1000));
        console.warn(
          `[Google Fact Check] Request error "${message}"; retrying in ${backoffMs}ms (attempt ${attempt + 1}/${FACT_CHECK_MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    return null;
  });

  if (!data) {
    return null;
  }

  factCheckResponseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + FACT_CHECK_CACHE_TTL_MS,
  });

  return data;
}

export interface FactCheckSearchResult {
  title: string;
  url: string;
  publisher: string;
  rating: string;
}

export async function searchGoogleFactCheck(query: string): Promise<FactCheckSearchResult[]> {
  if (!config.googleFactCheckApiKey) {
    console.log("[Google Fact Check] API key missing; skipping search.");
    return [];
  }

  const params = new URLSearchParams({
    key: config.googleFactCheckApiKey,
    query,
    languageCode: config.googleFactCheckLanguage,
    pageSize: "10",
  });

  try {
    const data = await fetchFactCheckWithRetry(params);
    if (!data) {
      console.warn(`[Google Fact Check Search] Query "${query}" returned no data after retries.`);
      return [];
    }

    const results: FactCheckSearchResult[] = [];

    for (const claim of data.claims || []) {
      for (const review of claim.claimReview || []) {
        if (review.url) {
          results.push({
            title: review.title || claim.text || "",
            url: review.url,
            publisher: review.publisher?.name || "Unknown",
            rating: review.textualRating || "Unrated",
          });
        }
      }
    }

    console.log(`[Google Fact Check Search] Found ${results.length} results for "${query}"`);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Google Fact Check Search] Error: ${message}`);
    return [];
  }
}

export async function fetchGoogleFactCheckClaims(): Promise<FactCheckClaim[]> {
  if (!config.googleFactCheckApiKey) {
    console.log("[Google Fact Check] API key missing; skipping.");
    return [];
  }

  const queries = [
    // Trump & MAGA
    "Donald Trump", "Trump executive order", "Trump claim",
    "MAGA", "Trump conspiracy", "Trump indictment",
    "Trump election fraud", "stolen election", "January 6",
    "deep state", "weaponized DOJ",
    // Immigration & border
    "immigration", "border crisis", "ICE deportation",
    "illegal immigrants crime", "migrant caravan",
    // Government & policy
    "government spending", "national debt", "federal budget",
    "Congress", "Supreme Court",
    // Elections & voting
    "voter fraud", "voter ID", "election integrity",
    "mail-in ballots", "voting machines",
    // Healthcare & medicine
    "vaccine", "COVID vaccine", "vaccine side effects",
    "RFK Jr", "FDA", "CDC", "fluoride",
    "ivermectin", "hydroxychloroquine",
    "Medicare", "Medicaid", "Affordable Care Act",
    "abortion", "reproductive rights",
    // Conspiracy theories & misinformation
    "QAnon", "great replacement", "chemtrails",
    "5G", "Bill Gates microchip",
    "climate change hoax", "election rigged",
    // Economy
    "inflation", "economy", "tariffs", "trade war",
    "jobs report", "unemployment",
    // Other hot-button issues
    "gun control", "Second Amendment",
    "critical race theory", "DEI", "woke",
    "transgender", "drag queen",
    "Hunter Biden", "Biden crime family",
    "Project 2025", "DOGE Elon Musk",
    // Epstein & Twitter Files
    "Jeffrey Epstein", "Epstein files", "Epstein client list",
    "Trump Epstein", "Twitter Files",
  ];
  const allClaims: FactCheckClaim[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        key: config.googleFactCheckApiKey,
        query,
        languageCode: config.googleFactCheckLanguage,
        pageSize: String(config.googleFactCheckPageSize),
      });

      const data = await fetchFactCheckWithRetry(params);
      if (!data) {
        console.warn(`[Google Fact Check] Query "${query}" failed after retries.`);
        continue;
      }

      for (const claim of data.claims || []) {
        const key = claim.text || "";
        if (!key || seen.has(key)) continue;
        seen.add(key);

        const reviews = (claim.claimReview || []).map((review) => ({
          publisher: review.publisher?.name || "Unknown publisher",
          reviewTitle: review.title || "",
          textualRating: review.textualRating || "Unrated",
          reviewUrl: review.url || "",
          languageCode: review.languageCode || claim.languageCode || config.googleFactCheckLanguage,
          reviewDate: review.reviewDate || "",
        }));

        if (reviews.length > 0) {
          allClaims.push({
            text: key,
            claimant: claim.claimant || "",
            claimDate: claim.claimDate || "",
            languageCode: claim.languageCode || config.googleFactCheckLanguage,
            reviews,
            source: "googleFactCheck",
          });
        }
      }
      // Soft spacing between broad query scans.
      await new Promise((r) => setTimeout(r, 250));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Google Fact Check] Query "${query}" error: ${message}`);
    }
  }

  console.log(`[Google Fact Check] Retrieved ${allClaims.length} claims`);
  return allClaims;
}
