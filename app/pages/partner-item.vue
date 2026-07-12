<script setup lang="ts">
// Partner PDP — /partner-item?id={hash_id} (CONTRACT §3.2 item detail).
// Mirrors the closet PDP's look (same webflow wrapper classes for the two-column
// layout + thumbnail rail) with simplified gallery mechanics and new-scope code
// style: composition API, $t() i18n, .pp- classes for everything new.
import type { PartnerItemDetail } from '~/composables/usePartnerCatalog'

const route = useRoute()
const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { hasActiveMembership } = useAuth()
const cart = usePartnerCart()

function getId(): string {
  const raw = route.query.id
  const v = Array.isArray(raw) ? raw[0] : raw
  return (v || '').toString().trim()
}

// ?id missing → back to the partner directory (same pattern as product.vue's SKU guard).
if (!getId()) {
  await navigateTo(isNL.value ? '/nl/partners' : '/partners')
}

// ============================================================
// STATE MACHINE: loading → ready | notfound
// ============================================================

const pageState = ref<'loading' | 'ready' | 'notfound'>('loading')
const item = ref<PartnerItemDetail | null>(null)

// ============================================================
// STATUS → BUTTON CONFIG (like product.vue's ITEM_STATUS_CONFIG;
// reserved/rented are shown but unreservable, per CONTRACT §1)
// ============================================================

const PP_STATUS_CONFIG: Record<string, { canReserve: boolean; labelKey: string }> = {
  available: { canReserve: true, labelKey: '' },
  reserved: { canReserve: false, labelKey: 'partner.pdp.statusReserved' },
  rented: { canReserve: false, labelKey: 'partner.pdp.statusRented' },
}

const statusConfig = computed(
  () =>
    PP_STATUS_CONFIG[item.value?.status || ''] || {
      canReserve: false,
      labelKey: 'partner.unavailable',
    },
)

// ============================================================
// GALLERY (simplified: thumb rails on desktop/tablet, arrows + dots on mobile)
// ============================================================

const photos = computed(() => (item.value?.photos || []).map((p) => p.url).filter(Boolean))
const currentIndex = ref(0)
const mainImage = computed(() => photos.value[currentIndex.value] || '')

function showImage(i: number) {
  const len = photos.value.length
  if (!len) return
  currentIndex.value = ((i % len) + len) % len
}

// ============================================================
// PRICING / DETAILS (all prices come from the API — never computed locally)
// ============================================================

const rentalWeeksText = computed(() => {
  const d = item.value
  if (!d?.rental_min_weeks || !d?.rental_max_weeks) return ''
  if (d.rental_min_weeks === d.rental_max_weeks) {
    return t('partner.pdp.rentalWeeksExact', { weeks: d.rental_min_weeks })
  }
  return t('partner.pdp.rentalWeeks', { min: d.rental_min_weeks, max: d.rental_max_weeks })
})

const detailRows = computed(() => {
  const d = item.value
  if (!d) return []
  return [
    { key: 'brand', label: t('partner.pdp.brand'), value: d.brand || '' },
    { key: 'size', label: t('partner.pdp.size'), value: d.size || '' },
    { key: 'category', label: t('partner.pdp.category'), value: d.category || '' },
    { key: 'condition', label: t('partner.pdp.condition'), value: d.condition || '' },
  ].filter((row) => row.value)
})

const partnerPath = computed(
  () => `${langPrefix.value}/partners/${encodeURIComponent(item.value?.partner?.slug || '')}`,
)
const termsPath = computed(() => `${partnerPath.value}#terms`)

// ============================================================
// RESERVE (cart is a stub this phase → 'coming soon' inline note)
// ============================================================

const reserveNote = ref<'' | 'not_ready' | 'added'>('')

function reserve(intent: 'purchase' | 'rental') {
  const d = item.value
  if (!d || !statusConfig.value.canReserve) return
  const result = cart.addItem({
    pp_id: d.hash_id,
    intent,
    title: d.title,
    partner_slug: d.partner?.slug || '',
    partner_name: d.partner?.name || '',
    image: photos.value[0] || '',
    price_cents: intent === 'purchase' ? d.purchase_price_cents : d.rental_price_2wk_cents,
    member_price_cents:
      intent === 'purchase' ? d.member_purchase_price_cents : d.member_rental_price_2wk_cents,
    hold_deposit_cents: d.hold_deposit_cents ?? null,
    addedAt: Date.now(),
  })
  if (result.success) {
    reserveNote.value = 'added'
    cart.openPanel()
  } else if (result.reason === 'not_ready') {
    reserveNote.value = 'not_ready'
  }
}

// ============================================================
// SEO — noindex, consistent with the closet PDP decision
// ============================================================

useHead({
  title: () =>
    item.value?.title ? `${item.value.title} | Dematerialized` : 'Partner Item | Dematerialized',
  meta: [{ name: 'robots', content: 'noindex' }],
})

// ============================================================
// INIT
// ============================================================

async function load() {
  const id = getId()
  if (!id) return
  pageState.value = 'loading'
  reserveNote.value = ''
  const detail = await fetchItemDetail(id)
  if (!detail) {
    pageState.value = 'notfound'
    return
  }
  item.value = detail
  currentIndex.value = 0
  pageState.value = 'ready'
}

watch(
  () => route.query.id,
  async () => {
    if (route.path !== '/partner-item' && route.path !== '/nl/partner-item') return
    if (!getId()) {
      await navigateTo(isNL.value ? '/nl/partners' : '/partners')
      return
    }
    item.value = null
    await load()
  },
)

onMounted(() => {
  load()
})
</script>

<template>
  <section class="full-page-section product pp-pdp">
    <div v-if="pageState === 'loading'" class="pp-pdp-loading">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="pageState === 'notfound'" class="pp-state">
      <h3>{{ $t('partner.pdp.notFoundTitle') }}</h3>
      <p>{{ $t('partner.pdp.notFoundBody') }}</p>
      <NuxtLink :to="`${langPrefix}/partners`" class="pp-btn pp-btn-outline">{{ $t('partner.pdp.backToPartners') }}</NuxtLink>
    </div>

    <div v-else-if="item" class="div-pdp-desktop-wrapper pp-pdp-wrapper">
      <!-- thumbnail rail (desktop) -->
      <div v-show="photos.length" class="div-pdp-sub-images-wrapper desktop">
        <div v-for="(url, idx) in photos" :key="'thumb-d-' + url" class="div-sub-image-background pp-pdp-thumb" :class="{ 'is-active': idx === currentIndex }" @click="showImage(idx)">
          <img class="pdp-sub-image pp-pdp-thumb-img" :src="url" :alt="item.title" loading="lazy" decoding="async">
        </div>
      </div>

      <!-- main image (kept visible on mobile via .pp-pdp-image-wrapper overrides) -->
      <div class="div-pdp-image-wrapper pp-pdp-image-wrapper">
        <img class="pdp-image pp-pdp-image" :src="mainImage || '/images/placeholder-pdp.png'" :alt="item.title" loading="lazy" decoding="async">
        <button v-show="photos.length > 1" class="pp-pdp-arrow pp-pdp-arrow-prev" :aria-label="$t('partner.pdp.prevPhoto')" @click="showImage(currentIndex - 1)">&#8249;</button>
        <button v-show="photos.length > 1" class="pp-pdp-arrow pp-pdp-arrow-next" :aria-label="$t('partner.pdp.nextPhoto')" @click="showImage(currentIndex + 1)">&#8250;</button>
        <div v-show="photos.length > 1" class="pp-pdp-dots">
          <button v-for="(url, idx) in photos" :key="'dot-' + url" class="pp-pdp-dot" :class="{ 'is-active': idx === currentIndex }" :aria-label="`photo ${idx + 1}`" @click="showImage(idx)"></button>
        </div>
      </div>

      <!-- thumbnail rail (tablet) -->
      <div v-show="photos.length" class="div-pdp-sub-images-wrapper tablet">
        <div v-for="(url, idx) in photos" :key="'thumb-t-' + url" class="div-sub-image-background pp-pdp-thumb" :class="{ 'is-active': idx === currentIndex }" @click="showImage(idx)">
          <img class="pdp-sub-image pp-pdp-thumb-img" :src="url" :alt="item.title" loading="lazy" decoding="async">
        </div>
      </div>

      <div class="div-section flex-vertical">
        <div class="div-content-wrapper pdp">
          <div class="div-pdp-name-wrapper">
            <div class="pp-pdp-badge-row">
              <PartnerBadge />
              <span class="pp-pdp-notice">{{ $t('partner.pdp.notice') }}</span>
            </div>
            <div class="heading-mobile align-left">{{ item.title }}</div>
            <div class="pp-pdp-partner-line">
              {{ $t('partner.soldBy') }}
              <NuxtLink :to="partnerPath" class="pp-pdp-partner-link">{{ item.partner.name }}</NuxtLink>
            </div>
          </div>

          <div v-show="detailRows.length" class="div-pdp-main-details">
            <div v-for="row in detailRows" :key="row.key" class="label-text">
              <div class="pdp-medium">{{ row.label }}</div>
              <div class="pdp-medium">:</div>
              <div class="paragraph-primary pdp">{{ row.value }}</div>
            </div>
          </div>

          <!-- pricing block: purchase and/or rental per capabilities; member prices
               straight from the API, shown only for active members (v-if gating) -->
          <div class="pp-pdp-pricing">
            <div v-if="item.available_for_purchase" class="pp-pdp-price-block">
              <div class="pp-pdp-price-heading">{{ $t('partner.pdp.buyLabel') }}</div>
              <div class="pp-price-row">
                <template v-if="hasActiveMembership && item.member_purchase_price_cents !== null">
                  <span class="pp-price-struck">{{ ppFormatPrice(item.purchase_price_cents) }}</span>
                  <span class="pp-price-member pp-pdp-price-big">{{ ppFormatPrice(item.member_purchase_price_cents) }}</span>
                  <span class="pp-price-label">{{ $t('partner.memberPrice') }}</span>
                </template>
                <template v-else>
                  <span class="pp-price-regular pp-pdp-price-big">{{ ppFormatPrice(item.purchase_price_cents) }}</span>
                </template>
              </div>
            </div>

            <div v-if="item.available_for_rental" class="pp-pdp-price-block">
              <div class="pp-pdp-price-heading">{{ $t('partner.pdp.rentLabel') }}</div>
              <div class="pp-price-row">
                <template v-if="hasActiveMembership && item.member_rental_price_2wk_cents !== null">
                  <span class="pp-price-struck">{{ ppFormatPrice(item.rental_price_2wk_cents) }}</span>
                  <span class="pp-price-member pp-pdp-price-big">{{ ppFormatPrice(item.member_rental_price_2wk_cents) }}</span>
                  <span class="pp-price-label">{{ $t('partner.memberPrice') }}</span>
                </template>
                <template v-else>
                  <span class="pp-price-regular pp-pdp-price-big">{{ ppFormatPrice(item.rental_price_2wk_cents) }}</span>
                </template>
                <span class="pp-price-label">{{ $t('partner.perTwoWeeks') }}</span>
              </div>
              <div v-if="rentalWeeksText" class="pp-pdp-price-sub">{{ rentalWeeksText }}</div>
              <div v-if="item.rental_deposit_cents" class="pp-pdp-price-sub">{{ $t('partner.pdp.rentalDeposit', { amount: ppFormatPrice(item.rental_deposit_cents) }) }}</div>
            </div>
          </div>

          <!-- hold deposit: authorised, not charged -->
          <div v-if="item.hold_deposit_cents" class="pp-pdp-hold-note">
            <strong>{{ $t('partner.pdp.holdTitle', { amount: ppFormatPrice(item.hold_deposit_cents) }) }}</strong>
            <p>{{ $t('partner.pdp.holdBody', { amount: ppFormatPrice(item.hold_deposit_cents) }) }}</p>
          </div>

          <!-- reserve actions -->
          <div class="pp-pdp-actions">
            <template v-if="statusConfig.canReserve">
              <button v-if="item.available_for_purchase" class="pp-btn pp-btn-primary pp-pdp-btn" @click="reserve('purchase')">{{ $t('partner.reserveToBuy') }}</button>
              <button v-if="item.available_for_rental" class="pp-btn pp-btn-outline pp-pdp-btn" @click="reserve('rental')">{{ $t('partner.reserveToRent') }}</button>
              <div v-if="reserveNote === 'not_ready'" class="pp-pdp-inline-note">{{ $t('partner.pdp.comingSoon') }}</div>
              <div v-else-if="reserveNote === 'added'" class="pp-msg-success">{{ $t('partner.pdp.added') }}</div>
              <div class="pp-pdp-hold-window">{{ $t('partner.holdWindow') }}</div>
            </template>
            <button v-else class="pp-btn pp-btn-primary pp-pdp-btn" disabled>{{ $t(statusConfig.labelKey || 'partner.unavailable') }}</button>
          </div>

          <!-- pickup info -->
          <div class="pp-card pp-pdp-pickup">
            <div class="pp-pdp-pickup-title">{{ $t('partner.pdp.pickupTitle') }}</div>
            <div class="pp-card-meta pp-pdp-pickup-line">{{ item.partner.name }}</div>
            <div v-if="item.partner.address" class="pp-card-meta pp-pdp-pickup-line">{{ item.partner.address }}</div>
            <div v-if="item.partner.pickup_instructions" class="pp-card-meta pp-pdp-pickup-line">{{ item.partner.pickup_instructions }}</div>
            <div class="pp-pdp-pay-note">{{ $t('partner.pdp.payAtStore') }}</div>
          </div>

          <div v-if="item.description" class="div-pdp-more-details">
            <div class="paragraph-primary _14px pp-pdp-description">{{ item.description }}</div>
          </div>

          <NuxtLink :to="termsPath" class="pp-pdp-terms-link">{{ $t('partner.pdp.viewTerms', { name: item.partner.name }) }}</NuxtLink>
        </div>
      </div>
    </div>

    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
/* Partner PDP — page-specific styles, .pp- scope only */
.pp-pdp-loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- gallery --- */
.pp-pdp-thumb {
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
}
.pp-pdp-thumb.is-active {
  outline: 0.5px solid #24282d;
  border-radius: 20px;
}
.pp-pdp-thumb-img {
  display: block;
  width: 80%;
  height: auto;
  border-radius: 20px;
}
.pp-pdp-image-wrapper {
  position: relative;
}
.pp-pdp-image {
  object-fit: contain;
}
.pp-pdp-arrow {
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--pp-ink);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.pp-pdp-arrow-prev { left: 10px; }
.pp-pdp-arrow-next { right: 10px; }
.pp-pdp-dots {
  display: none;
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  gap: 6px;
}
.pp-pdp-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--pp-gray-light);
  cursor: pointer;
}
.pp-pdp-dot.is-active {
  background: var(--pp-ink);
}
@media (max-width: 767px) {
  /* the global sheet hides .div-pdp-image-wrapper/.pdp-image on mobile (the closet
     PDP swaps in a slider there); this simplified gallery stays, full-width */
  .div-pdp-image-wrapper.pp-pdp-image-wrapper {
    display: flex;
    width: calc(100% - 32px);
    max-height: 70svh;
    margin: 12px auto 0;
  }
  .pdp-image.pp-pdp-image {
    display: block;
    aspect-ratio: auto;
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 60svh;
    padding: 1rem;
  }
  .pp-pdp-arrow {
    display: inline-flex;
  }
  .pp-pdp-dots {
    display: flex;
  }
}

/* --- header bits --- */
.pp-pdp-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  font-family: 'Urbanist', sans-serif;
}
.pp-pdp-badge-row .pp-badge {
  position: static;
}
.pp-pdp-notice {
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-pdp-partner-line {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  color: var(--pp-gray);
  margin-top: 8px;
}
.pp-pdp-partner-link {
  color: var(--pp-magenta);
  font-weight: 600;
  text-decoration: underline;
}

/* --- pricing --- */
.pp-pdp-pricing {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
  font-family: 'Urbanist', sans-serif;
}
.pp-pdp-price-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pp-pdp-price-heading {
  font-size: 13px;
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: 0.04em;
  color: var(--pp-gray);
}
.pp-pdp-price-big {
  font-size: 22px;
}
.pp-pdp-price-sub {
  font-size: 13px;
  color: var(--pp-gray);
}

/* --- hold deposit note --- */
.pp-pdp-hold-note {
  background: var(--pp-bg-light);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  max-width: 440px;
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-pdp-hold-note strong {
  color: var(--pp-ink);
}
.pp-pdp-hold-note p {
  margin: 4px 0 0;
}

/* --- actions --- */
.pp-pdp-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 24px;
}
.pp-pdp-btn {
  width: 300px;
  padding: 14px 20px;
  font-size: 17px;
  text-transform: lowercase;
}
.pp-pdp-inline-note {
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  color: var(--pp-warning);
}
.pp-pdp-hold-window {
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  color: var(--pp-gray);
}
@media (max-width: 767px) {
  .pp-pdp-btn {
    width: 100%;
  }
}

/* --- pickup card --- */
.pp-pdp-pickup {
  max-width: 440px;
  margin-bottom: 24px;
}
.pp-pdp-pickup-title {
  font-weight: 700;
  font-size: 15px;
  text-transform: lowercase;
  margin-bottom: 6px;
}
.pp-pdp-pickup-line {
  margin-bottom: 2px;
  white-space: pre-wrap;
}
.pp-pdp-pay-note {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pp-magenta);
}

/* --- description + terms link --- */
.pp-pdp-description {
  white-space: pre-wrap;
}
.pp-pdp-terms-link {
  display: inline-block;
  margin-top: 16px;
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  color: var(--pp-gray);
  text-decoration: underline;
}
.pp-pdp-terms-link:hover {
  color: var(--pp-ink);
}
</style>
