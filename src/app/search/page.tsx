import { Metadata } from "next";
import { Suspense } from "react";
import { getAllClaims } from "@/lib/claims";
import SearchPageClient from "./SearchPageClient";

export const metadata: Metadata = {
  title: "Search Claims",
  description: "Search our database of political claims and evidence.",
};

export default async function SearchPage() {
  const claims = await getAllClaims();
  const claimsData = claims.map(
    ({ title, slug, topic, status, summary, updated }) => ({
      title,
      slug,
      topic,
      status,
      summary,
      updated,
    })
  );

  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">Loading...</div>}>
      <SearchPageClient claims={claimsData} />
    </Suspense>
  );
}
