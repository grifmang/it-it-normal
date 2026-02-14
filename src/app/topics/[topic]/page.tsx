import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClaimsByTopic, getTopicsWithCounts } from "@/lib/claims";
import { TOPICS } from "@/lib/types";
import ClaimCard from "@/components/ClaimCard";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Link from "next/link";

export async function generateStaticParams() {
  const topics = await getTopicsWithCounts();
  return topics.map(({ topic }) => ({ topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const topicName = TOPICS[topic] || topic;
  return {
    title: `${topicName} Claims`,
    description: `Evidence-based analysis of political claims related to ${topicName.toLowerCase()}.`,
    alternates: {
      canonical: `/topics/${topic}`,
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const claims = await getClaimsByTopic(topic);
  const topicName = TOPICS[topic] || topic;

  if (claims.length === 0) {
    notFound();
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Topics", href: "/topics" },
          { name: topicName, href: `/topics/${topic}` },
        ]}
      />
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/topics" className="hover:text-gray-700">
          Topics
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{topicName}</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">{topicName}</h1>
      <p className="mb-8 text-sm text-gray-600">
        {claims.length} {claims.length === 1 ? "claim" : "claims"} reviewed in
        this topic.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {claims.map((claim) => (
          <ClaimCard key={claim.slug} claim={claim} />
        ))}
      </div>
    </div>
    </>
  );
}
