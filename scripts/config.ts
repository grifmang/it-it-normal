import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  newsApiKey: process.env.NEWS_API_KEY || "",
  congressApiKey: process.env.CONGRESS_API_KEY || "",
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY || "",
  courtListenerApiToken: process.env.COURTLISTENER_API_TOKEN || "",
  googleFactCheckApiKey: process.env.GOOGLE_FACT_CHECK_API_KEY || "",

  // Directories
  claimsDir: path.join(__dirname, "..", "content", "claims"),
  draftsDir: path.join(__dirname, "..", "content", "drafts"),

  // Source settings
  googleTrendsGeo: process.env.GOOGLE_TRENDS_GEO || "US",
  redditSubreddits: (
    process.env.REDDIT_SUBREDDITS || "politics,news,neutralpolitics,PoliticalDiscussion,law,scotus"
  ).split(",").map(s => s.trim()).filter(Boolean),
  newsApiTopics: (
    process.env.NEWS_API_TOPICS ||
    "politics,government,congress,supreme court,immigration,election,executive order,federal budget,trade policy"
  ).split(",").map(s => s.trim()).filter(Boolean),
  googleFactCheckLanguage: process.env.GOOGLE_FACT_CHECK_LANGUAGE || "en-US",
  googleFactCheckPageSize: parseInt(
    process.env.GOOGLE_FACT_CHECK_PAGE_SIZE || "20"
  ),

  // Publish mode
  autoPublish: process.env.AUTO_PUBLISH === "true",

  // RSS feeds to monitor
  rssFeeds: [
    // Fact-checkers (to find gaps, not duplicate)
    "https://www.politifact.com/rss/all/",
    "https://www.snopes.com/feed/",
    "https://www.factcheck.org/feed/",
    "https://www.reuters.com/fact-check/rss",
    "https://apnews.com/hub/ap-fact-check/rss",
    // Government
    "https://www.whitehouse.gov/presidential-actions/feed/",
    "https://www.whitehouse.gov/briefing-room/feed/",
    "https://www.justice.gov/feeds/justice-news.xml",
    // News
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "https://feeds.washingtonpost.com/rss/politics",
    "https://feeds.npr.org/1014/rss.xml",
    // Wire services & political news
    "https://rsshub.app/apnews/topics/politics",
    "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
    "https://thehill.com/feed/",
    "https://www.politico.com/rss/politicopicks.xml",
    // Legal / SCOTUS
    "https://www.scotusblog.com/feed/",
  ],

  // Pipeline settings
  maxClaimsPerRun: parseInt(process.env.MAX_CLAIMS_PER_RUN || "6"),
  minRelevanceScore: parseFloat(process.env.MIN_RELEVANCE_SCORE || "0.6"),
};

export function validateConfig(): string[] {
  const errors: string[] = [];
  if (!config.anthropicApiKey) {
    errors.push("ANTHROPIC_API_KEY is required in .env");
  }
  return errors;
}
