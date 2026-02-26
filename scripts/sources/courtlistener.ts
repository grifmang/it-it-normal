import { config } from "../config";

const COURTLISTENER_MAX_RETRIES = 3;
const COURTLISTENER_RETRY_DELAY_MS = 5000;
const COURTLISTENER_TIMEOUT_MS = 30000;

export interface CourtOpinion {
  caseName: string;
  court: string;
  dateDecided: string;
  url: string;
  summary: string;
  source: "courtlistener";
  timestamp: string;
}

export async function fetchCourtOpinions(): Promise<CourtOpinion[]> {
  const opinions: CourtOpinion[] = [];

  if (!config.courtListenerApiToken) {
    console.warn(
      "[CourtListener] Skipping: missing COURTLISTENER_API_TOKEN (CourtListener now requires API auth)"
    );
    return opinions;
  }

  const url = "https://www.courtlistener.com/api/rest/v4/opinions/?order_by=-date_created&type=010combined";

  for (let attempt = 1; attempt <= COURTLISTENER_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), COURTLISTENER_TIMEOUT_MS);
      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${config.courtListenerApiToken}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[CourtListener] Error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

      for (const opinion of data.results || []) {
        const created = new Date(opinion.date_created || 0);
        if (created < cutoff) continue;

        opinions.push({
          caseName: opinion.case_name || "",
          court: opinion.court || "",
          dateDecided: opinion.date_created || "",
          url: `https://www.courtlistener.com${opinion.absolute_url || ""}`,
          summary: (opinion.plain_text || "").slice(0, 500),
          source: "courtlistener",
          timestamp: opinion.date_created || new Date().toISOString(),
        });
      }

      console.log(`[CourtListener] Found ${opinions.length} recent opinions`);
      return opinions;
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      const message = timedOut ? `timed out after ${COURTLISTENER_TIMEOUT_MS / 1000}s` : (error instanceof Error ? error.message : String(error));

      if (attempt < COURTLISTENER_MAX_RETRIES) {
        console.warn(`[CourtListener] Attempt ${attempt}/${COURTLISTENER_MAX_RETRIES} failed (${message}); retrying in ${COURTLISTENER_RETRY_DELAY_MS / 1000}s`);
        await new Promise((r) => setTimeout(r, COURTLISTENER_RETRY_DELAY_MS));
      } else {
        console.warn(`[CourtListener] All ${COURTLISTENER_MAX_RETRIES} attempts failed (${message})`);
      }
    }
  }

  return opinions;
}
