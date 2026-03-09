<script lang="ts">
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
</script>

<svelte:head>
  <title>{page.status} — Page Not Found</title>
</svelte:head>

<div class="error-page">
  <p class="status">{page.status}</p>
  <h1>Page Not Found</h1>
  <p class="message">
    The page you're looking for doesn't exist or has been moved.
  </p>
  <a href={resolve('/')}>Return Home</a>
</div>

<style>
  .error-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
    color: var(--text-color);
  }

  .status {
    font-size: 5em;
    font-weight: bold;
    color: var(--primary-color);
    margin: 0;
    letter-spacing: 4px;
  }

  h1 {
    font-size: 1.5em;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0;
    color: var(--text-color);
  }

  .message {
    font-size: var(--font-base);
    color: var(--secondary-color);
    margin: 0;
  }

  a {
    color: var(--text-color);
    text-decoration: none;
    font-size: var(--font-md);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--line-color);
    padding-bottom: 2px;
    transition: border-color 0.2s;
  }

  a:hover {
    border-color: var(--primary-color);
  }
</style>
