<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('auth.register')}` })
</script>

<template>
  <AuthForm mode="register" />
</template>
