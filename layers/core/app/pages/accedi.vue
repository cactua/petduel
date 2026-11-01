<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.login')} · PetDuel` })
</script>

<template>
  <AuthForm mode="login" />
</template>
