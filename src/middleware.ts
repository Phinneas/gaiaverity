import { defineMiddleware } from "astro:middleware";

// 301 redirect map — migrated from public/_redirects (Cloudflare Pages format,
// which is NOT processed by Workers). All rules must be maintained here now.

const REDIRECTS: Record<string, string> = {
  // ── Dead URLs (GSC 404s) ───────────────────────────────────────────────────
  "/bio-diverse-lawn-care/": "/blog/biodiverse-lawn-care/",
  "/blog": "/blog/",
  "/archive": "/archive/",
  "/clover-and-wildflower-lawn/": "/blog/white-clover-lawn-alternative/",
  "/what-is-sustainable-gardening/": "/blog/sustainable-gardening-techniques/",
  "/garden-design-inspirations/": "/blog/",
  "/designing-small-backyard-gardens/": "/blog/small-backyard-garden-ideas/",

  // ── Merged duplicate pages (301 to the survivor) ──────────────────────────
  "/blog/best-drought-tolerant-plants/": "/blog/best-drought-tolerant-ground-cover-plants/",
  "/blog/are-lawn-mushrooms-poisonous/": "/blog/lawn-mushrooms-and-dogs/",

  // ── CMS root-level URLs → /blog/ canonical ─────────────────────────────────
  "/biodiverse-lawn-care/": "/blog/biodiverse-lawn-care/",
  "/white-clover-lawn-alternative/": "/blog/white-clover-lawn-alternative/",
  "/replace-your-lawn-with-wildflowers/": "/blog/replace-your-lawn-with-wildflowers/",
  "/sustainable-gardening-techniques/": "/blog/sustainable-gardening-techniques/",
  "/lawn-mushrooms/": "/blog/lawn-mushrooms/",
  "/clay-garden-soil/": "/blog/clay-garden-soil/",
  "/sustainable-small-backyard-vegetable-garden/": "/blog/sustainable-small-backyard-vegetable-garden/",
  "/how-to-start-a-backyard-garden/": "/blog/how-to-start-a-backyard-garden/",
  "/when-to-prune-holly-bushes/": "/blog/when-to-prune-holly-bushes/",
  "/japanese-garden-ideas/": "/blog/japanese-garden-ideas/",
  "/lawn-alternatives/": "/blog/lawn-alternatives/",
  "/native-pollinator-garden-design/": "/blog/native-pollinator-garden-design/",
  "/diy-fruit-fly-traps/": "/blog/diy-fruit-fly-traps/",
  "/no-dig-organic-gardening/": "/blog/no-dig-organic-gardening/",
  "/climate-resilient-backyard-garden/": "/blog/climate-resilient-backyard-garden/",
  "/rain-garden-design/": "/blog/rain-garden-design/",
  "/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/": "/blog/small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery/",
  "/fire-resistant-plants/": "/blog/fire-resistant-plants/",
  "/best-drought-tolerant-plants/": "/blog/best-drought-tolerant-ground-cover-plants/",
  "/are-lawn-mushrooms-poisonous/": "/blog/lawn-mushrooms-and-dogs/",
  "/mushrooms-growing-in-lawn-identification/": "/blog/mushrooms-growing-in-lawn-identification/",
  "/fairy-ring-mushrooms/": "/blog/fairy-ring-mushrooms/",
  "/lawn-mushrooms-and-dogs/": "/blog/lawn-mushrooms-and-dogs/",
  "/common-lawn-mushroom-types/": "/blog/common-lawn-mushroom-types/",
  "/mushrooms-after-rain/": "/blog/mushrooms-after-rain/",
  "/fall-mushroom-management/": "/blog/fall-mushroom-management/",
  "/fall-mushroom-management-for-healthy-lawns/": "/blog/fall-mushroom-management-for-healthy-lawns/",
  "/seasonal-mushroom-patterns-in-home-lawns/": "/blog/seasonal-mushroom-patterns-in-home-lawns/",
  "/terrarium-setup-guide/": "/blog/terrarium-setup-guide/",
  "/no-dig-gardening/": "/blog/no-dig-gardening/",
  "/best-diy-fruit-fly-trap-methods/": "/blog/best-diy-fruit-fly-trap-methods/",
  "/climate-resilient-garden/": "/blog/climate-resilient-garden/",
  "/best-drought-tolerant-ground-cover-plants/": "/blog/best-drought-tolerant-ground-cover-plants/",
  "/best-fire-resistant-plants/": "/blog/best-fire-resistant-plants/",
  "/organic-lawn-care-guide/": "/blog/organic-lawn-care-guide/",
  "/rain-garden-design-2/": "/blog/rain-garden-design-2/",
  "/best-organic-lawn-fertilizer-guide/": "/blog/best-organic-lawn-fertilizer-guide/",
  "/garden-gnomes-cultural-history/": "/blog/garden-gnomes-cultural-history/",
  "/backyard-garden-ideas/": "/blog/backyard-garden-ideas/",
  "/edible-landscaping/": "/blog/edible-landscaping/",
  "/tomato-companion-plants/": "/blog/tomato-companion-plants/",
  "/native-pollinator-plants/": "/blog/native-pollinator-plants/",
  "/desert-plants-home-garden/": "/blog/desert-plants-home-garden/",
  "/small-backyard-garden-ideas/": "/blog/small-backyard-garden-ideas/",
  "/vertical-garden-ideas-small-spaces/": "/blog/vertical-garden-ideas-small-spaces/",
  "/battery-powered-garden-tools/": "/blog/battery-powered-garden-tools/",
  "/native-plant-gardening-tips/": "/blog/native-plant-gardening-tips/",
  "/mushrooms-in-lawn/": "/blog/mushrooms-in-lawn/",
  "/mushrooms-lawn-why-they-belong/": "/blog/mushrooms-lawn-why-they-belong/",
  "/organic-weed-control-lawns/": "/blog/organic-weed-control-lawns/",
  "/white-mushrooms-in-lawn/": "/blog/white-mushrooms-in-lawn/",
  "/lawn-mushrooms-poisonous-dogs/": "/blog/lawn-mushrooms-poisonous-dogs/",
  "/mushrooms-after-rain-yard/": "/blog/mushrooms-after-rain-yard/",
  "/mushrooms-new-sod/": "/blog/mushrooms-new-sod/",
  "/bee-lawn-guide/": "/blog/bee-lawn-guide/",
  "/no-mow-lawn-guide/": "/blog/no-mow-lawn-guide/",
};

// ── Ghost / demo content — permanently removed (410 Gone) ────────────────────
// These slugs never belonged to GaiaVerity's gardening content. They appeared
// from a Ghost CMS demo import or template migration. 410 tells Google they are
// gone permanently and should be deindexed faster than a 404.
const GONE_SLUGS = new Set([
  "14-architectural-design-ideas-for-spacious-interior",
  "every-next-level-of-your-life-will-demand-a-different-you",
  "this-bread-pudding-will-give-you-all-the-fall-feels",
  "complete-guide-fullstack-development",
  "essential-data-structures-algorithms",
  "nothing-new-about-undermining-women-autonomy",
  "how-to-become-frontend-master",
  "what-is-mcp",
  "kitchensink",
]);

// ── Known valid blog slugs (from MDX content + CMS) ─────────────────────────
// Used to return proper 404 for unknown slugs rather than a soft 404 (200).
// Note: merged/redirected slugs (e.g. best-drought-tolerant-plants) stay here
// so their 301 in REDIRECTS fires before this 404 check.
const VALID_BLOG_SLUGS = new Set([
  "are-lawn-mushrooms-poisonous",
  "backyard-garden-ideas",
  "battery-powered-garden-tools",
  "best-diy-fruit-fly-trap-methods",
  "best-drought-tolerant-ground-cover-plants",
  "best-drought-tolerant-plants",
  "best-fire-resistant-plants",
  "best-organic-lawn-fertilizer-guide",
  "biodiverse-lawn-care",
  "clay-garden-soil",
  "climate-resilient-backyard-garden",
  "climate-resilient-garden",
  "common-lawn-mushroom-types",
  "desert-plants-home-garden",
  "diy-fruit-fly-traps",
  "edible-landscaping",
  "fairy-ring-mushrooms",
  "fall-mushroom-management-for-healthy-lawns",
  "fall-mushroom-management",
  "fire-resistant-plants",
  "fungus-gnats-yellow-sticky-traps",
  "garden-gnomes-cultural-history",
  "how-to-improve-clay-soil",
  "how-to-start-a-backyard-garden",
  "japanese-garden-ideas",
  "lawn-alternatives",
  "lawn-mushrooms-and-dogs",
  "lawn-mushrooms",
  "mushrooms-after-rain",
  "mushrooms-growing-in-lawn-identification",
  "mushrooms-in-lawn",
  "mushrooms-lawn-why-they-belong",
  "native-plant-gardening-tips",
  "native-pollinator-garden-design",
  "native-pollinator-plants",
  "no-dig-gardening",
  "no-dig-organic-gardening",
  "organic-lawn-care-guide",
  "organic-weed-control-lawns",
  "rain-garden-design-2",
  "rain-garden-design",
  "replace-your-lawn-with-wildflowers",
  "seasonal-mushroom-patterns-in-home-lawns",
  "small-backyard-garden-ideas",
  "small-space-vertical-garden-ideas-to-transform-your-balcony-or-wall-with-lush-greenery",
  "sustainable-gardening-techniques",
  "sustainable-small-backyard-vegetable-garden",
  "terrarium-setup-guide",
  "tomato-companion-plants",
  "vertical-garden-ideas-small-spaces",
  "welcome-to-gaiaverity",
  "when-to-prune-holly-bushes",
  "white-clover-lawn-alternative",
  "white-mushrooms-in-lawn",
]);

// Category query params that don't correspond to real gardening categories
// (Ghost CMS defaults — travel, lifestyle, etc.) — return 410 to prevent
// Google from indexing these query-param URLs.
const DEPRECATED_CATEGORIES = new Set([
  "travel",
  "announcement",
  "general",
  "personal",
  "design",
  "education",
  "lifestyle",
  "technology",
]);

function isGhostSlugPath(path: string): boolean {
  // Match /blog/<slug> or /blog/<slug>/ — any variant
  const match = path.match(/^\/blog\/([^\/]+)\/?$/);
  if (!match) return false;
  return GONE_SLUGS.has(match[1]);
}

function isInvalidBlogSlug(path: string): boolean {
  const match = path.match(/^\/blog\/([^\/]+)\/?$/);
  if (!match) return false;
  const slug = match[1];
  return !VALID_BLOG_SLUGS.has(slug) && !GONE_SLUGS.has(slug);
}

function hasDeprecatedCategory(url: URL): boolean {
  const cat = url.searchParams.get("category");
  return cat !== null && DEPRECATED_CATEGORIES.has(cat.toLowerCase());
}

export const onRequest = defineMiddleware((context, next) => {
  const url = context.url;
  const path = url.pathname;

  // Redirect apex domain → www (canonical consistency for SEO)
  if (url.hostname === "gaiaverity.com") {
    const wwwUrl = new URL(url.toString());
    wwwUrl.hostname = "www.gaiaverity.com";
    return context.redirect(wwwUrl.toString(), 301);
  }

  // ── 410 Gone: ghost/demo content that never belonged on this site ──────────
  if (isGhostSlugPath(path)) {
    return new Response("Gone", { status: 410 });
  }

  // ── 404 Not Found: invalid blog slugs ──────────────────────────────────────
  if (isInvalidBlogSlug(path)) {
    return context.rewrite(new Request(new URL("/404", context.url)));
  }

  // ── 410 Gone: deprecated category query params on /blog or /archive ────────
  if ((path === "/blog/" || path === "/archive/") && hasDeprecatedCategory(url)) {
    return new Response("Gone", { status: 410 });
  }

  // ── 301 Redirects ──────────────────────────────────────────────────────────
  if (REDIRECTS[path]) {
    return context.redirect(REDIRECTS[path], 301);
  }

  // Also check without trailing slash — Astro enforces trailingSlash: 'always'
  // but old indexed URLs may lack the slash
  if (!path.endsWith("/") && REDIRECTS[path + "/"]) {
    return context.redirect(REDIRECTS[path + "/"], 301);
  }

  return next();
});
