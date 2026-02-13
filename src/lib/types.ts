export type ClaimStatus = "verified" | "mixed" | "unsupported" | "unresolved";

export type SourceType =
  | "court"
  | "news"
  | "official"
  | "transcript"
  | "report";

export interface Source {
  title: string;
  url: string;
  type: SourceType;
  summary: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
}

export interface ClaimFrontmatter {
  title: string;
  slug: string;
  topic: string;
  status: ClaimStatus;
  summary: string;
  created: string;
  updated: string;
  sources: Source[];
  evidenceFor: string[];
  evidenceAgainst: string[];
  timeline: TimelineEvent[];
  whatThisMeans: string[];
  sourcesVerified?: boolean;
}

export interface Claim extends ClaimFrontmatter {
  content: string;
}

export const TOPICS: Record<string, string> = {
  doj: "Department of Justice",
  immigration: "Immigration",
  elections: "Elections",
  economy: "Economy",
  healthcare: "Healthcare",
  foreign_policy: "Foreign Policy",
  environment: "Environment",
  civil_rights: "Civil Rights",
};

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  verified: "Supported by Evidence",
  mixed: "Mixed Evidence",
  unsupported: "Not Supported by Evidence",
  unresolved: "Unresolved",
};
