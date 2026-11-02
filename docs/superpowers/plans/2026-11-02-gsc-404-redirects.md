# GSC 404 Redirect Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 30 "Not found (404)" URLs in Google Search Console by adding 301 redirects from old Ghost URLs to their current Astro locations.

**Architecture:** Add static 301 rules to `public/_redirects` (served at the Cloudflare edge, mechanism already proven in production). Extend `scripts/check-redirects.mjs` into a full verification harness covering every rule, used red-green around the deploy: run it against production before the change (new rules FAIL), deploy, run again (all PASS).

**Tech Stack:** Astro 7 + @astrojs/cloudflare, Cloudflare Workers static assets `_redirects`, Node fetch for the check script.

**Spec:** `docs/superpowers/specs/2026-11-02-gsc-404-redirects-design.md`

## Global Constraints

- Every redirect is a `301` (permanent). Never `302`/`307`.
- Each source path is written **twice** in `_redirects`: with and without trailing slash. `_redirects` matches exact paths only.
- Destinations always end in a trailing slash (except `/en/` → `/`), matching Astro `trailingSlash: 'always'`.
- `/best-drought-tolerant-plants/` points **directly** to `/blog/best-drought-tolerant-ground-cover-plants/` and `/rain-garden-design-2/` **directly** to `/blog/rain-garden-design/` — no redirect chains through the existing rules.
- Do not modify or remove the 15 existing lines in `public/_redirects` (including the `/blog/:slug`-style placeholder rules added in commit `fc01eef`). Static rules take precedence over placeholders, so no conflicts.
- Do not touch the working-tree deletions of the old `2026-08-11` drilldown folder or the untracked files (`2026-11-02` drilldown, `root-cellar-refrigerator.mdx`) — they are the user's uncommitted changes.

---

### Task 1: Extend `scripts/check-redirects.mjs` to cover all 30 rules (the failing test)

**Files:**
- Modify: `scripts/check-redirects.mjs` (only the `redirects` object literal, lines 4-7)

**Interfaces:**
- Consumes: nothing (standalone script; `BASE_URL` env var, defaults to `https://www.gaiaverity.com`)
- Produces: exit code 0 when every rule returns the exact 301 expected; prints `PASS`/`FAIL` per rule. Task 3 relies on this.

- [ ] **Step 1: Replace the `redirects` object with the full 30-rule map**

Keep the rest of the script unchanged. New object (existing 2 entries first, then the 28 new ones):

```js
const redirects = {
  "/blog/best-drought-tolerant-plants/": "/blog/best-drought-tolerant-ground-cover-plants/",
  "/blog/rain-garden-design-2/": "/blog/rain-garden-design/",
  "/sustainable-small-backyard-vegetable-garden/": "/blog/sustainable-small-backyard-vegetable-garden/",
  "/mushrooms-growing-in-lawn-identification/": "/blog/mushrooms-growing-in-lawn-identification/",
  "/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/": "/blog/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/",
  "/best-fire-resistant-plants/": "/blog/best-fire-resistant-plants/",
  "/white-mushrooms-in-lawn/": "/blog/white-mushrooms-in-lawn/",
  "/climate-resilient-backyard-garden/": "/blog/climate-resilient-backyard-garden/",
  "/sustainable-gardening-techniques/": "/blog/sustainable-gardening-techniques/",
  "/replace-your-lawn-with-wildflowers/": "/blog/replace-your-lawn-with-wildflowers/",
  "/best-drought-tolerant-plants/": "/blog/best-drought-tolerant-ground-cover-plants/",
  "/how-to-start-a-backyard-garden/": "/blog/how-to-start-a-backyard-garden/",
  "/best-diy-fruit-fly-trap-methods/": "/blog/best-diy-fruit-fly-trap-methods/",
  "/climate-resilient-garden/": "/blog/climate-resilient-garden/",
  "/are-lawn-mushrooms-poisonous/": "/blog/are-lawn-mushrooms-poisonous/",
  "/common-lawn-mushroom-types/": "/blog/common-lawn-mushroom-types/",
  "/fall-mushroom-management/": "/blog/fall-mushroom-management/",
  "/lawn-mushrooms-and-dogs/": "/blog/lawn-mushrooms-and-dogs/",
  "/terrarium-setup-guide/": "/blog/terrarium-setup-guide/",
  "/garden-gnomes-cultural-history/": "/blog/garden-gnomes-cultural-history/",
  "/japanese-garden-ideas/": "/blog/japanese-garden-ideas/",
  "/lawn-alternatives/": "/blog/lawn-alternatives/",
  "/fairy-ring-mushrooms/": "/blog/fairy-ring-mushrooms/",
  "/diy-fruit-fly-traps/": "/blog/diy-fruit-fly-traps/",
  "/fire-resistant-plants/": "/blog/fire-resistant-plants/",
  "/rain-garden-design-2/": "/blog/rain-garden-design/",
  "/clay-garden-soil/": "/blog/clay-garden-soil/",
  "/en/": "/",
  "/blog/kitchensink/": "/blog/",
  "/author/chester/": "/about/",
};
```

- [ ] **Step 2: Run the check against production and verify it fails (red)**

Run: `node scripts/check-redirects.mjs`
Expected: exit code 1. The first 2 rules PASS; the 28 new rules FAIL with `404` (or `301` to a different destination for none of them — any mismatch is a failure to note). This proves the test detects the missing redirects.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-redirects.mjs
git commit -m "test: cover all GSC 404 redirect rules in check-redirects script"
```

---

### Task 2: Add the 27 redirect rules (54 lines) to `public/_redirects`

**Files:**
- Modify: `public/_redirects` (append after the existing 15 lines)

**Interfaces:**
- Consumes: the exact destination mapping defined in Task 1's `redirects` object — the two must agree rule-for-rule.
- Produces: `dist/client/_redirects` containing all rules after build (verified in Step 3).

- [ ] **Step 1: Append the rules**

Append exactly this block to the end of `public/_redirects` (each source appears with and without trailing slash):

```

# Ghost migration: root-level blog slugs -> /blog/<slug>/
/sustainable-small-backyard-vegetable-garden /blog/sustainable-small-backyard-vegetable-garden/ 301
/sustainable-small-backyard-vegetable-garden/ /blog/sustainable-small-backyard-vegetable-garden/ 301
/mushrooms-growing-in-lawn-identification /blog/mushrooms-growing-in-lawn-identification/ 301
/mushrooms-growing-in-lawn-identification/ /blog/mushrooms-growing-in-lawn-identification/ 301
/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery /blog/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/ 301
/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/ /blog/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/ 301
/best-fire-resistant-plants /blog/best-fire-resistant-plants/ 301
/best-fire-resistant-plants/ /blog/best-fire-resistant-plants/ 301
/white-mushrooms-in-lawn /blog/white-mushrooms-in-lawn/ 301
/white-mushrooms-in-lawn/ /blog/white-mushrooms-in-lawn/ 301
/climate-resilient-backyard-garden /blog/climate-resilient-backyard-garden/ 301
/climate-resilient-backyard-garden/ /blog/climate-resilient-backyard-garden/ 301
/sustainable-gardening-techniques /blog/sustainable-gardening-techniques/ 301
/sustainable-gardening-techniques/ /blog/sustainable-gardening-techniques/ 301
/replace-your-lawn-with-wildflowers /blog/replace-your-lawn-with-wildflowers/ 301
/replace-your-lawn-with-wildflowers/ /blog/replace-your-lawn-with-wildflowers/ 301
/best-drought-tolerant-plants /blog/best-drought-tolerant-ground-cover-plants/ 301
/best-drought-tolerant-plants/ /blog/best-drought-tolerant-ground-cover-plants/ 301
/how-to-start-a-backyard-garden /blog/how-to-start-a-backyard-garden/ 301
/how-to-start-a-backyard-garden/ /blog/how-to-start-a-backyard-garden/ 301
/best-diy-fruit-fly-trap-methods /blog/best-diy-fruit-fly-trap-methods/ 301
/best-diy-fruit-fly-trap-methods/ /blog/best-diy-fruit-fly-trap-methods/ 301
/climate-resilient-garden /blog/climate-resilient-garden/ 301
/climate-resilient-garden/ /blog/climate-resilient-garden/ 301
/are-lawn-mushrooms-poisonous /blog/are-lawn-mushrooms-poisonous/ 301
/are-lawn-mushrooms-poisonous/ /blog/are-lawn-mushrooms-poisonous/ 301
/common-lawn-mushroom-types /blog/common-lawn-mushroom-types/ 301
/common-lawn-mushroom-types/ /blog/common-lawn-mushroom-types/ 301
/fall-mushroom-management /blog/fall-mushroom-management/ 301
/fall-mushroom-management/ /blog/fall-mushroom-management/ 301
/lawn-mushrooms-and-dogs /blog/lawn-mushrooms-and-dogs/ 301
/lawn-mushrooms-and-dogs/ /blog/lawn-mushrooms-and-dogs/ 301
/terrarium-setup-guide /blog/terrarium-setup-guide/ 301
/terrarium-setup-guide/ /blog/terrarium-setup-guide/ 301
/garden-gnomes-cultural-history /blog/garden-gnomes-cultural-history/ 301
/garden-gnomes-cultural-history/ /blog/garden-gnomes-cultural-history/ 301
/japanese-garden-ideas /blog/japanese-garden-ideas/ 301
/japanese-garden-ideas/ /blog/japanese-garden-ideas/ 301
/lawn-alternatives /blog/lawn-alternatives/ 301
/lawn-alternatives/ /blog/lawn-alternatives/ 301
/fairy-ring-mushrooms /blog/fairy-ring-mushrooms/ 301
/fairy-ring-mushrooms/ /blog/fairy-ring-mushrooms/ 301
/diy-fruit-fly-traps /blog/diy-fruit-fly-traps/ 301
/diy-fruit-fly-traps/ /blog/diy-fruit-fly-traps/ 301
/fire-resistant-plants /blog/fire-resistant-plants/ 301
/fire-resistant-plants/ /blog/fire-resistant-plants/ 301
/clay-garden-soil /blog/clay-garden-soil/ 301
/clay-garden-soil/ /blog/clay-garden-soil/ 301

# Ghost system pages
/en / 301
/en/ / 301
/blog/kitchensink /blog/ 301
/blog/kitchensink/ /blog/ 301
/author/chester /about/ 301
/author/chester/ /about/ 301
```

Note: `/rain-garden-design-2` needs no new lines — both its variants already exist at the top of the file (lines 2-3, destination `/blog/rain-garden-design/`). All other root slugs get both variants here (54 appended lines total).

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: build succeeds (the `prebuild` hero-image check also passes).

- [ ] **Step 3: Verify the built redirects file**

Run: `grep -c " 301$" dist/client/_redirects` and `grep "^/clay-garden-soil " dist/client/_redirects`
Expected: count is `67` (13 existing lines ending in `301` + 54 appended), and the grep prints `/clay-garden-soil /blog/clay-garden-soil/ 301`.

- [ ] **Step 4: Commit**

```bash
git add public/_redirects
git commit -m "fix: 301 redirect old Ghost URLs to current locations (GSC 404s)"
```

---

### Task 3: Deploy and verify live (green)

**Files:**
- None modified; runs the verification from Task 1.

**Interfaces:**
- Consumes: `scripts/check-redirects.mjs` from Task 1, deployed `_redirects` from Task 2.
- Produces: all-PASS live verification output; the deliverable the user asked for.

- [ ] **Step 1: Push and deploy**

```bash
git push
pnpm deploy
```

Expected: `wrangler deploy` succeeds and prints the deployed Worker URL.

- [ ] **Step 2: Run the full live check**

Run: `node scripts/check-redirects.mjs`
Expected: exit code 0 — all 30 rules print `PASS ... 301 → <destination>`.

- [ ] **Step 3: Spot-check the no-trailing-slash variants (not covered by the script)**

Run:
```bash
for p in "/clay-garden-soil" "/en" "/author/chester"; do
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}  $p\n" -I "https://www.gaiaverity.com$p"
done
```
Expected: each prints `301` with a `redirect_url` pointing directly at the final destination (`/blog/clay-garden-soil/`, `/`, `/about/`) — a single hop, no 307 intermediate.

- [ ] **Step 4: Report to the user**

Report the PASS count and remind the user to click **"Validate Fix"** on the 404 report in Google Search Console so Google re-crawls the URLs.
