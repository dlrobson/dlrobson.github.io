<script lang="ts">
  import { browser } from '$app/environment'
  import { type Theme, CYCLE, EXPLICIT_THEMES } from '$lib/theme'

  const ICON: Record<Theme, string> = {
    light: '🌞',
    system: '⊙',
    dark: '🌕',
  }

  const LABEL: Record<Theme, string> = {
    light: 'Light',
    system: 'System default',
    dark: 'Dark',
  }

  function initialTheme(): Theme {
    if (!browser) return 'system'
    const saved = localStorage.getItem('theme') as Theme | null
    return (EXPLICIT_THEMES as readonly string[]).includes(saved ?? '') ? (saved as Theme) : 'system'
  }

  let current = $state<Theme>(initialTheme())

  function cycle() {
    if (!browser) return
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]
    current = next
    if (next === 'system') {
      localStorage.removeItem('theme')
      delete document.documentElement.dataset.theme
    } else {
      localStorage.setItem('theme', next)
      document.documentElement.dataset.theme = next
    }
  }
</script>

<button
  class="theme-toggle"
  onclick={cycle}
  aria-label="Theme: {LABEL[current]}"
  title="Theme: {LABEL[current]}"
>
  {ICON[current]}
</button>

<style>
  .theme-toggle {
    position: fixed;
    top: var(--space-sm);
    right: var(--space-sm);
    z-index: 100;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line-color);
    border-radius: 50%;
    background: var(--bg-surface);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    transition:
      background 0.15s,
      border-color 0.15s;
  }

  .theme-toggle:hover {
    border-color: var(--primary-color);
  }

  @media print {
    .theme-toggle {
      display: none;
    }
  }
</style>
