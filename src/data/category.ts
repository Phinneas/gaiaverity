export interface Props {
  title: string;
  slug: string;
  color: "green" | "blue" | "orange" | "purple" | "pink";
  description: string;
}
export type Category = Props;

export const categories: Props[] = [
  {
    title: "Lawn Care",
    slug: "lawn",
    color: "green",
    description:
      "Organic lawn care, grass alternatives, soil health, and natural lawn solutions that work with nature, not against it.",
  },
  {
    title: "Mushrooms",
    slug: "mushrooms",
    color: "orange",
    description:
      "Everything about lawn mushrooms — identification, safety, fairy rings, and why they're a sign of healthy soil.",
  },
  {
    title: "Native Plants",
    slug: "native",
    color: "green",
    description:
      "Native plant gardening, pollinator habitats, and landscaping with plants that thrive naturally in your region.",
  },
  {
    title: "Drought-Resistant",
    slug: "drought",
    color: "orange",
    description:
      "Drought-tolerant plants, water-wise gardening techniques, and strategies for a resilient garden in dry conditions.",
  },
  {
    title: "Sustainable Gardening",
    slug: "sustainable",
    color: "green",
    description:
      "Eco-friendly gardening practices, composting, no-dig methods, biodiversity, and chemical-free solutions.",
  },
  {
    title: "Soil Health",
    slug: "soil",
    color: "purple",
    description:
      "Understanding and improving your soil — clay, sand, compost, amendments, and building living soil.",
  },
  {
    title: "Small Spaces",
    slug: "small-space",
    color: "pink",
    description:
      "Gardening in tight quarters — vertical gardens, container gardening, balcony setups, and small backyards.",
  },
  {
    title: "Fire-Resistant",
    slug: "fire-resistant",
    color: "orange",
    description:
      "Fire-resistant plants and landscaping strategies for creating defensible space around your home.",
  },
  {
    title: "Pest Control",
    slug: "pest-control",
    color: "purple",
    description:
      "Natural pest control methods, companion planting, beneficial insects, and organic solutions that work.",
  },
  {
    title: "Rain Gardens",
    slug: "rain-garden",
    color: "blue",
    description:
      "Rain garden design, stormwater management, drainage solutions, and water-loving native plants.",
  },
  {
    title: "Shade Gardening",
    slug: "shade",
    color: "green",
    description:
      "Gardening in shady spots — shade-tolerant plants, under-tree planting, and working with low-light conditions.",
  },
  {
    title: "General",
    slug: "general",
    color: "green",
    description:
      "General gardening advice, tips, and guides for home gardeners.",
  },
];
