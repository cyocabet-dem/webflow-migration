<script setup lang="ts">
// Partner notifications feed (CONTRACT §3.4 GET /partner/notifications).
// Type → label with a generic fallback for types outside the contract list (the
// backend also emits e.g. 'reservation_expired' partner feed rows — never crash on
// an unknown type). Rows mark read on click; 'mark all read' hits read-all. The
// shared 'pp-portal-unread' state keeps the shell's tab badge in sync.
interface NotificationRow {
  hash_id: string
  type: string
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const { ppFetch } = usePartnerPlatform()

const state = ref<'loading' | 'ready' | 'error'>('loading')
const rows = ref<NotificationRow[]>([])
const markingAll = ref(false)

const unreadState = useState<number | null>('pp-portal-unread', () => null)
const unreadCount = computed(() => rows.value.filter((r) => !r.read_at).length)

// CONTRACT §3.7 partner feed types — anything else falls back to the generic label.
const KNOWN_TYPES = new Set([
  'new_reservation',
  'item_approved',
  'item_rejected',
  'sale_completed',
  'rental_completed',
  'return_due',
  'return_overdue',
  'no_show_captured',
  'completion_payment_failed',
])

function typeLabel(type: string): string {
  if (KNOWN_TYPES.has(type)) return t(`partnerDashboard.notifications.types.${type}`)
  return t('partnerDashboard.notifications.types.generic')
}

// Payload highlights: item title, customer name, rejection reason, plus any money
// amounts (*_cents keys) formatted with ppFormatPrice.
function highlights(payload: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof payload.item_title === 'string' && payload.item_title) parts.push(payload.item_title)
  if (typeof payload.customer_name === 'string' && payload.customer_name) {
    parts.push(payload.customer_name)
  }
  if (typeof payload.reason === 'string' && payload.reason) parts.push(payload.reason)
  for (const [key, value] of Object.entries(payload)) {
    if (key.endsWith('_cents') && typeof value === 'number' && value > 0) {
      parts.push(ppFormatPrice(value))
    }
  }
  return parts.join(' · ')
}

function formatDate(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toLowerCase()
  } catch {
    return ''
  }
}

async function load() {
  state.value = 'loading'
  try {
    const data = await ppFetch<NotificationRow[]>('/partner/notifications')
    rows.value = Array.isArray(data) ? data : []
    unreadState.value = unreadCount.value
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

async function markRead(row: NotificationRow) {
  if (row.read_at) return
  row.read_at = new Date().toISOString() // optimistic — a failed call just re-syncs on reload
  unreadState.value = unreadCount.value
  try {
    await ppFetch(`/partner/notifications/${row.hash_id}/read`, { method: 'POST' })
  } catch {
    /* optimistic UI — the next load re-syncs */
  }
}

async function markAllRead() {
  if (markingAll.value || !unreadCount.value) return
  markingAll.value = true
  try {
    await ppFetch('/partner/notifications/read-all', { method: 'POST' })
    const now = new Date().toISOString()
    rows.value.forEach((r) => {
      if (!r.read_at) r.read_at = now
    })
    unreadState.value = 0
  } catch {
    /* keep rows as they are — retry is a click away */
  } finally {
    markingAll.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<template>
  <section class="pp-feed">
    <div class="pp-feed-head">
      <h2 class="pp-feed-title">{{ $t('partnerDashboard.notifications.title') }}</h2>
      <button
        v-if="state === 'ready' && unreadCount > 0"
        class="pp-btn pp-btn-ghost pp-btn-sm"
        type="button"
        :disabled="markingAll"
        @click="markAllRead()"
      >
        {{ $t('partnerDashboard.notifications.markAll') }}
      </button>
    </div>

    <div v-if="state === 'loading'" class="pp-feed-loading">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="state === 'error'" class="pp-state">
      <p>{{ $t('partnerDashboard.common.error') }}</p>
      <button class="pp-btn pp-btn-outline pp-btn-sm" type="button" @click="load()">
        {{ $t('partnerDashboard.common.retry') }}
      </button>
    </div>

    <p v-else-if="!rows.length" class="pp-feed-empty">
      {{ $t('partnerDashboard.notifications.empty') }}
    </p>

    <ul v-else class="pp-feed-list">
      <li
        v-for="row in rows"
        :key="row.hash_id"
        class="pp-feed-row"
        :class="{ 'is-unread': !row.read_at }"
        @click="markRead(row)"
      >
        <span class="pp-feed-dot" aria-hidden="true"></span>
        <div class="pp-feed-row-main">
          <span class="pp-feed-row-label">{{ typeLabel(row.type) }}</span>
          <span v-if="highlights(row.payload)" class="pp-feed-row-detail">{{ highlights(row.payload) }}</span>
        </div>
        <span class="pp-feed-row-date">{{ formatDate(row.created_at) }}</span>
      </li>
    </ul>
  </section>
</template>

<style>
.pp-feed {
  font-family: 'Urbanist', sans-serif;
}
.pp-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.pp-feed-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.pp-feed-loading {
  padding: 20px 0;
}
.pp-feed-empty {
  color: var(--pp-gray);
  font-size: 14px;
}
.pp-feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--pp-gray-light);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}
.pp-feed-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--pp-bg-light);
  cursor: pointer;
}
.pp-feed-row:last-child {
  border-bottom: none;
}
.pp-feed-row:hover {
  background: var(--pp-bg-light);
}
.pp-feed-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  margin-top: 6px;
  flex-shrink: 0;
}
.pp-feed-row.is-unread .pp-feed-dot {
  background: var(--pp-magenta);
}
.pp-feed-row-main {
  flex: 1;
  min-width: 0;
}
.pp-feed-row-label {
  display: block;
  font-size: 14px;
  color: var(--pp-gray);
}
.pp-feed-row.is-unread .pp-feed-row-label {
  color: var(--pp-ink);
  font-weight: 700;
}
.pp-feed-row-detail {
  display: block;
  font-size: 13px;
  color: var(--pp-gray);
  overflow-wrap: anywhere;
}
.pp-feed-row-date {
  font-size: 12px;
  color: var(--pp-gray);
  white-space: nowrap;
  margin-top: 2px;
}
</style>
