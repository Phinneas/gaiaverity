# GSC 404 Redirect Fixes — Design

**Date:** 2026-11-02
**Source data:** `https___www.gaiaverity.com_-Coverage-Drilldown-2026-11-02/Table.csv` (Google Search Console "Not found (404)" drilldown, 30 URLs)

## Problem

The site migrated from Ghost to Astro. Ghost served posts at root-level slugs (`/clay-garden-soil/`) plus system pages (`/en/`, `/author/chester/`, `/blog/kitchensink/`). Astro serves all posts under `/blog/<slug>/`. Google Search Console reports 30 URLs returning 404.

## Verification already done

- All 25 root-level blog slugs in the report exist as current posts in `src/content/blog/`.
- The existing two rules in `public/_redirects` return correct 301s in production (verified via `node scripts/check-redirects.mjs`), confirming `_redirects` is honored by the Cloudflare Workers deployment.
- `/contact` and `/blog/white-mushrooms-in-lawn` (no trailing slash) already return 307 → canonical URL via Astro `trailingSlash: 'always'`. No action needed for these; the user should use "Validate Fix" in GSC after deploy.

## Approach

Add 301 rules to `public/_redirects` (edge-served, proven mechanism). Rejected alternatives: Astro middleware redirects (runs in Worker per-request, more code, duplicates `_redirects`), hybrid pattern-matching (unjustified for 30 known URLs).

## Changes

### 1. `public/_redirects`

Keep the 2 existing rules. Add 28 new 301 rules:

| Source | Destination |
|---|---|
| `/sustainable-small-backyard-vegetable-garden/` | `/blog/sustainable-small-backyard-vegetable-garden/` |
| `/mushrooms-growing-in-lawn-identification/` | `/blog/mushrooms-growing-in-lawn-identification/` |
| `/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/` | `/blog/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/` |
| `/best-fire-resistant-plants/` | `/blog/best-fire-resistant-plants/` |
| `/white-mushrooms-in-lawn/` | `/blog/white-mushrooms-in-lawn/` |
| `/climate-resilient-backyard-garden/` | `/blog/climate-resilient-backyard-garden/` |
| `/sustainable-gardening-techniques/` | `/blog/sustainable-gardening-techniques/` |
| `/replace-your-lawn-with-wildflowers/` | `/blog/replace-your-lawn-with-wildflowers/` |
| `/best-drought-tolerant-plants/` | `/blog/best-drought-tolerant-ground-cover-plants/` (direct — avoids chain through existing rule) |
| `/how-to-start-a-backyard-garden/` | `/blog/how-to-start-a-backyard-garden/` |
| `/best-diy-fruit-fly-trap-methods/` | `/blog/best-diy-fruit-fly-trap-methods/` |
| `/climate-resilient-garden/` | `/blog/climate-resilient-garden/` |
| `/are-lawn-mushrooms-poisonous/` | `/blog/are-lawn-mushrooms-poisonous/` |
| `/common-lawn-mushroom-types/` | `/blog/common-lawn-mushroom-types/` |
| `/fall-mushroom-management/` | `/blog/fall-mushroom-management/` |
| `/lawn-mushrooms-and-dogs/` | `/blog/lawn-mushrooms-and-dogs/` |
| `/terrarium-setup-guide/` | `/blog/terrarium-setup-guide/` |
| `/garden-gnomes-cultural-history/` | `/blog/garden-gnomes-cultural-history/` |
| `/japanese-garden-ideas/` | `/blog/japanese-garden-ideas/` |
| `/lawn-alternatives/` | `/blog/lawn-alternatives/` |
| `/fairy-ring-mushrooms/` | `/blog/fairy-ring-mushrooms/` |
| `/diy-fruit-fly-traps/` | `/blog/diy-fruit-fly-traps/` |
| `/fire-resistant-plants/` | `/blog/fire-resistant-plants/` |
| `/rain-garden-design-2/` | `/blog/rain-garden-design/` (direct — avoids chain through existing rule) |
| `/clay-garden-soil/` | `/blog/clay-garden-soil/` |
| `/en/` | `/` |
| `/blog/kitchensink/` | `/blog/` |
| `/author/chester/` | `/about/` |

Each source rule is written twice — with and without trailing slash (e.g. `/clay-garden-soil` and `/clay-garden-soil/`) — because `_redirects` matches exact paths only. This prevents a 307 (trailing-slash) → 301 (redirect) chain for slash-less requests.

### 2. `scripts/check-redirects.mjs`

Extend the `redirects` map to cover every rule above (trailing-slash variants only — the canonical form). The script already fetches each source with `redirect: "manual"` and asserts `301` + exact `Location`.

## Out of scope

- `/contact` and `/blog/white-mushrooms-in-lawn` — already 307 correctly.
- Changing `trailingSlash` behavior globally.
- After deploy, user clicks "Validate Fix" in Search Console (manual GSC action, not code).

## Verification

1. `pnpm build` succeeds.
2. Confirm the built `dist/client/_redirects` contains all rules.
3. Deploy, then `node scripts/check-redirects.mjs` — every rule must print PASS.
4. Spot-check one no-trailing-slash source (e.g. `curl -I https://www.gaiaverity.com/clay-garden-soil`) returns a single 301 directly to the `/blog/` destination.
