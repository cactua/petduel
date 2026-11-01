<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.login')}` })
</script>

<template>
  <AuthForm mode="login" />
</template>
