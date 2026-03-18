<script lang="ts">
  import '$lib/tokens.css'
  import '../index.css'
  import '$lib/prose.css'
  import 'prism-themes/themes/prism-one-light.css'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<main>{@render children()}</main>
