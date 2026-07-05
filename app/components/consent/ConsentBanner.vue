<script setup lang="ts">
const { bannerOpen, preferencesOpen, acceptAll, denyAll, openPreferences } = useConsent()
</script>

<template>
  <div v-if="bannerOpen && !preferencesOpen" class="consent-banner" role="dialog" aria-label="cookie consent">
    <p class="consent-banner-text">
      {{ $t('consent.bannerText') }}
      <NuxtLink :to="$localePath('/cookie-policy')" class="consent-banner-link">{{ $t('consent.policyLink') }}</NuxtLink>
    </p>
    <div class="consent-banner-actions">
      <button class="consent-btn consent-btn-outline" @click="openPreferences">{{ $t('consent.preferences') }}</button>
      <button class="consent-btn consent-btn-outline" @click="denyAll">{{ $t('consent.deny') }}</button>
      <button class="consent-btn consent-btn-solid" @click="acceptAll">{{ $t('consent.accept') }}</button>
    </div>
  </div>
  <ConsentPreferences v-if="preferencesOpen" />
</template>

<style scoped>
.consent-banner {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 999998;
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #f0d4f8;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(75, 7, 63, 0.16);
  font-family: Urbanist, sans-serif;
}
.consent-banner-text {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #24282d;
  text-transform: lowercase;
}
.consent-banner-link {
  color: #a92296;
  text-decoration: underline;
}
.consent-banner-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.consent-btn {
  padding: 10px 20px;
  border-radius: 50px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: lowercase;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.consent-btn-solid {
  background: #a92296;
  border: 1px solid #a92296;
  color: #fff4fe;
}
.consent-btn-solid:hover {
  background: #4b073f;
  border-color: #4b073f;
}
.consent-btn-outline {
  background: #fff4fe;
  border: 1px solid #a92296;
  color: #24282d;
}
.consent-btn-outline:hover {
  background: #f0d4f8;
}
</style>
