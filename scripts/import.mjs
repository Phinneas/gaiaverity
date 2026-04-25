import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';
import TurndownService from 'turndown';

/**
 * This script imports content from a Ghost JSON export and creates MDX files for the Astro blog collection.
 * Usage: node scripts/import.mjs gaiaverity.ghost.2026-04-24-16-52-59.json
 */

const jsonFile = process.argv[2];

if (!jsonFile) {
  console.error('Please provide a Ghost JSON export file path.');
  process.exit(1);
}

const contentDir = path.join(process.cwd(), 'src/content/blog');
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Custom rule for Ghost-specific artifacts if needed
turndownService.addRule('ghost-images', {
  filter: ['img'],
  replacement: function (content, node) {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    const title = node.getAttribute('title') || '';
    return `![${alt}](${src}${title ? ` "${title}"` : ''})`;
  }
});

async function run() {
  try {
    console.log(`Reading ${jsonFile}...`);
    const rawData = fs.readFileSync(jsonFile, 'utf8');
    const exportData = JSON.parse(rawData);
    
    // Ghost export structure is usually { db: [ { data: { posts: [], ... } } ] }
    const data = exportData.db[0].data;
    
    const posts = data.posts || [];
    const users = data.users || [];
    const tags = data.tags || [];
    const postsAuthors = data.posts_authors || [];
    const postsTags = data.posts_tags || [];

    console.log(`Found ${posts.length} posts, ${users.length} users, ${tags.length} tags.`);

    // Create lookups
    const userMap = new Map(users.map(u => [u.id, u]));
    const tagMap = new Map(tags.map(t => [t.id, t]));
    
    // Map post IDs to author names
    const postAuthorMap = new Map();
    postsAuthors.forEach(pa => {
      const user = userMap.get(pa.author_id);
      if (user) {
        postAuthorMap.set(pa.post_id, user.name);
      }
    });

    // Map post IDs to tag names
    const postTagsMap = new Map();
    postsTags.forEach(pt => {
      const tag = tagMap.get(pt.tag_id);
      if (tag) {
        if (!postTagsMap.has(pt.post_id)) {
          postTagsMap.set(pt.post_id, []);
        }
        postTagsMap.get(pt.post_id).push(tag.name);
      }
    });

    let count = 0;
    for (const post of posts) {
      if (post.type !== 'post' || post.status !== 'published') {
        continue;
      }

      const title = post.title || 'Untitled';
      const slug = post.slug || slugify(title, { lower: true, strict: true });
      const filePath = path.join(contentDir, `${slug}.mdx`);

      const authorName = postAuthorMap.get(post.id) || 'Admin';
      const postTags = postTagsMap.get(post.id) || [];
      const category = postTags.length > 0 ? postTags[0] : 'General';
      
      const ghostUrl = 'https://gaiaverity.com';
      const featureImage = post.feature_image ? post.feature_image.replace('__GHOST_URL__', ghostUrl) : 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1000';

      const frontmatter = {
        title: title,
        excerpt: post.custom_excerpt || post.meta_description || '',
        category: category,
        author: authorName,
        tags: postTags,
        image: featureImage,
        publishDate: post.published_at || post.created_at || new Date().toISOString(),
        draft: false,
      };

      // Convert HTML to Markdown
      let markdownBody = '';
      if (post.html) {
        markdownBody = turndownService.turndown(post.html);
      } else if (post.plaintext) {
        markdownBody = post.plaintext;
      } else {
        markdownBody = 'No content available.';
      }

      // Sanitize for MDX
      markdownBody = markdownBody
        // Replace Ghost URL placeholders
        .replace(/__GHOST_URL__/g, ghostUrl)
        // Escape < if not part of a tag
        .replace(/<(?![a-zA-Z/!])/g, '&lt;')
        // Self-close void tags that might be unclosed
        .replace(/<br>/gi, '<br />')
        .replace(/<hr>/gi, '<hr />')
        .replace(/<img([^>]+)>/gi, (match, p1) => {
          if (p1.trim().endsWith('/')) return match;
          return `<img${p1} />`;
        })
        // Escape curly braces
        .replace(/{/g, '&#123;')
        .replace(/}/g, '&#125;');

      const fileContent = matter.stringify(markdownBody, frontmatter);

      fs.writeFileSync(filePath, fileContent);
      count++;
    }

    console.log(`Import completed! Successfully imported ${count} posts.`);
  } catch (error) {
    console.error('Error importing content:', error);
  }
}

run();
