import { Metadata } from "next";
import Link from "next/link";
import { getTopicsWithCounts } from "@/lib/claims";
import { TOPICS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse political claims by topic area.",
  alternates: {
    canonical: "/topics",
  },
};

export default async function TopicsPage() {
  const topics = await getTopicsWithCounts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Topics</h1>
      <p className="mb-8 text-sm text-gray-600">
        Browse claims organized by subject area.
      </p>

      {topics.length === 0 ? (
        <p className="text-sm text-gray-500">No topics available yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map(({ topic, count }) => (
            <Link
              key={topic}
              href={`/topics/${topic}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-gray-900">
                {TOPICS[topic] || topic}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {count} {count === 1 ? "claim" : "claims"} reviewed
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
