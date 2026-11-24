import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import ChallengeJoin from '@core/app/components/organisms/ChallengeJoin.vue'
import PhotoCropper from '@core/app/components/organisms/PhotoCropper.vue'
import type { Crops } from '#shared/images'
import { challengeDetail, entry, profile, USER } from '../fixtures'

const meta = {
  title: 'Organismi/Caricamento e sfide',
  tags: ['autodocs'],
  parameters: {
    user: USER,
    api: { '/api/users/giulia': profile({ isMe: true }), 'POST /api/challenges/*': {}, '/api/artists': [] },
    docs: {
      description: {
        component: 'Organismi per caricare immagini.\n\n'
          + '- **PhotoCropper**: ritaglio della foto nelle tre forme usate dal sito (verticale 3:4 per duelli e galleria, orizzontale 3:2 per i duelli su telefono, '
          + 'quadrata per profilo e classifiche). Per ognuna si trascina e si ingrandisce; `v-model` = i tre ritagli in frazioni, pronti per l\'upload.\n'
          + '- **ChallengeJoin**: iscrizione a una sfida, con un partecipante già in gara o una foto nuova (incollata o trascinata, con ritaglio e, sui siti che lo chiedono, '
          + 'l\'artista). Mostra le proprie iscrizioni e il loro stato. Chi non ha l\'account viene invitato ad accedere.',
      },
    },
  },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Ritaglio: Story = {
  name: 'PhotoCropper',
  render: () => ({
    components: { PhotoCropper },
    setup: () => ({ src: entry(0).image, crops: ref<Crops | null>(null) }),
    template: '<div class="card" style="max-width:640px"><PhotoCropper v-model="crops" :src="src" /></div>',
  }),
}
export const Iscrizione: Story = {
  name: 'ChallengeJoin',
  render: () => ({ components: { ChallengeJoin }, setup: () => ({ c: challengeDetail() }), template: '<div class="card" style="max-width:640px"><ChallengeJoin :challenge="c" /></div>' }),
}
export const IscrizioneGiaFatta: Story = {
  name: 'ChallengeJoin (già iscritto)',
  render: () => ({
    components: { ChallengeJoin },
    setup: () => {
      const p = entry(0)
      return { c: { ...challengeDetail(), myEntries: [{ entryId: 1, petId: p.id, petName: p.name, image: p.image, status: 'pending' as const }] } }
    },
    template: '<div class="card" style="max-width:640px"><ChallengeJoin :challenge="c" /></div>',
  }),
}
export const IscrizioneVisitatore: Story = {
  name: 'ChallengeJoin (senza accesso)',
  parameters: { user: null },
  render: () => ({ components: { ChallengeJoin }, setup: () => ({ c: challengeDetail() }), template: '<div class="card" style="max-width:640px"><ChallengeJoin :challenge="c" /></div>' }),
}
