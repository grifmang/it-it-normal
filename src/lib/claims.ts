import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { Claim, ClaimFrontmatter } from "./types";

const claimsDirectory = path.join(process.cwd(), "content", "claims");

export function getClaimSlugs(): string[] {
  if (!fs.existsSync(claimsDirectory)) return [];
  return fs
    .readdirSync(claimsDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export async function getClaimBySlug(slug: string): Promise<Claim> {
  const fullPath = path.join(claimsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const frontmatter = data as ClaimFrontmatter;

  return {
    ...frontmatter,
    slug,
    content: contentHtml,
  };
}

export async function getAllClaims(): Promise<Claim[]> {
  const slugs = getClaimSlugs();
  const claims = await Promise.all(slugs.map((slug) => getClaimBySlug(slug)));

  return claims.sort(
    (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
  );
}

export async function getClaimsByTopic(topic: string): Promise<Claim[]> {
  const allClaims = await getAllClaims();
  return allClaims.filter((claim) => claim.topic === topic);
}

export async function getTopicsWithCounts(): Promise<
  { topic: string; count: number }[]
> {
  const allClaims = await getAllClaims();
  const topicMap = new Map<string, number>();

  for (const claim of allClaims) {
    topicMap.set(claim.topic, (topicMap.get(claim.topic) || 0) + 1);
  }

  return Array.from(topicMap.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getClaimsIndex(): Promise<
  Pick<Claim, "title" | "slug" | "topic" | "status" | "summary" | "updated">[]
> {
  const claims = await getAllClaims();
  return claims.map(({ title, slug, topic, status, summary, updated }) => ({
    title,
    slug,
    topic,
    status,
    summary,
    updated,
  }));
}
