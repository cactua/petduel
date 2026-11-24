import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { userEvent, within } from 'storybook/test'
import ReportButton from '@core/app/components/molecules/ReportButton.vue'
import { USER } from '../fixtures'

const openSheet = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(within(canvasElement).getAllByRole('button')[0]!)
}

const meta = {
  title: 'Molecole/ReportButton',
  component: ReportButton,
  tags: ['autodocs'],
  args: { photoId: 101 },
  argTypes: {
    photoId: { description: 'Segnala un\'immagine pubblicata (motivi: rubata, fatta con IA, esplicita, offensiva, dati personali, altro)' },
    username: { description: 'Segnala un profilo (motivi: offensivo, spam, si spaccia per altri, altro). Si usa al posto di photoId' },
    preset: { control: 'select', options: [undefined, 'stolen', 'ai', 'explicit', 'hateful', 'personal', 'spam', 'impersonation', 'other'], description: 'Motivo già scelto all\'apertura' },
    label: { description: 'Testo del pulsante al posto di "Segnala"' },
    icon: { description: 'Solo la bandierina tonda, da appoggiare su una foto (il testo resta per i lettori di schermo)' },
  },
  decorators: [() => ({ template: '<div style="min-height:520px"><story /></div>' })],
  parameters: {
    user: USER,
    api: { 'POST /api/reports': {} },
    docs: {
      description: {
        component: 'Pulsante "Segnala" con il suo foglio (`<dialog>`): motivo, nota facoltativa, link alle regole e invio a `/api/reports`. Dopo l\'invio ringrazia. '
          + 'Chi non ha fatto l\'accesso viene mandato al login.',
      },
    },
  },
} satisfies Meta<typeof ReportButton>
export default meta
type Story = StoryObj<typeof meta>

export const Pulsante: Story = {}
export const SoloIcona: Story = {
  args: { icon: true },
  decorators: [() => ({ template: '<div style="position:relative;width:200px;height:120px;border-radius:18px;background:var(--line)"><div style="position:absolute;top:8px;right:8px"><story /></div></div>' })],
}
export const FoglioImmagine: Story = { name: 'Foglio aperto (immagine)', play: openSheet }
export const FoglioProfilo: Story = { name: 'Foglio aperto (profilo)', args: { photoId: undefined, username: 'marco_b' }, play: openSheet }
export const ConMotivoScelto: Story = { args: { preset: 'stolen', label: 'Non è mia' }, play: openSheet }
export const Errore: Story = {
  name: 'Invio fallito',
  args: { preset: 'other' },
  parameters: { api: { 'POST /api/reports': { __error: 429, message: 'errors.tooMany' } } },
  play: async (ctx) => {
    await openSheet(ctx)
    const dialog = within(ctx.canvasElement.ownerDocument.body)
    await userEvent.click(await dialog.findByRole('button', { name: /invia|send/i }))
  },
}
