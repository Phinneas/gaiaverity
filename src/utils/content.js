import { getCollection } from "astro:content";

// Only return posts without `draft: true` in the frontmatter

export async function getLocalPosts() {
  const posts = await getCollection("blog", ({ data }) => {
    return data.draft !== true;
  });
  
  return posts.sort(
    (a, b) =>
      new Date(b.data.publishDate).valueOf() -
      new Date(a.data.publishDate).valueOf()
  );
}
