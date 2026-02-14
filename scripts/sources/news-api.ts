import { config } from "../config";

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  sourceName: string;
  source: "news-api";
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  if (!config.newsApiKey) {
    console.log("[NewsAPI] Skipped — no API key configured");
    return [];
  }

  const articles: NewsArticle[] = [];

  try {
    const url = `https://newsapi.org/v2/top-headlines?country=us&pageSize=100&apiKey=${config.newsApiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[NewsAPI] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    for (const article of data.articles || []) {
      if (article.title && article.title !== "[Removed]") {
        articles.push({
          title: article.title,
          description: article.description || "",
          url: article.url,
          publishedAt: article.publishedAt,
          sourceName: article.source?.name || "Unknown",
          source: "news-api",
        });
      }
    }

    console.log(`[NewsAPI] Found ${articles.length} articles`);
  } catch (error) {
    console.error("[NewsAPI] Error:", error);
  }

  return articles;
}
