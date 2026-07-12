<script setup lang="ts">
// Partner storefront — /partners/{slug} (CONTRACT §3.2 GET /public/partners/{slug}
// + /terms). The partner API is client-reachable only in dev, so this follows the
// catalog's client fetch-on-mounted pattern rather than blog/[slug].vue's SSR
// useAsyncData: SSR renders the loading state and can never hard-crash when the
// API is down. Unknown slug → real 404 (fetchStorefront resolves null only then);
// transport failure → gentle error/retry state.
import type {
  PartnerMappedItem,
  PartnerStorefront,
  PartnerTermsDoc,
} from '~/composables/usePartnerCatalog'

const route = useRoute()
const { locale, t } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))

const slug = computed(() => String(route.params.slug || ''))

const pageState = ref<'loading' | 'ready' | 'error'>('loading')
const store = ref<PartnerStorefront | null>(null)
const terms = ref<PartnerTermsDoc[]>([])

useHead({
  title: () =>
    store.value?.name ? `${store.value.name} | Dematerialized` : 'Partner Shop | Dematerialized',
})

const cards = computed<PartnerMappedItem[]>(() => (store.value?.items || []).map(mapToCatalogItem))
const hours = computed(() => store.value?.hours || [])

function itemPath(ppId: string): string {
  return `${langPrefix.value}/partner-item?id=${encodeURIComponent(ppId)}`
}

// Card price line — non-member prices (member pricing lives on the PDP), plus the
// unreservable statuses shown like closet items.
function cardMeta(c: PartnerMappedItem): string {
  const parts: string[] = []
  if (c.available_for_purchase && c.purchase_price_cents !== null) {
    parts.push(ppFormatPrice(c.purchase_price_cents))
  }
  if (c.available_for_rental && c.rental_price_2wk_cents !== null) {
    parts.push(`${ppFormatPrice(c.rental_price_2wk_cents)} ${t('partner.perTwoWeeks')}`)
  }
  if (c.status === 'reserved') parts.push(t('partner.pdp.statusReserved'))
  if (c.status === 'rented') parts.push(t('partner.pdp.statusRented'))
  return parts.join(' · ')
}

function termDate(doc: PartnerTermsDoc): string {
  return (doc.effective_from || '').slice(0, 10)
}

async function load() {
  if (!slug.value) return
  pageState.value = 'loading'
  try {
    const [sf, termDocs] = await Promise.all([
      fetchStorefront(slug.value),
      fetchPartnerTerms(slug.value),
    ])
    if (!sf) {
      // Unknown slug — a real 404, same outcome as blog/[slug].vue's createError.
      showError(createError({ statusCode: 404, statusMessage: 'Partner not found', fatal: true }))
      return
    }
    store.value = sf
    terms.value = termDocs
    pageState.value = 'ready'
    if (route.hash === '#terms') {
      await nextTick()
      document.getElementById('terms')?.scrollIntoView({ behavior: 'smooth' })
    }
  } catch {
    // API unreachable — degrade, never crash.
    pageState.value = 'error'
  }
}

watch(
  () => route.params.slug,
  () => {
    if (!slug.value) return
    if (!route.path.includes('/partners/')) return
    store.value = null
    load()
  },
)

onMounted(() => {
  load()
})
</script>

<template>
  <section class="full-page-section pp-storefront">
    <div v-if="pageState === 'loading'" class="pp-storefront-loading">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="pageState === 'error'" class="pp-state">
      <h3>{{ $t('partner.storefront.errorTitle') }}</h3>
      <p>{{ $t('partner.storefront.errorBody') }}</p>
      <button class="pp-btn pp-btn-outline" @click="load()">{{ $t('partner.storefront.retry') }}</button>
    </div>

    <template v-else-if="store">
      <NuxtLink :to="`${langPrefix}/partners`" class="pp-storefront-back">&#8249; {{ $t('partner.storefront.backToPartners') }}</NuxtLink>

      <div class="pp-storefront-head">
        <h1 class="heading-mobile align-left large pp-storefront-heading">{{ store.name }}</h1>
        <PartnerBadge />
      </div>

      <div v-if="store.member_discount_pct > 0" class="pp-storefront-callout">
        {{ $t('partner.storefront.memberDiscount', { pct: store.member_discount_pct }) }}
      </div>

      <div v-if="store.photos && store.photos.length" class="pp-storefront-photos">
        <img v-for="(url, i) in store.photos" :key="url + i" :src="url" :alt="`${store.name} — photo ${i + 1}`" loading="lazy" decoding="async">
      </div>

      <div class="pp-storefront-info">
        <div v-if="store.about" class="pp-storefront-block">
          <div class="pp-storefront-block-title">{{ $t('partner.storefront.aboutTitle') }}</div>
          <div class="pp-storefront-about">{{ store.about }}</div>
        </div>
        <div class="pp-storefront-block">
          <template v-if="hours.length">
            <div class="pp-storefront-block-title">{{ $t('partner.storefront.hoursTitle') }}</div>
            <table class="pp-storefront-hours">
              <tbody>
                <tr v-for="(h, i) in hours" :key="h.day + i">
                  <td class="pp-storefront-day">{{ h.day }}</td>
                  <td>{{ h.open }} – {{ h.close }}</td>
                </tr>
              </tbody>
            </table>
          </template>
          <template v-if="store.address">
            <div class="pp-storefront-block-title pp-storefront-block-gap">{{ $t('partner.storefront.addressTitle') }}</div>
            <div class="pp-storefront-text">{{ store.address }}</div>
          </template>
          <template v-if="store.pickup_instructions">
            <div class="pp-storefront-block-title pp-storefront-block-gap">{{ $t('partner.storefront.pickupTitle') }}</div>
            <div class="pp-storefront-text">{{ store.pickup_instructions }}</div>
          </template>
        </div>
      </div>

      <div class="pp-storefront-block-title pp-storefront-items-title">{{ $t('partner.storefront.itemsTitle') }}</div>
      <div v-if="!cards.length" class="pp-state">
        <p>{{ $t('partner.storefront.itemsEmpty') }}</p>
      </div>
      <div v-else data-grid="products" class="div-clothing-wrapper pp-storefront-grid">
        <div v-for="c in cards" :key="c.pp_id" class="div-clothing-item-wrapper">
          <PartnerBadge />
          <NuxtLink :to="itemPath(c.pp_id)" class="div-clothing-image-wrapper w-inline-block">
            <img class="clothing-image back" :src="c.back_image || c.front_image || ''" :alt="`${c.name} — back`" loading="lazy" decoding="async">
            <img class="clothing-image front" :src="c.front_image || ''" :alt="`${c.name} — front`" loading="lazy" decoding="async">
          </NuxtLink>
          <div class="div-clothing-item-text">
            <div class="clohting-item-heading">{{ c.name }}</div>
            <div class="clothing-item-text pp-storefront-price">{{ cardMeta(c) }}</div>
          </div>
        </div>
      </div>

      <section id="terms" class="pp-storefront-terms">
        <div class="pp-storefront-block-title">{{ $t('partner.storefront.termsTitle') }}</div>
        <div v-if="!terms.length" class="pp-storefront-text">{{ $t('partner.storefront.termsEmpty') }}</div>
        <article v-for="doc in terms" :key="doc.hash_id" class="pp-card pp-storefront-term">
          <div class="pp-storefront-term-head">
            <span class="pp-chip">{{ doc.type }}</span>
            <span class="pp-card-meta">{{ $t('partner.storefront.termsVersion', { version: doc.version, date: termDate(doc) || '—' }) }}</span>
          </div>
          <div v-if="doc.body_text" class="pp-storefront-term-body">{{ doc.body_text }}</div>
          <a v-if="doc.pdf_url" :href="doc.pdf_url" target="_blank" rel="noopener" class="pp-btn pp-btn-ghost pp-btn-sm">{{ $t('partner.storefront.downloadPdf') }}</a>
        </article>
      </section>
    </template>

    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
/* Partner storefront — page-specific styles, .pp- scope only */
.pp-storefront {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  font-family: 'Urbanist', sans-serif;
  color: var(--pp-ink);
}
.pp-storefront-loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-storefront-back {
  display: inline-block;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--pp-gray);
  text-decoration: none;
}
.pp-storefront-back:hover {
  color: var(--pp-ink);
}
.pp-storefront-head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.pp-storefront-heading {
  margin: 0;
}
.pp-storefront-head .pp-badge {
  position: static;
}
.pp-storefront-callout {
  display: inline-block;
  margin-top: 14px;
  padding: 6px 16px;
  border: 1px dashed var(--pp-magenta);
  border-radius: 50px;
  background: #fff4fe;
  color: var(--pp-magenta);
  font-size: 14px;
  font-weight: 600;
}
.pp-storefront-photos {
  display: flex;
  gap: 12px;
  margin: 24px 0 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.pp-storefront-photos::-webkit-scrollbar {
  display: none;
}
.pp-storefront-photos img {
  flex: 0 0 auto;
  height: 200px;
  border-radius: 16px;
  object-fit: cover;
}
.pp-storefront-info {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
  margin: 24px 0 40px;
}
@media (max-width: 767px) {
  .pp-storefront-info {
    grid-template-columns: 1fr;
  }
}
.pp-storefront-block-title {
  font-size: 15px;
  font-weight: 700;
  text-transform: lowercase;
  color: var(--pp-gray);
  margin: 0 0 8px;
}
.pp-storefront-block-gap {
  margin-top: 18px;
}
.pp-storefront-about,
.pp-storefront-text {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.pp-storefront-hours {
  border-collapse: collapse;
  font-size: 14px;
}
.pp-storefront-hours td {
  padding: 3px 18px 3px 0;
}
.pp-storefront-day {
  color: var(--pp-gray);
  text-transform: lowercase;
}
.pp-storefront-items-title {
  margin-top: 8px;
}
.pp-storefront-grid {
  margin-top: 16px;
}
.pp-storefront-price {
  color: var(--pp-gray);
}
.pp-storefront-terms {
  margin-top: 56px;
}
.pp-storefront-term-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.pp-storefront-term-body {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px;
}
</style>
