#!/usr/bin/env node
/**
 * check-hero-images.mjs
 *
 * Guards against the "every post has the same hero image" problem.
 * Scans src/content/blog/*.mdx frontmatter, extracts each `image:` value,
 * canonicalizes it to a stable photo id, and fails if the same photo is used
 * by more than one post.
 *
 * Usage:
 *   node scripts/check-hero-images.mjs        # exit 0 if all unique, 1 if duplicates
 *   node scripts/check-hero-images.mjs --list # also print the full image map
 *
 * Wire into CI or a pre-commit hook so duplicate hero images can't ship again.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../src/content/blog');

/**
 * Reduce a hero image reference to a stable identity so that the same photo
 * with different resize/crop query params still counts as a duplicate.
 */
function canonicalKey(image) {
  if (typeof image !== 'string' || image.length === 0) return null;

  // Unsplash: https://images.unsplash.com/photo-<timestamp>-<hash>?...
  const unsplash = image.match(/images\.unsplash\.com\/photo-([0-9]+-[a-f0-9]+)/i);
  if (unsplash) return `unsplash:${unsplash[1].toLowerCase()}`;

  // Pexels: https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg
  const pexels = image.match(/images\.pexels\.com\/photos\/(\d+)\//i);
  if (pexels) return `pexels:${pexels[1]}`;

  // Any other remote URL: drop the query string so sizing params don't split it.
  if (/^https?:\/\//i.test(image)) {
    return `url:${image.split('?')[0].toLowerCase()}`;
  }

  // Local asset path: use it verbatim (already unique per file).
  return `local:${image.replace(/\\/g, '/')}`;
}

function collectImages() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content dir not found: ${CONTENT_DIR}`);
    process.exit(2);
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => /\.(md|mdx)$/i.test(f))
    .sort();

  const byKey = new Map(); // key -> [{ file, image }]
  const missing = [];

  for (const file of files) {
    const full = path.join(CONTENT_DIR, file);
    const { data } = matter(fs.readFileSync(full, 'utf8'));
    const image = data.image;

    if (!image) {
      missing.push(file);
      continue;
    }

    const key = canonicalKey(image);
    if (!key) {
      missing.push(file);
      continue;
    }

    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ file, image });
  }

  return { byKey, missing };
}

function main() {
  const list = process.argv.includes('--list');
  const { byKey, missing } = collectImages();

  let duplicates = 0;

  console.log(`Checked ${[...byKey.values()].reduce((n, v) => n + v.length, 0) + missing.length} posts.\n`);

  for (const [key, posts] of byKey.entries()) {
    if (posts.length > 1) {
      duplicates++;
      console.log(`\u274c DUPLICATE ${key} (${posts.length}x):`);
      for (const p of posts) console.log(`     - ${p.file}`);
    }
  }

  if (duplicates === 0) {
    console.log('\u2705 All hero images are unique.');
  }

  if (missing.length > 0) {
    console.log(`\n\u26a0\ufe0f  ${missing.length} post(s) missing an image:`);
    for (const f of missing) console.log(`     - ${f}`);
  }

  if (list) {
    console.log('\nFull image map:');
    for (const [key, posts] of [...byKey.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`  ${key}  <-  ${posts.map((p) => p.file).join(', ')}`);
    }
  }

  process.exit(duplicates > 0 ? 1 : 0);
}

main();
