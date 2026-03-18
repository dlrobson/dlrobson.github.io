<script lang="ts">
  import type { Component } from 'svelte'

  let {
    data,
  }: {
    data: {
      content: Component
      meta: { title: string; date: string; description?: string }
    }
  } = $props()
</script>

<data.content />
