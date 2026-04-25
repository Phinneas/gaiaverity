const COLLECTION_ID = 'col-blog-posts-94b7858e';

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

    return results.map(row => {
      let parsedData = {};
      try {
        parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (e) {
        console.error('Failed to parse JSON for row:', row.id, e);
      }
      
      const rawTags = parsedData.tags;
      const tags = typeof rawTags === 'string' 
        ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
        : Array.isArray(rawTags) ? rawTags : [];

      return {
        id: row.id,
        slug: row.slug,
        data: {
          title: row.title || parsedData.title || '',
          description: parsedData.excerpt || '',
          excerpt: parsedData.excerpt || '',
          publishDate: parsedData.publishedAt 
            ? new Date(parsedData.publishedAt).toISOString()
            : new Date(row.created_at).toISOString(),
          image: parsedData.featuredImage || '',
          author: parsedData.author || 'Admin',
          category: parsedData.category || 'General',
          tags: tags,
          content: parsedData.content || '',
          draft: false,
          ...parsedData
        }
      };
    });
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
        LIMIT 1
      `)
      .bind(COLLECTION_ID, slug)
      .first();

    if (!row) return null;

    let parsedData = {};
    try {
      parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch (e) {
      console.error('Failed to parse JSON for row:', row.id, e);
    }
    
    const rawTags = parsedData.tags;
    const tags = typeof rawTags === 'string' 
      ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(rawTags) ? rawTags : [];

    return {
      id: row.id,
      slug: row.slug,
      data: {
        title: row.title || parsedData.title || '',
        description: parsedData.excerpt || '',
        excerpt: parsedData.excerpt || '',
        publishDate: parsedData.publishedAt 
          ? new Date(parsedData.publishedAt).toISOString()
          : new Date(row.created_at).toISOString(),
        image: parsedData.featuredImage || '',
        author: parsedData.author || 'Admin',
        category: parsedData.category || 'General',
        tags: tags,
        content: parsedData.content || '',
        draft: false,
        ...parsedData
      }
    };
  } catch (error) {
    console.error('Error fetching post by slug from D1:', error);
    return null;
  }
}
