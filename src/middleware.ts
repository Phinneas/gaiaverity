import { defineMiddleware } from "astro:middleware";

// 301 redirect map — migrated from public/_redirects (Cloudflare Pages format,
// which is NOT processed by Workers). All rules must be maintained here now.

const REDIRECTS: Record<string, string> = {
  // ── Dead URLs (GSC 404s) ───────────────────────────────────────────────────
  "/bio-diverse-lawn-care/": "/blog/biodiverse-lawn-care/",
  "/blog": "/blog/",
  "/clover-and-wildflower-lawn/": "/blog/white-clover-lawn-alternative/",
  "/what-is-sustainable-gardening/": "/blog/sustainable-gardening-techniques/",
  "/garden-design-inspirations/": "/blog/",
  "/designing-small-backyard-gardens/": "/blog/small-backyard-garden-ideas/",

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
  "/best-drought-tolerant-plants/": "/blog/best-drought-tolerant-plants/",
  "/are-lawn-mushrooms-poisonous/": "/blog/are-lawn-mushrooms-poisonous/",
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

export const onRequest = defineMiddleware((context, next) => {
  const url = context.url;
  const path = url.pathname;

  // Redirect apex domain → www (canonical consistency for SEO)
  if (url.hostname === "gaiaverity.com") {
    const wwwUrl = new URL(url.toString());
    wwwUrl.hostname = "www.gaiaverity.com";
    return context.redirect(wwwUrl.toString(), 301);
  }

  // Check exact redirect match (with trailing slash)
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
