<script lang="ts">
  import '$lib/App.css'
  import '../index.css'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<main>{@render children()}</main>
