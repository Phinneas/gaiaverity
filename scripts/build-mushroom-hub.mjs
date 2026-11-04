// build-mushroom-hub.mjs
//
// Data Hubs P2 (pilot) — "When mushrooms appear after rain, by region."
//
// Pulls two public, reusable datasets and joins them:
//   1. GBIF fungi occurrences (CC0 + CC-BY only) for the Pacific Northwest.
//   2. NOAA GHCN-Daily precipitation (Seattle-Tacoma KSEA as the regional proxy).
//
// Outputs src/data/mushroom-hub-data.json, which the hub page reads at build
// time. Run:  node scripts/build-mushroom-hub.mjs
//
// Licence filter: only CC0_1_0 and CC_BY_4_0 records are kept, so the result
// is reproducible and reusable without attribution friction (CC-BY still needs
// attribution, which the hub page's "how this was made" section provides).

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "mushroom-hub-data.json");

// Pacific Northwest bounding box (lat min,max ; lon min,max)
const BBOX_LAT = "41.5,49.5";
const BBOX_LON = "-125.5,-116.0";

// Regional rainfall proxy — Seattle-Tacoma Intl (KSEA), GHCN-Daily
const NOAA_STATION = "USW00024233";
const START_YEAR = 2015;
const END_YEAR = 2024;

const GBIF = "https://api.gbif.org/v1";
const NCEI = "https://www.ncei.noaa.gov/access/services/data/v1";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "gaiaverity-hub/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

// 1 ── GBIF: sightings by month (facet) ────────────────────────────────
async function sightingsByMonth() {
  const url =
    `${GBIF}/occurrence/search?kingdom=Fungi&license=CC0_1_0&license=CC_BY_4_0` +
    `&decimalLatitude=${BBOX_LAT}&decimalLongitude=${BBOX_LON}` +
    `&year=${START_YEAR},${END_YEAR}&facet=month&facetLimit=12&limit=0`;
  const data = await fetchJson(url);
  const months = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  // facet=month returns counts in data.facets[0].counts
  for (const f of data.facets || []) {
    if (f.field !== "MONTH") continue;
    for (const c of f.counts || []) {
      const m = parseInt(c.name, 10) - 1;
      if (m >= 0 && m < 12) counts[m] = c.count;
    }
  }
  // total count for this slice (data.count)
  return { months: counts, total: data.count || counts.reduce((a, b) => a + b, 0) };
}

// 2 ── NOAA: daily rainfall (KSEA) ─────────────────────────────────────
async function dailyRainfall() {
  const url =
    `${NCEI}?dataset=daily-summaries&dataTypes=PRCP&stations=${NOAA_STATION}` +
    `&startDate=${START_YEAR}-01-01&endDate=${END_YEAR}-12-31&units=metric&format=json`;
  const rows = await fetchJson(url);
  const series = {};
  for (const r of rows) {
    series[r.DATE] = parseFloat(r.PRCP || "0");
  }
  return series;
}

// 3 ── GBIF: occurrence dates (sample) for the days-after-rain join ────
async function occurrenceDates() {
  const dates = [];
  let offset = 0;
  const pageSize = 300;
  const maxPages = 30; // ~9000 dated records — larger sample for a smoother histogram
  const url =
    `${GBIF}/occurrence/search?kingdom=Fungi&license=CC0_1_0&license=CC_BY_4_0` +
    `&decimalLatitude=${BBOX_LAT}&decimalLongitude=${BBOX_LON}` +
    `&year=${START_YEAR},${END_YEAR}&hasCoordinate=true&limit=${pageSize}`;
  for (let p = 0; p < maxPages; p++) {
    const data = await fetchJson(`${url}&offset=${offset}`);
    for (const r of data.results || []) {
      const d = (r.eventDate || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dates.push(d);
    }
    if (data.endOfRecords || !(data.results || []).length) break;
    offset += pageSize;
    await sleep(500);
  }
  return dates;
}

// 4 ── Join: days since last rain for each sighting ────────────────────
function daysAfterRain(dates, rainfall) {
  // Build a sorted list of "rain days" (PRCP >= 1 mm)
  const rainDays = Object.keys(rainfall)
    .filter((d) => rainfall[d] >= 1)
    .sort();

  // buckets: 0, 1, 2, 3, 4-5, 6-9, 10+
  const buckets = [
    { label: "Same day", min: 0, max: 0, count: 0 },
    { label: "1 day", min: 1, max: 1, count: 0 },
    { label: "2 days", min: 2, max: 2, count: 0 },
    { label: "3 days", min: 3, max: 3, count: 0 },
    { label: "4–5 days", min: 4, max: 5, count: 0 },
    { label: "6–9 days", min: 6, max: 9, count: 0 },
    { label: "10+ days", min: 10, max: Infinity, count: 0 },
  ];

  let matched = 0;
  for (const d of dates) {
    // find most recent rain day <= d
    let idx = -1;
    // binary search
    let lo = 0, hi = rainDays.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rainDays[mid] <= d) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    if (idx < 0) continue; // sighting before any recorded rain — skip
    const lastRain = rainDays[idx];
    const diff = Math.round((new Date(d) - new Date(lastRain)) / 86400000);
    for (const b of buckets) {
      if (diff >= b.min && diff <= b.max) { b.count++; break; }
    }
    matched++;
  }

  return { buckets, matched, total: dates.length, rainDays: rainDays.length };
}

async function main() {
  console.log("Fetching GBIF monthly facet…");
  const monthly = await sightingsByMonth();

  console.log("Fetching NOAA daily rainfall (KSEA)…");
  const rainfall = await dailyRainfall();

  console.log("Fetching GBIF occurrence dates (sample)…");
  const dates = await occurrenceDates();

  console.log("Joining sighting dates to rainfall…");
  const dar = daysAfterRain(dates, rainfall);

  const out = {
    generatedAt: new Date().toISOString(),
    region: { label: "Pacific Northwest", bboxLat: BBOX_LAT, bboxLon: BBOX_LON },
    sources: {
      gbif: "GBIF.org occurrence data, kingdom=Fungi, licences CC0_1_0 + CC_BY_4_0",
      noaa: `NOAA GHCN-Daily precipitation, station ${NOAA_STATION} (Seattle-Tacoma KSEA), regional proxy`,
    },
    window: { startYear: START_YEAR, endYear: END_YEAR },
    sightingsByMonth: monthly,
    daysAfterRain: dar,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(JSON.stringify(
    {
      monthlyTotal: monthly.total,
      monthly: monthly.months,
      rainDays: dar.rainDays,
      sightingsSampled: dar.total,
      daysAfterRain: dar.buckets,
    },
    null,
    2
  ));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
