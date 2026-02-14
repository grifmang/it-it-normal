import { getAllClaims, getTopicsWithCounts } from "@/lib/claims";
import { TOPICS } from "@/lib/types";
import ClaimCard from "@/components/ClaimCard";
import SearchBar from "@/components/SearchBar";
import AdUnit from "@/components/AdUnit";
import Link from "next/link";

export default async function HomePage() {
  const claims = await getAllClaims();
  const topics = await getTopicsWithCounts();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Is This Normal?",
    url: "https://isthisnormal.com",
    logo: "https://isthisnormal.com/og-default.svg",
    description:
      "Evidence-based political claim analysis. Primary sources. Structured evidence. No opinion.",
    sameAs: [],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      {/* Hero */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What&apos;s the evidence for that claim?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-gray-600">
            Structured evidence for political claims. Primary sources.
            Timelines. No opinion. No editorial tone.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar large />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Topics */}
        {topics.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Browse by Topic
            </h2>
            <div className="flex flex-wrap gap-2">
              {topics.map(({ topic, count }) => (
                <Link
                  key={topic}
                  href={`/topics/${topic}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300"
                >
                  {TOPICS[topic] || topic}{" "}
                  <span className="text-gray-400">({count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <AdUnit slot="home-mid" format="horizontal" />

        {/* Recent Claims */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Claims
          </h2>
          {claims.length === 0 ? (
            <p className="text-sm text-gray-500">
              No claims have been published yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {claims.map((claim) => (
                <ClaimCard key={claim.slug} claim={claim} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
