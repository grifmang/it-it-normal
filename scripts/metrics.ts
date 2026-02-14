import fs from "fs";
import path from "path";

export interface PipelineMetrics {
  timestamp: string;
  sourcesCount: number;
  claimsExtracted: number;
  claimsGenerated: number;
  claimsSkipped: number;
  errors: number;
  durationMs: number;
}

const LOG_PATH = path.join(__dirname, "..", "content", "pipeline-log.json");
const MAX_ENTRIES = 100;

export function recordMetrics(metrics: PipelineMetrics): void {
  let entries: PipelineMetrics[] = [];

  if (fs.existsSync(LOG_PATH)) {
    try {
      const raw = fs.readFileSync(LOG_PATH, "utf8");
      entries = JSON.parse(raw);
    } catch {
      entries = [];
    }
  }

  entries.push(metrics);

  // Keep only the last MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(entries.length - MAX_ENTRIES);
  }

  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2), "utf8");
}

export function getRecentMetrics(count: number): PipelineMetrics[] {
  if (!fs.existsSync(LOG_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(LOG_PATH, "utf8");
    const entries: PipelineMetrics[] = JSON.parse(raw);
    return entries.slice(-count);
  } catch {
    return [];
  }
}
