<script lang="ts">
  import 'prism-themes/themes/prism-one-light.css'
  import { formatDate } from '$lib/format-date'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'

  interface Props {
    title: string
    date: string
    description?: string
    children?: import('svelte').Snippet
  }

  let { title, date, description, children }: Props = $props()
</script>

<svelte:head>
  <title>{title}</title>
  {#if description}
    <meta name="description" content={description} />
  {/if}
</svelte:head>

<article class="post">
  <header>
    <Breadcrumb
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/posts', label: 'Posts' },
        { label: title },
      ]}
    />
    <h1>{title}</h1>
    <time datetime={date}>{formatDate(date)}</time>
  </header>
  <div class="prose">
    {#if children}
      {@render children()}
    {/if}
  </div>
</article>

<style>
  .post {
    max-width: 65ch;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg);
    color: var(--text-color);
  }

  header {
    margin-bottom: var(--space-xl);
  }

  h1 {
    font-size: 2em;
    color: var(--primary-color);
    margin: var(--space-md) 0 var(--space-sm);
    line-height: 1.2;
  }

  time {
    color: var(--secondary-color);
    font-size: var(--font-sm);
  }

  .prose {
    line-height: 1.7;
  }

  .prose :global(h2) {
    color: var(--primary-color);
    margin-top: var(--space-xl);
    margin-bottom: var(--space-md);
    font-size: 1.4em;
  }

  .prose :global(h3) {
    color: var(--primary-color);
    margin-top: var(--space-lg);
    margin-bottom: var(--space-sm);
    font-size: 1.15em;
  }

  .prose :global(p) {
    margin: var(--space-md) 0;
  }

  .prose :global(code) {
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
  }

  .prose :global(pre) {
    border-radius: 6px;
    padding: var(--space-lg);
    overflow-x: auto;
    margin: var(--space-lg) 0;
    font-size: 0.85em;
    line-height: 1.5;
  }

  .prose :global(pre code) {
    background: none;
    padding: 0;
  }

  .prose :global(ul),
  .prose :global(ol) {
    padding-left: var(--space-lg);
    margin: var(--space-md) 0;
  }

  .prose :global(li) {
    margin: var(--space-xs) 0;
  }

  .prose :global(blockquote) {
    border-left: 3px solid var(--primary-color);
    margin: var(--space-lg) 0;
    padding: var(--space-sm) var(--space-lg);
    color: var(--secondary-color);
    font-style: italic;
  }

  .prose :global(hr) {
    border: none;
    border-top: 1px solid var(--line-color);
    margin: var(--space-xl) 0;
  }

  .prose :global(.mermaid-diagram) {
    margin: var(--space-lg) 0;
    display: flex;
    justify-content: center;
  }

  .prose :global(.mermaid-diagram svg) {
    max-width: 100%;
    height: auto;
  }

  /* Light SVG shown by default; dark SVG hidden until theme activates. */
  :global(.mermaid-dark) {
    display: none;
  }

  :global([data-theme='dark'] .mermaid-dark) {
    display: block;
  }
  :global([data-theme='dark'] .mermaid-light) {
    display: none;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme]) .mermaid-dark) {
      display: block;
    }
    :global(:root:not([data-theme]) .mermaid-light) {
      display: none;
    }
  }

  .prose :global(strong) {
    color: var(--primary-color);
  }

  /* ── Tables ────────────────────────────────────────── */
  .prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-lg) 0;
    font-size: var(--font-sm);
  }

  .prose :global(th) {
    background: var(--bg-surface);
    color: var(--primary-color);
    font-weight: 600;
    text-align: left;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 2px solid var(--primary-color);
    white-space: normal;
    word-break: keep-all;
  }

  .prose :global(td) {
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--line-color);
    vertical-align: top;
    white-space: normal;
    word-break: keep-all;
  }

  .prose :global(tr:last-child td) {
    border-bottom: none;
  }

  .prose :global(tr:nth-child(even) td) {
    background: var(--bg-surface);
  }

  /* ── .grid-table: equal-width columns ─────────────── */
  .prose :global(.grid-table) {
    overflow-x: auto;
  }

  .prose :global(.grid-table table) {
    table-layout: auto;
    min-width: 100%;
  }
</style>
