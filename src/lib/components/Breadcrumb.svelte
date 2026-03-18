<script lang="ts">
  import { resolve } from '$app/paths'
  import type { Pathname } from '$app/types'

  interface Crumb {
    href?: Pathname
    label: string
  }

  interface Props {
    crumbs: Crumb[]
  }

  let { crumbs }: Props = $props()
</script>

<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    {#each crumbs as crumb, i (i)}
      <li
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        {#if crumb.href}
          <a href={resolve(crumb.href)} itemprop="item">
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
