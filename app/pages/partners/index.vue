<script setup lang="ts">
// Partner directory — /partners (CONTRACT §3.2 GET /public/partners).
// Client-side state machine; when the availability probe fails or the fetch
// degrades, the page stays functional with a gentle "coming soon" state.
import type { PartnerDirectoryEntry } from '~/composables/usePartnerCatalog'

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const langPrefix = computed(() => (isNL.value ? '/nl' : ''))
const { probe, enabled } = usePartnerPlatform()

const pageState = ref<'loading' | 'ready' | 'unavailable'>('loading')
const partners = ref<PartnerDirectoryEntry[]>([])

useHead({
  title: 'Partner Shops | Dematerialized',
  meta: [
    {
      name: 'description',
      content: 'Independent local shops on Dematerialized — reserve online, try on and pay in store.',
    },
  ],
})

async function load() {
  pageState.value = 'loading'
  await probe()
  if (!enabled.value) {
    pageState.value = 'unavailable'
    return
  }
  const list = await fetchPartnerDirectory()
  if (!list.length) {
    // [] covers both "no partners yet" and a degraded fetch — same gentle state.
    pageState.value = 'unavailable'
    return
  }
  partners.value = list
  pageState.value = 'ready'
}

onMounted(() => {
  load()
})
</script>

<template>
  <section class="full-page-section pp-directory">
    <div class="pp-directory-hero">
      <h1 class="heading-mobile align-left large pp-directory-heading">{{ $t('partner.directory.title') }}</h1>
      <p class="pp-directory-subtitle">{{ $t('partner.directory.subtitle') }}</p>
    </div>

    <div v-if="pageState === 'loading'" class="pp-directory-loading">
      <div class="pp-spinner"></div>
    </div>

    <div v-else-if="pageState === 'unavailable'" class="pp-state">
      <h3>{{ $t('partner.directory.comingSoonTitle') }}</h3>
      <p>{{ $t('partner.directory.comingSoonBody') }}</p>
    </div>

    <div v-else class="pp-directory-grid">
      <NuxtLink v-for="p in partners" :key="p.hash_id" :to="`${langPrefix}/partners/${encodeURIComponent(p.slug)}`" class="pp-directory-card">
        <div class="pp-directory-photo">
          <img v-if="p.photo_url" :src="p.photo_url" :alt="p.name" loading="lazy" decoding="async">
          <div v-else class="pp-directory-photo-empty">{{ (p.name || '?').charAt(0) }}</div>
        </div>
        <div class="pp-directory-card-body">
          <div class="pp-directory-name">{{ p.name }}</div>
          <div v-if="p.address" class="pp-directory-address">{{ p.address }}</div>
          <div class="pp-directory-count">{{ $t('partner.directory.itemCount', p.item_count || 0) }}</div>
        </div>
      </NuxtLink>
    </div>

    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
/* Partner directory — page-specific styles, .pp- scope only */
.pp-directory {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 64px;
  font-family: 'Urbanist', sans-serif;
}
.pp-directory-heading {
  margin: 0;
}
.pp-directory-subtitle {
  color: var(--pp-gray);
  font-size: 16px;
  max-width: 560px;
  margin: 10px 0 0;
}
.pp-directory-loading {
  min-height: 30vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-directory-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 36px;
}
@media (max-width: 991px) {
  .pp-directory-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .pp-directory-grid {
    grid-template-columns: 1fr;
  }
}
.pp-directory-card {
  display: block;
  background: #fff;
  border: 1px solid var(--pp-gray-light);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: var(--pp-ink);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.pp-directory-card:hover {
  box-shadow: 0 6px 24px rgba(36, 40, 45, 0.08);
  transform: translateY(-2px);
}
.pp-directory-photo {
  aspect-ratio: 3 / 2;
  background: var(--pp-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pp-directory-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pp-directory-photo-empty {
  font-size: 44px;
  font-weight: 700;
  color: var(--pp-gray-light);
  text-transform: lowercase;
}
.pp-directory-card-body {
  padding: 16px 18px 18px;
}
.pp-directory-name {
  font-size: 18px;
  font-weight: 700;
  text-transform: lowercase;
}
.pp-directory-address {
  color: var(--pp-gray);
  font-size: 14px;
  margin-top: 2px;
}
.pp-directory-count {
  color: var(--pp-magenta);
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
}
</style>
