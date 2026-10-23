import { describe, expect, it } from 'vitest'
import { validateImageFile } from '../lib/ocr'

describe('Local OCR File Validation', () => {
  it('accepts valid PNG magic bytes', async () => {
    // 89 50 4E 47
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00])
    const file = new File([pngBytes], 'screenshot.png', { type: 'image/png' })
    await expect(validateImageFile(file)).resolves.toBeUndefined()
  })

  it('accepts valid JPEG magic bytes', async () => {
    // FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    const file = new File([jpegBytes], 'screenshot.jpg', { type: 'image/jpeg' })
    await expect(validateImageFile(file)).resolves.toBeUndefined()
  })

  it('rejects files without valid PNG/JPEG magic bytes', async () => {
    const fakeBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38]) // GIF
    const file = new File([fakeBytes], 'fake.png', { type: 'image/png' })
    await expect(validateImageFile(file)).rejects.toThrow(/not a valid PNG or JPEG image/)
  })

  it('rejects files exceeding 5 MB limit', async () => {
    const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)])
    const file = new File([bigBlob], 'huge.png', { type: 'image/png' })
    await expect(validateImageFile(file)).rejects.toThrow(/exceeds the 5 MB limit/)
  })
})
