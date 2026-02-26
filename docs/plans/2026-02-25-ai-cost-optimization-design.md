# AI Pipeline Cost Optimization Design

**Date:** 2026-02-25
**Status:** Approved

## Problem

The pipeline currently uses `claude-sonnet-4-5-20250929` for all AI tasks, including several that don't require Sonnet-level reasoning. As the claims library grows, `update-claims.ts` runs against every claim older than 3 days with no cap, causing unbounded cost growth.

## Changes

### 1. Switch `verify-claim.ts` to Haiku 4.5

`verify-claim.ts` checks whether source URLs look plausible and flags fabricated-looking entries. This is pattern-matching and structural judgment — Haiku handles it well.

- Model: `claude-sonnet-4-5-20250929` → `claude-haiku-4-5-20251001`
- Also reduce `max_tokens` from `4096` → `512` (output is a small JSON object)

### 2. Switch `update-claims.ts` to Haiku 4.5

`update-claims.ts` asks "are there new developments since date X?" for each claim. The task is recall + JSON output — does not require deep reasoning.

- Model: `claude-sonnet-4-5-20250929` → `claude-haiku-4-5-20251001`

### 3. Add `MAX_UPDATES_PER_RUN` cap

`update-claims.ts` processes every claim file older than 3 days with no limit. As the library scales, this becomes the dominant cost driver.

- New env var: `MAX_UPDATES_PER_RUN` (default: `20`)
- Added to `config.ts`
- `updateAllClaims()` stops after checking this many claims

### 4. Prompt caching in `update-claims.ts`

The system prompt in `update-claims.ts` is identical across every claim file processed in a single run. Anthropic's prompt caching (`cache_control: { type: "ephemeral" }`) caches this prefix and reduces input token costs by ~90% on all calls after the first.

- Add `cache_control` to the static instruction block in the `messages` array

## Models Left Unchanged

| Script | Model | Reason |
|--------|-------|--------|
| `extract-claims.ts` | Sonnet 4.5 | Feeds all downstream claims; quality matters |
| `draft-claim.ts` | Sonnet 4.5 | Publishes directly to site with no human review |
| `resolve-sources.ts` | Haiku 4.5 | Already using Haiku |

## Expected Impact

- `verify-claim.ts`: ~3-4x cheaper per call + smaller output window
- `update-claims.ts`: ~3-4x cheaper per call + caching reduces input tokens ~90% after first call per run + hard cap prevents unbounded growth
