/**
 * File validation helper for text evidence uploads.
 * Restricts to plain text, max 100 KB, UTF-8, no NUL bytes.
 */

const MAX_FILE_BYTES = 100 * 1024 // 100 KB

export interface ValidationResult {
  valid: boolean
  content?: string
  error?: string
}

export async function validateTxtFile(file: File): Promise<ValidationResult> {
  // Check extension
  if (!file.name.toLowerCase().endsWith('.txt')) {
    return {
      valid: false,
      error: 'Only plain text (.txt) files are supported. Images and screenshots cannot be analyzed.',
    }
  }

  // Check MIME type if present
  if (file.type && file.type !== 'text/plain') {
    return {
      valid: false,
      error: 'Invalid file type. Please provide a standard .txt file.',
    }
  }

  // Check file size
  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: 'File size exceeds 100 KB limit. Please paste shorter excerpt text or trim the file.',
    }
  }

  // Read content as ArrayBuffer to check for NUL bytes and valid UTF-8
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Check for NUL bytes (binary detection)
    for (let i = 0; i < uint8Array.length; i++) {
      if (uint8Array[i] === 0) {
        return {
          valid: false,
          error: 'Binary or non-text content detected. Please provide a plain text (.txt) file.',
        }
      }
    }

    // Decode as UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const text = decoder.decode(uint8Array)

    if (!text.trim()) {
      return {
        valid: false,
        error: 'The uploaded file is empty.',
      }
    }

    return {
      valid: true,
      content: text,
    }
  } catch {
    return {
      valid: false,
      error: 'Could not decode file as UTF-8 plain text. Please check the file encoding.',
    }
  }
}
