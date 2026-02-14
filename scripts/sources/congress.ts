import { config } from "../config";

export interface CongressItem {
  title: string;
  billNumber: string;
  congress: number;
  url: string;
  latestAction: string;
  source: "congress";
  timestamp: string;
}

export async function fetchCongressActivity(): Promise<CongressItem[]> {
  if (!config.congressApiKey) {
    console.log("[Congress] Skipped — no API key configured");
    return [];
  }

  const items: CongressItem[] = [];

  try {
    const url = `https://api.congress.gov/v3/bill?format=json&sort=updateDate+desc&limit=25&api_key=${config.congressApiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[Congress] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    for (const bill of data.bills || []) {
      items.push({
        title: bill.title || "",
        billNumber: bill.number || "",
        congress: bill.congress || 0,
        url: bill.url || "",
        latestAction: bill.latestAction?.text || "",
        source: "congress",
        timestamp: bill.updateDate || new Date().toISOString(),
      });
    }

    console.log(`[Congress] Found ${items.length} bills`);
  } catch (error) {
    console.error("[Congress] Error:", error);
  }

  return items;
}
