import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { mdsvex } from 'mdsvex'
import { fileURLToPath } from 'url'
import path from 'path'
import remarkMermaid from './remark-mermaid.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      remarkPlugins: [remarkMermaid],
      layout: {
        _: path.resolve(__dirname, './src/lib/components/PostLayout.svelte'),
      },
    }),
  ],
  kit: {
    adapter: adapter({
      // Output directory for the static build
      pages: 'build',
      assets: 'build',
      // No SPA fallback needed — the page is fully prerendered
      fallback: undefined,
    }),
  },
}
