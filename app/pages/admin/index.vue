<script setup lang="ts">
// Admin hub — /admin (CONTRACT §3.5). Courtney-only surface: pending-approvals +
// partners count tiles and the admin notification feed. Client-side gate only
// (loading → signin → not-admin → ready); no route middleware, per house rules.
const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { probe, enabled, fetchMe, ppFetch } = usePartnerPlatform()

useHead({
  title: 'Admin | Dematerialized',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// ============================================================
// Admin gate (loading → signin → notadmin → ready)
// ============================================================

type GateState = 'loading' | 'signin' | 'notadmin' | 'ready'
const gate = ref<GateState>('loading')

async function resolveGate(): Promise<boolean> {
  gate.value = 'loading'
  await probe()
  if (!enabled.value) {
    gate.value = 'notadmin'
    return false
  }
  const w = window as any
  let signedIn = false
  try {
    signedIn = w.auth0Client ? await w.auth0Client.isAuthenticated() : false
  } catch {
    signedIn = false
  }
  if (!signedIn) {
    gate.value = 'signin'
    return false
  }
  const me = await fetchMe()
  if (!me?.is_admin) {
    gate.value = 'notadmin'
    return false
  }
  gate.value = 'ready'
  return true
}

function openAuthModal() {
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

// ============================================================
// Hub data (pending count + partners count + notification feed)
// ============================================================

interface AdminNotification {
  hash_id: string
  type: string
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

const hubState = ref<'loading' | 'ready' | 'error'>('loading')
const pendingCount = ref(0)
const partnersCount = ref(0)
const notifications = ref<AdminNotification[]>([])

async function loadHub() {
  hubState.value = 'loading'
  try {
    const [pending, partners, notifs] = await Promise.all([
      ppFetch<unknown[]>('/admin/items/pending'),
      ppFetch<unknown[]>('/admin/partners'),
      ppFetch<AdminNotification[]>('/admin/notifications'),
    ])
    pendingCount.value = Array.isArray(pending) ? pending.length : 0
    partnersCount.value = Array.isArray(partners) ? partners.length : 0
    notifications.value = (Array.isArray(notifs) ? notifs : [])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    hubState.value = 'ready'
  } catch {
    hubState.value = 'error'
  }
}

// Notification type → label, with a graceful fallback for types we don't know yet.
function notifLabel(n: AdminNotification): string {
  if (n.type === 'item_pending_approval') return t('partnerAdmin.hub.notifItemPending')
  if (n.type === 'payment_issue') return t('partnerAdmin.hub.notifPaymentIssue')
  const humanized = (n.type || '').replace(/_/g, ' ').trim()
  return humanized || t('partnerAdmin.hub.notifUnknown')
}

function notifDetail(n: AdminNotification): string {
  const p = n.payload || {}
  const bits: string[] = []
  for (const key of ['item_title', 'partner_name', 'message']) {
    const v = p[key]
    if (typeof v === 'string' && v) bits.push(v)
  }
  return bits.join(' · ')
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toLowerCase()
}

onMounted(async () => {
  if (await resolveGate()) await loadHub()
})
</script>

<template>
  <section class="full-page-section pp-admin">
    <div v-if="gate === 'loading'" class="pp-admin-gate">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="gate === 'signin'" class="pp-state">
      <h3>{{ $t('partnerAdmin.gate.signinTitle') }}</h3>
      <p>{{ $t('partnerAdmin.gate.signinBody') }}</p>
      <button class="pp-btn pp-btn-primary" type="button" @click="openAuthModal()">
        {{ $t('partnerAdmin.gate.signinCta') }}
      </button>
    </div>

    <div v-else-if="gate === 'notadmin'" class="pp-state">
      <h3>{{ $t('partnerAdmin.gate.notAdminTitle') }}</h3>
      <p>{{ $t('partnerAdmin.gate.notAdminBody') }}</p>
      <NuxtLink :to="langPrefix + '/'" class="pp-btn pp-btn-ghost">
        {{ $t('partnerAdmin.gate.backHome') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header class="pp-admin-header">
        <h1 class="pp-admin-heading">{{ $t('partnerAdmin.hub.heading') }}</h1>
        <p class="pp-admin-subtitle">{{ $t('partnerAdmin.hub.subtitle') }}</p>
        <nav class="pp-admin-nav">
          <NuxtLink :to="`${langPrefix}/admin`" class="pp-admin-nav-link is-active">{{ $t('partnerAdmin.nav.hub') }}</NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/approvals`" class="pp-admin-nav-link">{{ $t('partnerAdmin.nav.approvals') }}</NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/partners`" class="pp-admin-nav-link">{{ $t('partnerAdmin.nav.partners') }}</NuxtLink>
        </nav>
      </header>

      <div v-if="hubState === 'loading'" class="pp-admin-gate">
        <div class="pp-spinner"></div>
      </div>

      <div v-else-if="hubState === 'error'" class="pp-state">
        <p>{{ $t('partnerAdmin.common.loadError') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="loadHub()">
          {{ $t('partnerAdmin.common.retry') }}
        </button>
      </div>

      <template v-else>
        <div class="pp-admin-tiles">
          <NuxtLink :to="`${langPrefix}/admin/approvals`" class="pp-admin-tile" :class="{ 'is-hot': pendingCount > 0 }">
            <span class="pp-admin-tile-count">{{ pendingCount }}</span>
            <span class="pp-admin-tile-label">{{ $t('partnerAdmin.hub.approvalsTile') }}</span>
            <span class="pp-admin-tile-hint">
              {{ pendingCount > 0 ? $t('partnerAdmin.hub.approvalsHint') : $t('partnerAdmin.hub.approvalsEmptyHint') }}
            </span>
          </NuxtLink>
          <NuxtLink :to="`${langPrefix}/admin/partners`" class="pp-admin-tile">
            <span class="pp-admin-tile-count">{{ partnersCount }}</span>
            <span class="pp-admin-tile-label">{{ $t('partnerAdmin.hub.partnersTile') }}</span>
            <span class="pp-admin-tile-hint">{{ $t('partnerAdmin.hub.partnersHint') }}</span>
          </NuxtLink>
        </div>

        <div class="pp-card pp-admin-feed">
          <h2 class="pp-admin-feed-title">{{ $t('partnerAdmin.hub.notificationsTitle') }}</h2>
          <p v-if="!notifications.length" class="pp-admin-feed-empty">
            {{ $t('partnerAdmin.hub.notificationsEmpty') }}
          </p>
          <ul v-else class="pp-admin-feed-list">
            <li v-for="n in notifications" :key="n.hash_id" class="pp-admin-feed-row">
              <div class="pp-admin-feed-main">
                <span class="pp-admin-feed-type">{{ notifLabel(n) }}</span>
                <span v-if="notifDetail(n)" class="pp-admin-feed-detail">{{ notifDetail(n) }}</span>
              </div>
              <span class="pp-admin-feed-date">{{ formatDate(n.created_at) }}</span>
            </li>
          </ul>
        </div>
      </template>
    </template>

    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
/* Shared admin layout (duplicated verbatim in all three /admin pages ON PURPOSE:
   page <style> blocks only load with their own page, and a direct visit to any
   /admin URL must carry the full layout — the .pp-admin prefix is the scope).
   Top/side padding comes from .full-page-section (responsive, clears the fixed
   header); we only stretch the flex children and cap the width. */
.pp-admin {
  align-items: stretch;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 64px;
  font-family: 'Urbanist', sans-serif;
  color: var(--pp-ink);
}
@media (max-width: 767px) {
  .pp-admin {
    padding-top: 72px; /* clear the compact mobile header */
    padding-left: 16px;
    padding-right: 16px;
  }
}
.pp-admin-gate {
  min-height: 30vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-admin-header {
  margin-bottom: 28px;
}
.pp-admin-heading {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  text-transform: lowercase;
}
.pp-admin-subtitle {
  color: var(--pp-gray);
  font-size: 15px;
  margin: 6px 0 0;
  max-width: 560px;
}
.pp-admin-nav {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.pp-admin-nav-link {
  padding: 6px 16px;
  border-radius: 50px;
  border: 1px solid var(--pp-gray-light);
  color: var(--pp-gray);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.pp-admin-nav-link:hover {
  color: var(--pp-magenta);
  border-color: var(--pp-magenta);
}
.pp-admin-nav-link.is-active {
  background: var(--pp-magenta);
  border-color: var(--pp-magenta);
  color: #fff;
}

/* --- hub tiles --- */
.pp-admin-tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}
@media (max-width: 600px) {
  .pp-admin-tiles {
    grid-template-columns: 1fr;
  }
}
.pp-admin-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 26px 28px;
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 16px;
  text-decoration: none;
  color: var(--pp-ink);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.pp-admin-tile:hover {
  box-shadow: 0 6px 24px rgba(36, 40, 45, 0.08);
  transform: translateY(-2px);
}
.pp-admin-tile.is-hot {
  border-color: var(--pp-magenta);
}
.pp-admin-tile-count {
  font-size: 44px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--pp-magenta);
}
.pp-admin-tile-label {
  font-size: 17px;
  font-weight: 700;
}
.pp-admin-tile-hint {
  font-size: 13px;
  color: var(--pp-gray);
}

/* --- notification feed --- */
.pp-admin-feed {
  padding: 22px 24px;
}
.pp-admin-feed-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px;
  text-transform: lowercase;
}
.pp-admin-feed-empty {
  color: var(--pp-gray);
  font-size: 14px;
  margin: 0;
}
.pp-admin-feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.pp-admin-feed-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid var(--pp-bg-light);
}
.pp-admin-feed-row:first-child {
  border-top: none;
}
.pp-admin-feed-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.pp-admin-feed-type {
  font-size: 14px;
  font-weight: 700;
}
.pp-admin-feed-detail {
  font-size: 13px;
  color: var(--pp-gray);
  overflow-wrap: anywhere;
}
.pp-admin-feed-date {
  font-size: 12px;
  color: var(--pp-gray);
  white-space: nowrap;
}
</style>
