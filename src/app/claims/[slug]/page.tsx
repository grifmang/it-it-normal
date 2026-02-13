import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClaimBySlug, getClaimSlugs } from "@/lib/claims";
import { TOPICS, STATUS_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import SourceList from "@/components/SourceList";
import EvidenceSection from "@/components/EvidenceSection";
import Timeline from "@/components/Timeline";
import ClaimReviewSchema from "@/components/ClaimReviewSchema";

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
      openGraph: {
        title: `"${claim.title}"`,
        description: claim.summary,
        type: "article",
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

  return (
    <>
      <ClaimReviewSchema claim={claim} />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={claim.status} />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {TOPICS[claim.topic] || claim.topic}
            </span>
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
      </article>
    </>
  );
}
