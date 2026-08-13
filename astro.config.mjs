// https://astro.build/config
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { unified } from '@astrojs/markdown-remark';

import rehypeImageNativeLazyLoading from 'rehype-plugin-image-native-lazy-loading';

import { remarkReadingTime } from './src/utils/all.js';
import { remarkNapkin } from './src/plugins/remark-napkin.mjs';

export default defineConfig({
  site: 'https://www.gaiaverity.com',
  trailingSlash: 'always',
  output: 'server',
  adapter: cloudflare(),
  prerender: {
    default: false,
    auto: false,
  },
  image: {
    domains: ['pub-d552d0f3145d4a05b526e561d625b49b.r2.dev', 'images.unsplash.com'],
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkNapkin],
      rehypePlugins: [rehypeImageNativeLazyLoading],
    }),
  },
  integrations: [tailwind(), mdx(), sitemap()],
  vite: {
    ssr: {
      external: ['reading-time', 'mdast-util-to-string'],
    },
  },
});
