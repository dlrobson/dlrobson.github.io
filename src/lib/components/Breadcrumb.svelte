<script lang="ts">
  interface Crumb {
    href?: string
    label: string
  }

  interface Props {
    crumbs: Crumb[]
  }

  let { crumbs }: Props = $props()
</script>

<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    {#each crumbs as crumb, i}
      <li
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        {#if crumb.href}
          <a href={crumb.href} itemprop="item">
            <span itemprop="name">{crumb.label}</span>
          </a>
        {:else}
          <span itemprop="item">
            <span aria-current="page" itemprop="name">{crumb.label}</span>
          </span>
        {/if}
        <meta itemprop="position" content={String(i + 1)} />
        {#if i < crumbs.length - 1}
          <span class="sep" aria-hidden="true">/</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb {
    font-size: var(--font-sm);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3em;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  a {
    color: var(--secondary-color);
    text-decoration: none;
  }

  a:hover {
    color: var(--primary-color);
  }

  span[aria-current='page'] {
    color: var(--text-color);
  }

  .sep {
    color: var(--secondary-color);
    opacity: 0.5;
  }
</style>
