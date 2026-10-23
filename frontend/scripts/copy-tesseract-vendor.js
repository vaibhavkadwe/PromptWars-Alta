/**
 * Copies Tesseract worker, WASM core, and English language data into public/vendor/tesseract/
 * to ensure 100% self-hosted, offline, and same-origin OCR execution without any CDN.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')

const targetDir = path.join(frontendRoot, 'public', 'vendor', 'tesseract')
const coreTargetDir = path.join(targetDir, 'core')
const langTargetDir = path.join(targetDir, 'lang')

fs.mkdirSync(coreTargetDir, { recursive: true })
fs.mkdirSync(langTargetDir, { recursive: true })

// 1. Worker
const workerSource = path.join(frontendRoot, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js')
if (fs.existsSync(workerSource)) {
  fs.copyFileSync(workerSource, path.join(targetDir, 'worker.min.js'))
}

// 2. Core (WASM + JS files)
const coreSourceDir = path.join(frontendRoot, 'node_modules', 'tesseract.js-core')
if (fs.existsSync(coreSourceDir)) {
  const files = fs.readdirSync(coreSourceDir)
  for (const f of files) {
    if (f.endsWith('.js') || f.endsWith('.wasm')) {
      fs.copyFileSync(path.join(coreSourceDir, f), path.join(coreTargetDir, f))
    }
  }
}

// 3. Language Data (English traineddata.gz)
const langSource = path.join(frontendRoot, 'node_modules', '@tesseract.js-data', 'eng', '4.0.0', 'eng.traineddata.gz')
if (fs.existsSync(langSource)) {
  fs.copyFileSync(langSource, path.join(langTargetDir, 'eng.traineddata.gz'))
}

console.log('Successfully copied self-hosted Tesseract vendor files to public/vendor/tesseract/')
