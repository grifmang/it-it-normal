import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SITE_URL = "https://isthisnormal.com";
const SITE_TITLE = "Is This Normal?";
const SITE_DESCRIPTION =
  "Evidence-based political claim analysis. Primary sources. Structured evidence. No opinion.";

const claimsDir = path.join(process.cwd(), "content", "claims");
const outDir = path.join(process.cwd(), "out");

interface ClaimData {
  title: string;
  slug: string;
  topic: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
}

function getClaims(): ClaimData[] {
  if (!fs.existsSync(claimsDir)) return [];
  return fs
    .readdirSync(claimsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(claimsDir, f), "utf8");
      const { data } = matter(raw);
      return {
        title: data.title as string,
        slug: f.replace(/\.md$/, ""),
        topic: data.topic as string,
        status: data.status as string,
        summary: data.summary as string,
        created: data.created as string,
        updated: data.updated as string,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(): string {
  const claims = getClaims();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>${escapeXml(SITE_TITLE)}</title>\n`;
  xml += `    <link>${SITE_URL}</link>\n`;
  xml += `    <description>${escapeXml(SITE_DESCRIPTION)}</description>\n`;
  xml += `    <language>en-us</language>\n`;
  xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
  xml += `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>\n`;

  for (const claim of claims) {
    const pubDate = new Date(claim.created).toUTCString();
    xml += `    <item>\n`;
    xml += `      <title>${escapeXml(claim.title)}</title>\n`;
    xml += `      <link>${SITE_URL}/claims/${claim.slug}</link>\n`;
    xml += `      <guid isPermaLink="true">${SITE_URL}/claims/${claim.slug}</guid>\n`;
    xml += `      <description>${escapeXml(claim.summary)}</description>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <category>${escapeXml(claim.topic)}</category>\n`;
    xml += `    </item>\n`;
  }

  xml += `  </channel>\n`;
  xml += `</rss>\n`;
  return xml;
}

function main() {
  if (!fs.existsSync(outDir)) {
    console.error("Error: out/ directory not found. Run `next build` first.");
    process.exit(1);
  }

  const rss = buildRss();
  fs.writeFileSync(path.join(outDir, "feed.xml"), rss, "utf8");
  console.log(`RSS feed written to out/feed.xml`);
}

main();
