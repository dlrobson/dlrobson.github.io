<script lang="ts">
  import { PROFILE } from '$lib/profile'
</script>

<svelte:head>
  <title>{PROFILE.name}</title>
  <meta name="description" content="Personal website of {PROFILE.name}" />
</svelte:head>

<div class="home">
  <h1>{PROFILE.name}</h1>
  <nav>
    <a href="/posts">Posts</a>
    <a href="/resume">Resume</a>
  </nav>
  <div class="socials">
    <a href="mailto:{PROFILE.email}">Email</a>
    <a href={PROFILE.github} target="_blank" rel="noopener noreferrer">GitHub</a
    >
    <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer"
      >LinkedIn</a
    >
  </div>
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

  .socials {
    display: flex;
    gap: var(--space-lg);
  }

  .socials a {
    color: var(--text-color);
    text-decoration: none;
    font-size: var(--font-sm);
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .socials a:hover {
    opacity: 1;
  }
</style>
