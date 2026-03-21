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
 * @returns {string}
 */
function wrapCppWithMain(code) {
  const names = [...code.matchAll(/void\s+(test_\w+)\s*\(\)/g)].map((m) => m[1])
  if (names.length === 0) return code
  const calls = names.map((name) => `    ${name}();`).join('\n')
  return `${code}\nint main() {\n${calls}\n    return 0;\n}\n`
}

/**
 * @param {string} code
 * @returns {Promise<string | null>}
 */
async function resolveRustUrl(code) {
  try {
    const response = await fetch('https://play.rust-lang.org/meta/gist/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return `https://play.rust-lang.org/?gist=${data.id}&version=stable&mode=debug&edition=2021`
  } catch (err) {
    console.warn('[remark-playground-links] Rust Playground API failed:', err.message)
    return null
  }
}

/**
 * @param {string} code
 * @returns {Promise<string | null>}
 */
async function resolveGodboltUrl(code) {
  try {
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.url
  } catch (err) {
    console.warn('[remark-playground-links] Godbolt API failed:', err.message)
    return null
  }
}

/**
 * @param {string} code
 * @returns {Promise<string | null>}
 */
async function resolveWandboxUrl(code) {
  try {
    const response = await fetch('https://wandbox.org/api/permlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'cpython-3.12.7',
        code,
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.permlink
      ? `https://wandbox.org/permlink/${data.permlink}`
      : null
  } catch (err) {
    console.warn('[remark-playground-links] Wandbox API failed:', err.message)
    return null
  }
}

/**
 * Inject pre-computed URL props into a `<CodeTabs ...>` opening tag string.
 *
 * @param {string} htmlValue  - Raw HTML string of the opening tag node
 * @param {{ rustUrl?: string, cppUrl?: string, pythonUrl?: string }} urls
 * @returns {string}
 */
function rewriteCodeTabsTag(htmlValue, urls) {
  const props = []
  if (urls.rustUrl) props.push(`rustUrl="${escapeAttr(urls.rustUrl)}"`)
  if (urls.cppUrl) props.push(`cppUrl="${escapeAttr(urls.cppUrl)}"`)
  if (urls.pythonUrl) props.push(`pythonUrl="${escapeAttr(urls.pythonUrl)}"`)
  if (props.length === 0) return htmlValue
  // Insert props before the closing `>` of the opening tag
  return htmlValue.replace(/>(\s*)$/, ` ${props.join(' ')}>$1`)
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** @type {import('unified').Plugin} */
export default function remarkPlaygroundLinks() {
  return async (tree) => {
    // Collect all <CodeTabs playground> blocks to process
    const blocks = []

    const children = tree.children
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      if (node.type !== 'html') continue
      if (!node.value.includes('<CodeTabs') || !node.value.includes('playground'))
        continue

      // Collect sibling code nodes until </CodeTabs>
      const codeNodes = []
      let j = i + 1
      while (j < children.length) {
        const sibling = children[j]
        if (sibling.type === 'html' && sibling.value.trim().startsWith('</CodeTabs')) break
        if (sibling.type === 'code' && sibling.lang) codeNodes.push(sibling)
        j++
      }

      if (codeNodes.length > 0) {
        blocks.push({ nodeIndex: i, node, codeNodes })
      }
    }

    if (blocks.length === 0) return

    const cache = await loadCache(CACHE_PATH)
    let cacheUpdated = false

    for (const { nodeIndex, node, codeNodes } of blocks) {
      /** @type {{ rustUrl?: string, cppUrl?: string, pythonUrl?: string }} */
      const urls = {}

      for (const codeNode of codeNodes) {
        const lang = codeNode.lang
        const code = codeNode.value
        const key = `${lang}:${hashCode(code)}`

        if (cache[key]) {
          if (lang === 'rust') urls.rustUrl = cache[key]
          else if (lang === 'cpp') urls.cppUrl = cache[key]
          else if (lang === 'python') urls.pythonUrl = cache[key]
          continue
        }

        let url = null
        if (lang === 'rust') url = await resolveRustUrl(code)
        else if (lang === 'cpp') url = await resolveGodboltUrl(code)
        else if (lang === 'python') url = await resolveWandboxUrl(code)

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

    if (cacheUpdated) {
      await saveCache(CACHE_PATH, cache)
    }
  }
}
