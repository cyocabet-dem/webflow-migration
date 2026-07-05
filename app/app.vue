<script setup lang="ts">
// The ported .lang-en/.lang-nl CSS toggle keys off html[lang], so the locale must land there.
// .auth-pending gates auth-sensitive chrome (see 7-auth-gate.css); the auth plugin drops it.
const { locale } = useI18n()
const { authReady } = useAuth()
const switchLocalePath = useSwitchLocalePath()
const SITE = 'https://dematerialized.nl'
useHead({
  htmlAttrs: { lang: locale, class: computed(() => (authReady.value ? '' : 'auth-pending')) },
  link: computed(() => [
    { rel: 'alternate', hreflang: 'en', href: SITE + (switchLocalePath('en') || '/') },
    { rel: 'alternate', hreflang: 'nl', href: SITE + (switchLocalePath('nl') || '/nl') },
    { rel: 'alternate', hreflang: 'x-default', href: SITE + (switchLocalePath('en') || '/') },
  ]),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
