<script setup lang="ts">
// Partner dashboard — overview (CONTRACT §3.4 GET /partner/dashboard).
// Stat tiles + Connect status banner + the notifications feed.
useHead({
  title: 'Partner dashboard',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface DashboardData {
  items: Record<string, number>
  active_reservations: number
  rentals_due_7d: number
  unread_notifications: number
  connect: { onboarded: boolean; charges_enabled: boolean; payouts_enabled: boolean }
}

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { ppFetch } = usePartnerPlatform()

const state = ref<'loading' | 'ready' | 'error'>('loading')
const dashboard = ref<DashboardData | null>(null)

const ITEM_STATUSES = [
  'available',
  'reserved',
  'rented',
  'sold',
  'draft',
  'pending_approval',
  'rejected',
] as const

const connectIncomplete = computed(() => {
  const c = dashboard.value?.connect
  if (!c) return false
  return !c.onboarded || !c.charges_enabled || !c.payouts_enabled
})

async function load() {
  state.value = 'loading'
  try {
    dashboard.value = await ppFetch<DashboardData>('/partner/dashboard')
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}
</script>

<template>
  <section class="full-page-section pp-overview">
    <PartnerPortalShell @ready="load">
      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <template v-else-if="dashboard">
        <div v-if="connectIncomplete" class="pp-overview-connect">
          <div class="pp-overview-connect-text">
            <strong>{{ $t('partnerDashboard.overview.connectTitle') }}</strong>
            <p>{{ $t('partnerDashboard.overview.connectBody') }}</p>
          </div>
          <NuxtLink :to="langPrefix + '/partner/payouts'" class="pp-btn pp-btn-primary pp-btn-sm">
            {{ $t('partnerDashboard.overview.connectCta') }}
          </NuxtLink>
        </div>

        <div class="pp-overview-stats">
          <NuxtLink :to="langPrefix + '/partner/reservations'" class="pp-overview-stat">
            <span class="pp-overview-stat-n">{{ dashboard.active_reservations }}</span>
            <span class="pp-overview-stat-label">{{ $t('partnerDashboard.overview.statActiveReservations') }}</span>
          </NuxtLink>
          <NuxtLink :to="langPrefix + '/partner/rentals'" class="pp-overview-stat">
            <span class="pp-overview-stat-n">{{ dashboard.rentals_due_7d }}</span>
            <span class="pp-overview-stat-label">{{ $t('partnerDashboard.overview.statRentalsDue') }}</span>
          </NuxtLink>
          <div class="pp-overview-stat">
            <span class="pp-overview-stat-n">{{ dashboard.unread_notifications }}</span>
            <span class="pp-overview-stat-label">{{ $t('partnerDashboard.overview.statUnread') }}</span>
          </div>
        </div>

        <h2 class="pp-overview-subtitle">{{ $t('partnerDashboard.overview.itemsTitle') }}</h2>
        <div class="pp-overview-items">
          <NuxtLink
            v-for="status in ITEM_STATUSES"
            :key="status"
            :to="langPrefix + '/partner/items'"
            class="pp-overview-item-tile"
          >
            <span class="pp-overview-item-n">{{ dashboard.items[status] ?? 0 }}</span>
            <span class="pp-chip" :class="`pp-chip-${status}`">{{ $t(`partnerDashboard.statuses.${status}`) }}</span>
          </NuxtLink>
        </div>

        <PartnerNotificationsFeed class="pp-overview-feed" />
      </template>
    </PartnerPortalShell>
  </section>
</template>

<style>
.pp-overview-connect {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: #fef3e2;
  border: 1px solid #fcd9a8;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  font-family: 'Urbanist', sans-serif;
}
.pp-overview-connect-text {
  flex: 1;
  min-width: 220px;
  color: var(--pp-warning);
}
.pp-overview-connect-text p {
  margin: 2px 0 0;
  font-size: 14px;
}
.pp-overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 26px;
}
.pp-overview-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  padding: 18px;
  text-decoration: none;
  color: var(--pp-ink);
}
.pp-overview-stat-n {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}
.pp-overview-stat-label {
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-overview-subtitle {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px;
  font-family: 'Urbanist', sans-serif;
}
.pp-overview-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 30px;
}
.pp-overview-item-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 10px;
  padding: 12px;
  text-decoration: none;
  color: var(--pp-ink);
}
.pp-overview-item-n {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}
.pp-overview-feed {
  margin-top: 8px;
}
</style>
