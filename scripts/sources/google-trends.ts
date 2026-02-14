import Parser from "rss-parser";
import { config } from "../config";

export interface TrendingTopic {
  title: string;
  source: "google-trends";
  trafficVolume: string;
  relatedQueries: string[];
  timestamp: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "IsThisNormal/1.0 (claim-research-bot)",
  },
});

export async function fetchGoogleTrends(): Promise<TrendingTopic[]> {
  try {
    const geo = (config.googleTrendsGeo || "US").toUpperCase();
    const feedUrl = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`;

    const feed = await parser.parseURL(feedUrl);
    const topics: TrendingTopic[] = [];

    for (const item of (feed.items || []).slice(0, 25)) {
      const title = item.title?.trim() || "";
      if (!title) continue;

      topics.push({
        title,
        source: "google-trends",
        trafficVolume: "",
        relatedQueries: [],
        timestamp: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
      });
    }

    console.log(`[Google Trends] Found ${topics.length} trending topics`);
    return topics;
  } catch (error) {
    console.error("[Google Trends] Error:", error);
    return [];
  }
}
