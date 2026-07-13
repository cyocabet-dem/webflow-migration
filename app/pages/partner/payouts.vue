<script setup lang="ts">
// Partner dashboard — payouts / Stripe Connect (CONTRACT §3.4 /partner/stripe/*).
// Status tiles + hosted onboarding redirect; money flows straight through Stripe
// Express to the partner's own account — Demat never holds it.
useHead({
  title: 'Partner payouts',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface StripeStatus {
  account_id: string | null
  onboarded: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
}

const { t } = useI18n()
const { ppFetch } = usePartnerPlatform()

const state = ref<'loading' | 'ready' | 'error'>('loading')
const status = ref<StripeStatus | null>(null)
const linkBusy = ref(false)
const linkError = ref('')

const tiles = computed(() => [
  { key: 'tileOnboarded', ok: !!status.value?.onboarded },
  { key: 'tileCharges', ok: !!status.value?.charges_enabled },
  { key: 'tilePayouts', ok: !!status.value?.payouts_enabled },
])

async function load() {
  state.value = 'loading'
  try {
    status.value = await ppFetch<StripeStatus>('/partner/stripe/status')
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

async function startOnboarding() {
  if (linkBusy.value) return
  linkBusy.value = true
  linkError.value = ''
  try {
    const res = await ppFetch<{ url: string }>('/partner/stripe/onboarding-link', {
      method: 'POST',
      body: { refresh_url: window.location.href, return_url: window.location.href },
    })
    window.location.href = res.url
  } catch (e: any) {
    linkError.value =
      e?.code === 'connect_not_onboarded'
        ? t('partnerDashboard.payouts.noAccountYet')
        : e?.message || t('partnerDashboard.common.error')
    linkBusy.value = false
  }
}

async function openDashboard() {
  if (linkBusy.value) return
  linkBusy.value = true
  linkError.value = ''
  try {
    const res = await ppFetch<{ url: string }>('/partner/stripe/dashboard-link', {
      method: 'POST',
    })
    window.open(res.url, '_blank', 'noopener')
  } catch (e: any) {
    linkError.value = e?.message || t('partnerDashboard.common.error')
  } finally {
    linkBusy.value = false
  }
}
</script>

<template>
  <section class="full-page-section pp-ppay">
    <PartnerPortalShell @ready="load">
      <h2 class="pp-ppay-title">{{ $t('partnerDashboard.payouts.title') }}</h2>
      <p class="pp-ppay-explainer">{{ $t('partnerDashboard.payouts.explainer') }}</p>

      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <template v-else-if="status">
        <div class="pp-ppay-tiles">
          <div v-for="tile in tiles" :key="tile.key" class="pp-ppay-tile">
            <span class="pp-chip" :class="tile.ok ? 'pp-chip-ok' : 'pp-chip-pending'">
              {{ tile.ok ? '✓' : '✗' }}
            </span>
            <span class="pp-ppay-tile-label">{{ $t(`partnerDashboard.payouts.${tile.key}`) }}</span>
          </div>
        </div>

        <p v-if="linkError" class="pp-msg-error">{{ linkError }}</p>

        <div class="pp-ppay-actions">
          <button
            v-if="!status.onboarded"
            class="pp-btn pp-btn-primary"
            type="button"
            :disabled="linkBusy"
            @click="startOnboarding()"
          >
            {{ linkBusy ? $t('partnerDashboard.payouts.opening') : $t('partnerDashboard.payouts.setup') }}
          </button>
          <button
            v-else
            class="pp-btn pp-btn-outline"
            type="button"
            :disabled="linkBusy"
            @click="openDashboard()"
          >
            {{ linkBusy ? $t('partnerDashboard.payouts.opening') : $t('partnerDashboard.payouts.openDashboard') }}
          </button>
        </div>
      </template>
    </PartnerPortalShell>
  </section>
</template>

<style>
.pp-ppay-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Urbanist', sans-serif;
}
.pp-ppay-explainer {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--pp-gray);
  font-family: 'Urbanist', sans-serif;
  max-width: 620px;
}
.pp-ppay-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-width: 680px;
}
.pp-ppay-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  padding: 16px;
  font-family: 'Urbanist', sans-serif;
}
.pp-ppay-tile-label {
  font-size: 14px;
  font-weight: 600;
}
.pp-ppay-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
