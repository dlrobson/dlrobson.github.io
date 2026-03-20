<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { getSharedLang, setSharedLang } from '$lib/codeLang.svelte.ts'

  interface Props {
    langs?: string // comma-separated, e.g. "python,rust,cpp" — enables SSR tab bar
    children?: import('svelte').Snippet
  }

  const LANGUAGE_LABELS: Record<string, string> = {
    python: 'Python',
    rust: 'Rust',
    cpp: 'C++',
  }

  function labelFromLanguage(lang: string): string {
    return LANGUAGE_LABELS[lang] ?? lang.charAt(0).toUpperCase() + lang.slice(1)
  }

  let { langs, children }: Props = $props()

  // Parse tabs from prop for SSR — the tab bar renders immediately with no JS needed.
  // onMount overrides with DOM-detected tabs once JS runs.
  // untrack is intentional: langs is a static prop we want to snapshot at init.
  const parsedLangs = untrack(
    () =>
      langs
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
  )

  let container: HTMLElement
  let tabs = $state<string[]>(parsedLangs)
  let activeTab = $state(parsedLangs[0] ?? '')
  let mounted = false

  function getPreElements(): HTMLPreElement[] {
    return Array.from(
      container.querySelectorAll<HTMLPreElement>(':scope > pre'),
    )
  }

  function detectLanguage(pre: HTMLPreElement): string {
    const code = pre.querySelector('code')
    const langClass = Array.from(code?.classList ?? []).find((c) =>
      c.startsWith('language-'),
    )
    return langClass ? langClass.slice('language-'.length) : 'text'
  }

  function applyVisibility(activeLang: string): void {
    getPreElements().forEach((pre, i) => {
      pre.classList.toggle('hidden-tab', tabs[i] !== activeLang)
    })
  }

  function selectTab(lang: string): void {
    activeTab = lang
    applyVisibility(lang)
    setSharedLang(lang)
  }

  onMount(() => {
    const pres = getPreElements()
    tabs = pres.map(detectLanguage)
    const shared = getSharedLang()
    activeTab = shared && tabs.includes(shared) ? shared : (tabs[0] ?? '')
    applyVisibility(activeTab)
    container.dataset.tabbed = 'true'
    mounted = true
  })

  $effect(() => {
    const shared = getSharedLang()
    if (!mounted) return
    if (shared && tabs.includes(shared) && shared !== activeTab) {
      activeTab = shared
      applyVisibility(shared)
    }
  })
</script>

<div class="code-tabs" bind:this={container}>
  {#if tabs.length > 0}
    <div class="code-tabs-bar">
      {#each tabs as lang}
        <button
          class:active={lang === activeTab}
          onclick={() => selectTab(lang)}
        >
          {labelFromLanguage(lang)}
        </button>
      {/each}
    </div>
  {/if}
  {@render children?.()}
</div>
