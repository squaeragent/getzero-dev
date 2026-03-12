import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://squaer.co',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
});
