#!/usr/bin/env node

const baseUrl = process.env.BASE_URL || "https://www.gaiaverity.com";
const redirects = {
  "/blog/best-drought-tolerant-plants/": "/blog/best-drought-tolerant-ground-cover-plants/",
  "/blog/rain-garden-design-2/": "/blog/rain-garden-design/",
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
