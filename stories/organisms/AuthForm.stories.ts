import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AuthForm from '@core/app/components/organisms/AuthForm.vue'

const meta = {
  title: 'Organismi/AuthForm',
  component: AuthForm,
  tags: ['autodocs'],
  args: { mode: 'login' },
  argTypes: { mode: { control: 'inline-radio', options: ['login', 'register'], description: '`login` accesso, `register` nuovo account (con accettazione delle regole)' } },
  decorators: [() => ({ template: '<div style="max-width:440px"><story /></div>' })],
  parameters: {
    api: {
      'POST /api/auth/login': { __error: 401, message: 'errors.badLogin' },
      'POST /api/auth/register': {},
    },
    docs: {
      description: {
        component: 'Modulo di accesso e di registrazione (pagine `/login` e `/signup`). Controlla i campi con gli stessi schemi del server (zod), '
          + 'mostra gli errori tradotti e dopo l\'accesso torna alla pagina di partenza (`?redirect=`, solo indirizzi interni). '
          + 'Nella storia "Accedi" il server risponde con credenziali sbagliate: prova a inviare.',
      },
    },
  },
} satisfies Meta<typeof AuthForm>
export default meta
type Story = StoryObj<typeof meta>

export const Accedi: Story = {}
export const Registrati: Story = { args: { mode: 'register' } }
