import Link from "next/link";
import { Claim, TOPICS } from "@/lib/types";
import StatusBadge from "./StatusBadge";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <article className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={claim.status} />
      </div>

      <Link href={`/claims/${claim.slug}`} className="block">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-800">
          &ldquo;{claim.title}&rdquo;
        </h3>
      </Link>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
        {claim.summary}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {TOPICS[claim.topic] || claim.topic}
        </span>
        <div className="text-right text-xs text-gray-500">
          <p>{claim.sources.length} sources</p>
          <p>Updated {formatDate(claim.updated)}</p>
        </div>
      </div>
    </article>
  );
}
