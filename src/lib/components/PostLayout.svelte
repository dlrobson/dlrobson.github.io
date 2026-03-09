<script lang="ts">
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
