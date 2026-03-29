import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { mdsvex } from 'mdsvex'
import { fileURLToPath } from 'url'
import path from 'path'
import remarkMermaid from './scripts/remark-mermaid.js'
import remarkPlaygroundLinks from './scripts/remark-playground-links.js'
import { highlight } from './src/lib/highlight.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      remarkPlugins: [remarkMermaid, remarkPlaygroundLinks],
      layout: {
        _: path.resolve(__dirname, './src/lib/components/PostLayout.svelte'),
      },
      highlight: { highlighter: highlight },
    }),
  ],
  kit: {
    adapter: adapter({
      // Output directory for the static build
      pages: 'build',
      assets: 'build',
      // GitHub Pages serves 404.html for unmatched paths, which loads the
      // SvelteKit client runtime and renders +error.svelte for unknown routes.
      fallback: '404.html',
    }),
  },
}
