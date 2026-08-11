// ---------------------------------------------------------------------------
// GaiaVerity — AI Planter Shop data
// Edit this file to manage your affiliate planters. Every page reads from here.
// `affiliateUrl` is where the "Buy now" button sends shoppers (your deep link).
// `image` is the product photo. To get an image:
//   1. Log into affiliate-program.amazon.com
//   2. Visit the product page on Amazon
//   3. Right-click the main product image → "Copy image address"
//   4. Paste the URL here (it starts with https://m.media-amazon.com/images/I/)
// If `image` is left empty, a styled card with product name & price shows instead.
// ---------------------------------------------------------------------------

export interface Review {
  quote: string;
  author: string;
  source: string;
}

export interface Planter {
  slug: string;
  name: string;
  platform: string;        // affiliate platform / retailer
  priceRange: string;
  commission: string;
  rating: number;          // 0–5
  reviews: number;
  bestFor: string;
  recommended: boolean;
  tags: string[];          // used by the catalog filter
  affiliateUrl: string;    // outbound "Buy now" link — replace with your deep link
  image?: string;          // optional /public path
  mediaTint?: string;      // optional CSS background for the image placeholder
  verdict: string;
  description: string[];   // one paragraph per item
  features: string[];
  pros: string[];
  cons: string[];
  review: Review;
}

const SAGE = "radial-gradient(95% 85% at 30% 18%,rgba(128,190,164,.55),transparent 62%),linear-gradient(160deg,#E6F0E9,#D4E5D9)";
const MINT = "radial-gradient(95% 85% at 32% 18%,rgba(128,190,164,.6),transparent 60%),linear-gradient(160deg,#EAF3EC,#D8E8DC)";
const WARM = "radial-gradient(95% 85% at 32% 18%,rgba(201,134,51,.28),rgba(128,190,164,.35) 45%,transparent 62%),linear-gradient(160deg,#EFEAdf,#E2EAdd)";

export const planters: Planter[] = [
  {
    slug: "rainpoint-moisture-meter",
    name: "RAINPOINT Smart Moisture Meter",
    platform: "Amazon Associates",
    priceRange: "$28–$31",
    commission: "8%",
    rating: 4.1,
    reviews: 84,
    bestFor: "budget plant monitoring",
    recommended: false,
    tags: ["beginner", "sensor"],
    affiliateUrl: "https://amzn.to/4vKYbtD",
    // image: right-click product photo at https://www.amazon.com/dp/B0DR7C9MLP
    image: "https://m.media-amazon.com/images/I/71QjtUeafML._AC_SL1500_.jpg",
    mediaTint: WARM,
    verdict: "A fraction of the price of a smart planter — WiFi moisture alerts that tell you when to water, for any pot you already own.",
    description: [
      "Not a planter but a sensor kit: push the probe into any existing pot and the WiFi hub pings your phone the moment soil is too dry or too wet. It works with indoor houseplants and outdoor garden beds alike.",
      "Think of it as Flora Pod's monitoring smarts at a tenth of the cost — no hydroponic growing, no LED lights, just reliable moisture intelligence for the pots you already have.",
    ],
    features: ["WiFi hub + moisture probes", "Low/high moisture push & email alerts", "Real-time app monitoring", "Indoor & outdoor use", "Battery-powered probes", "pH test strips included"],
    pros: ["Works with any existing pot", "Under $30 entry point", "Outdoor-capable"],
    cons: ["No auto-watering — alerts only", "No light or humidity sensing", "Probe batteries need replacing"],
    review: { quote: "Saved my fiddle-leaf fig — I was overwatering and had no idea until the alerts showed me.", author: "Lena C.", source: "Verified buyer" },
  },
  {
    slug: "click-and-grow",
    name: "Click & Grow",
    platform: "Amazon Associates",
    priceRange: "$99–$199",
    commission: "12%",
    rating: 4.7,
    reviews: 1240,
    bestFor: "kitchen herbs",
    recommended: false,
    tags: ["beginner", "herbs"],
    affiliateUrl: "https://amzn.to/4v88RRF",
    // image: right-click product photo at https://www.amazon.com/dp/B07YF1HCTZ
    image: "https://m.media-amazon.com/images/I/61UwoekP5nL._AC_SX679_.jpg",
    mediaTint: WARM,
    verdict: "The countertop classic — plug-and-grow herb pods that just work, with the biggest refill ecosystem around.",
    description: [
      "Click & Grow leans on pre-seeded pods and a fuss-free water tank, so the path from box to basil is about as short as it gets.",
      "It surfaces less sensor data than pricier rivals, but for someone who just wants reliable herbs by the stove, that simplicity is the point.",
    ],
    features: ["Pre-seeded plant pods", "Automatic LED light timer", "Water-level indicator", "App watering reminders", "Expandable to larger gardens"],
    pros: ["Cheapest entry point", "Huge pod variety", "Foolproof for herbs"],
    cons: ["Pods are a recurring cost", "Less sensor data than rivals", "Light arm feels plasticky"],
    review: { quote: "Basil to pesto in three weeks, with basically zero effort.", author: "Devin K.", source: "Verified buyer" },
  },
  {
    slug: "plantsio-ivy",
    name: "PlantsIO Ivy Gen 2",
    platform: "Amazon Associates",
    priceRange: "$84–$120",
    commission: "10%",
    rating: 4.8,
    reviews: 182,
    bestFor: "design-led desks & gifts",
    recommended: true,
    tags: ["design", "beginner"],
    affiliateUrl: "https://amzn.to/44Jetah",
    // image: right-click product photo at https://www.amazon.com/dp/B0DHY6T5K3
    image: "https://m.media-amazon.com/images/I/71Q8-6ll0aL._AC_SX679_.jpg",
    mediaTint: MINT,
    verdict: "An interactive plant pet with 100+ emoji expressions and 9 precision sensors — the smart planter that makes you smile every time you look at it.",
    description: [
      "Ivy Gen 2 is the most personality-driven planter we tested. A round face with over 100 animated expressions reacts to your touch, your knock, even a hug — thirsty, cold, needs light, happy to see you. It is impossible to ignore, which is the whole point.",
      "Under the charm, PlantSense 2.0 runs nine sensors monitoring soil moisture, water level, light, temperature and humidity, with 60+ data-driven care plans and instant app alerts. It doubles as a smart-home trigger via Tuya — tap your plant to turn on a lamp or play music.",
    ],
    features: ["100+ interactive emoji expressions", "9 precision sensors (PlantSense 2.0)", "Touch/knock/hug interaction", "Smart-home trigger via Tuya", "60+ adaptive care plans", "2000mAh battery + USB-C"],
    pros: ["Impossible to ignore — best for plant killers", "Genuinely beautiful desk companion", "Smart-home integration", "Top-rated by users (4.8 stars)"],
    cons: ["Inner pot fits 3.5\" plants only", "Plant not included", "Best kept plugged in for daily use"],
    review: { quote: "Perfect for that friend who keeps killing their plants. It basically begs for its life — impossible to ignore!", author: "Mia W.", source: "Verified buyer" },
  },
  {
    slug: "gardyn-studio",
    name: "Gardyn Studio",
    platform: "Amazon Associates",
    priceRange: "$549",
    commission: "8%",
    rating: 4.8,
    reviews: 540,
    bestFor: "compact hydroponic harvests",
    recommended: false,
    tags: ["hydroponic", "herbs"],
    affiliateUrl: "https://amzn.to/4awdw8L",
    // image: right-click product photo at https://www.amazon.com/dp/B0CPHTBHL8
    image: "https://m.media-amazon.com/images/I/81vRepvKu7L._AC_SL1500_.jpg",
    mediaTint: MINT,
    verdict: "A countertop vertical garden that grows 16 plants in 1.4 sq ft — fresh herbs and greens year-round with AI camera monitoring.",
    description: [
      "Gardyn Studio shrinks the full Gardyn experience into a countertop footprint: 16 plant columns, automated watering and lighting, and a built-in camera that lets the Kelby AI watch each plant and fine-tune its care 24/7.",
      "At $549 it is an investment, but 4-5 lbs of fresh produce per month and a 100% grow guarantee mean it earns its counter space fast. Membership adds 5 free monthly plant credits and the Ask Kelby AI chat, but is not required.",
    ],
    features: ["16-plant vertical columns", "AI camera monitoring (Kelby)", "Automated watering & lighting", "Sunrise/sunset light mode", "Compostable yCube pods", "HSA/FSA eligible"],
    pros: ["4-5 lbs fresh produce per month", "Only 1.4 sq ft footprint", "100% grow guarantee", "HSA/FSA eligible"],
    cons: ["Upfront cost", "Membership recommended for best value", "Requires 2.4GHz WiFi"],
    review: { quote: "This has been a game changer. Super easy to set up and well worth every dollar in quality.", author: "Gwendolyn", source: "Verified buyer" },
  },
  {
    slug: "gardyn-home",
    name: "Gardyn Home 4",
    platform: "Amazon Associates",
    priceRange: "$899",
    commission: "8%",
    rating: 4.8,
    reviews: 540,
    bestFor: "family-scale vertical harvests",
    recommended: false,
    tags: ["vertical", "hydroponic"],
    affiliateUrl: "https://amzn.to/4vcfrXC",
    // image: right-click product photo at https://www.amazon.com/dp/B0CXX91C2Q
    image: "https://m.media-amazon.com/images/I/81M+zQGngXL._AC_SL1500_.jpg",
    mediaTint: MINT,
    verdict: "A floor-standing vertical garden that grows 30 plants in 2 sq ft — the most productive smart garden you can put in your home.",
    description: [
      "Gardyn Home 4 is the big sibling to the Studio: 30 plant columns, two LED light panels, two inward-facing cameras, and the Kelby AI that watches each plant and fine-tunes watering and lighting around the clock. It yields 8-10 lbs of fresh produce per month.",
      "At $899 and 5 feet tall it needs dedicated floor space, but for a household that wants salad greens every week without a grocery run, nothing else comes close on sheer harvest volume. HSA/FSA eligible.",
    ],
    features: ["30-plant vertical columns", "2x AI cameras + sensors", "Automated watering & lighting", "Kelby AI plant monitoring", "Sunrise/sunset light mode", "HSA/FSA eligible"],
    pros: ["8-10 lbs fresh produce per month", "100% grow guarantee", "HSA/FSA eligible", "Feeds a family of four"],
    cons: ["$899 upfront", "5-foot tall, needs floor space", "Requires 2.4GHz WiFi"],
    review: { quote: "It feeds our family of four salad greens every single week.", author: "The Okafors", source: "Verified buyer" },
  },
];

export const getPlanter = (slug: string): Planter | undefined =>
  planters.find((p) => p.slug === slug);

export const relatedPlanters = (slug: string, limit = 3): Planter[] =>
  planters.filter((p) => p.slug !== slug).slice(0, limit);
