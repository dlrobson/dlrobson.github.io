import { readFile, writeFile } from 'fs/promises'

/**
 * @param {string} cachePath
 * @returns {Promise<Record<string, string>>}
 */
export async function loadCache(cachePath) {
  try {
    return JSON.parse(await readFile(cachePath, 'utf-8'))
  } catch {
    return {}
  }
}

/**
 * @param {string} cachePath
 * @param {Record<string, string>} cache
 * @returns {Promise<void>}
 */
export async function saveCache(cachePath, cache) {
  await writeFile(cachePath, JSON.stringify(cache, null, 2) + '\n', 'utf-8')
}
