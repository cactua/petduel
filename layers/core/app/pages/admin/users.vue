<script setup lang="ts">
import { adminUserCreateSchema, passwordSchema, type AdminUser, type AdminUserList } from '#shared/models'

const { features } = useAppConfig()

definePageMeta({ middleware: 'admin' })
useHead({ title: 'Utenti · Admin' })

const route = useRoute()
const { user: me } = useUserSession()
const q = ref(String(route.query.q ?? ''))
const filter = ref<'all' | 'admin' | 'banned' | 'shelter'>('all')
const page = ref(1)
// La ricerca parte mentre si scrive, con un attimo di attesa
const debounced = ref(q.value)
let typing: ReturnType<typeof setTimeout> | undefined
watch(q, (v) => {
  clearTimeout(typing)
  typing = setTimeout(() => {
    debounced.value = v
    page.value = 1
  }, 250)
})
watch(filter, () => (page.value = 1))

const { data, refresh, error: loadError } = await useFetch<AdminUserList>('/api/admin/users', {
  query: { q: debounced, filter, page },
})
const pages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / 30)))

const open = ref<number | null>(null)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const newPassword = ref('')
const confirmDelete = ref<number | null>(null)

function toggle(u: AdminUser) {
  open.value = open.value === u.id ? null : u.id
  newPassword.value = ''
  confirmDelete.value = null
  error.value = ''
  notice.value = ''
}

async function act(u: AdminUser, body: Record<string, unknown> | 'delete', done: string) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    if (body === 'delete') await $fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    else await $fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body })
    notice.value = done
    newPassword.value = ''
    if (body === 'delete') open.value = null
    await refresh()
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}

function setPassword(u: AdminUser) {
  const check = passwordSchema.safeParse(newPassword.value)
  if (!check.success) {
    error.value = check.error.issues[0]?.message ?? 'Password non valida'
    return
  }
  act(u, { password: check.data }, `Nuova password impostata per @${u.username}. Comunicagliela tu.`)
}
function remove(u: AdminUser) {
  if (confirmDelete.value !== u.id) {
    confirmDelete.value = u.id
    return
  }
  act(u, 'delete', `@${u.username} eliminato`)
}

// Password robusta proposta con un tocco, da copiare e mandare alla persona
function suggestPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(14))
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

// Nuovo utente
const creating = ref(false)
const form = reactive({ email: '', username: '', password: '', role: 'user' as 'user' | 'admin' })
const formError = ref('')
async function create() {
  formError.value = ''
  const check = adminUserCreateSchema.safeParse(form)
  if (!check.success) {
    formError.value = check.error.issues[0]?.message ?? 'Controlla i campi'
    return
  }
  busy.value = true
  try {
    const res = await $fetch<{ username: string }>('/api/admin/users', { method: 'POST', body: check.data })
    notice.value = `Account @${res.username} creato. Manda tu email e password alla persona.`
    Object.assign(form, { email: '', username: '', password: '', role: 'user' })
    creating.value = false
    q.value = res.username
  }
  catch (e) {
    formError.value = errorMessage(e)
  }
  finally {
    busy.value = false
  }
}

const joined = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { dateStyle: 'medium' })
</script>

<template>
  <section class="admin-page user-admin">
    <header class="admin-page__header">
      <h1 class="admin-page__title">Utenti</h1>
      <button type="button" class="btn btn--primary" @click="creating = !creating">{{ creating ? 'Chiudi' : '+ Nuovo utente' }}</button>
    </header>

    <form v-if="creating" class="admin-form admin-form--tight user-admin__box" novalidate @submit.prevent="create">
      <div class="admin-form__grid">
        <label>Email<input v-model="form.email" type="email" autocomplete="off" required></label>
        <label>Username<input v-model="form.username" autocomplete="off" required></label>
        <label>
          Password
          <span class="user-admin__password"><input v-model="form.password" autocomplete="new-password" required><button type="button" class="btn btn--ghost btn--sm" @click="form.password = suggestPassword()">Genera</button></span>
        </label>
        <label>Ruolo
          <select v-model="form.role"><option value="user">Utente</option><option value="admin">Admin</option></select>
        </label>
      </div>
      <p v-if="formError" class="error" role="alert">{{ formError }}</p>
      <button type="submit" class="btn btn--primary user-admin__create" :disabled="busy">Crea account</button>
    </form>

    <div class="user-admin__tools">
      <input v-model="q" type="search" placeholder="Cerca username o email" aria-label="Cerca utenti" class="input user-admin__search">
      <select v-model="filter" aria-label="Filtra" class="input user-admin__filter">
        <option value="all">Tutti</option>
        <option value="admin">Admin</option>
        <option v-if="features.shelters" value="shelter">Con rifugio</option>
        <option value="banned">Sospesi</option>
      </select>
    </div>
    <p v-if="notice" class="admin-page__notice" role="status">{{ notice }}</p>
    <p v-if="loadError" class="error" role="alert">Non riesco a caricare gli utenti</p>
    <p v-if="data" class="user-admin__count">{{ data.total.toLocaleString('it-IT') }} {{ data.total === 1 ? 'utente' : 'utenti' }}</p>

    <ul class="user-admin__list">
      <li v-for="u in data?.users" :key="u.id" class="user-admin__user" :class="{ 'user-admin__user--banned': u.banned, 'is-open': open === u.id }">
        <button type="button" class="user-admin__row" :aria-expanded="open === u.id" @click="toggle(u)">
          <span class="user-admin__who">
            <b>@{{ u.username }}</b>
            <span v-if="u.role === 'admin'" class="user-admin__tag user-admin__tag--admin">admin</span>
            <span v-if="u.shelter" class="user-admin__tag">🏠 {{ u.shelter }}</span>
            <span v-if="u.banned" class="user-admin__tag user-admin__tag--ban">sospeso</span>
            <small class="user-admin__email">{{ u.email }}</small>
          </span>
          <span class="user-admin__nums">
            <span><b>{{ u.pets }}</b> pet</span>
            <span><b>{{ u.votes.toLocaleString('it-IT') }}</b> voti</span>
            <span v-if="u.pendingPhotos" class="user-admin__wait"><b>{{ u.pendingPhotos }}</b> in attesa</span>
          </span>
        </button>
        <div v-if="open === u.id" class="user-admin__detail">
          <p class="user-admin__meta">Iscritto il {{ joined(u.createdAt) }} · <NuxtLink :to="`/u/${u.username}`" class="user-admin__link">Apri il profilo</NuxtLink></p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <template v-if="u.id !== me?.id">
            <div class="user-admin__acts">
              <button type="button" class="btn btn--ghost btn--sm" :disabled="busy" @click="act(u, { role: u.role === 'admin' ? 'user' : 'admin' }, u.role === 'admin' ? `@${u.username} non è più admin` : `@${u.username} ora è admin`)">
                {{ u.role === 'admin' ? 'Togli admin' : 'Rendi admin' }}
              </button>
              <button type="button" class="btn btn--ghost btn--sm" :disabled="busy" @click="act(u, { banned: !u.banned }, u.banned ? `@${u.username} riattivato` : `@${u.username} sospeso: è uscito da tutte le sessioni`)">
                {{ u.banned ? 'Riattiva' : 'Sospendi' }}
              </button>
              <button type="button" class="btn btn--danger btn--sm" :disabled="busy" @click="remove(u)">
                {{ confirmDelete === u.id ? 'Sicuro? Elimina account, pet e foto' : 'Elimina' }}
              </button>
            </div>
          </template>
          <p v-else class="user-admin__meta">Sei tu: ruolo e sospensione non si cambiano da qui.</p>
          <form class="user-admin__password" @submit.prevent="setPassword(u)">
            <input v-model="newPassword" placeholder="Nuova password" autocomplete="new-password" aria-label="Nuova password" class="input">
            <button type="button" class="btn btn--ghost btn--sm" @click="newPassword = suggestPassword()">Genera</button>
            <button type="submit" class="btn btn--sm user-admin__set" :disabled="busy || !newPassword">Imposta</button>
          </form>
        </div>
      </li>
    </ul>

    <nav v-if="pages > 1" class="user-admin__pager" aria-label="Pagine">
      <button type="button" class="btn btn--ghost btn--sm" :disabled="page <= 1" @click="page--">← Prima</button>
      <span>{{ page }} di {{ pages }}</span>
      <button type="button" class="btn btn--ghost btn--sm" :disabled="page >= pages" @click="page++">Dopo →</button>
    </nav>
  </section>
</template>

<style lang="scss" scoped>
// Pagina admin: elenco e gestione degli utenti
.user-admin {
  &__box { @include card(16px, 22px); }

  &__create { align-self: flex-start; }

  &__password {
    display: flex;
    gap: $space-2;

    .btn { flex-shrink: 0; }
  }

  &__set { background: var(--ink); color: var(--bg); }

  &__tools { display: flex; gap: $space-3; }

  &__search { flex: 1; padding: 9px 12px; }

  &__filter { width: auto; padding: 9px 12px; }

  &__count { margin: 0; font-size: 13px; color: var(--muted); font-weight: 700; }

  &__list { list-style: none; margin: 0; padding: 0; @include stack($space-2); }

  &__user {
    background: var(--surface);
    border-radius: $radius-md;
    box-shadow: 0 6px 18px -14px var(--shadow);

    &--banned { opacity: .7; }

    &.is-open { opacity: 1; outline: 2px solid var(--line); }
  }

  &__row { width: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; border: 0; background: none; color: var(--ink); padding: 11px 14px; text-align: left; cursor: pointer; font: inherit; }

  &__who { flex: 1 1 220px; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }

  &__email { flex-basis: 100%; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &__tag {
    font-size: 11px;
    font-weight: 800;
    @include pill(1px, 8px);
    background: var(--bg);
    color: var(--muted);

    &--admin { background: var(--ink); color: var(--bg); }

    &--ban { background: var(--action); color: #fff; }
  }

  &__nums {
    display: flex;
    gap: $space-5;
    font-size: 13px;
    color: var(--muted);

    b { color: var(--ink); font-variant-numeric: tabular-nums; }
  }

  &__wait { color: var(--coral-deep); }

  &__detail { padding: 0 14px 14px; @include stack($space-4); }

  &__meta { margin: 0; font-size: 13px; color: var(--muted); }

  &__link { color: var(--coral-deep); font-weight: 700; }

  &__acts { @include cluster($space-2); }

  &__pager { display: flex; align-items: center; justify-content: center; gap: $space-5; font-weight: 700; font-size: 14px; }
}
</style>
