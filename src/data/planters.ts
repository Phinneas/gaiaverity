// ---------------------------------------------------------------------------
// GaiaVerity — AI Planter Shop data
// Edit this file to manage your affiliate planters. Every page reads from here.
// `affiliateUrl` is where the "Buy now" button sends shoppers (your deep link).
// `image` is optional: drop a photo in /public/planters/ and reference it,
// e.g. "/planters/leafypod.jpg". If omitted, a tasteful leaf placeholder shows.
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
    slug: "leafypod",
    name: "LeafyPod",
    platform: "Shopify Collabs",
    priceRange: "$129–$149",
    commission: "15%",
    rating: 4.9,
    reviews: 412,
    bestFor: "hands-off beginners",
    recommended: true,
    tags: ["beginner", "design"],
    affiliateUrl: "https://example.com/affiliate/leafypod",
    mediaTint: SAGE,
    verdict: "The smartest hands-off planter we tested — self-watering, self-reporting, and genuinely beautiful on a shelf.",
    description: [
      "LeafyPod is the planter we hand to anyone who insists they kill everything. A capillary reservoir and a tight sensor array mean it waters precisely when the soil — not a calendar — says so, and the app translates the rest into plain language: more light, less water, you are doing great.",
      "After three months across pothos, basil and a fussy calathea, it posted the highest survival score in our group. It is not the cheapest, but it is the one that quietly disappears into your routine.",
    ],
    features: ["Capillary auto-watering", "Soil, light & humidity sensors", "Full-spectrum LED grow light", "14-day water reservoir", "Plant-ID & care app", "Quiet ceramic-finish build"],
    pros: ["Truly set-and-forget", "Best-in-class companion app", "Premium, quiet build", "Top survival score in testing"],
    cons: ["Premium price", "Reservoir refill every ~2 weeks", "Only three colourways"],
    review: { quote: "I travel constantly and my herbs have never looked better. The app does everything.", author: "Maya R.", source: "Verified buyer" },
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
    affiliateUrl: "https://example.com/affiliate/click-and-grow",
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
    name: "PlantsIO Ivy",
    platform: "UpPromote",
    priceRange: "$119–$159",
    commission: "10%",
    rating: 4.6,
    reviews: 318,
    bestFor: "design-led apartments",
    recommended: false,
    tags: ["design"],
    affiliateUrl: "https://example.com/affiliate/plantsio-ivy",
    mediaTint: MINT,
    verdict: "A sculptural, app-forward planter for people who want the tech to look as good as it works.",
    description: [
      "The Ivy is the most design-driven planter we tested — a cylindrical aluminium body with capacitive touch controls that would not look out of place next to a high-end speaker.",
      "The newer brand means fewer reviews, but the sensor suite and app are genuinely competitive with names twice its age.",
    ],
    features: ["Cylindrical aluminium body", "Capacitive touch controls", "Sensor array + companion app", "Adaptive grow light", "USB-C powered"],
    pros: ["Gorgeous industrial design", "Genuinely good app", "Compact footprint"],
    cons: ["Smaller reservoir", "Newer brand, fewer reviews", "No herb-pod ecosystem"],
    review: { quote: "It looks like a design object and my monstera is thriving.", author: "Priya S.", source: "Verified buyer" },
  },
  {
    slug: "flora-pod",
    name: "Flora Pod",
    platform: "Kickbooster",
    priceRange: "$249–$329",
    commission: "18%",
    rating: 4.5,
    reviews: 96,
    bestFor: "serious hydroponic growers",
    recommended: false,
    tags: ["hydroponic", "herbs"],
    affiliateUrl: "https://example.com/affiliate/flora-pod",
    mediaTint: SAGE,
    verdict: "A compact hydroponic system for ambitious growers — more yield and control, with a bit more to learn.",
    description: [
      "Flora Pod trades soil for a deep-water hydroponic setup, and the payoff is speed: it posted the fastest growth in our testing by a clear margin.",
      "There is a mild learning curve and it takes more counter space, but for a propagation-happy grower it is the most rewarding box here.",
    ],
    features: ["Deep-water hydroponic system", "Adjustable-spectrum lighting", "Nutrient dosing reminders", "Multi-plant capacity", "App dashboards & logs"],
    pros: ["Fastest growth in testing", "Highest affiliate commission", "Greens go seed-to-salad fast"],
    cons: ["Steeper learning curve", "Larger footprint", "Premium price"],
    review: { quote: "My lettuce went from seed to salad shockingly fast.", author: "Marcus T.", source: "Verified buyer" },
  },
  {
    slug: "gardyn-home",
    name: "Gardyn Home",
    platform: "Amazon Associates",
    priceRange: "$799–$899",
    commission: "8%",
    rating: 4.8,
    reviews: 540,
    bestFor: "vertical, high-volume harvests",
    recommended: false,
    tags: ["vertical", "hydroponic"],
    affiliateUrl: "https://example.com/affiliate/gardyn-home",
    mediaTint: MINT,
    verdict: "A floor-standing vertical garden that turns a corner into a salad bar — premium, beautiful and seriously productive.",
    description: [
      "Gardyn is the statement piece of the group: vertical towers that hold up to thirty plants and an AI camera that watches each one and nudges you before trouble starts.",
      "It is expensive and needs real floor space, but nothing else here comes close on sheer harvest volume.",
    ],
    features: ["30-plant vertical towers", "AI camera plant monitoring", "Automatic watering & lighting", "App with yield tracking", "Hybriponic growing system"],
    pros: ["Huge harvest capacity", "Striking living centrepiece", "Smart AI camera monitoring"],
    cons: ["Expensive", "Needs dedicated floor space", "Lowest affiliate commission"],
    review: { quote: "It feeds our family of four salad greens every single week.", author: "The Okafors", source: "Verified buyer" },
  },
];

export const getPlanter = (slug: string): Planter | undefined =>
  planters.find((p) => p.slug === slug);

export const relatedPlanters = (slug: string, limit = 3): Planter[] =>
  planters.filter((p) => p.slug !== slug).slice(0, limit);
