import { describe, expect, it } from 'vitest'
import { linkLabel, linkPlatform, withProtocol } from '../layers/core/app/utils/links'

describe('sito di un link', () => {
  it('riconosce i siti noti, anche con www e sottodomini', () => {
    expect(linkPlatform('https://www.furaffinity.net/user/x')).toEqual({ name: 'FurAffinity', known: true })
    expect(linkPlatform('https://nome.tumblr.com')).toEqual({ name: 'Tumblr', known: true })
    expect(linkPlatform('https://twitter.com/x')?.name).toBe('X')
  })

  it('per gli altri dà il dominio', () => {
    expect(linkPlatform('https://www.esempio.it/portfolio')).toEqual({ name: 'esempio.it', known: false })
  })

  it('non riconosce ciò che non è un indirizzo web', () => {
    expect(linkPlatform('instagram.com/x')).toBeNull()
    expect(linkPlatform('javascript:alert(1)')).toBeNull()
    expect(linkPlatform('https://localhost')).toBeNull()
    expect(linkLabel('ciao')).toBe('ciao')
  })
})

describe('https:// aggiunto da solo', () => {
  it('a un dominio scritto senza', () => {
    expect(withProtocol(' instagram.com/nome ')).toBe('https://instagram.com/nome')
    expect(withProtocol('www.vgen.co/nome?x=1')).toBe('https://www.vgen.co/nome?x=1')
  })

  it('lascia stare il resto', () => {
    expect(withProtocol('http://esempio.it')).toBe('http://esempio.it')
    expect(withProtocol('mailto:a@b.it')).toBe('mailto:a@b.it')
    expect(withProtocol('il mio sito')).toBe('il mio sito')
    expect(withProtocol('')).toBe('')
  })
})
