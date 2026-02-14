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

  try {
    const url = `https://www.courtlistener.com/api/rest/v4/opinions/?order_by=-date_created&type=010combined`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
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
  } catch (error) {
    console.error("[CourtListener] Error:", error);
  }

  return opinions;
}
