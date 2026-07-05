<script setup lang="ts">
const { consent, preferencesOpen, save } = useConsent()

const marketing = ref(consent.value?.marketing ?? false)
const personalization = ref(consent.value?.personalization ?? false)
const analytics = ref(consent.value?.analytics ?? false)

function savePreferences() {
  save({ marketing: marketing.value, personalization: personalization.value, analytics: analytics.value })
}
</script>

<template>
  <div class="consent-prefs-backdrop" @click.self="preferencesOpen = false">
    <div class="consent-prefs" role="dialog" aria-label="cookie preferences">
      <h3 class="consent-prefs-title">{{ $t('consent.prefsTitle') }}</h3>
      <div class="consent-prefs-row">
        <div>
          <strong>{{ $t('consent.essentials') }}</strong>
          <p>{{ $t('consent.essentialsDesc') }}</p>
        </div>
        <span class="consent-prefs-always">{{ $t('consent.alwaysActive') }}</span>
      </div>
      <label class="consent-prefs-row">
        <div>
          <strong>{{ $t('consent.marketing') }}</strong>
          <p>{{ $t('consent.marketingDesc') }}</p>
        </div>
        <input v-model="marketing" type="checkbox" />
      </label>
      <label class="consent-prefs-row">
        <div>
          <strong>{{ $t('consent.personalization') }}</strong>
          <p>{{ $t('consent.personalizationDesc') }}</p>
        </div>
        <input v-model="personalization" type="checkbox" />
      </label>
      <label class="consent-prefs-row">
        <div>
          <strong>{{ $t('consent.analytics') }}</strong>
          <p>{{ $t('consent.analyticsDesc') }}</p>
        </div>
        <input v-model="analytics" type="checkbox" />
      </label>
      <button class="consent-btn consent-btn-solid" @click="savePreferences">{{ $t('consent.savePreferences') }}</button>
    </div>
  </div>
</template>

<style scoped>
.consent-prefs-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(36, 40, 45, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.consent-prefs {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  background: #fff;
  border-radius: 20px;
  font-family: Urbanist, sans-serif;
  color: #24282d;
}
.consent-prefs-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  text-transform: lowercase;
  color: #4b073f;
}
.consent-prefs-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0d4f8;
  font-size: 14px;
}
.consent-prefs-row p {
  margin: 4px 0 0;
  color: #6b6b6b;
  font-size: 13px;
  line-height: 1.4;
}
.consent-prefs-row input[type='checkbox'] {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  accent-color: #4b073f;
}
.consent-prefs-always {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: #a92296;
  text-transform: lowercase;
}
.consent-btn {
  margin-top: 16px;
  padding: 12px 24px;
  border-radius: 50px;
  background: #a92296;
  border: 1px solid #a92296;
  color: #fff4fe;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: lowercase;
  cursor: pointer;
  transition: background-color 0.2s;
}
.consent-btn:hover {
  background: #4b073f;
  border-color: #4b073f;
}
</style>
