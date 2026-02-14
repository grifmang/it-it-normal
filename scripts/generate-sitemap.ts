import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SITE_URL = "https://isthisnormal.com";
const claimsDir = path.join(process.cwd(), "content", "claims");
const outDir = path.join(process.cwd(), "out");

interface ClaimMeta {
  slug: string;
  topic: string;
  updated: string;
}

function getClaims(): ClaimMeta[] {
  if (!fs.existsSync(claimsDir)) return [];
  return fs
    .readdirSync(claimsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(claimsDir, f), "utf8");
      const { data } = matter(raw);
      return {
        slug: f.replace(/\.md$/, ""),
        topic: data.topic as string,
        updated: data.updated as string,
      };
    });
}

function toW3CDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function buildSitemap(): string {
  const claims = getClaims();
  const topics = [...new Set(claims.map((c) => c.topic))];

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/topics", priority: "0.8", changefreq: "weekly" },
    { loc: "/search", priority: "0.6", changefreq: "weekly" },
    { loc: "/methodology", priority: "0.5", changefreq: "monthly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const topic of topics) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/topics/${topic}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const claim of claims) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/claims/${claim.slug}</loc>\n`;
    xml += `    <lastmod>${toW3CDate(claim.updated)}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

function main() {
  if (!fs.existsSync(outDir)) {
    console.error("Error: out/ directory not found. Run `next build` first.");
    process.exit(1);
  }

  const sitemap = buildSitemap();
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap, "utf8");
  console.log(`Sitemap written to out/sitemap.xml`);
}

main();
