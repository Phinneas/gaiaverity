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
    bio: "Chester Beard is the founder and writer behind GaiaVerity, sharing practical, researched gardening advice for real backyards — less water, fewer chemicals, and more life in the soil.",
  },
];
