/**
 * Safe, local-only client-side OCR service using self-hosted Tesseract.js.
 * Strictly verifies magic bytes, enforces dimension and file size caps,
 * terminates worker after recognition, and leaves zero image artifacts.
 */

export interface OcrProgress {
  status: string
  progress: number
}

export interface ValidatedFile {
  file: File
  name: string
  size: number
}

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_DIMENSION = 4096

export async function validateImageFile(file: File): Promise<void> {
  // 1. File size cap
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" exceeds the 5 MB limit.`)
  }

  // 2. Read first 4 bytes to verify magic bytes
  const buffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const isPng =
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47

  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff

  if (!isPng && !isJpeg) {
    throw new Error(`"${file.name}" is not a valid PNG or JPEG image.`)
  }

  // 3. Decode safely via createImageBitmap to check dimensions (if supported in environment)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      const { width, height } = bitmap
      bitmap.close()
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        throw new Error(
          `"${file.name}" dimensions (${width}x${height}) exceed the ${MAX_DIMENSION}x${MAX_DIMENSION} limit.`,
        )
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('limit')) {
        throw err
      }
      throw new Error(`"${file.name}" could not be decoded or is malformed.`, { cause: err })
    }
  }
}

export async function recognizeImages(
  files: File[],
  onProgress?: (progress: OcrProgress) => void,
): Promise<string> {
  if (!files || files.length === 0) {
    return ''
  }

  if (files.length > 3) {
    throw new Error('You can select at most 3 screenshot files.')
  }

  // Validate each file first
  for (const f of files) {
    await validateImageFile(f)
  }

  // Lazy-load tesseract.js dynamically
  const { createWorker } = await import('tesseract.js')

  // Initialize self-hosted worker with same-origin URLs
  const worker = await createWorker('eng', 1, {
    workerPath: '/vendor/tesseract/worker.min.js',
    corePath: '/vendor/tesseract/core',
    langPath: '/vendor/tesseract/lang',
    cacheMethod: 'none',
    gzip: true,
    logger: (m) => {
      if (onProgress && m && typeof m.progress === 'number') {
        onProgress({ status: m.status, progress: m.progress })
      }
    },
  })

  const results: string[] = []

  try {
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (onProgress) {
        onProgress({ status: `Recognizing image ${i + 1} of ${files.length}`, progress: i / files.length })
      }
      const res = await worker.recognize(f)
      if (res && res.data && res.data.text) {
        results.push(res.data.text.trim())
      }
    }
  } finally {
    // Strictly terminate worker and release memory
    await worker.terminate()
  }

  return results.join('\n\n--- Next Screenshot ---\n\n')
}
