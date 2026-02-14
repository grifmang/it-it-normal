import { fetchGoogleTrends, TrendingTopic } from "./google-trends";
import { fetchRedditPosts, RedditPost } from "./reddit";
import { fetchNewsArticles, NewsArticle } from "./news-api";
import { fetchRssFeeds, RssItem } from "./rss";
import { fetchCongressActivity, CongressItem } from "./congress";
import { fetchCourtOpinions, CourtOpinion } from "./courtlistener";
import { fetchExecutiveOrders, ExecutiveOrderItem } from "./executive-orders";

export type RawItem = TrendingTopic | RedditPost | NewsArticle | RssItem | CongressItem | CourtOpinion | ExecutiveOrderItem;

export interface AggregatedContent {
  googleTrends: TrendingTopic[];
  reddit: RedditPost[];
  news: NewsArticle[];
  rss: RssItem[];
  congress: CongressItem[];
  courtlistener: CourtOpinion[];
  executiveOrders: ExecutiveOrderItem[];
  all: RawItem[];
  fetchedAt: string;
}

export async function aggregateAllSources(): Promise<AggregatedContent> {
  console.log("\n=== Aggregating sources ===\n");

  const [googleTrends, reddit, news, rss, congress, courtlistener, executiveOrders] = await Promise.all([
    fetchGoogleTrends(),
    fetchRedditPosts(),
    fetchNewsArticles(),
    fetchRssFeeds(),
    fetchCongressActivity(),
    fetchCourtOpinions(),
    fetchExecutiveOrders(),
  ]);

  const all: RawItem[] = [...googleTrends, ...reddit, ...news, ...rss, ...congress, ...courtlistener, ...executiveOrders];

  console.log(`\n=== Total: ${all.length} items from all sources ===\n`);

  return {
    googleTrends,
    reddit,
    news,
    rss,
    congress,
    courtlistener,
    executiveOrders,
    all,
    fetchedAt: new Date().toISOString(),
  };
}

export type { CongressItem } from "./congress";
export type { CourtOpinion } from "./courtlistener";

export type { ExecutiveOrderItem } from "./executive-orders";
