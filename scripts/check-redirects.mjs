#!/usr/bin/env node

const baseUrl = process.env.BASE_URL || "https://www.gaiaverity.com";
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

let failed = false;

for (const [path, destination] of Object.entries(redirects)) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  const location = response.headers.get("location");
  const expected = new URL(destination, baseUrl).href;
  const actual = location && new URL(location, baseUrl).href;
  const passed = response.status === 301 && actual === expected;

  console.log(`${passed ? "PASS" : "FAIL"} ${path} ${response.status} → ${location || "(none)"}`);
  failed ||= !passed;
}

process.exitCode = failed ? 1 : 0;
