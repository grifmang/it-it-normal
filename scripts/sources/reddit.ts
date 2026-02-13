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

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  for (const subreddit of config.redditSubreddits) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "IsThisNormal/1.0 (claim-research-bot)",
        },
      });

      if (!response.ok) {
        console.error(
          `[Reddit] Error fetching r/${subreddit}: ${response.status}`
        );
        continue;
      }

      const data = await response.json();
      const children = data?.data?.children || [];

      for (const child of children) {
        const post = child.data;
        if (post.score > 100) {
          posts.push({
            title: post.title,
            subreddit: post.subreddit,
            score: post.score,
            url: post.url,
            selftext: (post.selftext || "").slice(0, 500),
            source: "reddit",
            timestamp: new Date(post.created_utc * 1000).toISOString(),
          });
        }
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.error(`[Reddit] Error fetching r/${subreddit}:`, error);
    }
  }

  console.log(`[Reddit] Found ${posts.length} high-engagement posts`);
  return posts;
}
