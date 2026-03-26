/**
 * Remark plugin: inject playground URLs into <CodeTabs playground> blocks at build time.
 *
 * URLs are resolved via external APIs on cache miss and stored in playground-urls.json,
 * keyed by SHA-256 hash of the code so rebuilds don't re-fetch unchanged snippets.
 *
 * Rust:   play.rust-lang.org gist API  → https://play.rust-lang.org/?gist=<id>
 * C++:    godbolt.org shortener API    → https://godbolt.org/z/<id>  (Clang 22, -std=c++23)
 * Python: godbolt.org shortener API   → https://godbolt.org/z/<id>  (CPython 3.14)
 */

import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import path from 'path'
import { loadCache, saveCache } from './playground-cache.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = path.join(__dirname, 'playground-urls.json')

/**
 * @param {string} code
 * @returns {string}
 */
function hashCode(code) {
  return createHash('sha256').update(code).digest('hex').slice(0, 16)
}

/**
 * @param {string} code
 * @returns {Promise<string | null>}
 */
async function resolveRustUrl(code) {
  try {
    const res = await fetch('https://play.rust-lang.org/meta/gist/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { id } = await res.json()
    return `https://play.rust-lang.org/?gist=${id}&version=stable&mode=debug&edition=2021`
  } catch (err) {
    console.warn(
      '[remark-playground-links] Rust Playground API failed:',
      err.message,
    )
    return null
  }
}

/** @type {Record<string, { language: string, compilers: { id: string, options: string }[] }>} */
const GODBOLT_CONFIG = {
  cpp: {
    language: 'c++',
    compilers: [{ id: 'clang2210', options: '-std=c++23' }],
  },
  python: { language: 'python', compilers: [{ id: 'python314', options: '' }] },
}

/**
 * @param {'cpp' | 'python'} lang
 * @param {string} code
 * @returns {Promise<string | null>}
 */
async function resolveGodboltUrl(lang, code) {
  const { language, compilers } = GODBOLT_CONFIG[lang]
  try {
    const res = await fetch('https://godbolt.org/api/shortener', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [{ id: 1, language, source: code, compilers }],
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { url } = await res.json()
    return url
  } catch (err) {
    console.warn(
      `[remark-playground-links] Godbolt API failed (${lang}):`,
      err.message,
    )
    return null
  }
}

/**
 * Inject pre-computed URL props into a `<CodeTabs ...>` opening tag string.
 *
 * @param {string} htmlValue
 * @param {{ rustUrl?: string, cppUrl?: string, pythonUrl?: string }} urls
 * @returns {string}
 */
function rewriteCodeTabsTag(htmlValue, urls) {
  const props = []
  if (urls.rustUrl) props.push(`rustUrl="${escapeAttr(urls.rustUrl)}"`)
  if (urls.cppUrl) props.push(`cppUrl="${escapeAttr(urls.cppUrl)}"`)
  if (urls.pythonUrl) props.push(`pythonUrl="${escapeAttr(urls.pythonUrl)}"`)
  if (props.length === 0) return htmlValue
  return htmlValue.replace(/>(\s*)$/, ` ${props.join(' ')}>$1`)
}

/** @param {string} value */
function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** @type {import('unified').Plugin} */
export default function remarkPlaygroundLinks() {
  return async (tree) => {
    const blocks = []
    const children = tree.children

    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      if (node.type !== 'html') continue
      if (
        !node.value.includes('<CodeTabs') ||
        !node.value.includes('playground')
      )
        continue

      const codeNodes = []
      let j = i + 1
      while (j < children.length) {
        const sibling = children[j]
        if (
          sibling.type === 'html' &&
          sibling.value.trim().startsWith('</CodeTabs')
        )
          break
        if (sibling.type === 'code' && sibling.lang) codeNodes.push(sibling)
        j++
      }

      if (codeNodes.length > 0) blocks.push({ nodeIndex: i, node, codeNodes })
    }

    if (blocks.length === 0) return

    const cache = await loadCache(CACHE_PATH)
    let cacheUpdated = false

    for (const { nodeIndex, node, codeNodes } of blocks) {
      /** @type {{ rustUrl?: string, cppUrl?: string, pythonUrl?: string }} */
      const urls = {}

      for (const { lang, value: code } of codeNodes) {
        const key = `${lang}:${hashCode(code)}`
        if (cache[key]) {
          if (lang === 'rust') urls.rustUrl = cache[key]
          else if (lang === 'cpp') urls.cppUrl = cache[key]
          else if (lang === 'python') urls.pythonUrl = cache[key]
          continue
        }

        let url = null
        if (lang === 'rust') url = await resolveRustUrl(code)
        else if (lang === 'cpp' || lang === 'python')
          url = await resolveGodboltUrl(lang, code)

        if (url) {
          cache[key] = url
          cacheUpdated = true
          if (lang === 'rust') urls.rustUrl = url
          else if (lang === 'cpp') urls.cppUrl = url
          else if (lang === 'python') urls.pythonUrl = url
        }
      }

      tree.children[nodeIndex] = {
        ...node,
        value: rewriteCodeTabsTag(node.value, urls),
      }
    }

    if (cacheUpdated) await saveCache(CACHE_PATH, cache)
  }
}
