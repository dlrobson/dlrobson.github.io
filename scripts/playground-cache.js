import { readFile, writeFile } from 'fs/promises'

/**
 * @param {string} path
 * @returns {Promise<Record<string, string>>}
 */
export async function loadCache(path) {
  try {
    const text = await readFile(path, 'utf-8')
    return JSON.parse(text)
  } catch {
    return {}
  }
}

/**
 * @param {string} path
 * @param {Record<string, string>} cache
 */
export async function saveCache(path, cache) {
  await writeFile(path, JSON.stringify(cache, null, 2) + '\n', 'utf-8')
}
