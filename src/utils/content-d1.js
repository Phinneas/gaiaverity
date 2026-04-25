const COLLECTION_ID = 'col-blog-posts-94b7858e';

function parseD1Row(row) {
  let parsedData = {};
  try {
    parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  } catch (e) {
    console.error('Failed to parse JSON for row:', row.id, e);
  }

  const rawTags = parsedData.tags;
  let tags = [];
  if (typeof rawTags === 'string' && rawTags.trim()) {
    tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
  } else if (Array.isArray(rawTags)) {
    tags = rawTags;
  }

  let publishDate;
  try {
    if (parsedData.publishedAt) {
      publishDate = new Date(parsedData.publishedAt).toISOString();
    } else {
      publishDate = new Date(row.created_at).toISOString();
    }
  } catch (e) {
    publishDate = new Date().toISOString();
  }

  return {
    id: row.id,
    slug: row.slug,
    data: {
      title: row.title || parsedData.title || 'Untitled',
      excerpt: parsedData.excerpt || '',
      publishDate: publishDate,
      image: parsedData.featuredImage || '',
      author: parsedData.author || 'Admin',
      category: parsedData.category || 'General',
      tags: tags,
      content: parsedData.content || '',
      draft: false,
    }
  };
}

export async function getD1Posts(db) {
  if (!db) {
    console.warn('D1 Database not found in Astro.locals.runtime.env.DB');
    return [];
  }

  try {
    const { results } = await db
      .prepare(`
        SELECT id, slug, title, data, created_at, updated_at 
        FROM content 
        WHERE collection_id = ? 
        AND status = 'published'
        AND data LIKE '%"site":"gaiaverity"%'
        ORDER BY created_at DESC
      `)
      .bind(COLLECTION_ID)
      .all();

    return results.map(parseD1Row);
  } catch (error) {
    console.error('Error fetching posts from D1:', error);
    return [];
  }
}

export async function getD1PostBySlug(db, slug) {
  if (!db) return null;

  try {
    const row = await db
      .prepare(`
        SELECT id, slug, title, data, created_at, updated_at 
        FROM content 
        WHERE collection_id = ? 
        AND slug = ? 
        AND status = 'published'
        LIMIT 1
      `)
      .bind(COLLECTION_ID, slug)
      .first();

    if (!row) return null;
    return parseD1Row(row);
  } catch (error) {
    console.error('Error fetching post by slug from D1:', error);
    return null;
  }
}
