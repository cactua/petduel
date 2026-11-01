<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('auth.register')} · PetDuel` })
</script>

<template>
  <AuthForm mode="register" />
</template>
