<script setup lang="ts">
import {
  ADOPTION_STATUS, PET_SIZE, adoptionFieldsSchema, adoptionRequestSchema,
  type AdoptionFields, type PetGallery,
} from '#shared/models'

/**
 * Scheda di adozione sulla pagina del pet. Il pubblico vede i dati e può scrivere al rifugio;
 * il rifugio proprietario (verificato) può compilarla e cambiare lo stato.
 */
const props = defineProps<{ pet: PetGallery, manage?: boolean }>()
const emit = defineEmits<{ changed: [] }>()

const route = useRoute()
const { loggedIn } = useUserSession()
const info = computed(() => props.pet.adoptionInfo ?? null)

const { t } = useI18n()
const facts = computed(() => {
  const a = info.value
  if (!a) return []
  return [
    a.sex && t(`adoption.sex.${a.sex}`),
    a.age,
    a.size && t('adoption.sizeOf', { size: t(`adoption.size.${a.size}`) }),
    a.neutered === true ? t(a.sex === 'f' ? 'adoption.neuteredF' : 'adoption.neuteredM') : a.neutered === false ? t('adoption.notNeutered') : '',
  ].filter(Boolean) as string[]
})

// --- Richiesta di adozione ---
const request = reactive({ message: '', phone: '' })
const sent = ref(false)
const sending = ref(false)
const error = ref('')
// Passando a un altro pet la pagina resta la stessa: la richiesta riparte vuota
watch(() => props.pet.id, () => {
  Object.assign(request, { message: '', phone: '' })
  sent.value = false
  error.value = ''
  editing.value = false
})

async function send() {
  error.value = ''
  const check = adoptionRequestSchema.safeParse(request)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  sending.value = true
  try {
    await $fetch(`/api/pets/${props.pet.id}/adoption-requests`, { method: 'POST', body: check.data })
    sent.value = true
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}

// --- Modifica (solo il rifugio) ---
const editing = ref(false)
const form = reactive<AdoptionFields>({ status: null, sex: null, age: '', size: null, neutered: null, about: '', hideFromRankings: false })
function startEdit() {
  const a = info.value
  Object.assign(form, a
    ? { status: a.status, sex: a.sex, age: a.age, size: a.size, neutered: a.neutered, about: a.about, hideFromRankings: a.hideFromRankings }
    : { status: 'available', sex: null, age: '', size: null, neutered: null, about: '', hideFromRankings: false })
  error.value = ''
  editing.value = true
}
async function save() {
  error.value = ''
  const check = adoptionFieldsSchema.safeParse(form)
  if (!check.success) {
    error.value = tr(check.error.issues[0]?.message ?? 'validation.check')
    return
  }
  sending.value = true
  try {
    await $fetch(`/api/pets/${props.pet.id}/adoption`, { method: 'PUT', body: check.data })
    editing.value = false
    emit('changed')
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    sending.value = false
  }
}
// La select lavora con stringhe: "" vuol dire "non indicato"
const neuteredModel = computed({
  get: () => (form.neutered === null ? '' : form.neutered ? 'si' : 'no'),
  set: (v: string) => (form.neutered = v === '' ? null : v === 'si'),
})
</script>

<template>
  <section v-if="info || manage" class="adoption-card" :class="info && `adoption-card--${info.status}`">
    <!-- Modifica della scheda -->
    <form v-if="editing" class="adoption-card__form" novalidate @submit.prevent="save">
      <h2 class="adoption-card__title">{{ $t('adoption.card') }}</h2>
      <label for="a-status" class="label">{{ $t('adoption.statusLabel') }}</label>
      <select id="a-status" v-model="form.status" class="input">
        <option v-for="s in ADOPTION_STATUS" :key="s" :value="s">{{ $t(`adoption.status.${s}`) }}</option>
        <option :value="null">{{ $t('adoption.noCard') }}</option>
      </select>
      <div class="adoption-card__row">
        <div class="field">
          <label for="a-sex" class="label">{{ $t('adoption.sexLabel') }}</label>
          <select id="a-sex" v-model="form.sex" class="input">
            <option :value="null">{{ $t('adoption.notSet') }}</option>
            <option value="m">{{ $t('adoption.sex.m') }}</option>
            <option value="f">{{ $t('adoption.sex.f') }}</option>
          </select>
        </div>
        <div class="field">
          <label for="a-age" class="label">{{ $t('adoption.age') }}</label>
          <input id="a-age" v-model="form.age" maxlength="30" :placeholder="$t('adoption.agePlaceholder')" class="input">
        </div>
      </div>
      <div class="adoption-card__row">
        <div class="field">
          <label for="a-size" class="label">{{ $t('adoption.sizeLabel') }}</label>
          <select id="a-size" v-model="form.size" class="input">
            <option :value="null">{{ $t('adoption.notSet') }}</option>
            <option v-for="s in PET_SIZE" :key="s" :value="s">{{ $t(`adoption.size.${s}`) }}</option>
          </select>
        </div>
        <div class="field">
          <label for="a-neutered" class="label">{{ $t('adoption.neuteredLabel') }}</label>
          <select id="a-neutered" v-model="neuteredModel" class="input">
            <option value="">{{ $t('adoption.notSet') }}</option>
            <option value="si">{{ $t('common.yes') }}</option>
            <option value="no">{{ $t('common.no') }}</option>
          </select>
        </div>
      </div>
      <label for="a-about" class="label">{{ $t('adoption.about') }}</label>
      <textarea id="a-about" v-model="form.about" maxlength="600" rows="4" :placeholder="$t('adoption.aboutPlaceholder')" class="input" />
      <label v-if="form.status" class="adoption-card__check">
        <input v-model="form.hideFromRankings" type="checkbox" class="adoption-card__checkbox">
        <span class="adoption-card__check-text"><b>{{ $t('adoption.hide') }}</b><small>{{ $t('adoption.hideHelp') }}</small></span>
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="adoption-card__buttons">
        <button type="button" class="btn btn--ghost" @click="editing = false">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn--primary" :disabled="sending">{{ sending ? $t('common.saving') : $t('common.save') }}</button>
      </div>
    </form>

    <template v-else>
      <div v-if="info" class="adoption-card__head">
        <span class="adoption-card__status">{{ info.status === 'adopted' ? '🎉' : '🏠' }} {{ $t(`adoption.status.${info.status}`) }}</span>
        <NuxtLink :to="`/rifugi/${info.shelter.slug}`" class="adoption-card__shelter">{{ info.shelter.name }} · {{ info.shelter.city }}</NuxtLink>
      </div>
      <p v-else class="adoption-card__hint">{{ $t('adoption.noCardHint') }}</p>

      <ul v-if="facts.length" class="adoption-card__facts">
        <li v-for="f in facts" :key="f" class="adoption-card__fact">{{ f }}</li>
      </ul>
      <p v-if="manage && info?.hideFromRankings" class="adoption-card__hint">{{ $t('adoption.hidden') }}</p>
      <p v-if="info?.about" class="adoption-card__about">{{ info.about }}</p>
      <p v-if="info?.status === 'adopted'" class="adoption-card__happy">{{ $t('adoption.adopted', { name: pet.name }) }}</p>
      <p v-else-if="info?.status === 'fostered'" class="adoption-card__hint">{{ $t('adoption.fostered') }}</p>

      <button v-if="manage" type="button" class="btn btn--ghost adoption-card__edit" @click="startEdit">{{ info ? $t('adoption.editCard') : $t('adoption.addCard') }}</button>

      <!-- Richiesta di adozione, solo per chi non è il rifugio -->
      <template v-else-if="info?.status === 'available'">
        <p v-if="sent" class="adoption-card__sent" role="status">{{ $t('adoption.sent') }}</p>
        <NuxtLink v-else-if="!loggedIn" :to="{ path: '/accedi', query: { redirect: route.fullPath } }" class="btn btn--primary btn--lg">{{ $t('adoption.loginToAdopt', { name: pet.name }) }}</NuxtLink>
        <form v-else class="adoption-card__form adoption-card__form--request" novalidate @submit.prevent="send">
          <h2 class="adoption-card__title">{{ $t('adoption.want', { name: pet.name }) }}</h2>
          <label for="r-msg" class="label">{{ $t('adoption.writeShelter') }}</label>
          <textarea id="r-msg" v-model="request.message" maxlength="1000" rows="4" :placeholder="$t('adoption.messagePlaceholder')" class="input" />
          <label for="r-phone" class="label">{{ $t('adoption.phone') }} <small>({{ $t('common.optional') }})</small></label>
          <input id="r-phone" v-model="request.phone" type="tel" maxlength="30" placeholder="+39 333 1234567" class="input">
          <p class="adoption-card__hint adoption-card__hint--small">{{ $t('adoption.note') }}</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <button type="submit" class="btn btn--primary btn--lg" :disabled="sending">{{ sending ? $t('common.sending') : $t('adoption.send') }}</button>
        </form>
      </template>
    </template>
  </section>
</template>

<style lang="scss" scoped>
// Organismo: scheda di adozione di un pet (vista, modifica del rifugio, richiesta)
.adoption-card {
  @include card($space-7, 24px);
  @include stack($space-4);
  border: 2px solid var(--line);

  &--available { border-color: var(--coral); }

  &--adopted { border-color: var(--mint); }

  &__head { display: flex; align-items: center; gap: $space-4; flex-wrap: wrap; }

  &__status {
    background: var(--action);
    color: #fff;
    font-weight: 900;
    @include pill(6px, 14px);

    .adoption-card--adopted & { background: color-mix(in srgb, var(--mint) 82%, #000); }

    .adoption-card--fostered & { background: var(--sun); color: var(--sun-ink); }
  }

  &__shelter {
    @include plain-link(var(--ink));
    font-weight: 800;

    &:hover { text-decoration: underline; }
  }

  &__facts { @include cluster($space-2); margin: 0; padding: 0; list-style: none; }

  &__fact { background: var(--bg); border: 1px solid var(--line); @include pill(5px, 12px); font-weight: 700; font-size: 14px; }

  &__about { margin: 0; white-space: pre-line; @include prose; }

  &__happy { margin: 0; font-weight: 800; color: var(--ink); }

  &__hint {
    margin: 0;
    color: var(--muted);
    font-size: 14px;

    &--small { font-size: 13px; }
  }

  &__edit { align-self: flex-start; }

  &__title { font-size: 19px; }

  &__form {
    @include stack($space-2);

    &--request { border-top: 2px dashed var(--line); padding-top: 12px; }
  }

  &__row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-4; }

  &__check { display: flex; gap: $space-4; align-items: flex-start; margin-top: $space-1; cursor: pointer; }

  &__checkbox { width: 20px; height: 20px; flex-shrink: 0; margin: 2px 0 0; accent-color: var(--coral); }

  &__check-text {
    display: flex;
    flex-direction: column;

    small { color: var(--muted); font-size: 13px; }
  }

  &__buttons { display: flex; gap: $space-3; justify-content: flex-end; }

  &__sent { margin: 0; color: var(--ink); font-weight: 800; background: var(--coral-soft); padding: 12px 14px; border-radius: 16px; }
}
</style>
