# dlrobson.github.io

Personal site built with SvelteKit and `adapter-static`. Hosts my resume and posts, deployed to GitHub Pages.

Live at **<https://dlrobson.github.io/>**

## Stack

- SvelteKit (static prerender)
- TypeScript
- mdsvex for Markdown posts
- Mermaid diagram support via remark plugin
- Puppeteer for PDF resume generation

## Dev

```bash
nix-shell  # or direnv allow
just       # lint, type-check, test
npm run dev
```

## Source

This repository is a read-only mirror. The source of truth lives in a private Forgejo instance. The built site is deployed to the `gh-pages` branch via Forgejo CI.
