<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { getSharedLang, setSharedLang } from '$lib/codeLang.svelte.ts'

  interface Props {
    langs?: string // comma-separated, e.g. "python,rust,cpp" — enables SSR tab bar
    playground?: boolean
    rustUrl?: string
    cppUrl?: string
    pythonUrl?: string
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

  let { langs, playground, rustUrl, cppUrl, pythonUrl, children }: Props =
    $props()

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
  let running = $state(false)
  let playgroundError = $state(false)

  const activeUrl = $derived(
    (
      { rust: rustUrl, cpp: cppUrl, python: pythonUrl } as Record<
        string,
        string | undefined
      >
    )[activeTab],
  )

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

  function getActiveCode(): string {
    const index = tabs.indexOf(activeTab)
    const pre = getPreElements()[index]
    return pre?.querySelector('code')?.textContent ?? ''
  }

  async function fetchRustUrl(code: string): Promise<string> {
    const response = await fetch('https://play.rust-lang.org/meta/gist/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!response.ok)
      throw new Error(`Rust Playground gist failed: ${response.status}`)
    const data = await response.json()
    return `https://play.rust-lang.org/?gist=${data.id}&version=stable&mode=debug&edition=2021`
  }

  function wrapCppWithMain(code: string): string {
    const names = [...code.matchAll(/void\s+(test_\w+)\s*\(\)/g)].map(
      (m) => m[1],
    )
    if (names.length === 0) return code
    const calls = names.map((name) => `    ${name}();`).join('\n')
    return `${code}\nint main() {\n${calls}\n    return 0;\n}\n`
  }

  async function fetchGodboltUrl(code: string): Promise<string> {
    const response = await fetch('https://godbolt.org/api/shortener', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: 1,
            language: 'c++',
            source: wrapCppWithMain(code),
            compilers: [{ id: 'g132', options: '-std=c++17' }],
          },
        ],
      }),
    })
    if (!response.ok)
      throw new Error(`godbolt shortener failed: ${response.status}`)
    const data = await response.json()
    return data.url as string
  }

  async function runInPlayground(): Promise<void> {
    if (running) return
    running = true
    playgroundError = false
    const code = getActiveCode()
    try {
      if (activeTab === 'rust') {
        const url = await fetchRustUrl(code)
        window.open(url, '_blank')
      } else if (activeTab === 'cpp') {
        const url = await fetchGodboltUrl(code)
        window.open(url, '_blank')
      } else {
        window.open('https://www.online-python.com/', '_blank')
      }
    } catch {
      playgroundError = true
    } finally {
      running = false
    }
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
      {#each tabs as lang (lang)}
        <button
          class:active={lang === activeTab}
          onclick={() => selectTab(lang)}
        >
          {labelFromLanguage(lang)}
        </button>
      {/each}
      {#if playground}
        {#if activeUrl}
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer external"
            class="run-btn"
            title="Open in playground">↗ Run</a
          >
        {:else}
          <button
            class="run-btn"
            class:run-btn-loading={running}
            class:run-btn-error={playgroundError}
            disabled={running}
            title={activeTab === 'python'
              ? 'Python playground coming soon'
              : 'Open in playground'}
            onclick={runInPlayground}
          >
            {#if running}
              …
            {:else if playgroundError}
              ⚠ Try again
            {:else}
              ↗ Run
            {/if}
          </button>
        {/if}
      {/if}
    </div>
  {/if}
  {@render children?.()}
</div>
