import { Claim, STATUS_LABELS } from "@/lib/types";

function statusToRating(status: string): string {
  switch (status) {
    case "verified":
      return "True";
    case "mixed":
      return "Mixture";
    case "unsupported":
      return "False";
    case "unresolved":
      return "Unverified";
    default:
      return "Unverified";
  }
}

export default function ClaimReviewSchema({ claim }: { claim: Claim }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    datePublished: claim.created,
    dateModified: claim.updated,
    url: `https://isthisnormal.com/claims/${claim.slug}`,
    claimReviewed: claim.title,
    reviewBody: claim.summary,
    author: {
      "@type": "Organization",
      name: "Is This Normal?",
      url: "https://isthisnormal.com",
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: statusToRating(claim.status),
      bestRating: "True",
      worstRating: "False",
      alternateName: STATUS_LABELS[claim.status],
    },
    itemReviewed: {
      "@type": "Claim",
      name: claim.title,
      datePublished: claim.created,
      ...(claim.sources.length > 0 && {
        appearance: claim.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.title,
          url: source.url,
        })),
      }),
    },
    ...(claim.sources.length > 0 && {
      isBasedOn: claim.sources.map((source) => ({
        "@type": "CreativeWork",
        name: source.title,
        url: source.url,
      })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
