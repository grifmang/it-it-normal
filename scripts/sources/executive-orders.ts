const EXECUTIVE_ORDER_KEYWORDS = [
  "executive order",
  "presidential proclamation",
  "memorandum",
  "presidential action",
];

const FEDERAL_REGISTER_EXEC_ORDERS_URL =
  "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bpresidential_document_type%5D%5B%5D=executive_order&order=newest&per_page=25";

const WHITE_HOUSE_ACTIONS_FEED_URL =
  "https://www.whitehouse.gov/presidential-actions/feed/";

export interface ExecutiveOrderItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  sourceName: string;
  source: "executive-orders";
}

interface FederalRegisterResponse {
  results?: Array<{
    title?: string;
    abstract?: string;
    html_url?: string;
    pdf_url?: string;
    publication_date?: string;
    document_number?: string;
  }>;
}

interface RssXmlItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function isRecent(publishedAt: string): boolean {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return false;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return date >= sevenDaysAgo;
}

function hasExecutiveOrderSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  return EXECUTIVE_ORDER_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
}

async function fetchFederalRegisterExecutiveOrders(): Promise<ExecutiveOrderItem[]> {
  try {
    const response = await fetch(FEDERAL_REGISTER_EXEC_ORDERS_URL, {
      headers: {
        "User-Agent": "IsThisNormal/1.0 (claim-research-bot)",
      },
    });

    if (!response.ok) {
      console.warn(
        `[ExecOrders] Federal Register request failed: ${response.status}`
      );
      return [];
    }

    const data = (await response.json()) as FederalRegisterResponse;

    return (data.results || [])
      .map((result) => ({
        title: result.title || "",
        summary: result.abstract || `Executive Order ${result.document_number || ""}`,
        url: result.html_url || result.pdf_url || "",
        publishedAt: result.publication_date || "",
        sourceName: "Federal Register",
        source: "executive-orders" as const,
      }))
      .filter((item) => item.title && item.url && isRecent(item.publishedAt));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ExecOrders] Federal Register fetch skipped: ${message}`);
    return [];
  }
}

function parseXmlTag(text: string, tagName: string): string {
  const tag = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = text.match(tag);
  return match?.[1]?.trim() || "";
}

function parseRssItems(xml: string): RssXmlItem[] {
  return xml
    .split("<item>")
    .slice(1)
    .map((chunk) => chunk.split("</item>")[0] || "")
    .map((itemXml) => ({
      title: parseXmlTag(itemXml, "title"),
      link: parseXmlTag(itemXml, "link"),
      description: parseXmlTag(itemXml, "description"),
      pubDate: parseXmlTag(itemXml, "pubDate"),
    }));
}

async function fetchWhiteHouseExecutiveActions(): Promise<ExecutiveOrderItem[]> {
  try {
    const response = await fetch(WHITE_HOUSE_ACTIONS_FEED_URL, {
      headers: {
        "User-Agent": "IsThisNormal/1.0 (claim-research-bot)",
      },
    });

    if (!response.ok) {
      console.warn(
        `[ExecOrders] White House feed request failed: ${response.status}`
      );
      return [];
    }

    const xml = await response.text();
    const parsedItems = parseRssItems(xml);

    return parsedItems
      .filter((item) => {
        const signalText = `${item.title} ${item.description}`;
        return item.link && isRecent(item.pubDate) && hasExecutiveOrderSignal(signalText);
      })
      .map((item) => ({
        title: item.title,
        summary: item.description.replace(/<[^>]*>/g, "").slice(0, 500),
        url: item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
        sourceName: "White House Presidential Actions",
        source: "executive-orders" as const,
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ExecOrders] White House feed skipped: ${message}`);
    return [];
  }
}

export async function fetchExecutiveOrders(): Promise<ExecutiveOrderItem[]> {
  const [federalRegisterItems, whiteHouseItems] = await Promise.all([
    fetchFederalRegisterExecutiveOrders(),
    fetchWhiteHouseExecutiveActions(),
  ]);

  const dedupedByUrl = new Map<string, ExecutiveOrderItem>();

  for (const item of [...federalRegisterItems, ...whiteHouseItems]) {
    if (!dedupedByUrl.has(item.url)) {
      dedupedByUrl.set(item.url, item);
    }
  }

  const items = Array.from(dedupedByUrl.values()).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  console.log(`[ExecOrders] Found ${items.length} recent executive-order items`);
  return items;
}
