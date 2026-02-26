# AI Cost Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce Anthropic API costs by switching cheaper tasks to Haiku 4.5, trimming over-provisioned token limits, capping the update loop, and adding prompt caching.

**Architecture:** Four targeted edits across three files — `config.ts`, `verify-claim.ts`, and `update-claims.ts`. No logic changes; only model strings, token limits, a new config value, and cache_control headers.

**Tech Stack:** TypeScript, `tsx`, Anthropic SDK (`@anthropic-ai/sdk`), `dotenv`

---

### Task 1: Add MAX_UPDATES_PER_RUN to config

**Files:**
- Modify: `scripts/config.ts`

**Context:**
`config.ts` reads all env vars via `dotenv` and exports a typed `config` object. `update-claims.ts` imports `config` and should read this new value.

**Step 1: Add the config field**

Open `scripts/config.ts`. In the exported `config` object, add after the `maxClaimsPerRun` line (line 60):

```ts
  maxClaimsPerRun: parseInt(process.env.MAX_CLAIMS_PER_RUN || "6"),
  maxUpdatesPerRun: parseInt(process.env.MAX_UPDATES_PER_RUN || "20"),
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add scripts/config.ts
git commit -m "feat: add MAX_UPDATES_PER_RUN config cap"
```

---

### Task 2: Switch verify-claim.ts to Haiku + reduce max_tokens

**Files:**
- Modify: `scripts/ai/verify-claim.ts`

**Context:**
`verify-claim.ts` checks source URLs for plausibility and outputs a small JSON object (issue list + suggested fixes). The output is typically under 200 tokens; 4096 is massively over-provisioned.

**Step 1: Change the model string**

In `scripts/ai/verify-claim.ts` at line 37, change:

```ts
    model: "claude-sonnet-4-5-20250929",
```
to:
```ts
    model: "claude-haiku-4-5-20251001",
```

**Step 2: Reduce max_tokens**

On line 38, change:

```ts
    max_tokens: 4096,
```
to:
```ts
    max_tokens: 512,
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add scripts/ai/verify-claim.ts
git commit -m "perf: switch verify-claim to Haiku 4.5, reduce max_tokens to 512"
```

---

### Task 3: Switch update-claims.ts to Haiku + prompt caching + apply run cap

**Files:**
- Modify: `scripts/ai/update-claims.ts`

**Context:**
`update-claims.ts` makes one API call per claim file. The system prompt is a large static block that is identical on every call within a run. Anthropic's prompt caching marks this block with `cache_control: { type: "ephemeral" }` — the SDK sends it as a `text` content block inside the `user` message. After the first call warms the cache, subsequent calls in the same run pay ~10% of normal input token cost for that block.

The Anthropic SDK's `MessageParam` type accepts content as either a string or an array of content blocks. To use caching, split the message into two content blocks: a cacheable static instruction block, and a dynamic per-claim data block.

**Step 1: Change the model string**

In `scripts/ai/update-claims.ts` at line 58, change:

```ts
    model: "claude-sonnet-4-5-20250929",
```
to:
```ts
    model: "claude-haiku-4-5-20251001",
```

**Step 2: Add prompt caching to the API call**

The current call (lines 57–99) sends a single large string as `content`. Replace it with two content blocks — the static instructions (cacheable) and the dynamic claim data:

```ts
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a research assistant for "Is This Normal?", a neutral, evidence-based political claim analysis site.

Review this existing claim and determine if there are significant new developments since the last update.

Are there any significant new developments related to this claim? Consider recent news, court decisions, policy changes, or new data.

Respond with ONLY valid JSON in this exact format:
{
  "hasUpdates": true/false,
  "newEvidenceFor": ["New supporting evidence point 1", ...],
  "newEvidenceAgainst": ["New contrary evidence point 1", ...],
  "newTimelineEvents": [{"date": "YYYY-MM-DD", "description": "What happened"}, ...],
  "suggestedStatus": "verified|mixed|unsupported|unresolved" (only if status should change),
  "updateSummary": "Brief description of what changed"
}

If there are no significant updates, respond with:
{
  "hasUpdates": false,
  "updateSummary": "No significant new developments found."
}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `CLAIM: "${title}"
SUMMARY: ${summary}
CURRENT STATUS: ${status}
LAST UPDATED: ${data.updated}

CURRENT EVIDENCE FOR:
- ${evidenceFor || "None"}

CURRENT EVIDENCE AGAINST:
- ${evidenceAgainst || "None"}

CURRENT TIMELINE:
- ${timeline || "None"}

Are there any significant new developments related to this claim since ${data.updated}?`,
          },
        ],
      },
    ],
  });
```

**Step 3: Apply the run cap in updateAllClaims()**

In the `updateAllClaims()` function, find the `for` loop over `sorted` (around line 173). Add a `checked` increment guard at the top of the loop body that breaks when the cap is reached. Replace the existing loop opening with:

```ts
  for (const { file, filepath } of sorted) {
    if (checked >= config.maxUpdatesPerRun) {
      console.log(`\n[Update] Reached MAX_UPDATES_PER_RUN limit (${config.maxUpdatesPerRun}). Stopping.`);
      break;
    }
    // ... rest of loop unchanged
```

Note: `checked` is incremented later in the loop (after the "too recent" skip check), so the cap counts only claims actually checked, not skipped ones. Move the `checked++` to just before the API call to ensure accuracy.

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 5: Commit**

```bash
git add scripts/ai/update-claims.ts
git commit -m "perf: switch update-claims to Haiku 4.5, add prompt caching, cap per run"
```

---

## Verification

After all tasks are complete, do a final sanity check:

```bash
grep -n "model:" scripts/ai/verify-claim.ts scripts/ai/update-claims.ts scripts/ai/extract-claims.ts scripts/ai/draft-claim.ts
```

Expected output:
```
verify-claim.ts:    model: "claude-haiku-4-5-20251001",
update-claims.ts:    model: "claude-haiku-4-5-20251001",
extract-claims.ts:    model: "claude-sonnet-4-5-20250929",
draft-claim.ts:    model: "claude-sonnet-4-5-20250929",
```

Also confirm the cap is wired up:
```bash
grep -n "maxUpdatesPerRun" scripts/config.ts scripts/ai/update-claims.ts
```

Expected: appears in both files.
