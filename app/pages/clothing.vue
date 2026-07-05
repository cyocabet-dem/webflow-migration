<script setup lang="ts">
useHead({
  title: 'Shop The Collection | Dematerialized',
  meta: [
    {
      name: 'description',
      content:
        'Discover a unique mix of local donations and curated pieces for women. New arrivals every week in all sizes. Visit our showroom in Den Bosch or explore the full collection online.',
    },
    { property: 'og:title', content: 'Shop The Collection | Dematerialized' },
    {
      property: 'og:description',
      content:
        'Discover a unique mix of local donations and curated pieces for women. New arrivals every week in all sizes. Visit our showroom in Den Bosch or explore the full collection online.',
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/clothing-meta.png',
    },
    { name: 'twitter:title', content: 'Shop The Collection | Dematerialized' },
    {
      name: 'twitter:description',
      content:
        'Discover a unique mix of local donations and curated pieces for women. New arrivals every week in all sizes. Visit our showroom in Den Bosch or explore the full collection online.',
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/clothing-meta.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: `{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "All Clothing",
  "url": "/clothing",
  "inLanguage": "en",
  "description": "Browse our complete collection of women's clothing including blazers, dresses, jeans, jumpsuits, knitwear, matching sets, outerwear, pants, shorts, skirts, sport, and tops. New arrivals every week in all sizes.",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Dematerialized",
    "url": "/"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Clothing",
        "item": "/clothing"
      }
    ]
  },
  "about": {
    "@type": "Store",
    "name": "Dematerialized",
    "description": "Unique mix of local donations and curated pieces for women with new arrivals every week in all sizes",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Den Bosch"
    }
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "/clothing?page=1&limit=20&categories={category}"
    },
    "query-input": "required name=category"
  }
}`,
    },
  ],
})

const {
  isNL,
  loaded,
  loadError,
  currentPage,
  searchInputValue,
  selected,
  totalPages,
  pageItems,
  sections,
  extraOptions,
  activeFilterCount,
  statusAvailableCount,
  applyBtnText,
  chips,
  productPath,
  cardMeta,
  statusClass,
  init,
  onFilterChange,
  removeChip,
  handleSearch,
  handleResetAll,
  prevPage,
  nextPage,
  loadWishlist,
  isInWishlist,
  toggleWishlist,
} = useCatalog()

// ============================================================
// FILTER PANEL: OPEN / CLOSE + SECTION TOGGLES
// ============================================================

const panelOpen = ref(false)
const openSections = reactive<Record<string, boolean>>({})

const panelSections: Array<{ type: string; title: string; id?: string; extra: boolean }> = [
  { type: 'category', title: 'category', extra: false },
  { type: 'subcategory', title: 'type', id: 'filter-section-subcategory', extra: false },
  { type: 'size', title: 'size', id: 'filter-section-size', extra: false },
  { type: 'color', title: 'color', extra: false },
  ...EXTRA_FILTERS.map((def) => ({
    type: def.type as string,
    title: def.label as string,
    id: `filter-section-${def.type}`,
    extra: true,
  })),
]

function openFilterPanel() {
  panelOpen.value = true
  document.body.classList.add('filter-panel-open')
}

function closeFilterPanel() {
  panelOpen.value = false
  document.body.classList.remove('filter-panel-open')
}

function toggleSection(type: string) {
  openSections[type] = !openSections[type]
}

// ============================================================
// SEARCH: debounce + clear + mobile expand/collapse
// ============================================================

const searchInputEl = ref<HTMLInputElement | null>(null)
let searchDebounce: ReturnType<typeof setTimeout> | undefined

function onSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => handleSearch(searchInputValue.value), 300)
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    clearTimeout(searchDebounce)
    handleSearch(searchInputValue.value)
  }
  if (e.key === 'Escape') {
    searchInputValue.value = ''
    handleSearch('')
  }
}

async function onSearchClear() {
  searchInputValue.value = ''
  await handleSearch('')
  // Collapse mobile search
  if (window.innerWidth <= 767) {
    searchExpanded.value = false
  }
}

// ============================================================
// MOBILE SEARCH: tap icon to expand, click outside to collapse
// (the old JS moved .search-container to be a direct child of
// .full-page-section on mobile — reproduced with v-if placement)
// ============================================================

const isMobile = ref(false)
const searchExpanded = ref(false)

function onResize() {
  isMobile.value = window.innerWidth <= 767
  if (!isMobile.value) searchExpanded.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (!isMobile.value) return
  const target = e.target as Element | null
  if (!target || typeof target.closest !== 'function') return

  // Tap search icon pill → expand
  const icon = target.closest('.search-icon')
  if (icon && !searchExpanded.value) {
    e.preventDefault()
    e.stopPropagation()
    searchExpanded.value = true
    requestAnimationFrame(() => searchInputEl.value?.focus())
    return
  }

  // If expanded, tap outside search → collapse
  if (searchExpanded.value && !target.closest('.search-container')) {
    searchExpanded.value = false
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (panelOpen.value) closeFilterPanel()
  if (isMobile.value && searchExpanded.value) {
    searchExpanded.value = false
  }
}

onMounted(() => {
  isMobile.value = window.innerWidth <= 767
  window.addEventListener('resize', onResize)
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
  loadWishlist()
  init()
})

onBeforeUnmount(() => {
  clearTimeout(searchDebounce)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
  document.body.classList.remove('filter-panel-open')
})
</script>

<template>
  <div>
    <section class="full-page-section">
      <div class="div-filter-section">
        <div class="div-filter-wrapper">
          <div id="data-filter-open" data-filter-open="" class="data-filter-open" @click.prevent="openFilterPanel">
            <div class="icon-filter-menu w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu-icon lucide-menu">
                <path d="M4 5h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 19h16"></path>
              </svg></div>
            <div class="paragraph-primary filter-menu">Filter</div>
          </div>
          <div class="code-embed-34 w-embed">
            <div v-if="!isMobile" class="search-container" :class="{ 'is-expanded': searchExpanded }">
              <div class="search-wrapper">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input ref="searchInputEl" v-model="searchInputValue" type="text" data-search="input" class="search-input" placeholder="search..." @input="onSearchInput" @keydown="onSearchKeydown">
                <button data-search="clear" class="search-clear" aria-label="Clear search" :style="{ display: searchInputValue ? 'block' : 'none' }" @click="onSearchClear">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isMobile" class="search-container" :class="{ 'is-expanded': searchExpanded }">
        <div class="search-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input ref="searchInputEl" v-model="searchInputValue" type="text" data-search="input" class="search-input" placeholder="search..." @input="onSearchInput" @keydown="onSearchKeydown">
          <button data-search="clear" class="search-clear" aria-label="Clear search" :style="{ display: searchInputValue ? 'block' : 'none' }" @click="onSearchClear">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>
    <div class="div-clothing-section">
      <div class="filter-chips-bar" :class="{ 'has-chips': chips.length > 0 }">
        <button v-for="chip in chips" :key="`${chip.type}-${chip.value}`" class="filter-chip" :data-chip-type="chip.type" :data-chip-value="chip.value" @click="removeChip(chip.type, chip.value)">
          {{ chip.value }}
          <span class="filter-chip-x">&times;</span>
        </button>
      </div>
      <div data-grid="products" class="div-clothing-wrapper">
        <p v-if="loadError" style="grid-column: 1/-1; text-align: center; padding: 40px 0; font-family: Urbanist, sans-serif; color: #a86b9c;">could not load catalog. please refresh the page.</p>
        <p v-else-if="loaded && pageItems.length === 0" style="grid-column: 1/-1; text-align: center; padding: 40px 0; font-family: Urbanist, sans-serif; font-weight: 300; color: #a86b9c;">{{ isNL ? 'geen items gevonden.' : 'no items found.' }}</p>
        <div v-for="(item, i) in pageItems" :key="item.id ?? item.sku ?? i" class="div-clothing-item-wrapper" :data-sku="item.sku" :data-name="item.name" :data-item-id="item.id" :data-status="item.status || 'available'">
          <div class="div-wish-list-wrapper" data-wishlist-bound="true" @click.prevent.stop="toggleWishlist(item.id)">
            <div class="heart-icon-outline-20px w-embed" :style="{ display: isInWishlist(item.id) ? 'none' : 'block' }"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M442.9 128C410.5 128 380 143.6 361 169.9L333 208.6C330 212.8 325.2 215.2 320 215.2C314.8 215.2 310 212.7 307 208.6L279 169.9L279 169.9C260 143.6 229.5 128 197.1 128C141.2 128 96 173.3 96 229.1C96 284.1 130.4 336.2 167.8 381.6C209.9 432.8 261.2 477.6 296.3 504.5C302.5 509.3 310.7 512 320 512C329.3 512 337.4 509.3 343.7 504.5C378.8 477.7 430.1 432.8 472.2 381.6C509.5 336.2 544 284.1 544 229.1C544 173.2 498.7 128 442.9 128zM335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1C576 296.5 534.4 356.4 496.9 401.9C452.8 455.5 399.6 502 363.1 529.8C350.7 539.2 335.5 543.9 320 543.9C304.5 543.9 289.2 539.3 276.9 529.8C240.4 502 187.2 455.5 143.1 402C105.6 356.4 64 296.5 64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1L320 171.8L335 151.1z"></path>
              </svg></div>
            <div class="heart-icon-filled-20px w-embed" :style="{ display: isInWishlist(item.id) ? 'block' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path fill="#000000" d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"></path>
              </svg></div>
            <div class="heart-icon-wrapper"></div>
          </div>
          <a id="w-node-_2469b4f2-f406-0ebe-03c3-cec18917dfdf-e74571a7" :href="productPath(item.sku)" class="div-clothing-image-wrapper w-inline-block"><img class="clothing-image back" :src="item.back_image || item.front_image || ''" :alt="`${item.name} — back`" data-field="backImage" loading="lazy" decoding="async"><img class="clothing-image front" :src="item.front_image || ''" :alt="`${item.name} — front`" data-field="frontImage" loading="lazy" decoding="async"></a>
          <div class="div-clothing-item-text">
            <div data-field="name" class="clohting-item-heading">{{ item.name || item.sku }}</div>
            <div data-field="meta" class="clothing-item-text" :class="statusClass(item)">{{ cardMeta(item) }}</div>
          </div>
        </div>
      </div>
      <div class="div-pagination w-embed">
        <div data-pager="" class="pager">
          <button type="button" data-page="prev" aria-label="Previous page" :disabled="currentPage <= 1" @click="prevPage">Prev</button>
          <span data-page="label">{{ currentPage }} / {{ totalPages }}</span>
          <button type="button" data-page="next" aria-label="Next page" :disabled="currentPage >= totalPages" @click="nextPage">Next</button>
        </div>
      </div>
    </div>
    <div id="filter-panel-backdrop" class="filter-panel-backdrop" :class="{ 'is-open': panelOpen }" @click="closeFilterPanel"></div>
    <div id="filter-panel" class="filter-panel" :class="{ 'is-open': panelOpen }">
      <div class="filter-panel-header">
        <div class="filter-panel-header-left">
          <span class="filter-panel-title">filters</span>
          <span v-show="activeFilterCount > 0" id="filter-active-count" class="filter-active-count">{{ activeFilterCount }}</span>
        </div>
        <button id="filter-panel-close-btn" class="filter-panel-close" @click="closeFilterPanel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div id="filter-panel-body" class="filter-panel-body">
        <label id="filter-status-row" class="filter-status-row">
          <input type="checkbox" data-filter="status" value="available" :checked="selected.status.includes('available')" @change="onFilterChange('status', 'available', ($event.target as HTMLInputElement).checked)">
          <span class="filter-status-label">show available only</span>
          <span id="filter-status-available-count" class="filter-status-count">{{ loaded ? statusAvailableCount : '' }}</span>
        </label>
        <div v-for="sec in panelSections" v-show="!sec.extra || extraOptions[sec.type].length > 0" :id="sec.id" :key="sec.type" class="filter-section" :data-section="sec.type">
          <button class="filter-section-header" :class="{ 'is-collapsed': !openSections[sec.type] }" :data-toggle="sec.type" @click.prevent="toggleSection(sec.type)">
            <span class="filter-section-title">{{ sec.title }}</span>
            <svg class="filter-section-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="filter-section-content" :class="{ 'is-open': openSections[sec.type] }" :data-list="sec.type">
            <div v-if="sections[sec.type].empty" class="filter-section-empty">no options available</div>
            <template v-else>
              <label v-for="row in sections[sec.type].rows" :key="row.name" class="filter-row">
                <input type="checkbox" :value="row.name" :data-filter="sec.type" :data-id="row.id" :data-category-id="row.category_id" :checked="row.checked" @change="onFilterChange(sec.type, row.name, ($event.target as HTMLInputElement).checked)">
                <span class="filter-row-label">{{ row.name }}</span>
                <span class="filter-row-count">{{ row.count }}</span>
              </label>
            </template>
          </div>
        </div>
      </div>
      <div class="filter-panel-footer">
        <button id="filter-panel-reset-btn" class="filter-panel-reset" @click="handleResetAll">reset all</button>
        <button id="filter-panel-apply-btn" class="filter-panel-apply" @click="closeFilterPanel">{{ applyBtnText }}</button>
      </div>
    </div>
  </div>
</template>

<style>
/* ============================================
   CLOTHING PAGE STYLES
   Filter panel + product grid + search
   Dematerialized — clean, on-brand
   ============================================ */
/* Hide ONLY the template card in Designer/Publish */
.is-template {
  display: none !important;
}
/* PDP hover image swap */
.div-clothing-image-wrapper {
  position: relative;
  overflow: hidden;
}
.item-card__img.is-front,
.item-card__img.is-back {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity .25s ease;
  display: block;
}
.item-card__img.is-front { opacity: 1; }
.item-card__img.is-back  { opacity: 0; }
.item-card:hover .item-card__img.is-front { opacity: 0; }
.item-card:hover .item-card__img.is-back  { opacity: 1; }
/* Card hover image swap (was Webflow IX2: hide .clothing-image.front on hover) */
.div-clothing-image-wrapper:hover .clothing-image.front { display: none; }
/* ============================================
   FILTER PANEL - SLIDE-OUT FROM RIGHT
   ============================================ */
.filter-panel-backdrop {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(70, 83, 94, 0.35);
  z-index: 9998;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.filter-panel-backdrop.is-open {
  display: block;
  opacity: 1;
}
.filter-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100%;
  background: #fff;
  box-shadow: -6px 0 32px rgba(70, 83, 94, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.filter-panel.is-open {
  transform: translateX(0);
}
/* Header */
.filter-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px 24px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  background: #fff;
}
.filter-panel-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-panel-title {
  font-family: 'Urbanist', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #24282d;
  text-transform: lowercase;
  letter-spacing: 1px;
}
.filter-active-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  background: #a92296;
  color: #fff;
  font-family: 'Urbanist', sans-serif;
  font-size: 13px;
  font-weight: 700;
  border-radius: 50px;
}
.filter-panel-close {
  background: none;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #24282d;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
}
.filter-panel-close:hover {
  background: #f5f5f5;
  border-color: #999;
}
/* Scrollable Body */
.filter-panel-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0;
}
/* Filter Sections */
.filter-section {
  border-bottom: 1px solid #eee;
}
.filter-section:last-child {
  border-bottom: none;
}
.filter-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 20px 32px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}
.filter-section-header:hover {
  background: #f9f9f9;
}
.filter-section-title {
  font-family: 'Urbanist', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #24282d;
  text-transform: lowercase;
  letter-spacing: 0.5px;
}
.filter-section-chevron {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: #999;
  flex-shrink: 0;
}
.filter-section-header.is-collapsed .filter-section-chevron {
  transform: rotate(-90deg);
}
/* Section Content — closed by default */
.filter-section-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), padding 0.35s ease;
  padding: 0 32px;
}
.filter-section-content.is-open {
  max-height: 800px;
  padding: 0 32px 20px;
}
/* Checkbox Row */
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  cursor: pointer;
  transition: color 0.15s ease;
}
.filter-row:hover .filter-row-label {
  color: #a92296;
}
.filter-row input[type="checkbox"] {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 20px !important;
  height: 20px !important;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid #ccc;
  border-radius: 4px;
  background: #fff;
  transition: all 0.15s ease;
  position: relative;
  accent-color: unset !important;
}
.filter-row input[type="checkbox"]:hover {
  border-color: #a92296;
}
.filter-row input[type="checkbox"]:checked {
  background: #a92296 !important;
  border-color: #a92296 !important;
}
.filter-row input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.filter-row-label {
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 400;
  color: #24282d;
  text-transform: lowercase;
  line-height: 1.3;
  letter-spacing: 0.5px;
  transition: color 0.15s ease;
}
.filter-row-count {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #999;
  margin-left: auto;
  flex-shrink: 0;
}
/* Empty filter section */
.filter-section-empty {
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  color: #999;
  padding: 4px 0;
  font-style: italic;
}
/* Status toggle row (availability) */
.filter-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 32px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.15s ease;
}
.filter-status-row:hover {
  background: #f9f9f9;
}
.filter-status-row input[type="checkbox"] {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 20px !important;
  height: 20px !important;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid #ccc;
  border-radius: 4px;
  background: #fff;
  transition: all 0.15s ease;
  position: relative;
  accent-color: unset !important;
}
.filter-status-row input[type="checkbox"]:hover {
  border-color: #a92296;
}
.filter-status-row input[type="checkbox"]:checked {
  background: #a92296 !important;
  border-color: #a92296 !important;
}
.filter-status-row input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.filter-status-label {
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #24282d;
  text-transform: lowercase;
  letter-spacing: 0.5px;
}
.filter-status-count {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #999;
  margin-left: auto;
}
/* Footer */
/* Footer — use #id for high specificity to beat Webflow */
.filter-panel-footer,
#filter-panel .filter-panel-footer {
  display: flex !important;
  align-items: center !important;
  gap: 12px;
  padding: 16px 32px;
  border-top: 1px solid #e5e5e5;
  flex-shrink: 0;
  background: #fff;
}
.filter-panel-reset,
#filter-panel .filter-panel-reset,
#filter-panel-reset-btn {
  flex: 0 0 auto;
  align-self: center !important;
  padding: 16px 24px !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  line-height: 1.3 !important;
  background: #fff !important;
  color: #24282d;
  border: 1px solid #a92296 !important;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  border-radius: 50px;
  box-sizing: border-box !important;
}
.filter-panel-reset:hover,
#filter-panel .filter-panel-reset:hover {
  background: #fff4fe !important;
}
.filter-panel-apply,
#filter-panel .filter-panel-apply,
#filter-panel-apply-btn {
  flex: 1;
  align-self: center !important;
  padding: 16px 24px !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  line-height: 1.3 !important;
  background: #a92296;
  color: #fff;
  border: none !important;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  border-radius: 50px;
  box-sizing: border-box !important;
}
.filter-panel-apply:hover,
#filter-panel .filter-panel-apply:hover {
  background: #4b073f;
}
/* Hide bottom navbar when filter is open */
body.filter-panel-open #bottom-navbar,
body.filter-panel-open .navbar-2.w-nav {
  display: none !important;
}
body.filter-panel-open {
  overflow: hidden;
}
/* ============================================
   FILTER TRIGGER BUTTON (in toolbar)
   ============================================ */
.filter-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #ccc;
  cursor: pointer;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #24282d;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  border-radius: 6px;
  white-space: nowrap;
}
.filter-trigger-btn:hover {
  border-color: #a92296;
  color: #a92296;
}
.filter-trigger-btn.has-active {
  border-color: #a92296;
  background: #a92296;
  color: #fff;
}
.filter-trigger-icon {
  display: flex;
  align-items: center;
}
.filter-trigger-count {
  display: none;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #fff;
  color: #a92296;
  font-size: 12px;
  font-weight: 700;
  border-radius: 50px;
  align-items: center;
  justify-content: center;
}
.filter-trigger-btn.has-active .filter-trigger-count {
  display: inline-flex;
}
/* ============================================
   SEARCH BAR
   ============================================ */
.search-container {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 480px;
  min-width: 0;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #999;
  flex-shrink: 0;
}
.search-input,
input.search-input,
input[data-search="input"] {
  width: 100%;
  padding: 12px 40px 12px 42px !important;
  border: 1px solid #24282d !important;
  border-radius: 50px !important;
  font-family: Urbanist, sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.3px;
  background: #fff !important;
  outline: none;
  transition: border-color 0.2s;
  color: #24282d;
  -webkit-text-fill-color: #24282d;
  caret-color: #a92296;
  box-sizing: border-box;
  -webkit-appearance: none !important;
  appearance: none !important;
}
.search-input:focus,
input.search-input:focus,
input[data-search="input"]:focus {
  border-color: #a92296 !important;
}
.search-input::placeholder {
  color: #999;
  -webkit-text-fill-color: #999;
}
.search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: none;
  opacity: 0.5;
  transition: opacity 0.2s;
  color: #24282d;
}
.search-clear:hover {
  opacity: 1;
}
/* ============================================
   TOOLBAR AREA
   ============================================ */
.clothing-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
}
.clothing-toolbar-left {
  flex: 1;
  min-width: 0;
}
.clothing-toolbar-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.clothing-result-count {
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #999;
  padding-top: 4px;
}
.clothing-reset-all {
  display: none;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #a92296;
  text-transform: lowercase;
  padding: 4px 0;
  transition: color 0.2s ease;
}
.clothing-reset-all:hover {
  color: #4b073f;
}
.clothing-reset-all svg {
  flex-shrink: 0;
}
/* ============================================
   ACTIVE FILTER CHIPS
   ============================================ */
.filter-chips-bar {
  display: none;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 16px;
}
.filter-chips-bar.has-chips {
  display: flex;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #eff9ff;
  border: 1px solid #2cc4ff;
  cursor: pointer;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #24282d;
  text-transform: lowercase;
  transition: all 0.15s ease;
  border-radius: 20px;
}
.filter-chip:hover {
  background: #ddf2ff;
  border-color: #2cc4ff;
}
.filter-chip-x {
  font-size: 16px;
  line-height: 1;
  color: #999;
}
.filter-chip:hover .filter-chip-x {
  color: #24282d;
}
/* ============================================
   FULL PAGE SECTION
   ============================================ */
.full-page-section {
  position: relative;
  z-index: 10;
  background: #fff;
}
/* ============================================
   MOBILE STYLES
   ============================================ */
@media screen and (max-width: 479px) {
  .filter-panel {
    width: 100%;
  }
  .filter-panel-header {
    padding: 22px 24px 20px;
  }
  .filter-panel-body {
    padding-bottom: 0;
  }
  .filter-section-header {
    padding: 18px 24px;
  }
  .filter-section-content {
    padding: 0 24px;
  }
  .filter-section-content.is-open {
    padding: 0 24px 16px;
  }
  .filter-status-row {
    padding: 14px 24px;
  }
  .filter-panel-footer {
    padding: 12px 24px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  }
}
@media screen and (max-width: 767px) {
  .full-page-section {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    padding: 80px 20px 16px 20px !important;
    gap: 12px;
  }
  .full-page-section > .w-embed {
    flex: 1;
    min-width: 0;
  }
  /* ---- COLLAPSED: icon pill ---- */
  .search-container {
    width: auto !important;
    flex: 0 0 auto !important;
  }
  .search-wrapper {
    max-width: none !important;
    width: auto !important;
  }
  .search-wrapper .search-input {
    width: 0 !important;
    padding: 0 !important;
    border: none !important;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }
  .search-wrapper .search-icon {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    width: 16px !important;
    height: 16px !important;
    padding: 13px !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    border: 1px solid #24282d;
    border-radius: 50px;
    cursor: pointer;
    pointer-events: auto !important;
    color: #999;
    background: #fff;
    transition: border-color 0.2s;
    box-sizing: content-box;
  }
  .search-wrapper .search-icon:active {
    border-color: #a92296;
  }
  .search-container:not(.is-expanded) .search-wrapper .search-clear {
    display: none !important;
  }
  /* ---- EXPANDED: full-width inline row ---- */
  .search-container.is-expanded {
    width: 100% !important;
    flex: 1 1 100% !important;
    order: -1 !important;
  }
  .search-container.is-expanded .search-wrapper {
    flex: 1;
    width: 100% !important;
    position: relative;
  }
  .search-container.is-expanded .search-wrapper .search-icon {
    position: absolute !important;
    left: 16px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 16px !important;
    height: 16px !important;
    padding: 0 !important;
    border: none;
    border-radius: 0;
    background: none;
    pointer-events: none !important;
    cursor: default;
    color: #999;
    box-sizing: border-box;
  }
  .search-container.is-expanded .search-wrapper .search-input {
    width: 100% !important;
    padding: 12px 40px 12px 42px !important;
    border: 1px solid #24282d !important;
    border-radius: 50px !important;
    opacity: 1 !important;
    position: relative !important;
    pointer-events: auto !important;
    -webkit-user-select: text !important;
    user-select: text !important;
    font-size: 16px !important;
  }
  .search-container.is-expanded .search-wrapper .search-input:focus {
    border-color: #a92296 !important;
  }
  /* Hide backdrop on mobile — not needed with inline approach */
  .search-mobile-backdrop {
    display: none !important;
  }
  /* Filter footer: force side-by-side on mobile */
  .filter-panel-footer,
  #filter-panel .filter-panel-footer {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    padding: 12px 20px !important;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0)) !important;
    gap: 10px !important;
  }
  .filter-panel-reset,
  #filter-panel .filter-panel-reset,
  #filter-panel-reset-btn {
    font-size: 15px !important;
    padding: 11px 20px !important;
    white-space: nowrap !important;
  }
  .filter-panel-apply,
  #filter-panel .filter-panel-apply,
  #filter-panel-apply-btn {
    font-size: 15px !important;
    padding: 11px 20px !important;
    white-space: nowrap !important;
  }
  .clothing-toolbar {
    flex-wrap: wrap;
    gap: 12px;
  }
  .clothing-toolbar-left {
    width: 100%;
  }
  .clothing-toolbar-right {
    width: auto;
  }
  .div-filter-section {
    flex-shrink: 0;
    width: auto !important;
    padding: 0 !important;
  }
  .div-filter-wrapper {
    justify-content: flex-end;
  }
}
</style>
