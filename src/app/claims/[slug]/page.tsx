import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getClaimBySlug, getClaimSlugs, getClaimsByTopic } from "@/lib/claims";
import { TOPICS, STATUS_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import SourceList from "@/components/SourceList";
import EvidenceSection from "@/components/EvidenceSection";
import Timeline from "@/components/Timeline";
import ClaimReviewSchema from "@/components/ClaimReviewSchema";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import AdUnit from "@/components/AdUnit";

const STALE_CLAIM_DAYS = 7;

function getClaimAgeDays(updatedAt: string): number {
  const updatedTime = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedTime)) return 0;

  const now = Date.now();
  const diff = now - updatedTime;
  if (diff <= 0) return 0;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function generateStaticParams() {
  const slugs = getClaimSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const claim = await getClaimBySlug(slug);
    return {
      title: `"${claim.title}" — ${STATUS_LABELS[claim.status]}`,
      description: claim.summary,
      alternates: {
        canonical: `/claims/${claim.slug}`,
      },
      openGraph: {
        title: `"${claim.title}"`,
        description: claim.summary,
        type: "article",
        publishedTime: claim.created,
        modifiedTime: claim.updated,
        section: TOPICS[claim.topic] || claim.topic,
      },
    };
  } catch {
    return { title: "Claim Not Found" };
  }
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let claim;
  try {
    claim = await getClaimBySlug(slug);
  } catch {
    notFound();
  }

  const claimAgeDays = getClaimAgeDays(claim.updated);
  const isStaleClaim = claimAgeDays >= STALE_CLAIM_DAYS;
  const topicName = TOPICS[claim.topic] || claim.topic;

  // Get related claims from same topic (excluding current)
  const topicClaims = await getClaimsByTopic(claim.topic);
  const relatedClaims = topicClaims
    .filter((c) => c.slug !== claim.slug)
    .slice(0, 3);

  return (
    <>
      <ClaimReviewSchema claim={claim} />
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: topicName, href: `/topics/${claim.topic}` },
          { name: claim.title, href: `/claims/${claim.slug}` },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Unverified banner */}
        {claim.sourcesVerified === false && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Note:</span> Some sources in this
              analysis have not been manually verified. Dates or URLs may be
              approximate.
            </p>
          </div>
        )}

        {isStaleClaim && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Freshness note:</span> This
              analysis was last updated {claimAgeDays} days ago. Fast-moving
              policy claims can change quickly, so check for newer official
              updates before relying on this verdict.
            </p>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={claim.status} />
            <Link
              href={`/topics/${claim.topic}`}
              className="text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
            >
              {topicName}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            &ldquo;{claim.title}&rdquo;
          </h1>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
            <span>
              Published{" "}
              {new Date(claim.created).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>
              Updated{" "}
              {new Date(claim.updated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-8">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-900">
            Summary
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">
            {claim.summary}
          </p>
        </section>

        <AdUnit slot="claim-after-summary" format="auto" />

        {/* Primary Sources */}
        {claim.sources.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              Primary Sources
            </h2>
            <SourceList sources={claim.sources} />
          </section>
        )}

        {/* Evidence */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <EvidenceSection
            title="Evidence Supporting the Claim"
            items={claim.evidenceFor}
            variant="for"
          />
          <EvidenceSection
            title="Evidence Against / Context"
            items={claim.evidenceAgainst}
            variant="against"
          />
        </div>

        <AdUnit slot="claim-after-evidence" format="auto" />

        {/* Timeline */}
        {claim.timeline.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              Timeline
            </h2>
            <Timeline events={claim.timeline} />
          </section>
        )}

        {/* What This Means */}
        {claim.whatThisMeans.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              What This Means
            </h2>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="mb-2 text-xs font-medium text-blue-800 uppercase tracking-wide">
                Structured interpretation — not opinion
              </p>
              <ul className="space-y-1.5">
                {claim.whatThisMeans.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-800" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Additional Content */}
        {claim.content && (
          <section className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: claim.content }} />
          </section>
        )}

        {/* Related Claims */}
        {relatedClaims.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Related Claims in {topicName}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedClaims.map((related) => (
                <Link
                  key={related.slug}
                  href={`/claims/${related.slug}`}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-2">
                    <StatusBadge status={related.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    &ldquo;{related.title}&rdquo;
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {related.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
