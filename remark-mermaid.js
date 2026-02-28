/* global process */
import { visit } from 'unist-util-visit'
import { execFileSync } from 'child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'

const mmdc = fileURLToPath(new URL('./node_modules/.bin/mmdc', import.meta.url))

const chromiumPath =
  process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || '/usr/bin/chromium'

/** @type {import('unified').Plugin} */
export default function remarkMermaid() {
  return async (tree) => {
    const nodes = []

    visit(tree, 'code', (node, index, parent) => {
      if (
        node.lang === 'mermaid' &&
        index !== undefined &&
        parent !== undefined
      ) {
        nodes.push({ node, index, parent })
      }
    })

    for (const { node, index, parent } of nodes) {
      const dir = mkdtempSync(join(tmpdir(), 'mermaid-'))
      const inputPath = join(dir, 'diagram.mmd')
      const outputPath = join(dir, 'diagram.svg')
      const puppeteerConfigPath = join(dir, 'puppeteer.json')

      try {
        writeFileSync(inputPath, node.value)
        writeFileSync(
          puppeteerConfigPath,
          JSON.stringify({
            executablePath: chromiumPath,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          }),
        )

        try {
          execFileSync(mmdc, [
            '-i',
            inputPath,
            '-o',
            outputPath,
            '-p',
            puppeteerConfigPath,
          ])
        } catch (cause) {
          const preview = node.value.split('\n')[0].trim()
          throw new Error(
            `Failed to render Mermaid diagram starting with: "${preview}"\n` +
              `Check that Chromium is available at ${chromiumPath} and the diagram syntax is valid.`,
            { cause },
          )
        }

        const svg = readFileSync(outputPath, 'utf-8')
        parent.children.splice(index, 1, {
          type: 'html',
          value: `<div class="mermaid-diagram">${svg}</div>`,
        })
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }
  }
}
