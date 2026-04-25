// https://astro.build/config
import { defineConfig, passthroughImageService } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import rehypeImageNativeLazyLoading from 'rehype-plugin-image-native-lazy-loading';

import { remarkReadingTime } from './src/utils/all';

export default defineConfig({
  site: 'https://gaiaverity.pages.dev',
  output: 'hybrid',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
    },
  }),
  image: {
    service: passthroughImageService(),
  },
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [rehypeImageNativeLazyLoading],
    extendDefaultPlugins: true,
  },
  integrations: [tailwind(), mdx(), icon(), sitemap()],
  vite: {
    ssr: {
      external: ['node:stream', 'node:util', 'node:url', 'node:path'],
    },
    resolve: {
      alias: {
        stream: 'node:stream',
      },
    },
  },
});
