import { createHighlighter } from 'shiki'
import type { Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['one-light', 'one-dark-pro'],
      langs: [],
    })
  }
  return highlighterPromise
}

export async function highlight(
  code: string,
  lang: string | undefined,
): Promise<string> {
  const highlighter = await getHighlighter()
  const normalizedLang = lang ?? 'text'

  if (
    normalizedLang !== 'text' &&
    !highlighter.getLoadedLanguages().includes(normalizedLang)
  ) {
    try {
      await highlighter.loadLanguage(
        normalizedLang as Parameters<Highlighter['loadLanguage']>[0],
      )
    } catch {
      return `<pre><code>${code}</code></pre>`
    }
  }

  return highlighter
    .codeToHtml(code, {
      lang: normalizedLang,
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro',
      },
      defaultColor: false,
    })
    .replace(/ tabindex="0"/, '')
    .replace('<pre ', `<pre data-language="${normalizedLang}" `)
    .replace(/[{}]/g, (c) => (c === '{' ? '&#123;' : '&#125;'))
}
