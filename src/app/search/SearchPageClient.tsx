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

type SortMode = "relevance" | "updated_desc" | "updated_asc";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date pending";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const [sortMode, setSortMode] = useState<SortMode>("relevance");

  const fuse = useMemo(
    () =>
      new Fuse(claims, {
        keys: ["title", "summary", "topic"],
        threshold: 0.35,
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

    if (sortMode === "updated_desc") {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    }

    if (sortMode === "updated_asc") {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.updated).getTime() - new Date(b.updated).getTime()
      );
    }

    return filtered;
  }, [query, topicFilter, statusFilter, sortMode, claims, fuse]);

  const topics = useMemo(() => {
    const set = new Set(claims.map((c) => c.topic));
    return Array.from(set).sort();
  }, [claims]);

  const hasActiveFilters = Boolean(query.trim() || topicFilter || statusFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Browse Claims</h1>
      <p className="mb-6 text-sm text-gray-600">
        Quickly scan records by status, topic, and recency.
      </p>

      <div className="mb-6">
        <SearchBar defaultValue={query} large />
      </div>

      <section className="sticky top-16 z-20 mb-6 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 grid gap-3 md:grid-cols-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter current results..."
            className="md:col-span-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
          />
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
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
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Sort
            </label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="relevance">Best Match</option>
              <option value="updated_desc">Recently Updated</option>
              <option value="updated_asc">Oldest Updated</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuery("");
                  setTopicFilter("");
                  setStatusFilter("");
                  setSortMode("relevance");
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {results.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-500">
          No claims match your current filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((claim) => (
            <Link
              key={claim.slug}
              href={`/claims/${claim.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={claim.status} />
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {TOPICS[claim.topic] || claim.topic}
                </span>
              </div>
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-800">
                &ldquo;{claim.title}&rdquo;
              </h3>
              <p className="mt-1.5 line-clamp-3 text-sm text-gray-600">
                {claim.summary}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Updated {formatDate(claim.updated)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
