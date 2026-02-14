import { fetchGoogleTrends, TrendingTopic } from "./google-trends";
import { fetchRedditPosts, RedditPost } from "./reddit";
import { fetchNewsArticles, NewsArticle } from "./news-api";
import { fetchRssFeeds, RssItem } from "./rss";
import { fetchCongressActivity, CongressItem } from "./congress";
import { fetchCourtOpinions, CourtOpinion } from "./courtlistener";
import { fetchExecutiveOrders, ExecutiveOrderItem } from "./executive-orders";
import { fetchGoogleFactCheckClaims, FactCheckClaim } from "./google-fact-check";
import { searchBrave, BraveSearchResult } from "./brave-search";

export type RawItem = TrendingTopic | RedditPost | NewsArticle | RssItem | CongressItem | CourtOpinion | ExecutiveOrderItem | FactCheckClaim | BraveSearchResult;

export interface AggregatedContent {
  googleTrends: TrendingTopic[];
  reddit: RedditPost[];
  news: NewsArticle[];
  rss: RssItem[];
  congress: CongressItem[];
  courtlistener: CourtOpinion[];
  executiveOrders: ExecutiveOrderItem[];
  googleFactChecks: FactCheckClaim[];
  braveSearch: BraveSearchResult[];
  all: RawItem[];
  fetchedAt: string;
}

export async function aggregateAllSources(): Promise<AggregatedContent> {
  console.log("\n=== Aggregating sources ===\n");

  const [googleTrends, reddit, news, rss, congress, courtlistener, executiveOrders, googleFactChecks] = await Promise.all([
    fetchGoogleTrends(),
    fetchRedditPosts(),
    fetchNewsArticles(),
    fetchRssFeeds(),
    fetchCongressActivity(),
    fetchCourtOpinions(),
    fetchExecutiveOrders(),
    fetchGoogleFactCheckClaims(),
  ]);

  // Search Brave for top 3 trending topics
  const braveSearch: BraveSearchResult[] = [];
  const topTrends = googleTrends.slice(0, 3);
  for (const trend of topTrends) {
    const results = await searchBrave(trend.title);
    braveSearch.push(...results);
  }

  const all: RawItem[] = [...googleTrends, ...reddit, ...news, ...rss, ...congress, ...courtlistener, ...executiveOrders, ...googleFactChecks, ...braveSearch];

  console.log(`\n=== Total: ${all.length} items from all sources ===\n`);

  return {
    googleTrends,
    reddit,
    news,
    rss,
    congress,
    courtlistener,
    executiveOrders,
    googleFactChecks,
    braveSearch,
    all,
    fetchedAt: new Date().toISOString(),
  };
}

export type { CongressItem } from "./congress";
export type { CourtOpinion } from "./courtlistener";

export type { ExecutiveOrderItem } from "./executive-orders";

export type { FactCheckClaim } from "./google-fact-check";
