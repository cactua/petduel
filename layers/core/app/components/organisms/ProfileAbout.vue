<script setup lang="ts">
import type { Profile } from '#shared/models'

// Bio e pronomi del proprio profilo, modificati dalla pagina account
const { user } = useUserSession()
const { t } = useI18n()
const { data } = await useFetch<Profile>(() => `/api/users/${user.value?.username}`, { key: 'my-profile-about' })
const form = reactive({ bio: '', pronouns: '' })
watchEffect(() => {
  if (data.value) Object.assign(form, { bio: data.value.bio, pronouns: data.value.pronouns })
})
const status = ref('')
const error = ref('')
const busy = ref(false)
async function save() {
  busy.value = true
  status.value = ''
  error.value = ''
  try {
    await $fetch('/api/me/profile', { method: 'PUT', body: form })
    status.value = t('profile.savedAbout')
  }
  catch (e) {
    error.value = errorMessage(e, 'validation.check')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="profile-about" @submit.prevent="save">
    <label class="field">
      <span class="label">{{ $t('profile.bio') }}</span>
      <textarea v-model="form.bio" class="input" rows="3" maxlength="300" aria-describedby="bio-hint" />
      <small id="bio-hint" class="hint">{{ $t('profile.bioHint') }}</small>
    </label>
    <label class="field">
      <span class="label">{{ $t('profile.pronouns') }}</span>
      <input v-model="form.pronouns" class="input" maxlength="30" :placeholder="$t('profile.pronounsHint')">
    </label>
    <div class="profile-about__actions">
      <button type="submit" class="btn btn--primary" :disabled="busy">{{ $t('profile.saveAbout') }}</button>
      <p v-if="status" class="hint" role="status">{{ status }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.profile-about {
  @include stack($space-6);

  &__actions { display: flex; align-items: center; gap: $space-5; flex-wrap: wrap; }
}
</style>
