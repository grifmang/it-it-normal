import Parser from "rss-parser";
import { config } from "../config";

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; IsThisNormal/1.0)",
  },
});

export interface RssItem {
  title: string;
  link: string;
  contentSnippet: string;
  pubDate: string;
  feedSource: string;
  source: "rss";
}

export async function fetchRssFeeds(): Promise<RssItem[]> {
  const items: RssItem[] = [];
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  for (const feedUrl of config.rssFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const feedName = feed.title || feedUrl;

      for (const item of (feed.items || []).slice(0, 15)) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();

        if (pubDate >= twoDaysAgo) {
          items.push({
            title: item.title || "",
            link: item.link || "",
            contentSnippet: (item.contentSnippet || "").slice(0, 500),
            pubDate: pubDate.toISOString(),
            feedSource: feedName,
            source: "rss",
          });
        }
      }

      console.log(`[RSS] ${feedName}: ${feed.items?.length || 0} items`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[RSS] Skipping ${feedUrl}: ${message}`);
    }
  }

  console.log(`[RSS] Found ${items.length} recent items total`);
  return items;
}
