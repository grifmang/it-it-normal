import { fetchGoogleTrends, TrendingTopic } from "./google-trends";
import { fetchRedditPosts, RedditPost } from "./reddit";
import { fetchNewsArticles, NewsArticle } from "./news-api";
import { fetchRssFeeds, RssItem } from "./rss";

export type RawItem = TrendingTopic | RedditPost | NewsArticle | RssItem;

export interface AggregatedContent {
  googleTrends: TrendingTopic[];
  reddit: RedditPost[];
  news: NewsArticle[];
  rss: RssItem[];
  all: RawItem[];
  fetchedAt: string;
}

export async function aggregateAllSources(): Promise<AggregatedContent> {
  console.log("\n=== Aggregating sources ===\n");

  const [googleTrends, reddit, news, rss] = await Promise.all([
    fetchGoogleTrends(),
    fetchRedditPosts(),
    fetchNewsArticles(),
    fetchRssFeeds(),
  ]);

  const all: RawItem[] = [...googleTrends, ...reddit, ...news, ...rss];

  console.log(`\n=== Total: ${all.length} items from all sources ===\n`);

  return {
    googleTrends,
    reddit,
    news,
    rss,
    all,
    fetchedAt: new Date().toISOString(),
  };
}
