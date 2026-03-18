import puppeteer from 'puppeteer'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildDir = resolve(__dirname, '..', 'build')
const inputPath = `file://${buildDir}/resume/static.html`

const args = process.argv.slice(2)
const outputFlagIndex = args.findIndex((arg) => arg === '--output' || arg === '-o')
const outputFromFlag = outputFlagIndex >= 0 ? args[outputFlagIndex + 1] : undefined
const outputPositional = args.find((arg) => !arg.startsWith('-'))
const outputPath = outputFromFlag ?? outputPositional ?? '/tmp/resume.pdf'

const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined,
  args: ['--no-sandbox', '--disable-gpu'],
})

const page = await browser.newPage()
await page.goto(inputPath, { waitUntil: 'networkidle0' })
await page.pdf({
  path: outputPath,
  format: 'Letter',
  printBackground: true,
  displayHeaderFooter: false,
})

await browser.close()
console.log(`PDF written to ${outputPath}`)
