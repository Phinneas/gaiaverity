// https://astro.build/config
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

import rehypeImageNativeLazyLoading from 'rehype-plugin-image-native-lazy-loading';

import { remarkReadingTime } from './src/utils/all.js';

export default defineConfig({
  site: 'https://www.gaiaverity.com',
  output: 'static',
  image: {
    domains: ['pub-sonicjs-media-dev.r2.dev'],
    remotePatterns: [{ protocol: 'https' }],
  },
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [rehypeImageNativeLazyLoading],
  },
  integrations: [tailwind(), mdx(), sitemap(), icon()],
  vite: {
    ssr: {
      external: ['reading-time', 'mdast-util-to-string'],
    },
  },
});
