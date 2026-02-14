# Is This Normal?

A Next.js application and pipeline for surfacing high-interest political claims, gathering evidence, and publishing structured fact-check pages.

## Run the web app

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Run the claim pipeline

```bash
npm run pipeline
```

This pipeline:

1. Aggregates claims and events from multiple sources (news, RSS, Congress, court opinions, executive actions, trends, Reddit).
2. Pulls recent claim-review data from the Google Fact Check Tools API (when configured).
3. Uses AI to extract specific, checkable, high-relevance claims.
4. De-duplicates against existing claim files.
5. Generates new drafts for review/publishing.

## Environment variables

Create `.env` in the repo root.

Required:

- `ANTHROPIC_API_KEY`

Optional but recommended:

- `NEWS_API_KEY`
- `CONGRESS_API_KEY`
- `COURTLISTENER_API_TOKEN`
- `BRAVE_SEARCH_API_KEY`
- `GOOGLE_FACT_CHECK_API_KEY`
- `GOOGLE_FACT_CHECK_LANGUAGE` (default: `en-US`)
- `GOOGLE_FACT_CHECK_PAGE_SIZE` (default: `20`)
- `MAX_CLAIMS_PER_RUN` (default: `5`)
- `MIN_RELEVANCE_SCORE` (default: `0.6`)
- `AUTO_PUBLISH` (`true`/`false`)

## Quality focus

To improve thoroughness and accuracy:

- Prefer claims with multiple independent source types.
- Use fact-check databases to find unresolved or newly-evolving angles.
- Revisit previously checked claims when new official records or rulings appear.
