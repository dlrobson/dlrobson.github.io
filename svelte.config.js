import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            // Output directory for the static build
            pages: 'build',
            assets: 'build',
            // No SPA fallback needed — the page is fully prerendered
            fallback: undefined,
        }),
    },
};
