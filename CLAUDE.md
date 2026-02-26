# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # Local dev server
npm run build             # Build static site (+ postbuild: sitemap + RSS)
npm run lint              # ESLint
npm run pipeline          # Run claim extraction/publishing pipeline
npm run review            # Manual review interface
npm run review:auto       # Auto-publish wrapper
npm run update-claims     # Refresh existing claims with new evidence
npm run resolve-sources   # Backfill empty sources on existing claims
npm run verify            # Verify a single claim
```

Run the pipeline with `AUTO_PUBLISH=false` (default) to stage drafts to `content/drafts/` for inspection before committing.

## Architecture

**Data flow (pipeline):**
1. `scripts/sources/index.ts` aggregates all sources in parallel — NewsAPI, Google Trends, RSS feeds, Congress.gov, CourtListener, executive orders, Google Fact Check API, DuckDuckGo, and Google Custom Search
2. `scripts/ai/extract-claims.ts` sends aggregated content to Claude 3.5 Sonnet to extract specific, checkable political claims with relevance scores
3. `scripts/ai/dedup.ts` fuzzy-matches against existing claims (fuse.js) to skip duplicates
4. `scripts/ai/draft-claim.ts` generates markdown files with structured evidence (evidenceFor, evidenceAgainst, timeline, sources, verdict)
5. With `AUTO_PUBLISH=true`, files go directly to `content/claims/`; otherwise to `content/drafts/`

**Content storage:** All claims are `.md` files with YAML frontmatter (parsed by gray-matter). The `src/lib/claims.ts` loader reads from `content/claims/` at build time. No database.

**Frontend:** Next.js 16 App Router with `output: "export"` (static HTML to `out/`). Deployed to Netlify. Pages are fully static and built from the markdown files at build time.

**Schema conventions (`src/lib/types.ts`):**
- `ClaimStatus`: `"verified" | "mixed" | "unsupported" | "unresolved"` — no pending states; every published claim must have a verdict
- `TOPICS`: 8 fixed political topics used for browsing/filtering
- Claims include `evidenceFor[]`, `evidenceAgainst[]`, `timeline[]`, `sources[]`, `summary`, `claimText`, `verdict`

**CI/CD:**
- `pipeline.yml` — runs every 8h, auto-publishes directly to `main`, triggers Netlify deploy via build hook
- `pipeline-pr.yml` — runs every 4h, creates a PR instead for human review
- `build.yml` — lint + build on every push/PR

**Config:** `scripts/config.ts` is the single config source — reads `.env` via dotenv. Key env vars: `ANTHROPIC_API_KEY` (required), `AUTO_PUBLISH`, `MAX_CLAIMS_PER_RUN`, `MIN_RELEVANCE_SCORE`.

## Key patterns

- All script files use `tsx` (not compiled); run directly with `tsx scripts/...`
- Source adapters in `scripts/sources/` each return a normalized type from `search-types.ts`
- New claim markdown files are slugified from the claim text (`slugify`)
- Markdown body is converted to HTML via remark → rehype pipeline with sanitization (`rehype-sanitize`)
- Schema.org `ClaimReview` structured data is injected per claim page for SEO (`src/components/ClaimReviewSchema.tsx`)
