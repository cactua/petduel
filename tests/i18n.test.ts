import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { baseCompile } from '@intlify/message-compiler'

// Ogni testo di ogni lingua deve compilare: un "@" o una graffa sbagliati rompono tutto il file nel browser
const DIRS = ['layers/core/i18n/locales', 'layers/shelters/i18n/locales', 'sites/pets/i18n/locales', 'sites/furry/i18n/locales']

function* messages(node: unknown, path: string): Generator<[string, string]> {
  if (typeof node === 'string') yield [path, node]
  else if (Array.isArray(node)) for (const [i, v] of node.entries()) yield* messages(v, `${path}.${i}`)
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) yield* messages(v, path ? `${path}.${k}` : k)
}

const files = DIRS.flatMap((dir) => {
  try {
    return readdirSync(dir).filter(f => f.endsWith('.json')).map(f => join(dir, f))
  }
  catch {
    return []
  }
})

describe('testi tradotti', () => {
  it.each(files)('%s compila', (file) => {
    const errors: string[] = []
    for (const [key, text] of messages(JSON.parse(readFileSync(file, 'utf8')), '')) {
      baseCompile(text, { onError: e => errors.push(`${key}: ${e.message}`) })
    }
    expect(errors).toEqual([])
  })
})
