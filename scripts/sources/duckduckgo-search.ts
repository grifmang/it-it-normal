import { config } from "../config";

export interface DuckDuckGoSearchResult {
  title: string;
  url: string;
  snippet: string;
}

const DUCKDUCKGO_HTML_SEARCH = "https://html.duckduckgo.com/html/";

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function stripTags(input: string): string {
  return decodeHtml(input.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function normalizeDuckDuckGoUrl(rawHref: string): string {
  if (!rawHref) return "";

  const decoded = decodeHtml(rawHref);

  // DuckDuckGo often wraps outbound links as /l/?uddg=<encoded>
  if (decoded.startsWith("/l/?") || decoded.includes("duckduckgo.com/l/?")) {
    const wrapped = decoded.startsWith("http")
      ? decoded
      : `https://duckduckgo.com${decoded.startsWith("/") ? "" : "/"}${decoded}`;

    try {
      const wrappedUrl = new URL(wrapped);
      const target = wrappedUrl.searchParams.get("uddg");
      if (target) return decodeURIComponent(target);
    } catch {
      return decoded;
    }
  }

  if (decoded.startsWith("//")) {
    return `https:${decoded}`;
  }

  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    return decoded;
  }

  if (decoded.startsWith("/")) {
    return `https://duckduckgo.com${decoded}`;
  }

  return decoded;
}

export async function searchDuckDuckGo(query: string): Promise<DuckDuckGoSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      kl: config.duckDuckGoRegion,
    });

    const response = await fetch(`${DUCKDUCKGO_HTML_SEARCH}?${params.toString()}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IsThisNormal/1.0)",
      },
    });

    if (!response.ok) {
      console.warn(`[DuckDuckGo Search] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const html = await response.text();
    const resultPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetPattern = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

    const matches: Array<{ href: string; title: string }> = [];
    let match: RegExpExecArray | null = null;

    while ((match = resultPattern.exec(html)) !== null && matches.length < 10) {
      matches.push({
        href: match[1],
        title: stripTags(match[2]),
      });
    }

    const snippets: string[] = [];
    let snippetMatch: RegExpExecArray | null = null;
    while ((snippetMatch = snippetPattern.exec(html)) !== null && snippets.length < 10) {
      snippets.push(stripTags(snippetMatch[1] || snippetMatch[2] || ""));
    }

    const results = matches
      .map((m, i) => ({
        title: m.title,
        url: normalizeDuckDuckGoUrl(m.href),
        snippet: snippets[i] || "",
      }))
      .filter((r) => r.url && (r.url.startsWith("http://") || r.url.startsWith("https://")));

    console.log(`[DuckDuckGo Search] Found ${results.length} results for "${query}"`);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[DuckDuckGo Search] Error for query "${query}": ${message}`);
    return [];
  }
}
