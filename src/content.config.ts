import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      category: z.string().trim(),
      author: z.string().trim(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()),
      image: image().or(z.string()),
      publishDate: z.string().transform((str) => new Date(str)),
    }),
});

export const collections = { blog };
