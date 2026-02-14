import { config } from "../config";

export interface RedditPost {
  title: string;
  subreddit: string;
  score: number;
  url: string;
  selftext: string;
  source: "reddit";
  timestamp: string;
}

const REDDIT_USER_AGENT = "script:is-this-normal:1.0 (by /u/is_this_normal_bot)";

async function fetchSubreddit(subreddit: string, sort: "hot" | "new"): Promise<RedditPost[]> {
  const endpoint = `https://api.reddit.com/r/${subreddit}/${sort}?limit=25&raw_json=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": REDDIT_USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    const children = data?.data?.children || [];

    return children
      .map((child: { data: Record<string, unknown> }) => child.data)
      .filter((post: Record<string, unknown>) => Number(post.score || 0) > 100)
      .map((post: Record<string, unknown>) => ({
        title: String(post.title || ""),
        subreddit: String(post.subreddit || subreddit),
        score: Number(post.score || 0),
        url: String(post.url || ""),
        selftext: String(post.selftext || "").slice(0, 500),
        source: "reddit" as const,
        timestamp: new Date(Number(post.created_utc || Date.now() / 1000) * 1000).toISOString(),
      }));
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  for (const subreddit of config.redditSubreddits) {
    const normalized = subreddit.trim();
    if (!/^[A-Za-z0-9_]+$/.test(normalized)) {
      console.warn(`[Reddit] Skipping invalid subreddit name: ${subreddit}`);
      continue;
    }

    try {
      const hot = await fetchSubreddit(normalized, "hot");
      const fresh = await fetchSubreddit(normalized, "new");
      posts.push(...hot, ...fresh);
    } catch (error) {
      console.error(`[Reddit] Error fetching r/${subreddit}:`, error);
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  const deduped = Array.from(new Map(posts.map((post) => [post.url, post])).values());
  console.log(`[Reddit] Found ${deduped.length} high-engagement posts`);
  return deduped;
}
