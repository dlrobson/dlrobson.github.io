/* global process */
import { visit } from 'unist-util-visit'
import { execFileSync } from 'child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'

const mmdc = fileURLToPath(
  new URL('../node_modules/.bin/mmdc', import.meta.url),
)

const chromiumPath =
  process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || '/usr/bin/chromium'

/**
 * Executes the Mermaid CLI to render a diagram
 *
 * @param {string} inputPath - Path to the Mermaid source file (.mmd)
 * @param {string} outputPath - Path where the rendered SVG should be saved
 * @param {string} puppeteerConfigPath - Path to the Puppeteer configuration file
 * @param {string} svgId - Unique ID to assign to the root <svg> element for CSS targeting
 * @param {string} theme - Mermaid theme to use ('default' for light, 'dark' for dark)
 * @throws Will throw an error if the Mermaid CLI execution fails, which may indicate issues
 * with the source diagram or Chromium setup.
 */
function createMermaidDiagram(
  inputPath,
  outputPath,
  puppeteerConfigPath,
  svgId,
  theme,
) {
  const { DBUS_SESSION_BUS_ADDRESS: _, ...envWithoutDbus } = process.env
  execFileSync(
    mmdc,
    [
      '--input',
      inputPath,
      '--output',
      outputPath,
      '--puppeteerConfigFile',
      puppeteerConfigPath,
      '--theme',
      theme,
      '--svgId',
      svgId,
      '--backgroundColor',
      'transparent',
    ],
    { env: envWithoutDbus },
  )
}

/**
 * Handles the generation of SVGs for a specific node.
 *
 * @param {{ value: string }} node - The Markdown AST node containing the Mermaid diagram source in its `value` property.
 * @param {string} workspaceDir - Directory used to store temporary Mermaid source and generated SVG files.
 * @param {string} puppeteerConfigPath - Path to the Puppeteer configuration file used by the Mermaid CLI.
 * @param {number} index - Index of the node, used to generate unique file names and SVG IDs.
 * @returns {{ lightSvg: string, darkSvg: string }} An object containing the rendered light and dark SVG markup.
 * @throws Will throw an error if writing the Mermaid source file fails (e.g., due to permissions issues)
 * or if rendering the diagram fails (e.g., due to invalid Mermaid syntax or Chromium issues). The error
 * messages include context about the failure to aid in troubleshooting.
 */
function generateNodeSvgs(node, workspaceDir, puppeteerConfigPath, index) {
  const inputPath = join(workspaceDir, `diagram-${index}.mmd`)
  const lightPath = join(workspaceDir, `diagram-${index}.svg`)
  const darkPath = join(workspaceDir, `diagram-${index}-dark.svg`)

  try {
    writeFileSync(inputPath, node.value)
  } catch (err) {
    throw new Error(
      `Failed to write Mermaid diagram source for node at index ${index}\n` +
        `Ensure the workspace directory is writable: ${workspaceDir}`,
      { cause: err },
    )
  }

  try {
    createMermaidDiagram(
      inputPath,
      lightPath,
      puppeteerConfigPath,
      `light-${index}`,
      'default',
    )

    createMermaidDiagram(
      inputPath,
      darkPath,
      puppeteerConfigPath,
      `dark-${index}`,
      'dark',
    )

    return {
      lightSvg: readFileSync(lightPath, 'utf-8'),
      darkSvg: readFileSync(darkPath, 'utf-8'),
    }
  } catch (cause) {
    const preview = node.value.split('\n')[0].trim()
    throw new Error(
      `Failed to render Mermaid diagram starting with: "${preview}"\n` +
        `Ensure Chromium is at ${chromiumPath}`,
      { cause },
    )
  }
}

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

    if (nodes.length === 0) return

    let workspaceDir
    try {
      workspaceDir = mkdtempSync(join(tmpdir(), 'mermaid-'))
    } catch (err) {
      console.error(
        'Failed to create temporary workspace for Mermaid rendering:',
        err,
      )
      throw err
    }

    try {
      const puppeteerConfigPath = join(workspaceDir, 'puppeteer.json')

      writeFileSync(
        puppeteerConfigPath,
        JSON.stringify({
          executablePath: chromiumPath,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }),
      )

      for (const { node, index, parent } of nodes) {
        const { lightSvg, darkSvg } = generateNodeSvgs(
          node,
          workspaceDir,
          puppeteerConfigPath,
          index,
        )

        parent.children[index] = {
          type: 'html',
          value:
            `<div class="mermaid-diagram">` +
            `<div class="mermaid-light">${lightSvg}</div>` +
            `<div class="mermaid-dark">${darkSvg}</div>` +
            `</div>`,
        }
      }
    } catch (err) {
      console.error(
        'Mermaid plugin failure while rendering diagrams. ' +
          'Please verify that the Mermaid CLI (`mmdc`) is installed, ' +
          `Chromium is available at "${chromiumPath}", and that your Mermaid ` +
          'code blocks are valid.',
        err,
      )
      throw err
    } finally {
      rmSync(workspaceDir, { recursive: true, force: true })
    }
  }
}
