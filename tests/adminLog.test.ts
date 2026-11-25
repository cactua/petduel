import { describe, expect, it } from 'vitest'
import { describeAdminAction } from '../layers/core/shared/adminLog'

describe('registro admin in parole', () => {
  it('segnalazione archiviata su un utente', () => {
    const r = describeAdminAction('POST reports', '{"action":"dismiss","target":"user","id":166}')
    expect(r).toMatchObject({ kind: 'reports', text: 'Ha archiviato le segnalazioni sull\'utente #166' })
  })
  it('foto rifiutata con il motivo', () => {
    const r = describeAdminAction('POST photos/12', '{"action":"reject","reason":"Sfocata"}')
    expect(r).toMatchObject({ kind: 'photos', tone: 'bad', text: 'Ha rifiutato la foto #12 · “Sfocata”' })
  })
  it('più cambi su un utente in una frase', () => {
    expect(describeAdminAction('PATCH users/4', '{"role":"admin","password":"***"}').text)
      .toBe('Ha reso admin l\'utente #4 e ha cambiato la password dell\'utente #4')
  })
  it('sfida programmata e campagna in pausa', () => {
    expect(describeAdminAction('POST challenges', '{"title":"Linguaccia","startDate":"2026-12-07"}').text).toBe('Ha programmato la sfida “Linguaccia” dal 7/12/2026')
    expect(describeAdminAction('PATCH ads/3', '{"active":false}').text).toBe('Ha messo in pausa la campagna #3')
  })
  it('azione sconosciuta o dati illeggibili: resta il testo grezzo', () => {
    expect(describeAdminAction('POST nuova-cosa', 'non json')).toMatchObject({ kind: 'other', text: 'POST nuova-cosa' })
  })
})
