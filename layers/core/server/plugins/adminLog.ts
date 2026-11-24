import { adminLog } from '../db/schema'

// Registro delle azioni admin: ogni modifica riuscita sotto /api/admin si annota con chi l'ha fatta.
// Delle richieste si tengono i campi, mai le password
const SECRET_KEYS = /password|token|secret/i

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SECRET_KEYS.test(k) ? '***' : redact(v)]))
  }
  return value
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('afterResponse', async (event) => {
    const admin = event.context.admin as { id: number, username: string } | undefined
    if (!admin || event.method === 'GET' || event.method === 'HEAD' || !event.path.startsWith('/api/admin/')) return
    if (getResponseStatus(event) >= 400) return
    try {
      let detail = ''
      if (!getRequestHeader(event, 'content-type')?.includes('multipart')) {
        const body = await readBody(event).catch(() => undefined)
        if (body !== undefined && body !== null) detail = JSON.stringify(redact(body)).slice(0, 1000)
      }
      const path = event.path.split('?')[0]!
      const db = await useDb()
      await db.insert(adminLog).values({
        adminId: admin.id,
        adminName: admin.username,
        action: `${event.method} ${path.replace(/^\/api\/admin\//, '')}`,
        target: path.match(/\/(\d+)(?:\/|$)/)?.[1] ?? '',
        detail,
      })
    }
    catch (e) {
      console.error('[admin] registro non scritto', e)
    }
  })
})
