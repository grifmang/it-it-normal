import Link from "next/link";
import { Claim, TOPICS } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={claim.status} />
            {claim.sourcesVerified === false && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Unverified Sources
              </span>
            )}
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {TOPICS[claim.topic] || claim.topic}
            </span>
          </div>
          <Link href={`/claims/${claim.slug}`} className="group">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-800">
              &ldquo;{claim.title}&rdquo;
            </h3>
          </Link>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {claim.summary}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <span>{claim.sources.length} sources</span>
        <span>Updated {new Date(claim.updated).toLocaleDateString()}</span>
      </div>
    </article>
  );
}
