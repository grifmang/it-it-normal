import googleTrends from "google-trends-api";
import { config } from "../config";

export interface TrendingTopic {
  title: string;
  source: "google-trends";
  trafficVolume: string;
  relatedQueries: string[];
  timestamp: string;
}

export async function fetchGoogleTrends(): Promise<TrendingTopic[]> {
  try {
    const results = await googleTrends.dailyTrends({
      geo: config.googleTrendsGeo,
    });

    const parsed = JSON.parse(results);
    const days =
      parsed.default?.trendingSearchesDays || [];

    const topics: TrendingTopic[] = [];

    for (const day of days.slice(0, 2)) {
      for (const search of day.trendingSearches || []) {
        const title = search.title?.query || "";
        const traffic = search.formattedTraffic || "";
        const relatedQueries = (search.relatedQueries || []).map(
          (q: { query: string }) => q.query
        );

        if (title) {
          topics.push({
            title,
            source: "google-trends",
            trafficVolume: traffic,
            relatedQueries,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`[Google Trends] Found ${topics.length} trending topics`);
    return topics;
  } catch (error) {
    console.error("[Google Trends] Error:", error);
    return [];
  }
}
