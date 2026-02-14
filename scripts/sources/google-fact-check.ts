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

export async function fetchGoogleFactCheckClaims(): Promise<FactCheckClaim[]> {
  if (!config.googleFactCheckApiKey) {
    console.log("[Google Fact Check] API key missing; skipping.");
    return [];
  }

  const params = new URLSearchParams({
    key: config.googleFactCheckApiKey,
    languageCode: config.googleFactCheckLanguage,
    pageSize: String(config.googleFactCheckPageSize),
  });

  const url = `${GOOGLE_FACT_CHECK_API}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "IsThisNormal/1.0 (claim-research-bot)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as GoogleFactCheckResponse;
    const claims = (data.claims || []).map((claim): FactCheckClaim => ({
      text: claim.text || "",
      claimant: claim.claimant || "",
      claimDate: claim.claimDate || "",
      languageCode: claim.languageCode || config.googleFactCheckLanguage,
      reviews: (claim.claimReview || []).map((review) => ({
        publisher: review.publisher?.name || "Unknown publisher",
        reviewTitle: review.title || "",
        textualRating: review.textualRating || "Unrated",
        reviewUrl: review.url || "",
        languageCode: review.languageCode || claim.languageCode || config.googleFactCheckLanguage,
        reviewDate: review.reviewDate || "",
      })),
      source: "googleFactCheck",
    }));

    const filtered = claims.filter((claim) => claim.text && claim.reviews.length > 0);
    console.log(`[Google Fact Check] Retrieved ${filtered.length} claims`);
    return filtered;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Google Fact Check] Skipping due to error: ${message}`);
    return [];
  }
}
