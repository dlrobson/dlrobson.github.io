<script lang="ts">
  import { RESUME_DATA } from '$lib/resume.data'

  const { header } = RESUME_DATA
</script>

<svelte:head>
  <title>{header.name}</title>
  <meta name="description" content="Personal website of {header.name}" />
</svelte:head>

<div class="home">
  <h1>{header.name}</h1>
  <nav>
    <a href="/posts">Posts</a>
    <a href="/resume">Resume</a>
  </nav>
</div>

<style>
  .home {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
    color: var(--text-color);
  }

  h1 {
    font-size: 2.5em;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0;
    color: var(--primary-color);
  }

  nav {
    display: flex;
    gap: var(--space-lg);
  }

  nav a {
    color: var(--text-color);
    text-decoration: none;
    font-size: var(--font-md);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--line-color);
    padding-bottom: 2px;
    transition: border-color 0.2s;
  }

  nav a:hover {
    border-color: var(--primary-color);
  }
</style>
