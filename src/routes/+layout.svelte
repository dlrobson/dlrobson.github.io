<script lang="ts">
  import '$lib/tokens.css'
  import '../index.css'
  import type { Snippet } from 'svelte'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'

  let { children }: { children: Snippet } = $props()
</script>

<ThemeToggle />
<main>{@render children()}</main>
