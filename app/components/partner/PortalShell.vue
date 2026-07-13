<script setup lang="ts">
// Shared shell for every /partner/* dashboard page (CONTRACT §3.4).
// Resolves the access gate once per mount (probe + auth + /me are all cached in
// usePartnerPlatform's useState, so navigating between tabs resolves instantly):
//   loading → signin (no auth0Client / unauthenticated)
//           → not-partner (probe failed OR /me says !is_partner_user)
//           → ready (slot renders; 'ready' emitted so the page can load its data).
// Also renders the partner name + the horizontal tab nav with the unread-notifications
// badge on the overview tab (from GET /partner/dashboard — cheap counts endpoint).
const emit = defineEmits<{ (e: 'ready'): void }>()

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const route = useRoute()
const { probe, fetchMe, me, ppFetch } = usePartnerPlatform()

type GateState = 'loading' | 'signin' | 'not-partner' | 'ready'
const gate = ref<GateState>('loading')
const partnerName = computed(() => me.value?.partner?.name || '')

// Shared unread count: the shell fills it from /partner/dashboard; the notifications
// feed keeps it in sync as rows get marked read.
const unread = useState<number | null>('pp-portal-unread', () => null)

const TABS = [
  { key: 'overview', path: '/partner' },
  { key: 'items', path: '/partner/items' },
  { key: 'reservations', path: '/partner/reservations' },
  { key: 'rentals', path: '/partner/rentals' },
  { key: 'terms', path: '/partner/terms' },
  { key: 'storefront', path: '/partner/storefront' },
  { key: 'payouts', path: '/partner/payouts' },
] as const

function isActive(tab: (typeof TABS)[number]): boolean {
  const cur = route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, '')
  if (tab.key === 'overview') return cur === '/partner'
  // the item form (/partner/item) belongs to the items tab
  if (tab.key === 'items') return cur === '/partner/items' || cur === '/partner/item'
  return cur === tab.path || cur.startsWith(tab.path + '/')
}

function openAuthModal() {
  ;(window as any).openAuthModal?.()
}

async function refreshUnread() {
  try {
    const dash = await ppFetch<{ unread_notifications: number }>('/partner/dashboard')
    unread.value = dash.unread_notifications
  } catch {
    /* badge only — never blocks the shell */
  }
}

async function resolveGate() {
  gate.value = 'loading'
  const enabled = await probe()
  if (!enabled) {
    // backend absent / probe failed → same friendly not-partner state
    gate.value = 'not-partner'
    return
  }
  const client = (window as any).auth0Client
  let authed = false
  if (client) {
    try {
      authed = await client.isAuthenticated()
    } catch {
      authed = false
    }
  }
  if (!authed) {
    gate.value = 'signin'
    return
  }
  const who = await fetchMe()
  if (!who?.is_partner_user) {
    gate.value = 'not-partner'
    return
  }
  gate.value = 'ready'
  emit('ready')
  refreshUnread()
}

onMounted(() => {
  resolveGate()
})
</script>

<template>
  <div class="pp-portal">
    <div v-if="gate === 'loading'" class="pp-portal-loading">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="gate === 'signin'" class="pp-state">
      <h3>{{ $t('partnerDashboard.shell.signinTitle') }}</h3>
      <p>{{ $t('partnerDashboard.shell.signinBody') }}</p>
      <button class="pp-btn pp-btn-primary" type="button" @click="openAuthModal()">
        {{ $t('partnerDashboard.shell.signin') }}
      </button>
    </div>

    <div v-else-if="gate === 'not-partner'" class="pp-state">
      <h3>{{ $t('partnerDashboard.shell.notPartnerTitle') }}</h3>
      <p>{{ $t('partnerDashboard.shell.notPartnerBody') }}</p>
      <NuxtLink :to="langPrefix + '/'" class="pp-btn pp-btn-ghost">
        {{ $t('partnerDashboard.shell.backHome') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header class="pp-portal-head">
        <p class="pp-portal-kicker">{{ $t('partnerDashboard.shell.kicker') }}</p>
        <h1 class="pp-portal-name">{{ partnerName }}</h1>
      </header>

      <nav class="pp-portal-tabs" :aria-label="$t('partnerDashboard.shell.kicker')">
        <NuxtLink
          v-for="tab in TABS"
          :key="tab.key"
          :to="langPrefix + tab.path"
          class="pp-portal-tab"
          :class="{ 'is-active': isActive(tab) }"
        >
          {{ $t(`partnerDashboard.tabs.${tab.key}`) }}
          <span
            v-if="tab.key === 'overview' && unread"
            class="pp-portal-badge"
            :aria-label="$t('partnerDashboard.shell.unreadLabel', { n: unread })"
          >{{ unread }}</span>
        </NuxtLink>
      </nav>

      <div class="pp-portal-body">
        <slot />
      </div>
    </template>
  </div>
</template>

<style>
.pp-portal {
  font-family: 'Urbanist', sans-serif;
  color: var(--pp-ink);
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}
.pp-portal-loading {
  padding: 60px 0;
}
.pp-portal-head {
  margin-bottom: 14px;
}
.pp-portal-kicker {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: lowercase;
  color: var(--pp-magenta);
}
.pp-portal-name {
  margin: 2px 0 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.pp-portal-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--pp-gray-light);
  margin-bottom: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.pp-portal-tabs::-webkit-scrollbar {
  display: none;
}
.pp-portal-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--pp-gray);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.pp-portal-tab:hover {
  color: var(--pp-ink);
}
.pp-portal-tab.is-active {
  color: var(--pp-magenta);
  border-bottom-color: var(--pp-magenta);
}
.pp-portal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 50px;
  background: var(--pp-magenta);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
</style>
