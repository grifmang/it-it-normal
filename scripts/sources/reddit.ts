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
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Status ${response.status} (Reddit blocked unauthenticated access from this environment)`);
      }

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

async function fetchSubredditWithDelay(subreddit: string, delayMs: number): Promise<RedditPost[]> {
  await new Promise((r) => setTimeout(r, delayMs));

  const normalized = subreddit.trim();
  if (!/^[A-Za-z0-9_]+$/.test(normalized)) {
    console.warn(`[Reddit] Skipping invalid subreddit name: ${subreddit}`);
    return [];
  }

  try {
    const hot = await fetchSubreddit(normalized, "hot");
    const fresh = await fetchSubreddit(normalized, "new");
    return [...hot, ...fresh];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Reddit] Skipping r/${subreddit}: ${message}`);
    return [];
  }
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  // Fetch subreddits in parallel with 300ms staggered delays
  const results = await Promise.all(
    config.redditSubreddits.map((subreddit, i) =>
      fetchSubredditWithDelay(subreddit, i * 300)
    )
  );

  const posts = results.flat();
  const deduped = Array.from(new Map(posts.map((post) => [post.url, post])).values());
  console.log(`[Reddit] Found ${deduped.length} high-engagement posts`);
  return deduped;
}
