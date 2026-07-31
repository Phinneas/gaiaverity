// SonicJS client for GaiaVerity
// Hybrid: existing posts served from local MDX, new posts fetched from SonicJS CMS API.
// Collection: "gaiaverityposts" (id: 831ab5ab-11b7-45c7-ab15-d2e8cd423d1f)
// CMS admin: https://sonicjscms.buzzuw2.workers.dev/admin/dashboard

import { getCollection } from "astro:content";

const SONICJS_API = 'https://sonicjscms.buzzuw2.workers.dev';
const GAIA_COLLECTION = 'gaiaverityposts';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  isCmsPost?: boolean;
  htmlContent?: string;   // only set for CMS posts
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

export interface CmsPost {
  id: string;
  slug: string;
  title: string;
  htmlContent: string;
  excerpt: string;
  featureimage: string;
  author: string;
  publishedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// ── CMS fetch ────────────────────────────────────────────────────────────────

export async function fetchCmsPosts(): Promise<CmsPost[]> {
  try {
    const res = await fetch(
      `${SONICJS_API}/api/content?collection=${GAIA_COLLECTION}&limit=200`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const posts: any[] = data.data || [];

    return posts
      .map((p: any) => ({
        id: p.id,
        slug: p.data?.slug || p.slug || '',
        title: p.data?.title || p.title || '',
        htmlContent: p.data?.content || '',
        excerpt: stripHtml(p.data?.excerpt || ''),
        featureimage: p.data?.featureimage || '',
        author: stripHtml(p.data?.author || 'Admin'),
        publishedAt: p.data?.publshedat || p.created_at || '',
      }))
      .filter((p: CmsPost) => p.slug);
  } catch (e) {
    console.warn('[sonicjs] Failed to fetch CMS posts — falling back to MDX only:', e);
    return [];
  }
}

// ── Blog post listing (MDX + CMS merged) ─────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
  const [mdxPosts, cmsPosts] = await Promise.all([
    getCollection("blog", ({ data }) => data.draft !== true),
    fetchCmsPosts(),
  ]);

  // MDX slugs take precedence — skip any CMS post that duplicates one
  const mdxSlugs = new Set(mdxPosts.map((p: any) => p.slug || p.id));

  const formattedMdx: BlogPost[] = mdxPosts.map((post: any) => ({
    slug: post.slug || post.id,
    title: post.data.title,
    data: {
      title: post.data.title,
      slug: post.slug || post.id,
      excerpt: post.data.excerpt || '',
      content: '',
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

  const formattedCms: BlogPost[] = cmsPosts
    .filter((p: CmsPost) => !mdxSlugs.has(p.slug))
    .map((p: CmsPost) => ({
      slug: p.slug,
      title: p.title,
      isCmsPost: true,
      htmlContent: p.htmlContent,
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.htmlContent,
        featuredImage: p.featureimage,
        image: p.featureimage,
        author: p.author || 'Admin',
        publishedAt: p.publishedAt,
        publishDate: p.publishedAt,
        category: 'General',
        tags: [],
        site: 'gaiaverity',
      },
    }));

  return [...formattedMdx, ...formattedCms].sort((a, b) =>
    new Date(b.data.publishDate || 0).valueOf() -
    new Date(a.data.publishDate || 0).valueOf()
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

export function parseTags(tagsField: string | string[] | undefined): string[] {
  if (!tagsField) return [];
  if (Array.isArray(tagsField)) return tagsField;
  return tagsField.split(',').map(t => t.trim()).filter(Boolean);
}
