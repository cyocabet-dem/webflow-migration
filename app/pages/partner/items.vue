<script setup lang="ts">
// Partner dashboard — item list (CONTRACT §3.4 GET /partner/items).
// One fetch of everything, filtered client-side by status chips; rejected items get
// their rejection_reason callout with a 'fix & resubmit' link into the item form.
useHead({
  title: 'Partner items',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface PortalItem {
  hash_id: string
  title: string
  brand: string | null
  size: string | null
  category: string | null
  condition: string | null
  status: string
  photos: Array<{ hash_id: string; url: string; kind: string | null }>
  available_for_purchase: boolean
  available_for_rental: boolean
  purchase_price_cents: number | null
  member_purchase_price_cents: number | null
  rental_price_2wk_cents: number | null
  member_rental_price_2wk_cents: number | null
  rejection_reason: string | null
}

const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { ppFetch } = usePartnerPlatform()

// Standalone media URLs are API-origin-relative (/partner-platform/media/…) — resolve
// them against apiBase; absolute URLs (host storage adapter) pass through untouched.
const apiPublicBase = useRuntimeConfig().public.apiBase
function mediaUrl(u: string | null | undefined): string {
  if (!u) return ''
  return u.startsWith('/') ? apiPublicBase + u : u
}

const state = ref<'loading' | 'ready' | 'error'>('loading')
const items = ref<PortalItem[]>([])
const filter = ref<string>('all')

const FILTERS = [
  'all',
  'draft',
  'pending_approval',
  'rejected',
  'available',
  'reserved',
  'rented',
  'sold',
] as const

const KNOWN_STATUSES = new Set([
  'draft',
  'pending_approval',
  'rejected',
  'available',
  'reserved',
  'rented',
  'sold',
  'written_off',
])

function statusLabel(status: string): string {
  return KNOWN_STATUSES.has(status) ? t(`partnerDashboard.statuses.${status}`) : status
}

function filterCount(f: string): number {
  if (f === 'all') return items.value.length
  return items.value.filter((i) => i.status === f).length
}

const visibleItems = computed(() =>
  filter.value === 'all' ? items.value : items.value.filter((i) => i.status === filter.value),
)

const canEditStatus = (status: string) => status === 'draft' || status === 'rejected'

async function load() {
  state.value = 'loading'
  try {
    const data = await ppFetch<PortalItem[]>('/partner/items')
    items.value = Array.isArray(data) ? data : []
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}
</script>

<template>
  <section class="full-page-section pp-items">
    <PartnerPortalShell @ready="load">
      <div class="pp-items-head">
        <h2 class="pp-items-title">{{ $t('partnerDashboard.items.title') }}</h2>
        <NuxtLink :to="langPrefix + '/partner/item'" class="pp-btn pp-btn-primary pp-btn-sm">
          {{ $t('partnerDashboard.items.addItem') }}
        </NuxtLink>
      </div>

      <div v-if="state === 'loading'" class="pp-spinner"></div>

      <div v-else-if="state === 'error'" class="pp-state">
        <p>{{ $t('partnerDashboard.common.error') }}</p>
        <button class="pp-btn pp-btn-outline" type="button" @click="load()">
          {{ $t('partnerDashboard.common.retry') }}
        </button>
      </div>

      <template v-else>
        <div class="pp-items-filters">
          <button
            v-for="f in FILTERS"
            :key="f"
            class="pp-items-filter"
            :class="{ 'is-active': filter === f }"
            type="button"
            @click="filter = f"
          >
            {{ f === 'all' ? $t('partnerDashboard.items.filterAll') : statusLabel(f) }}
            <span class="pp-items-filter-n">{{ filterCount(f) }}</span>
          </button>
        </div>

        <div v-if="!visibleItems.length" class="pp-state">
          <h3>{{ $t('partnerDashboard.items.emptyTitle') }}</h3>
          <p>{{ filter === 'all' ? $t('partnerDashboard.items.emptyAllBody') : $t('partnerDashboard.items.emptyFilterBody') }}</p>
          <NuxtLink v-if="filter === 'all'" :to="langPrefix + '/partner/item'" class="pp-btn pp-btn-primary">
            {{ $t('partnerDashboard.items.addItem') }}
          </NuxtLink>
        </div>

        <div v-for="item in visibleItems" :key="item.hash_id" class="pp-card">
          <div class="pp-card-row">
            <img
              v-if="item.photos[0]"
              class="pp-card-thumb"
              :src="mediaUrl(item.photos[0].url)"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            />
            <div v-else class="pp-card-thumb"></div>
            <div class="pp-items-info">
              <p class="pp-card-title">{{ item.title }}</p>
              <p class="pp-card-meta">
                {{ [item.brand, item.size, item.category].filter(Boolean).join(' · ') }}
              </p>
              <div class="pp-items-prices">
                <span v-if="item.available_for_purchase && item.purchase_price_cents !== null" class="pp-items-price">
                  {{ $t('partnerDashboard.items.buyPrice', { amount: ppFormatPrice(item.purchase_price_cents) }) }}
                  <em v-if="item.member_purchase_price_cents !== null" class="pp-items-member">
                    {{ $t('partnerDashboard.items.membersPay', { amount: ppFormatPrice(item.member_purchase_price_cents) }) }}
                  </em>
                </span>
                <span v-if="item.available_for_rental && item.rental_price_2wk_cents !== null" class="pp-items-price">
                  {{ $t('partnerDashboard.items.rentPrice', { amount: ppFormatPrice(item.rental_price_2wk_cents) }) }}
                  <em v-if="item.member_rental_price_2wk_cents !== null" class="pp-items-member">
                    {{ $t('partnerDashboard.items.membersPay', { amount: ppFormatPrice(item.member_rental_price_2wk_cents) }) }}
                  </em>
                </span>
              </div>
            </div>
            <div class="pp-card-actions">
              <span class="pp-chip" :class="`pp-chip-${item.status}`">{{ statusLabel(item.status) }}</span>
              <NuxtLink
                :to="`${langPrefix}/partner/item?id=${item.hash_id}`"
                class="pp-btn pp-btn-ghost pp-btn-sm"
              >
                {{ canEditStatus(item.status) ? $t('partnerDashboard.items.edit') : $t('partnerDashboard.items.view') }}
              </NuxtLink>
            </div>
          </div>
          <div v-if="item.status === 'rejected' && item.rejection_reason" class="pp-items-rejected">
            <p class="pp-items-rejected-reason">
              <strong>{{ $t('partnerDashboard.items.rejectedLabel') }}</strong> {{ item.rejection_reason }}
            </p>
            <NuxtLink
              :to="`${langPrefix}/partner/item?id=${item.hash_id}`"
              class="pp-btn pp-btn-outline pp-btn-sm"
            >
              {{ $t('partnerDashboard.items.fixResubmit') }}
            </NuxtLink>
          </div>
        </div>
      </template>
    </PartnerPortalShell>
  </section>
</template>

<style>
.pp-items-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  font-family: 'Urbanist', sans-serif;
}
.pp-items-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.pp-items-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}
.pp-items-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 50px;
  border: 1px solid var(--pp-gray-light);
  background: #fff;
  color: var(--pp-gray);
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.pp-items-filter.is-active {
  border-color: var(--pp-magenta);
  color: var(--pp-magenta);
  background: #fff4fe;
}
.pp-items-filter-n {
  font-size: 11px;
  opacity: 0.75;
}
.pp-items-info {
  flex: 1;
  min-width: 200px;
}
.pp-items-prices {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 13px;
}
.pp-items-price {
  color: var(--pp-ink);
  font-weight: 600;
}
.pp-items-member {
  display: block;
  font-style: normal;
  font-weight: 400;
  color: var(--pp-magenta);
  font-size: 12px;
}
.pp-items-rejected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fee2e2;
}
.pp-items-rejected-reason {
  margin: 0;
  font-size: 13px;
  color: var(--pp-danger);
}
</style>
