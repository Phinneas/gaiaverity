import type { ImageMetadata } from "astro";

export interface Props {
  name: string;
  slug: string;
  image: ImageMetadata | string;
  bio: string;
}

export type Author = Props;

export const authors: Props[] = [
  {
    name: "Chester Beard",
    slug: "chester-beard",
    image: "",
    bio: "Chester Beard is the founder and lead writer at GaiaVerity. He has spent years working with plants, soil, and real backyards — testing which gardening methods actually hold up under everyday conditions and which fall apart when the weather, the soil, or the budget gets real. His writing draws on horticultural research from university extension services, the USDA, and first-hand experience with clay soil, drought, shade, and the compromises of suburban gardening. Every guide on GaiaVerity is researched, tested where possible, and written to give you a straight answer.",
  },
];
