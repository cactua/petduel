import { describe, expect, it } from 'vitest'
import { isAllowedImage } from '../layers/core/server/utils/uploadFormat'

// I primi byte di ogni formato, seguiti da un po' di riempimento
const file = (head: string | number[], rest = 16) => Buffer.concat([Buffer.from(head as never, 'latin1'), Buffer.alloc(rest)])

describe('formati delle foto caricate', () => {
  it('accetta JPEG, PNG, WebP, HEIC e AVIF', () => {
    expect(isAllowedImage(file([0xFF, 0xD8, 0xFF, 0xE0]))).toBe(true)
    expect(isAllowedImage(file([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))).toBe(true)
    expect(isAllowedImage(file('RIFF\x00\x00\x00\x00WEBPVP8 '))).toBe(true)
    expect(isAllowedImage(file('\x00\x00\x00\x18ftypheic'))).toBe(true)
    expect(isAllowedImage(file('\x00\x00\x00\x1cftypavif'))).toBe(true)
  })

  it('rifiuta SVG, GIF, TIFF, PDF e i file troppo corti', () => {
    expect(isAllowedImage(file('<svg xmlns="http://www.w3.org/2000/svg">'))).toBe(false)
    expect(isAllowedImage(file('<?xml version="1.0"?><svg>'))).toBe(false)
    expect(isAllowedImage(file('GIF89a'))).toBe(false)
    expect(isAllowedImage(file('II*\x00'))).toBe(false)
    expect(isAllowedImage(file('%PDF-1.7'))).toBe(false)
    expect(isAllowedImage(file('\x00\x00\x00\x18ftypqt  '))).toBe(false)
    expect(isAllowedImage(Buffer.from([0xFF, 0xD8, 0xFF]))).toBe(false)
  })
})
