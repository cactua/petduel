import type { Meta, StoryObj } from '@storybook/vue3-vite'
import site from '#site'

// SiteIcon e SiteMascot sono sostituiti dai siti: si usano per nome (registrati come in Nuxt), non importando il file,
// così cambiando sito dalla barra compare la versione di quel sito
const meta = {
  title: 'Atomi/SiteIcon e SiteMascot',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '**SiteIcon** è il simbolo del sito, accanto al nome nel logo e nella medaglietta dei duelli. **SiteMascot** è la mascotte che fa le domande e consola quando non c\'è niente da vedere.',
          '\n\nUn sito li sostituisce con un file omonimo in `sites/<sito>/app/components/atoms`:',
          '\n- **PetDuel**: la zampa e Biscotto, il cagnolino (`layers/core/app/components/atoms`).',
          '\n- **FurDuel**: la zampa, nessuna mascotte (`SiteMascot` non disegna niente).',
          '\n- **BikeDuel**: una moto vista di lato, nessuna mascotte.',
          '\n\nLa mascotte ha una piccola animazione (la testa che si inclina) che si ferma con `still` o con *riduci movimento*.',
          'Lo stesso disegno va messo in `brand.mascotSvg` del `site.config.ts` per le card da condividere.',
        ].join(' '),
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Icona: Story = {
  name: 'SiteIcon',
  render: () => ({
    setup: () => ({ site }),
    template: `<div style="display:flex;gap:24px;align-items:center">
      <span style="font-size:18px;color:var(--coral)"><SiteIcon /></span>
      <span style="font-size:36px;color:var(--coral)"><SiteIcon /></span>
      <b style="font-family:var(--display);font-size:28px;display:inline-flex;gap:6px;align-items:center;color:var(--coral-deep)"><SiteIcon /> {{ site.name }}</b>
    </div>`,
  }),
}

export const Mascotte: Story = {
  name: 'SiteMascot',
  args: { still: false },
  argTypes: { still: { control: 'boolean', description: 'Ferma l\'animazione (es. quando sta accanto a un testo da leggere)' } },
  render: args => ({
    setup: () => ({ args, site }),
    template: `<div style="width:140px">
      <SiteMascot :still="args.still" />
      <p v-if="!site.brand?.mascotSvg && site.id !== 'pets'" class="hint">{{ site.name }} non ha una mascotte: qui non compare niente.</p>
    </div>`,
  }),
}
