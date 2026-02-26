export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "googleFactCheck" | "googleCustomSearch" | "duckduckgo";
}
