<script lang="ts">
  import { resolve } from '$app/paths'
  import { formatDateShort } from '$lib/format-date'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'
  import type { PostMeta } from '$lib/post.types'

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
    <ul class="posts-list">
      {#each data.posts as post (post.slug)}
        <li class="post-item">
          <a href={resolve(`/posts/${post.slug}`)} class="post-link">
            <div class="post-header">
              <span class="title">{post.title}</span>
              <time datetime={post.date}>{formatDateShort(post.date)}</time>
            </div>
            {#if post.description}
              <p class="desc">{post.description}</p>
            {/if}
          </a>
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

  .posts-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .post-item {
    border-bottom: 1px solid var(--line-color);
  }

  .post-item:last-child {
    border-bottom: none;
  }

  .post-link {
    display: block;
    padding: var(--space-lg) 0;
    text-decoration: none;
    transition: transform 0.1s ease;
  }

  .post-link:hover .title {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-lg);
    margin-bottom: var(--space-xs);
  }

  .title {
    color: var(--text-color);
    font-size: var(--font-md);
    font-weight: 500;
  }

  time {
    color: var(--secondary-color);
    font-size: var(--font-sm);
    white-space: nowrap;
  }

  .desc {
    color: var(--secondary-color);
    font-size: var(--font-sm);
    margin: 0;
    line-height: 1.5;
  }

  .empty {
    color: var(--secondary-color);
    font-style: italic;
  }
</style>
