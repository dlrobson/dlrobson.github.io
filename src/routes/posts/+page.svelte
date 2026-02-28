<script lang="ts">
  import { formatDateShort } from '$lib/format-date'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'

  interface PostMeta {
    title: string
    date: string
    description?: string
    slug: string
  }

  let { data }: { data: { posts: PostMeta[] } } = $props()
</script>

<svelte:head>
  <title>Posts</title>
  <meta name="description" content="Blog posts" />
</svelte:head>

<div class="posts-page">
  <header>
    <Breadcrumb crumbs={[{ href: '/', label: 'Home' }, { label: 'Posts' }]} />
    <h1>Posts</h1>
  </header>

  {#if data.posts.length === 0}
    <p class="empty">No posts yet.</p>
  {:else}
    <ul>
      {#each data.posts as post}
        <li>
          <a href="/posts/{post.slug}">
            <span class="title">{post.title}</span>
            <time datetime={post.date}>{formatDateShort(post.date)}</time>
          </a>
          {#if post.description}
            <p class="desc">{post.description}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .posts-page {
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
    margin: var(--space-md) 0 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    border-bottom: 1px solid var(--line-color);
    padding: var(--space-lg) 0;
  }

  li:last-child {
    border-bottom: none;
  }

  li a {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    text-decoration: none;
    gap: var(--space-lg);
  }

  .title {
    color: var(--text-color);
    font-size: var(--font-md);
    font-weight: 500;
  }

  li a:hover .title {
    color: var(--primary-color);
  }

  time {
    color: var(--secondary-color);
    font-size: var(--font-sm);
    white-space: nowrap;
  }

  .desc {
    color: var(--secondary-color);
    font-size: var(--font-sm);
    margin: var(--space-xs) 0 0;
    line-height: 1.4;
  }

  .empty {
    color: var(--secondary-color);
    font-style: italic;
  }
</style>
