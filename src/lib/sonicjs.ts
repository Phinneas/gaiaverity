// SonicJS client for GaiaVerity
// Currently uses local MDX posts as the primary source
// SonicJS API only serves BatteryTrail content, not gaiaverity
// TODO: Configure SonicJS CMS to serve gaiaverity posts via API

import { getCollection } from "astro:content";

export interface BlogPost {
  slug: string;
  title: string;
  data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    image: string;
    author: string;
    publishedAt: string;
    publishDate: string;
    category: string;
    tags: string[] | string;
    site: string;
  };
  Content?: any;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  // Use local MDX collection (imported from Ghost/SonicJS)
  const posts = await getCollection("blog", ({ data }) => {
    return data.draft !== true;
  });

  return posts
    .sort((a, b) =>
      new Date(b.data.publishDate).valueOf() -
      new Date(a.data.publishDate).valueOf()
    )
    .map((post: any) => ({
      slug: post.slug,
      title: post.data.title,
      data: {
        title: post.data.title,
        slug: post.slug,
        excerpt: post.data.excerpt || '',
        content: '', // MDX posts use .render() instead
        featuredImage: post.data.image || '',
        image: post.data.image || '',
        author: post.data.author || 'Admin',
        publishedAt: post.data.publishDate?.toISOString?.() || post.data.publishDate || '',
        publishDate: post.data.publishDate?.toISOString?.() || post.data.publishDate || '',
        category: post.data.category || 'General',
        tags: post.data.tags || [],
        site: 'gaiaverity',
      },
    }));
}

export function parseTags(tagsField: string | string[] | undefined): string[] {
  if (!tagsField) return [];
  if (Array.isArray(tagsField)) return tagsField;
  return tagsField.split(',').map(t => t.trim()).filter(Boolean);
}
