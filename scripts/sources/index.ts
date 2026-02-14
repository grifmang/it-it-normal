import { fetchGoogleTrends, TrendingTopic } from "./google-trends";
import { fetchRedditPosts, RedditPost } from "./reddit";
import { fetchNewsArticles, NewsArticle } from "./news-api";
import { fetchRssFeeds, RssItem } from "./rss";
import { fetchCongressActivity, CongressItem } from "./congress";
import { fetchCourtOpinions, CourtOpinion } from "./courtlistener";

export type RawItem = TrendingTopic | RedditPost | NewsArticle | RssItem | CongressItem | CourtOpinion;

export interface AggregatedContent {
  googleTrends: TrendingTopic[];
  reddit: RedditPost[];
  news: NewsArticle[];
  rss: RssItem[];
  congress: CongressItem[];
  courtlistener: CourtOpinion[];
  all: RawItem[];
  fetchedAt: string;
}

export async function aggregateAllSources(): Promise<AggregatedContent> {
  console.log("\n=== Aggregating sources ===\n");

  const [googleTrends, reddit, news, rss, congress, courtlistener] = await Promise.all([
    fetchGoogleTrends(),
    fetchRedditPosts(),
    fetchNewsArticles(),
    fetchRssFeeds(),
    fetchCongressActivity(),
    fetchCourtOpinions(),
  ]);

  const all: RawItem[] = [...googleTrends, ...reddit, ...news, ...rss, ...congress, ...courtlistener];

  console.log(`\n=== Total: ${all.length} items from all sources ===\n`);

  return {
    googleTrends,
    reddit,
    news,
    rss,
    congress,
    courtlistener,
    all,
    fetchedAt: new Date().toISOString(),
  };
}

export type { CongressItem } from "./congress";
export type { CourtOpinion } from "./courtlistener";
