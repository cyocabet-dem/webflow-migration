<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const { getCachedCatalog, fetchAndCacheCatalog } = useCatalogCache()

function getSKU(): string {
  const raw = route.query.sku
  const v = Array.isArray(raw) ? raw[0] : raw
  return (v || '').toString().trim()
}

const skuValid = computed(() => getSKU() !== '')

if (!skuValid.value) {
  await navigateTo(isNL.value ? '/nl/clothing' : '/clothing')
}

// ============================================================
// ITEM STATUS CONFIGURATION (from pdp.js)
// ============================================================

const ITEM_STATUS_CONFIG: Record<string, any> = {
  available: { canAddToCart: true, buttonText: null, buttonTextNL: null, buttonClass: '' },
  rented: { canAddToCart: false, buttonText: 'Rented Out', buttonTextNL: 'verhuurd', buttonClass: 'status-rented' },
  reserved: { canAddToCart: false, buttonText: 'Reserved', buttonTextNL: 'gereserveerd', buttonClass: 'status-reserved' },
  returned: { canAddToCart: false, buttonText: 'Returning Soon', buttonTextNL: 'binnenkort terug', buttonClass: 'status-returned' },
  purchased: { canAddToCart: false, buttonText: 'Purchased', buttonTextNL: 'gekocht', buttonClass: 'status-purchased' },
  sold: { canAddToCart: false, buttonText: 'Sold', buttonTextNL: 'verkocht', buttonClass: 'status-sold' },
  damaged: { canAddToCart: false, buttonText: 'Unavailable', buttonTextNL: 'niet beschikbaar', buttonClass: 'status-unavailable' },
  retired: { canAddToCart: false, buttonText: 'No Longer Available', buttonTextNL: 'niet meer beschikbaar', buttonClass: 'status-retired' },
}

const DEFAULT_STATUS_CONFIG = {
  canAddToCart: false,
  buttonText: 'Unavailable',
  buttonTextNL: 'Niet beschikbaar',
  buttonClass: 'status-unavailable',
}

function getStatusConfig(status: string) {
  const normalizedStatus = (status || '').toLowerCase().trim()
  if (!normalizedStatus) {
    return ITEM_STATUS_CONFIG['available']
  }
  return ITEM_STATUS_CONFIG[normalizedStatus] || DEFAULT_STATUS_CONFIG
}

const T: Record<string, { en: string; nl: string }> = {
  addToCart: { en: 'Add To Cart', nl: 'in winkelmand' },
  removeFromCart: { en: 'Remove From Cart', nl: 'uit winkelmand' },
  cartFull: { en: 'Cart Full', nl: 'winkelmand vol' },
  updating: { en: 'Updating...', nl: 'bijwerken...' },
  cartFullAlert: { en: 'Your cart is full! You can reserve up to 10 items at a time.', nl: 'je winkelmand is vol! je kunt maximaal 10 items tegelijk reserveren.' },
  addToWishlist: { en: 'Add To Wish List', nl: 'toevoegen aan wishlist' },
  removeFromWishlist: { en: 'Remove From Wish List', nl: 'verwijderen uit wishlist' },
}

function t(key: string): string {
  const e = T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

function statusText(cfg: any): string {
  return (isNL.value && cfg.buttonTextNL) ? cfg.buttonTextNL : cfg.buttonText
}

// ============================================================
// IMAGE HELPERS (from pdp.js)
// ============================================================

function detectImageType(img: any): string {
  if (img?.image_type) return img.image_type
  const n = (img?.image_name || '').toLowerCase()
  if (n.includes('front')) return 'front'
  if (n.includes('back')) return 'back'
  if (n.includes('label')) return 'label'
  if (n.includes('fabric')) return 'fabric'
  return 'other'
}

const IMAGE_ORDER: Record<string, number> = { front: 1, back: 2, label: 3, fabric: 4, other: 99 }
const sortImages = (a: any, b: any) => (IMAGE_ORDER[a._type] || 99) - (IMAGE_ORDER[b._type] || 99)

function pickFrontImage(images: any[]): string {
  if (!images?.length) return ''
  const front = images.find((i: any) => i.image_type === 'front') ||
                images.find((i: any) => /front/i.test(i.image_name || ''))
  return front?.object_url || images[0]?.object_url || ''
}

// ============================================================
// DONATED BY FORMATTING (from pdp.js)
// ============================================================

function formatDonatedBy(raw: any): string {
  let val = (raw ?? '').toString().trim()
  if (!val) return ''

  if (/demat(erialized)?/i.test(val)) {
    return 'curated by demat'
  }

  if (val.toLowerCase().startsWith('donated by')) {
    val = val.substring('donated by'.length).trim()
  }
  if (!val) return ''

  const parts = val.split(/\s+/)
  if (parts.length < 2) return parts[0]

  const firstName = parts[0]

  let lastIdx = parts.length - 1
  const prefixes = ['van', 'de', 'der', 'den', 'het']
  for (let i = parts.length - 1; i >= 1; i--) {
    if (!prefixes.includes(parts[i].toLowerCase())) {
      lastIdx = i
      break
    }
  }

  const initial = parts[lastIdx].charAt(0).toUpperCase()
  return `${firstName} ${initial}.`
}

// ============================================================
// COLOR NORMALIZATION (from pdp.js)
// ============================================================

const normKey = (s: any) => (s || '').toString().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()

const COLOR_SYNONYMS: Record<string, string[]> = {
  'green': ['olive green', 'olive', 'army green', 'forest green', 'sage'],
  'gray': ['grey', 'light gray', 'light grey', 'ash'],
  'beige': ['light brown', 'sand', 'tan', 'khaki'],
  'pink': ['blush', 'rose'],
  'off white': ['cream', 'ivory'],
}

const COLOR_HEX: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', gray: '#808080', grey: '#808080',
  green: '#008000', beige: '#F5F5DC', pink: '#FFC0CB', blue: '#0000FF',
  brown: '#8B4513', red: '#FF0000', yellow: '#FFFF00', purple: '#800080',
  orange: '#FFA500', 'off white': '#FAF9F6',
}

function sanitizeHex(s: any): string {
  if (!s) return ''
  let x = s.toString().trim()
  if (x[0] !== '#') x = '#' + x
  const m3 = x.match(/^#([0-9a-fA-F]{3})$/)
  if (m3) x = '#' + m3[1].split('').map((c: string) => c + c).join('')
  return /^#([0-9a-fA-F]{6})$/.test(x) ? x.toUpperCase() : ''
}

function extractHex(v: any): string {
  if (!v) return ''
  if (typeof v === 'string') {
    const m = v.match(/#?[0-9a-fA-F]{3,6}/)
    return sanitizeHex(m ? m[0] : '')
  }
  if (typeof v === 'object') {
    return sanitizeHex(v.hex || v.hex_code || v.color_hex || v.code || v.color || '')
  }
  return ''
}

function canonicalizeColors(raw: any) {
  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : [])
  const seen = new Set<string>()
  const names: string[] = []
  const nameHexMap = new Map<string, string>()

  for (const v of arr) {
    let name = ''
    if (typeof v === 'string') name = v.trim()
    else if (v && typeof v === 'object') {
      name = (v.name || v.label || v.value || v.title || v.color || '').toString().trim()
      const hex = extractHex(v)
      if (hex) nameHexMap.set(normKey(name), hex)
    }
    const k = normKey(name)
    if (k && !seen.has(k)) {
      seen.add(k)
      names.push(name)
    }
  }

  const canonSet = new Set<string>()
  names.forEach(n => {
    const k = normKey(n)
    let canon: string | null = null
    for (const [c, syns] of Object.entries(COLOR_SYNONYMS)) {
      if (k === normKey(c) || syns.some(s => normKey(s) === k)) {
        canon = c
        break
      }
    }
    canonSet.add(canon || k)
  })

  if (canonSet.has('multicolor') && canonSet.size > 1) {
    canonSet.delete('multicolor')
  }

  const canonNames = Array.from(canonSet)
  const hexes = canonNames.map(cn => {
    let h = nameHexMap.get(normKey(cn))
    if (h) return h
    const syns = COLOR_SYNONYMS[cn] || []
    for (const s of syns) {
      h = nameHexMap.get(normKey(s))
      if (h) return h
    }
    return COLOR_HEX[cn] || ''
  }).filter(Boolean)

  const displayNames = canonNames.map(cn =>
    cn.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  )

  return { displayNames, hexes, canonNames }
}

// ============================================================
// ITEM NORMALIZATION (from pdp.js)
// ============================================================

function normalizeItem(raw: any) {
  const i = raw || {}

  const brand_name = (i.brand && (i.brand.brand_name || i.brand.sku_label)) ||
                     i.brand_name || i.label || i.maker || i.manufacturer || ''

  const { displayNames, hexes, canonNames } = canonicalizeColors(i.colors || i.color || i.primary_color)

  const sizeRaw = i.sizes || i.size || i.primary_size
  const sizeArr = Array.isArray(sizeRaw) ? sizeRaw : (sizeRaw ? [sizeRaw] : [])
  const sizes: string[] = []
  const seenSizes = new Set<string>()
  for (const v of sizeArr) {
    const s = typeof v === 'string' ? v.trim() :
              (v?.size || v?.name || v?.label || v?.value || '').toString().trim()
    const k = s.toLowerCase()
    if (s && !seenSizes.has(k)) {
      seenSizes.add(k)
      sizes.push(s)
    }
  }

  return {
    id: i.id,
    sku: i.sku || '',
    name: i.name || i.title || i.product_name || i.sku || '',
    description: i.description || i.desc || i.long_description || '',
    brand: (brand_name || '').trim() || 'Unknown',
    fabric: ((i.fabric ?? '').toString().trim()) || 'Unknown',
    care_instructions: ((i.care_instructions ?? '').toString().trim()) || 'Unknown',
    acquired_from: (i.acquired_from ?? '').toString().trim(),
    donated_by: formatDonatedBy(i.donated_by),
    color: displayNames.join(', '),
    color_keys: canonNames,
    color_hexes: hexes,
    size: sizes.join(', '),
    category_id: i.category_id || i.category?.id || null,
    category: i.category?.name || i.category_name || '',
    subcategory: i.subcategory?.name || i.subcategory_name || '',
    condition: i.condition || '',
    status: i.status || '',
    price: i.price || i.retail_price || i.list_price || '',
    images: Array.isArray(i.images) ? i.images : [],
    _raw: i,
  }
}

// ============================================================
// STATE
// ============================================================

const hydrated = ref(false)
const fields = reactive({
  name: 'Product name',
  size: 'Loading...',
  color: 'Loading...',
  fabric: '',
  care_instructions: '',
  donated_by: 'donated by',
})
const descriptionHtml = ref('')
const colorCircleStyle = ref<Record<string, string> | undefined>(undefined)
const colorCircleTitle = ref<string | undefined>(undefined)

const galleryImages = ref<any[]>([])
const currentIndex = ref(0)
const thumbsHidden = computed(() => hydrated.value && !galleryImages.value.length)
const mainImgUrl = computed(() => galleryImages.value[currentIndex.value]?.object_url || '')

const isZoomed = ref(false)
const zoomTouched = ref(false)
const zoomOrigin = ref('50% 50%')
const mainImgStyle = computed(() => {
  if (!zoomTouched.value) return undefined
  return {
    transform: `scale(${isZoomed.value ? 2 : 1})`,
    transformOrigin: zoomOrigin.value,
    cursor: isZoomed.value ? 'zoom-out' : 'zoom-in',
    transition: 'transform .25s ease, transform-origin .05s linear',
  }
})

const mobileIndex = ref(0)
const slideStyle = computed(() => ({
  transform: `translateX(-${mobileIndex.value * 100}%)`,
  transition: 'transform 500ms ease',
}))
let touchStartX = 0

const detailsOpen = ref(false)
const infoOpen = ref(false)
const availabilityOpen = ref(false)

const related = ref<Array<{ sku: string; name: string; url: string; href: string; loaded: boolean }>>([])
const relatedHidden = ref(false)
const relatedViewportEl = ref<HTMLElement | null>(null)
const relatedCardEls: Array<HTMLElement | null> = []
let relatedObserver: IntersectionObserver | null = null

const statusConfig = ref<any>(ITEM_STATUS_CONFIG.available)
const cartBtnText = ref('Add To Cart')
const cartBtnDisabled = ref(false)
const cartBtnClasses = ref<string[]>([])
const cartBtnStyle = ref<Record<string, string>>({ cursor: 'pointer' })

const rawItem = ref<any>(null)
const isItemInWishlist = ref(false)

// ============================================================
// SEO (source head: title/og:title/twitter:title "Product", robots noindex;
// pdp.js sets document.title to "<name> – Dematerialized" once hydrated)
// ============================================================

useHead({
  title: () => (hydrated.value && fields.name ? `${fields.name} – Dematerialized` : 'Product'),
  meta: [
    { property: 'og:title', content: 'Product' },
    { name: 'twitter:title', content: 'Product' },
    { name: 'robots', content: 'noindex' },
  ],
})

// ============================================================
// HYDRATION
// ============================================================

function paintColorCircles(hexes: string[]) {
  const colorText = (fields.color || '').trim().toLowerCase()
  const isMulticolor = colorText === 'multicolor'

  if (isMulticolor) {
    colorCircleStyle.value = { background: 'linear-gradient(90deg, #FDE2E4, #FFF1E6, #E2F0CB, #CDE7F0, #EADCF8, #F9E2AE)' }
    colorCircleTitle.value = 'Multicolor'
    return
  }
  if (!hexes?.length) {
    colorCircleStyle.value = { background: 'transparent' }
    colorCircleTitle.value = 'Unknown'
    return
  }
  if (hexes.length === 1) {
    colorCircleStyle.value = { background: hexes[0] }
  } else {
    const step = 100 / hexes.length
    const stops = hexes.map((h, i) => `${h} ${Math.round(i * step)}% ${Math.round((i + 1) * step)}%`).join(', ')
    colorCircleStyle.value = { background: `conic-gradient(${stops})` }
  }
  colorCircleTitle.value = hexes.join(', ')
}

function hydrateTextFields(n: any) {
  fields.name = (n.name ?? '').toString()
  descriptionHtml.value = (n.description ?? '').toString()
  fields.size = (n.size ?? '').toString()
  fields.color = (n.color ?? '').toString()
  fields.fabric = (n.fabric ?? '').toString()
  fields.care_instructions = (n.care_instructions ?? '').toString()
  fields.donated_by = (n.donated_by ?? '').toString()
  paintColorCircles(n.color_hexes)
  hydrated.value = true
}

// ============================================================
// GALLERY
// ============================================================

function initGallery(n: any) {
  const imgs = (n.images || []).map((i: any) => ({ ...i, _type: detectImageType(i) })).sort(sortImages)
  galleryImages.value = imgs
  currentIndex.value = imgs.length ? Math.max(0, imgs.findIndex((i: any) => i._type === 'front')) : 0
  mobileIndex.value = 0
}

function showImage(i: number) {
  const len = galleryImages.value.length
  if (!len) return
  currentIndex.value = ((i % len) + len) % len
}

function setZoom(on: boolean) {
  zoomTouched.value = true
  isZoomed.value = on
  if (!on) zoomOrigin.value = '50% 50%'
}

function onZoomMove(e: MouseEvent) {
  if (!isZoomed.value) return
  const wrap = e.currentTarget as HTMLElement
  const r = wrap.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * 100
  const y = ((e.clientY - r.top) / r.height) * 100
  zoomOrigin.value = `${x}% ${y}%`
}

function mobileGo(i: number) {
  const len = galleryImages.value.length
  if (!len) return
  mobileIndex.value = ((i % len) + len) % len
}

function mobilePrev() {
  mobileGo(mobileIndex.value - 1)
}

function mobileNext() {
  mobileGo(mobileIndex.value + 1)
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0]?.clientX ?? 0
}

function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX
  if (Math.abs(dx) < 50) return
  if (dx < 0) mobileNext()
  else mobilePrev()
}

// ============================================================
// RELATED ITEMS
// ============================================================

function findRelatedItems(catalog: any[], current: any) {
  const pool = catalog.filter(i => i.sku !== current.sku)

  const wantColors = (current.color_keys || []).map((c: string) => c.toLowerCase())

  const scored = pool.map(item => {
    let score = 0

    if (item.category_id === current.category_id ||
        item.category_name === current.category) {
      score += 10
    }

    const itemColors = (item.color_names || []).map((c: string) => c.toLowerCase())
    if (wantColors.some((c: string) => itemColors.includes(c))) {
      score += 5
    }

    return { ...item, _score: score }
  })

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, 12)
}

function setRelatedCardEl(el: any, idx: number) {
  relatedCardEls[idx] = (el as HTMLElement) || null
}

function setupRelatedLazyLoad() {
  if (relatedObserver) {
    relatedObserver.disconnect()
    relatedObserver = null
  }

  const viewport = relatedViewportEl.value
  if (!viewport) {
    related.value.forEach(r => { r.loaded = true })
    return
  }

  const vpRect = viewport.getBoundingClientRect()
  const lazyIdx: number[] = []

  related.value.forEach((r, idx) => {
    const el = relatedCardEls[idx]
    if (!el) {
      lazyIdx.push(idx)
      return
    }
    const rect = el.getBoundingClientRect()
    if (rect.left < vpRect.right && rect.right > vpRect.left) {
      r.loaded = true
    } else {
      lazyIdx.push(idx)
    }
  })

  if ('IntersectionObserver' in window) {
    const idxByEl = new Map<Element, number>()
    relatedObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return
        const idx = idxByEl.get(en.target)
        if (idx != null && related.value[idx]) related.value[idx].loaded = true
        relatedObserver?.unobserve(en.target)
      })
    }, { root: viewport, rootMargin: '200px 0px', threshold: 0.01 })

    for (const idx of lazyIdx) {
      const el = relatedCardEls[idx]
      if (!el) {
        if (related.value[idx]) related.value[idx].loaded = true
        continue
      }
      idxByEl.set(el, idx)
      relatedObserver.observe(el)
    }
  } else {
    lazyIdx.forEach(idx => {
      if (related.value[idx]) related.value[idx].loaded = true
    })
  }
}

async function initRelated(current: any) {
  related.value = []
  relatedHidden.value = false
  relatedCardEls.length = 0

  let catalog = getCachedCatalog()
  if (!catalog?.length) {
    catalog = await fetchAndCacheCatalog()
  }

  if (!catalog.length) {
    relatedHidden.value = true
    return
  }

  const list = findRelatedItems(catalog, current)

  if (!list.length) {
    relatedHidden.value = true
    return
  }

  const items: Array<{ sku: string; name: string; url: string; href: string; loaded: boolean }> = []
  for (const item of list) {
    const imgUrl = item.front_image
    if (!imgUrl) continue
    items.push({
      sku: item.sku,
      name: item.name || item.sku || '',
      url: imgUrl,
      href: `${isNL.value ? '/nl' : ''}/product?sku=${encodeURIComponent(item.sku)}`,
      loaded: false,
    })
  }

  related.value = items
  await nextTick()
  setupRelatedLazyLoad()
}

function onRelatedWheel(e: WheelEvent) {
  const viewport = relatedViewportEl.value
  if (!viewport) return
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    viewport.scrollLeft += e.deltaY
    e.preventDefault()
  }
}

// ============================================================
// CART / WISHLIST (pdp.js initCart / initWishlist)
// ============================================================

const { getToken } = useAuth()

function openAuthModal() {
  ;(window as any).openAuthModal?.()
}

async function addToCart() {
  const CartManager = (window as any).CartManager
  if (!CartManager || !rawItem.value) return

  const itemData = {
    ...rawItem.value,
    frontImage: pickFrontImage(rawItem.value.images),
  }

  cartBtnDisabled.value = true
  cartBtnText.value = t('updating')
  cartBtnStyle.value = { cursor: 'pointer', opacity: '0.7' }

  try {
    if (CartManager.isInCart(itemData.id)) {
      await CartManager.removeFromCart(itemData.id)
    } else {
      const result = await CartManager.addToCart(itemData)
      if (!result.success && result.reason === 'max_items') {
        alert(t('cartFullAlert'))
      }
    }
  } catch (e) {
    console.error('[PDP] Cart error:', e)
  }

  cartBtnDisabled.value = false
  updateCartButton()
}

async function checkWishlistStatus() {
  const item = rawItem.value
  if (!item?.id) return

  const token = await getToken()
  if (!token) {
    isItemInWishlist.value = false
    return
  }

  try {
    const res = await fetch(`${API_BASE}/private_clothing_items/wishlist/exists/${item.id}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      isItemInWishlist.value = data.exists || data === true
      return
    }
  } catch (e) {}
  isItemInWishlist.value = false
}

function updateCartButton() {
  const cfg = statusConfig.value
  if (!cfg.canAddToCart) {
    cartBtnText.value = statusText(cfg)
    cartBtnClasses.value = ['status-disabled', cfg.buttonClass].filter(Boolean)
    cartBtnDisabled.value = true
    cartBtnStyle.value = { cursor: 'not-allowed', opacity: '0.6' }
    return
  }
  cartBtnText.value = 'Add To Cart'
  cartBtnClasses.value = []
  cartBtnDisabled.value = false
  cartBtnStyle.value = { cursor: 'pointer' }
}

function onCartClick() {
  if (!statusConfig.value.canAddToCart) return
  addToCart()
}

async function onWishlistClick() {
  const itemId = rawItem.value?.id
  if (!itemId) return

  const token = await getToken()
  if (!token) {
    openAuthModal()
    return
  }

  const ok = isItemInWishlist.value
    ? await (window as any).WishlistManager.removeFromWishlist(itemId)
    : await (window as any).WishlistManager.addToWishlist(itemId)
  if (ok) isItemInWishlist.value = !isItemInWishlist.value
}

// ============================================================
// INIT
// ============================================================

async function fetchItem(sku: string) {
  const res = await fetch(`${API_BASE}/clothing_items/clothing_item/${encodeURIComponent(sku)}`, {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

function resetState() {
  hydrated.value = false
  fields.name = 'Product name'
  fields.size = 'Loading...'
  fields.color = 'Loading...'
  fields.fabric = ''
  fields.care_instructions = ''
  fields.donated_by = 'donated by'
  descriptionHtml.value = ''
  colorCircleStyle.value = undefined
  colorCircleTitle.value = undefined
  galleryImages.value = []
  currentIndex.value = 0
  mobileIndex.value = 0
  isZoomed.value = false
  zoomTouched.value = false
  zoomOrigin.value = '50% 50%'
  detailsOpen.value = false
  infoOpen.value = false
  availabilityOpen.value = false
  related.value = []
  relatedHidden.value = false
  relatedCardEls.length = 0
  relatedObserver?.disconnect()
  relatedObserver = null
  rawItem.value = null
  isItemInWishlist.value = false
  statusConfig.value = ITEM_STATUS_CONFIG.available
  updateCartButton()
}

async function init() {
  const sku = getSKU()
  if (!sku) return

  try {
    const raw = await fetchItem(sku)
    const n = normalizeItem(raw)

    rawItem.value = raw
    statusConfig.value = getStatusConfig(n.status || raw?.status || '')
    hydrateTextFields(n)
    initGallery(n)
    await initRelated(n)
    updateCartButton()
    await checkWishlistStatus()
  } catch (e) {
    console.error('[PDP] Init failed:', e)
  }
}

watch(() => route.query.sku, async () => {
  if (route.path !== '/product' && route.path !== '/nl/product') return
  if (!getSKU()) {
    await navigateTo(isNL.value ? '/nl/clothing' : '/clothing')
    return
  }
  resetState()
  await init()
})

onMounted(() => {
  relatedViewportEl.value?.addEventListener('wheel', onRelatedWheel, { passive: false })
  init()
})

onBeforeUnmount(() => {
  relatedViewportEl.value?.removeEventListener('wheel', onRelatedWheel)
  relatedObserver?.disconnect()
  relatedObserver = null
})
</script>

<template>
  <section class="full-page-section product">
    <div v-if="!skuValid" class="pdp-loader">
      <div class="pdp-spinner"></div>
    </div>
    <div data-delay="4000" data-animation="slide" class="slider-mobile-gallery w-slider" data-slider="mobile-gallery" data-autoplay="false" data-easing="ease" data-hide-arrows="false" data-disable-swipe="false" data-autoplay-limit="0" data-nav-spacing="3" data-duration="500" data-infinite="true">
      <div class="mobile-slider-mask w-slider-mask" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <template v-if="galleryImages.length">
          <div v-for="(img, idx) in galleryImages" :key="'slide-' + (img.object_url || idx)" class="w-slide" :style="slideStyle">
            <img class="mobile-slide-img" loading="lazy" decoding="async" :src="img.object_url" :alt="fields.name ? `${fields.name} – image ${idx + 1}` : `Product image ${idx + 1}`">
          </div>
        </template>
        <template v-else>
          <div class="slide-2 w-slide"><img src="/images/placeholder-pdp.png" loading="lazy" sizes="(max-width: 800px) 100vw, 800px" srcset="/images/placeholder-pdp-p-500.png 500w, /images/placeholder-pdp.png 800w" alt="" class="mobile-slide-img"></div>
          <div class="w-slide"></div>
        </template>
      </div>
      <div class="left-arrow w-slider-arrow-left" role="button" tabindex="0" aria-label="previous slide" @click="mobilePrev">
        <div class="icon-5 w-icon-slider-left"></div>
      </div>
      <div class="right-arrow w-slider-arrow-right" role="button" tabindex="0" aria-label="next slide" @click="mobileNext">
        <div class="icon-4 w-icon-slider-right"></div>
      </div>
      <div class="slide-nav-6 w-slider-nav w-slider-nav-invert w-round">
        <template v-if="galleryImages.length">
          <div v-for="(img, idx) in galleryImages" :key="'dot-' + (img.object_url || idx)" class="w-slider-dot" :class="{ 'w-active': idx === mobileIndex }" role="button" tabindex="0" :aria-label="`Show slide ${idx + 1} of ${galleryImages.length}`" style="margin-left: 3px; margin-right: 3px;" @click="mobileGo(idx)"></div>
        </template>
        <template v-else>
          <div class="w-slider-dot w-active" role="button" tabindex="0" aria-label="Show slide 1 of 2" style="margin-left: 3px; margin-right: 3px;"></div>
          <div class="w-slider-dot" role="button" tabindex="0" aria-label="Show slide 2 of 2" style="margin-left: 3px; margin-right: 3px;"></div>
        </template>
      </div>
    </div>
    <div class="div-pdp-desktop-wrapper">
      <div data-thumbs="" class="div-pdp-sub-images-wrapper desktop" :style="thumbsHidden ? { display: 'none' } : undefined">
        <div data-template="thumb" class="div-sub-image-background is-template"><img class="pdp-sub-image" src="/images/placeholder-pdp.png" data-thumb-img="" alt="" sizes="(max-width: 800px) 100vw, 800px" loading="lazy" srcset="/images/placeholder-pdp-p-500.png 500w, /images/placeholder-pdp.png 800w"></div>
        <div v-for="(img, idx) in galleryImages" :key="'thumb-d-' + (img.object_url || idx)" class="div-sub-image-background thumb-clone" :class="{ 'is-active': idx === currentIndex }" :data-url="img.object_url" @click="showImage(idx)">
          <img class="pdp-sub-image" data-thumb-img="" :src="img.object_url" :alt="fields.name" loading="lazy" decoding="async">
        </div>
      </div>
      <div class="div-pdp-image-wrapper" :class="{ 'is-zoomed': isZoomed }" @mouseenter="setZoom(true)" @mouseleave="setZoom(false)" @mousemove="onZoomMove">
        <img class="pdp-image" data-main-img="" :src="hydrated ? mainImgUrl : '/images/placeholder-pdp.png'" :srcset="hydrated ? undefined : '/images/placeholder-pdp-p-500.png 500w, /images/placeholder-pdp.png 800w'" :sizes="hydrated ? undefined : '(max-width: 800px) 100vw, 800px'" loading="lazy" :decoding="hydrated ? 'async' : undefined" :alt="hydrated && fields.name ? fields.name : ''" :style="mainImgStyle">
      </div>
      <div data-thumbs="" class="div-pdp-sub-images-wrapper tablet" :style="thumbsHidden ? { display: 'none' } : undefined">
        <div data-template="thumb" class="div-sub-image-background is-template"><img class="pdp-sub-image" src="/images/placeholder-pdp.png" data-thumb-img="" alt="" sizes="(max-width: 800px) 100vw, 800px" loading="lazy" srcset="/images/placeholder-pdp-p-500.png 500w, /images/placeholder-pdp.png 800w"></div>
        <div v-for="(img, idx) in galleryImages" :key="'thumb-t-' + (img.object_url || idx)" class="div-sub-image-background thumb-clone" :class="{ 'is-active': idx === currentIndex }" :data-url="img.object_url" @click="showImage(idx)">
          <img class="pdp-sub-image" data-thumb-img="" :src="img.object_url" :alt="fields.name" loading="lazy" decoding="async">
        </div>
      </div>
      <div class="div-section flex-vertical">
        <div class="div-content-wrapper pdp">
          <div class="div-pdp-name-wrapper">
            <div class="div-donated-by-background">
              <div data-pdp="donated_by" class="pdp-donated-by-text">{{ fields.donated_by }}</div>
            </div>
            <div data-field="name" class="heading-mobile align-left">{{ fields.name }}</div>
          </div>
          <div class="div-pdp-main-details">
            <div class="label-text">
              <div class="pdp-medium">Size</div>
              <div class="pdp-medium">:</div>
              <div data-field="size" class="paragraph-primary pdp">{{ fields.size }}</div>
            </div>
            <div class="label-text">
              <div class="pdp-medium">color</div>
              <div class="pdp-medium">:</div>
              <div data-field="color" class="paragraph-primary pdp">{{ fields.color }}</div>
            </div>
            <div class="color-circle-pdp" :style="colorCircleStyle" :title="colorCircleTitle"></div>
          </div>
          <div class="code-embed-btn-add-to-cart w-embed"><button id="pdp-cart-button" class="pdp-button-solid" :class="cartBtnClasses" :disabled="cartBtnDisabled" :style="cartBtnStyle" @click.prevent="onCartClick">{{ cartBtnText }}</button></div>
          <div class="code-embed-btn-wish-list w-embed"><button id="pdp-wishlist-button" class="pdp-button-outline" style="cursor: pointer;" @click.prevent="onWishlistClick">{{ isItemInWishlist ? t('removeFromWishlist') : t('addToWishlist') }}</button></div>
          <div class="div-pdp-more-details">
            <div data-field="description" class="pdp-details-text" v-html="hydrated ? descriptionHtml : 'Loading...'"></div>
            <div class="div-content-wrapper tablet top-margin">
              <div class="div-dropdown-title" @click="detailsOpen = !detailsOpen">
                <div class="dropdown-title">Details and Fit</div>
                <div class="icon-dropdown-min details w-embed" :style="detailsOpen ? { display: 'inline-flex' } : undefined"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
                <div class="icon-dropdown-plus details w-embed" :style="detailsOpen ? { display: 'none' } : undefined"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
              </div>
              <div class="div-dropdown-content details" :class="{ 'is-open': detailsOpen }" :style="detailsOpen ? { display: 'flex' } : undefined">
                <div data-field="description" class="paragraph-primary _14px" v-html="hydrated ? descriptionHtml : 'Description'"></div>
              </div>
            </div>
            <div class="div-content-wrapper align-left">
              <div class="div-dropdown-title" @click="infoOpen = !infoOpen">
                <div class="dropdown-title">More Information</div>
                <div class="icon-dropdown-min info w-embed" :style="infoOpen ? { display: 'inline-flex' } : undefined"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
                <div class="icon-dropdown-plus info w-embed" :style="infoOpen ? { display: 'none' } : undefined"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
              </div>
              <div class="div-content-wrapper-dropdown info" :class="{ 'is-open': infoOpen }" :style="infoOpen ? { display: 'flex' } : undefined">
                <div class="div-dropdown-content more-info">
                  <div class="pdp-medium subtext">Fabric :<br></div>
                  <div data-field="fabric" class="paragraph-primary _14px initial-caps"><template v-if="hydrated">{{ fields.fabric }}</template><template v-else>Fabric %<br></template></div>
                </div>
                <div class="div-dropdown-content vertical more-info">
                  <div class="pdp-medium subtext">Care Instructions :<br></div>
                  <div data-field="care_instructions" class="pdp-details-text care"><template v-if="hydrated">{{ fields.care_instructions }}</template><template v-else>These are the care instructions.<br></template></div>
                </div>
              </div>
            </div>
            <div class="div-content-wrapper align-left">
              <div class="div-dropdown-title" @click="availabilityOpen = !availabilityOpen">
                <div class="dropdown-title">item Availability</div>
                <div class="icon-dropdown-min availability w-embed" :style="availabilityOpen ? { display: 'inline-flex' } : undefined"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
                <div class="icon-dropdown-plus availability w-embed" :style="availabilityOpen ? { display: 'none' } : undefined"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
              </div>
              <div class="div-dropdown-content availability" :class="{ 'is-open': availabilityOpen }" :style="availabilityOpen ? { display: 'flex' } : undefined">
                <div class="paragraph-primary _14px">All of our pieces are truly unique. That means we only have one of each. Currently rented out? Add it to your <strong>wish list</strong> to track its availability.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="div-section product related">
      <div class="heading-mobile align-left large">you may also like</div>
      <div data-related="wrapper" class="div-content-wrapper related-section" :style="relatedHidden ? { display: 'none' } : undefined">
        <div ref="relatedViewportEl" data-related-viewport="" class="div-content-wrapper related-viewport">
          <div data-related-track="" class="data-related-track">
            <a data-template="related-card" href="#" class="data-related-card is-template w-inline-block"><img class="data-related-img" src="/images/placeholder-pdp.png" alt="" sizes="(max-width: 800px) 100vw, 800px" loading="lazy" data-related-img="" srcset="/images/placeholder-pdp-p-500.png 500w, /images/placeholder-pdp.png 800w">
              <div data-related-name="" class="data-related-name">Name</div>
            </a>
            <a v-for="(r, idx) in related" :key="'rel-' + r.sku" :ref="(el) => setRelatedCardEl(el, idx)" data-related-card="" :href="r.href" class="data-related-card w-inline-block"><img class="data-related-img" data-related-img="" :src="r.loaded ? r.url : '/images/placeholder-pdp.png'" :srcset="r.loaded ? undefined : '/images/placeholder-pdp-p-500.png 500w, /images/placeholder-pdp.png 800w'" :sizes="r.loaded ? undefined : '(max-width: 800px) 100vw, 800px'" :loading="r.loaded ? 'eager' : 'lazy'" :decoding="r.loaded ? 'async' : undefined" :alt="r.loaded ? r.name : ''">
              <div data-related-name="" class="data-related-name">{{ r.name }}</div>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
/* Page loader - hide template content until SKU validated */
.pdp-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.pdp-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* Hide page content initially */
body.pdp-checking {
  overflow: hidden;
}
body.pdp-checking > *:not(.pdp-loader) {
  visibility: hidden;
}
/* ---------- base helpers ---------- */
.is-template { display: none !important; }
/* ---------- PDP image + zoom ---------- */
.div-pdp-image-wrapper {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.div-pdp-image-wrapper [data-main-img] {
  display: block;
  width: 75%;
  height: auto;
  transform-origin: 50% 50%;
  transition: transform .25s ease, transform-origin .05s linear;
  will-change: transform, transform-origin;
  cursor: zoom-in;
}
.div-pdp-image-wrapper.is-zoomed [data-main-img] {
  transform: scale(2);
  cursor: zoom-out;
}
/* ---------- thumbnails ---------- */
[data-thumb-img] { display:block; width:80%; height:auto; border-radius: 20px; }
.thumb-clone { border-radius: 20px; overflow: hidden; }
.thumb-clone.is-active { outline: .5px solid #24282d !important; border-radius: 20px; }
/* ---------- RELATED STRIP (no margin/padding overrides) ---------- */
/* Viewport: owns the horizontal scroll only. Spacing comes from Webflow. */
[data-related-viewport]{
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  /* no padding/margin here — use Designer */
  /* optional, feel free to remove if you prefer: */
  scroll-snap-type: x mandatory;   /* snap is not spacing, just behavior */
}
[data-related-viewport]::-webkit-scrollbar { display: none; }
/* Track: pure horizontal row. No padding/margin set here. */
[data-related-track]{
  display: flex;
  flex-wrap: nowrap;
  gap: 12px !important;           /* card spacing only; adjust in Designer if needed */
}
/* Cards: size + snapping only. No margins/padding altered. */
[data-template="related-card"],
[data-related-track] [data-related-card],
[data-related-track] a:not(.is-template){
  flex: 0 0 auto;
  width: clamp(140px, 20vw, 220px);
  display: block;
  text-decoration: none;
  color: inherit;
  scroll-snap-align: start;
}
/* Images */
[data-related-img]{ display:block; width:100%; height:auto; border-radius:20;
}
/* Keep Webflow's default slide layout intact */
[data-slider="mobile-gallery"] .w-slide{
  /* no flex here */
  text-align:center;        /* safe centering */
  padding:0;
}
/* Center and contain the image */
[data-slider="mobile-gallery"] .mobile-slide-img{
  display:block;
  margin:0 auto;
  max-width:100%;
  height:auto;
  max-height:60vh;
  object-fit:contain;
  border-radius: 20px;
}
/* ---------- PDP action buttons ---------- */
.pdp-button-solid {
  display: block;
  width: 300px;
  padding: 16px 20px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: lowercase;
  background-color: #a92296;
  border: 1px solid #a92296;
  color: #f6f8f9;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
}
.pdp-button-solid:hover {
  background-color: #4b073f;
  color: #f6f8f9;
}
.pdp-button-outline {
  display: block;
  width: 300px;
  padding: 16px 20px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: lowercase;
  background-color: #fff4fe;
  color: #24282d;
  border: 1px solid #a92296;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
}
.pdp-button-outline:hover {
  background-color: #f6f8f9;
  color: #24282d;
  border: 1px solid #4b073f;
}
/* (Optional) remove any stray left spacing on the wrapper */
[data-slider="mobile-gallery"]{
  padding-left:0 !important;
  margin-left:0 !important;
}
/* Keep mask clean */
[data-slider="mobile-gallery"] .w-slider-mask{ overflow:hidden;
}
  /* Keep the related card text area transparent on mobile */
  [data-related-card] [data-related-name]{
    background: transparent !important;
  }
  /* If the whole card is picking up gray, clear it (text area only) */
  [data-related-card]{
    background: transparent;
}
/* Hide desktop gallery on mobile, show on tablet+ */
@media (max-width: 667px) {
  .div-pdp-image-wrapper,
  [data-thumbs] {
    display: none !important;
  }
}
/* Show desktop gallery on tablet and up */
@media (min-width: 668px) {
  [data-slider="mobile-gallery"] {
    display: none !important;
  }
}
/* Make PDP action buttons equal width on mobile */
@media (max-width: 767px) {
  #pdp-cart-button,
  #pdp-wishlist-button {
    width: 100% !important;
    display: block !important;
  }
}
</style>
