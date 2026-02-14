import { config } from "../config";

const GOOGLE_FACT_CHECK_API = "https://factchecktools.googleapis.com/v1alpha1/claims:search";

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

  const url = `${GOOGLE_FACT_CHECK_API}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IsThisNormal/1.0)",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[Google Fact Check Search] HTTP ${response.status}: ${body}`);
      return [];
    }

    const data = (await response.json()) as GoogleFactCheckResponse;
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

  const queries = ["politics", "government", "immigration", "economy"];
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

      const url = `${GOOGLE_FACT_CHECK_API}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IsThisNormal/1.0)",
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.warn(`[Google Fact Check] Query "${query}" failed: HTTP ${response.status} — ${body}`);
        continue;
      }

      const data = (await response.json()) as GoogleFactCheckResponse;
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Google Fact Check] Query "${query}" error: ${message}`);
    }
  }

  console.log(`[Google Fact Check] Retrieved ${allClaims.length} claims`);
  return allClaims;
}
