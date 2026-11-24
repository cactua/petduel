import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PushToggle from '@core/app/components/molecules/PushToggle.vue'
import { USER } from '../fixtures'

// Lo stato lo decide il browser (permesso, service worker): nelle storie si finge con beforeEach e si rimette tutto a posto dopo
function fake(opts: { permission?: NotificationPermission, subscribed?: boolean, noPush?: boolean, ios?: boolean }) {
  return () => {
    const restore: (() => void)[] = []
    const patch = (obj: object, key: string, value: unknown) => {
      const before = Object.getOwnPropertyDescriptor(obj, key)
      Object.defineProperty(obj, key, { configurable: true, get: () => value })
      restore.push(() => (before ? Object.defineProperty(obj, key, before) : Reflect.deleteProperty(obj, key)))
    }
    if (opts.permission) patch(Notification, 'permission', opts.permission)
    if (opts.subscribed !== undefined) {
      const reg = { pushManager: { getSubscription: async () => (opts.subscribed ? { endpoint: 'https://push.example/1' } : null) } }
      patch(navigator.serviceWorker, 'getRegistration', async () => reg)
    }
    if (opts.noPush) patch(window, 'PushManager', undefined)
    if (opts.ios) patch(navigator, 'userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    return () => restore.reverse().forEach(r => r())
  }
}
// "in" controlla solo che la chiave esista: per togliere PushManager serve cancellarla
function withoutPush(ios: boolean) {
  return () => {
    const saved = Object.getOwnPropertyDescriptor(window, 'PushManager')
    delete (window as unknown as Record<string, unknown>).PushManager
    const undo = ios ? fake({ ios: true })() : () => {}
    return () => {
      undo()
      if (saved) Object.defineProperty(window, 'PushManager', saved)
    }
  }
}

const meta = {
  title: 'Molecole/PushToggle',
  component: PushToggle,
  tags: ['autodocs'],
  args: { compact: false },
  argTypes: { compact: { description: 'Versione dentro la campanella: compare solo se c\'è qualcosa da fare (attivarle, o su iPhone aggiungere prima il sito alla schermata Home)' } },
  decorators: [() => ({ template: '<div style="max-width:420px"><story /></div>' })],
  parameters: {
    user: USER,
    docs: {
      description: {
        component: 'Notifiche push su questo dispositivo, con tutti gli stati: da attivare, attive, bloccate dal browser, non supportate, e su iPhone '
          + '"aggiungi prima alla schermata Home". Il permesso si chiede solo dopo il tocco su "Attiva". Senza chiave VAPID nel `.env` non compare.',
      },
    },
  },
} satisfies Meta<typeof PushToggle>
export default meta
type Story = StoryObj<typeof meta>

export const DaAttivare: Story = { beforeEach: fake({ permission: 'default', subscribed: false }) }
export const Attive: Story = { beforeEach: fake({ permission: 'granted', subscribed: true }) }
export const Bloccate: Story = { beforeEach: fake({ permission: 'denied' }) }
export const iPhoneDaInstallare: Story = { name: 'iPhone: prima la schermata Home', beforeEach: withoutPush(true) }
export const NonSupportate: Story = { beforeEach: withoutPush(false) }
export const Compatta: Story = { args: { compact: true }, beforeEach: fake({ permission: 'default', subscribed: false }) }
