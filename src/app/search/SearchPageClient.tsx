"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import Link from "next/link";
import { ClaimStatus, TOPICS, STATUS_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import SearchBar from "@/components/SearchBar";

interface ClaimData {
  title: string;
  slug: string;
  topic: string;
  status: ClaimStatus;
  summary: string;
  updated: string;
}

export default function SearchPageClient({
  claims,
}: {
  claims: ClaimData[];
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(claims, {
        keys: ["title", "summary", "topic"],
        threshold: 0.4,
        includeScore: true,
      }),
    [claims]
  );

  const results = useMemo(() => {
    let filtered = claims;

    if (query.trim()) {
      filtered = fuse.search(query).map((r) => r.item);
    }

    if (topicFilter) {
      filtered = filtered.filter((c) => c.topic === topicFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    return filtered;
  }, [query, topicFilter, statusFilter, claims, fuse]);

  const topics = useMemo(() => {
    const set = new Set(claims.map((c) => c.topic));
    return Array.from(set).sort();
  }, [claims]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Search Claims</h1>

      {/* Search */}
      <div className="mb-6">
        <SearchBar defaultValue={query} large />
      </div>

      {/* Inline filter for client-side */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to filter results..."
          className="mb-4 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {TOPICS[t] || t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <p className="mb-4 text-sm text-gray-500">
        {results.length} {results.length === 1 ? "result" : "results"}
      </p>
      <div className="space-y-3">
        {results.map((claim) => (
          <Link
            key={claim.slug}
            href={`/claims/${claim.slug}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={claim.status} />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {TOPICS[claim.topic] || claim.topic}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              &ldquo;{claim.title}&rdquo;
            </h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {claim.summary}
            </p>
          </Link>
        ))}

        {results.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No claims match your search. Try different keywords or clear
            filters.
          </p>
        )}
      </div>
    </div>
  );
}
