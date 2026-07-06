<script setup lang="ts">
// Always-present cookie widget (bottom-left, like Finsweet's on the old site) so
// users can reopen their consent preferences at any time.
const { openPreferences, bannerOpen, preferencesOpen } = useConsent()
</script>

<template>
  <button
    v-show="!bannerOpen && !preferencesOpen"
    class="cookie-widget"
    :aria-label="$t('consent.prefsTitle')"
    :title="$t('consent.prefsTitle')"
    @click="openPreferences"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
      <path d="M8.5 8.5v.01"></path>
      <path d="M16 15.5v.01"></path>
      <path d="M12 12v.01"></path>
      <path d="M11 17v.01"></path>
      <path d="M7 14v.01"></path>
    </svg>
  </button>
</template>

<style scoped>
.cookie-widget {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 999990;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #4b073f;
  border: 1px solid #f0d4f8;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(75, 7, 63, 0.18);
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease;
}
.cookie-widget:hover {
  background: #fff4fe;
  transform: scale(1.08);
}
@media (max-width: 767px) {
  .cookie-widget {
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
