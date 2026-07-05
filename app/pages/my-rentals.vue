<script setup lang="ts">
useHead({
  title: 'My Rentals',
  meta: [
    { name: 'description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:title', content: 'My Rentals' },
    { property: 'og:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { name: 'twitter:title', content: 'My Rentals' },
    { name: 'twitter:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: `{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": "My Rentals",
  "url": "/my-rentals",
  "inLanguage": "en",
  "description": "User account page for managing clothing rentals and rental history",
  "mainEntity": {
    "@type": "WebApplication",
    "name": "Dematerialized Rental Management",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "category": "Clothing Rental Service"
    },
    "featureList": [
      "View current rentals",
      "Access rental history",
      "Manage rented clothing items",
      "Track reservations"
    ]
  },
  "isPartOf": {
    "@type": "WebSite",
    "name": "Dematerialized",
    "url": "/",
    "description": "Sustainable fashion rental platform",
    "publisher": {
      "@type": "Organization",
      "name": "Dematerialized",
      "logo": {
        "@type": "ImageObject",
        "url": "https://dematerialized.nl/images/meta/Demat_logo_4000x4000_black-background.webp"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "reservations@dematerialized.nl",
        "contactType": "Customer Service"
      }
    }
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
        "name": "Account",
        "item": "/account"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "My Rentals",
        "item": "/my-rentals"
      }
    ]
  }
}`,
    },
  ],
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const route = useRoute()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const RENTALS_T: Record<string, { en: string; nl: string }> = {
  unknownItem:    { en: 'unknown item', nl: 'onbekend item' },
  rentedOn:       { en: 'rented on', nl: 'gehuurd op' },
  wantToKeep:     { en: 'want to keep it?', nl: 'wil je het houden?' },
  percentOff:     { en: '50% off', nl: '50% korting' },
  inCart:         { en: 'in cart', nl: 'in winkelmand' },
  addToCartLabel: { en: 'add to cart', nl: 'toevoegen aan winkelmand' },
  viewItem:       { en: 'view item', nl: 'bekijk item' },
  purchasedOn:    { en: 'purchased on', nl: 'gekocht op' },
  returnedOn:     { en: 'returned on', nl: 'geretourneerd op' },
  returnedWord:   { en: 'returned', nl: 'geretourneerd' },
  purchasedWord:  { en: 'purchased', nl: 'gekocht' },
  onWord:         { en: 'on', nl: 'op' },
  rentalDetails:  { en: 'rental details', nl: 'huurgegevens' },
  priceError:     { en: 'Unable to determine price for this item. Please try again later.', nl: 'kan de prijs van dit item niet bepalen. probeer het later opnieuw.' },
  addError:       { en: 'Unable to add to cart. Please refresh the page and try again.', nl: 'kan niet aan winkelmand toevoegen. ververs de pagina en probeer opnieuw.' },
  signinTitle:    { en: 'sign in to view your rentals', nl: 'log in om je verhuur te bekijken' },
  signinText:     { en: 'you need to be logged in to see your rentals.', nl: 'je moet ingelogd zijn om je verhuur te zien.' },
  signin:         { en: 'sign in', nl: 'inloggen' },
}

function t(key: string): string {
  const e = RENTALS_T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

// Pluralization helper ('item' is invariant in both languages)
function itemsWord(n: number): string {
  return isNL.value ? 'items' : (n === 1 ? 'item' : 'items')
}

// ── Sidenav active link (replaces the old auto-highlight script) ──
const sidenavPath = computed(() => route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, ''))
function isSidenavActive(href: string): boolean {
  const h = href.replace(/\/$/, '')
  return sidenavPath.value === h || sidenavPath.value.startsWith(h + '/')
}
// Hide the reservations link for shipping members (synchronous, from auth plugin state)
const { userData: authUserData } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const hideReservationsLink = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(authUserData.value?.membership?.name ?? ''))

// ── Page state (mirrors the old display toggles) ──
const isAuthenticated = ref(false)
const showLoading = ref(true)
const showNoMembership = ref(false)
const showEmpty = ref(false)
const showActiveSection = ref(false)
const showNoActive = ref(false)
const showHistorySection = ref(false)
const showContact = ref(true)

const activeRentals = ref<any[]>([])
const returnedRentals = ref<any[]>([])
const pricingCategories = ref<any[] | null>(null)
const cartItemIds = ref<Set<number>>(new Set())

const modalOpen = ref(false)
const modalTitleText = ref('')
const modalRentals = ref<any[]>([])

const MAX_THUMBS = 3

// ── Pricing ──
async function fetchPricingCategories() {
  if (pricingCategories.value) return pricingCategories.value
  try {
    const response = await fetch(`${apiBase}/clothing_items/pricing_categories`, {
      headers: { Accept: 'application/json' },
    })
    if (response.ok) {
      pricingCategories.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching pricing categories:', err)
  }
  return pricingCategories.value
}

function getRetailPrice(clothingItem: any): number | null {
  if (!pricingCategories.value || !clothingItem?.category?.pricing_group) return null
  const pricingGroup = clothingItem.category.pricing_group
  const isFastFashion = clothingItem.brand?.is_fast_fashion || false
  const match = pricingCategories.value.find((pc: any) =>
    pc.display_name === pricingGroup && pc.is_fast_fashion === isFastFashion
  )
  return match?.retail_price_cents || null
}

function getPurchasePrice(clothingItem: any): number | null {
  const retailPrice = getRetailPrice(clothingItem)
  if (!retailPrice) return null
  return Math.round(retailPrice * 0.5)
}

function hasPrice(clothingItem: any): boolean {
  return !!(getRetailPrice(clothingItem) && getPurchasePrice(clothingItem))
}

// ── Auth-gated fetch (Auth0 arrives in Phase 4; early-returns without a token) ──
async function getAuthToken(): Promise<string | null> {
  const auth0 = (window as any).auth0Client
  if (!auth0) return null
  try {
    const authed = await auth0.isAuthenticated()
    if (!authed) return null
    return await auth0.getTokenSilently()
  } catch {
    return null
  }
}

async function fetchRentals(includeHistory = false): Promise<any[] | null> {
  const token = await getAuthToken()
  if (!token) return null
  try {
    const url = includeHistory
      ? `${apiBase}/private_clothing_items/rentals?include_history=true`
      : `${apiBase}/private_clothing_items/rentals`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      console.error('Failed to fetch rentals:', response.status)
      return null
    }
    return await response.json()
  } catch (err) {
    console.error('Error fetching rentals:', err)
    return null
  }
}

// ── Formatters ──
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toLowerCase()
}

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '€0.00'
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`
}

function getItemImage(rental: any): string {
  if (!rental.clothing_item?.images?.length) return ''
  const frontImg = rental.clothing_item.images.find((img: any) =>
    img.image_type === 'front' ||
    (img.image_name && img.image_name.toLowerCase().includes('front'))
  )
  return frontImg?.object_url || rental.clothing_item.images[0]?.object_url || ''
}

function itemName(rental: any): string {
  return rental.clothing_item?.name?.toLowerCase() || t('unknownItem')
}

function productHref(sku: string): string {
  return (isNL.value ? '/nl/product' : '/product') + '?sku=' + encodeURIComponent(sku)
}

// ── Cart (shared PurchaseCart; local set keeps the in-cart visual state) ──
function isInCart(clothingItemId: number | undefined): boolean {
  return clothingItemId != null && cartItemIds.value.has(clothingItemId)
}

function syncCartState() {
  const cart = (window as any).PurchaseCart
  if (!cart) return
  const ids = new Set<number>()
  for (const r of activeRentals.value) {
    const id = r.clothing_item?.id
    if (id != null && cart.hasItem(id)) ids.add(id)
  }
  cartItemIds.value = ids
}

function addToCart(rentalId: number) {
  const rental = activeRentals.value.find(r => r.id === rentalId)
  if (!rental) {
    console.error('Rental not found:', rentalId)
    return
  }
  const ci = rental.clothing_item
  if (!ci) {
    console.error('No clothing item data for rental:', rentalId)
    return
  }
  const retailPrice = getRetailPrice(ci)
  const purchasePrice = getPurchasePrice(ci)
  if (!retailPrice) {
    console.error('Could not determine price for item:', ci.sku)
    alert(t('priceError'))
    return
  }
  const cartItem = {
    clothing_item_id: ci.id,
    rental_id: rental.id,
    sku: ci.sku || '',
    name: ci.name || 'Unknown Item',
    brand: ci.brand?.brand_name || '',
    image_url: getItemImage(rental),
    size: ci.size?.size || ci.size?.standard_size?.standard_size || '',
    colors: ci.colors?.map((c: any) => c.name).join(', ') || '',
    retail_price_cents: retailPrice,
    purchase_price_cents: purchasePrice,
  }
  const cart = (window as any).PurchaseCart
  if (cart) cart.addItem(cartItem)
  const ids = new Set(cartItemIds.value)
  ids.add(ci.id)
  cartItemIds.value = ids
}

function removeFromCart(clothingItemId: number) {
  const cart = (window as any).PurchaseCart
  if (cart) cart.removeItem(clothingItemId)
  const ids = new Set(cartItemIds.value)
  ids.delete(clothingItemId)
  cartItemIds.value = ids
}

// ── Date grouping for history ──
function formatDateKey(dateString: string | null | undefined): string {
  if (!dateString) return 'unknown'
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const historyGroups = computed(() => {
  const groups: Record<string, any[]> = {}
  returnedRentals.value.forEach((r) => {
    const dateKey = formatDateKey(r.rental_return_date)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(r)
  })
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  return sortedKeys.map(key => ({
    dateKey: key,
    displayDate: formatDate(groups[key][0].rental_return_date),
    rentals: groups[key],
  }))
})

function groupDateLabel(group: { displayDate: string; rentals: any[] }): string {
  const count = group.rentals.length
  const purchasedCount = group.rentals.filter(r =>
    r.clothing_item?.status?.toLowerCase() === 'sold'
  ).length
  const returnedCount = count - purchasedCount
  if (purchasedCount === count) {
    return t('purchasedOn') + ' ' + group.displayDate
  } else if (returnedCount === count) {
    return t('returnedOn') + ' ' + group.displayDate
  }
  return returnedCount + ' ' + t('returnedWord') + ' & ' + purchasedCount + ' ' + t('purchasedWord') + ' ' + t('onWord') + ' ' + group.displayDate
}

function groupImagesWidth(group: { rentals: any[] }): number {
  return Math.min(group.rentals.length, MAX_THUMBS) * 28 + 30
}

// ── Modal: grouped history ──
function openGroupModal(dateKey: string) {
  const rentals = returnedRentals.value.filter(r =>
    (r.status === 'Returned' || r.rental_return_date) && formatDateKey(r.rental_return_date) === dateKey
  )
  if (rentals.length === 0) {
    console.error('No rentals found for date:', dateKey)
    return
  }
  const purchasedCount = rentals.filter(r =>
    r.clothing_item?.status?.toLowerCase() === 'sold'
  ).length
  const returnedCount = rentals.length - purchasedCount
  if (purchasedCount === rentals.length) {
    modalTitleText.value = rentals.length + ' ' + itemsWord(rentals.length) + ' ' + t('purchasedWord')
  } else if (returnedCount === rentals.length) {
    modalTitleText.value = rentals.length === 1
      ? t('rentalDetails')
      : rentals.length + ' ' + itemsWord(rentals.length) + ' ' + t('returnedWord')
  } else {
    modalTitleText.value = returnedCount + ' ' + t('returnedWord') + ' & ' + purchasedCount + ' ' + t('purchasedWord')
  }
  modalRentals.value = rentals
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeRentalModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
}

// ── Page rendering flow (port of RentalsManager.renderRentalsPage) ──
async function loadRentals() {
  showLoading.value = true
  showEmpty.value = false
  showActiveSection.value = false
  showHistorySection.value = false
  showNoActive.value = false

  await fetchPricingCategories()
  const rentals = await fetchRentals(true)

  showLoading.value = false

  if (!rentals || rentals.length === 0) {
    showEmpty.value = true
    return
  }

  const active = rentals.filter(r => r.active && !r.rental_return_date)
  const returned = rentals.filter(r => !r.active || r.rental_return_date)
  returned.sort((a, b) => new Date(b.rental_return_date).getTime() - new Date(a.rental_return_date).getTime())

  activeRentals.value = active
  returnedRentals.value = returned
  syncCartState()

  showActiveSection.value = true
  showNoActive.value = active.length === 0

  if (returned.length > 0) {
    showHistorySection.value = true
  }

  if (active.length === 0 && returned.length === 0) {
    showEmpty.value = true
    showActiveSection.value = false
  }
}

// TODO Phase 4: window.auth0Client wiring — until then the page stays in its signed-out state
async function initRentals() {
  const auth0 = (window as any).auth0Client
  if (!auth0) return
  let isAuth = false
  try {
    isAuth = await auth0.isAuthenticated()
  } catch {
    return
  }
  if (!isAuth) return
  isAuthenticated.value = true
  try {
    const token = await auth0.getTokenSilently()
    const userResponse = await fetch(`${apiBase}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (!userData.stripe_id) {
        showLoading.value = false
        showNoMembership.value = true
        showContact.value = false
        return
      }
    }
  } catch (err) {
    console.error('Error checking membership:', err)
  }
  await loadRentals()
}

// TODO Phase 4: wire the Auth0 sign-in modal (window.openAuthModal)
function openAuthModal() {
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

onMounted(() => {
  ;(window as any).RentalsManager = { renderRentalsPage: syncCartState }
  initRentals()
})

onBeforeUnmount(() => {
  delete (window as any).RentalsManager
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="w-layout-blockcontainer container-1300 full-screen w-container">
    <div class="div-header-policies res">
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies res">rental overview</div>
      </div>
    </div>
    <div class="div-section-policies rentals">
      <div class="sidenav-account-pages w-embed w-script">
        <nav class="account-sidenav" aria-label="Account navigation">
          <div class="account-sidenav-inner">
            <a href="/profile" class="account-sidenav-link" :class="{ active: isSidenavActive('/profile') }" data-nav="profile">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M20 21a8 8 0 1 0-16 0"></path>
                </svg>
              </span>
              <span class="lang-en">profile</span><span class="lang-nl">profiel</span>
            </a>
            <a href="/my-rentals" class="account-sidenav-link" :class="{ active: isSidenavActive('/my-rentals') }" data-nav="my-rentals">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="m21 16-9-6.5V6a2 2 0 1 0-4 0"></path>
                  <path d="M3 16h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </span>
              <span class="lang-en">my rentals</span><span class="lang-nl">mijn huurartikelen</span>
            </a>
            <a href="/reservations" class="account-sidenav-link" :class="{ active: isSidenavActive('/reservations') }" data-nav="reservations" data-auth-gate :style="hideReservationsLink ? { display: 'none' } : undefined">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                  <path d="M16 2v4M8 2v4M3 10h18"></path>
                </svg>
              </span>
              <span class="lang-en">reservations</span><span class="lang-nl">reserveringen</span>
            </a>
            <div class="account-sidenav-sep"></div>
            <a href="/donations-credits" class="account-sidenav-link" :class="{ active: isSidenavActive('/donations-credits') }" data-nav="donations">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </span>
              <span class="lang-en">donations &amp; credits</span><span class="lang-nl">donaties &amp; tegoed</span>
            </a>
            <a href="/purchases" class="account-sidenav-link" :class="{ active: isSidenavActive('/purchases') }" data-nav="purchases">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </span>
              <span class="lang-en">purchases</span><span class="lang-nl">aankopen</span>
            </a>
            <div class="account-sidenav-sep"></div>
            <a href="/my-membership" class="account-sidenav-link" :class="{ active: isSidenavActive('/my-membership') }" data-nav="membership">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z"></path>
                </svg>
              </span>
              <span class="lang-en">membership</span><span class="lang-nl">lidmaatschap</span>
            </a>
          </div>
        </nav>
      </div>
      <div class="div-policy-menu rentals right">
        <div class="div-content-wrapper-policies right rentals">
          <div class="code-embed-35 w-embed">
            <div id="rentals-container">
              <div v-if="!isAuthenticated" class="rentals-signin">
                <h2 class="rentals-signin-title">{{ t('signinTitle') }}</h2>
                <p class="rentals-signin-text">{{ t('signinText') }}</p>
                <button class="rentals-signin-btn" @click="openAuthModal">{{ t('signin') }}</button>
              </div>
              <template v-else>
                <div id="rentals-loading" class="rentals-loading" :style="{ display: showLoading ? 'flex' : 'none' }">
                  <div class="rentals-loading-spinner"></div>
                  <p class="rentals-loading-text"><span class="lang-en">loading your rentals...</span><span class="lang-nl">je items worden geladen...</span></p>
                </div>
                <div id="rentals-no-membership" class="rentals-no-membership" :style="{ display: showNoMembership ? 'flex' : 'none' }">
                  <svg class="rentals-no-membership-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <h2 class="rentals-no-membership-title"><span class="lang-en">want to start renting?</span><span class="lang-nl">wil je gaan huren?</span></h2>
                  <p class="rentals-no-membership-text"><span class="lang-en">to rent from our shared closet, you'll need a membership first</span><span class="lang-nl">om uit onze gedeelde kast te huren heb je eerst een lidmaatschap nodig</span></p>
                  <a href="/memberships" class="rentals-no-membership-btn"><span class="lang-en">explore memberships</span><span class="lang-nl">bekijk lidmaatschappen</span></a>
                </div>
                <div id="rentals-empty" class="rentals-empty" :style="{ display: showEmpty ? 'flex' : 'none' }">
                  <div class="rentals-empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m21 16-9-6.5V6a2 2 0 1 0-4 0"></path>
                      <path d="M3 16h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                  </div>
                  <h2 class="rentals-empty-title"><span class="lang-en">no rentals yet</span><span class="lang-nl">nog niks gehuurd</span></h2>
                  <p class="rentals-empty-text"><span class="lang-en">time to pick your faves from our shared closet. please note that recent rentals may take some time to show up here.</span><span class="lang-nl">tijd om je favorieten uit onze gedeelde kast te kiezen. let op: recente verhuur kan even duren voordat het hier verschijnt.</span></p>
                  <a href="/clothing" class="rentals-empty-btn"><span class="lang-en">shop now</span><span class="lang-nl">shop nu</span></a>
                </div>
                <div id="rentals-active" class="rentals-section" :style="{ display: showActiveSection ? 'block' : 'none' }">
                  <div class="rentals-section-title"><span class="lang-en">currently renting</span><span class="lang-nl">momenteel gehuurd</span></div>
                  <div id="rentals-no-active" class="rentals-no-active" :style="{ display: showNoActive ? 'flex' : 'none' }">
                    <div class="rentals-no-active-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m21 16-9-6.5V6a2 2 0 1 0-4 0"></path>
                        <path d="M3 16h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      </svg>
                    </div>
                    <h3 class="rentals-no-active-title"><span class="lang-en">no active rentals</span><span class="lang-nl">geen actieve verhuur</span></h3>
                    <p class="rentals-no-active-text"><span class="lang-en">ready to refresh your wardrobe?</span><span class="lang-nl">klaar om je garderobe te vernieuwen?</span></p>
                    <a href="/clothing" class="rentals-no-active-btn"><span class="lang-en">browse the collection</span><span class="lang-nl">bekijk de collectie</span></a>
                  </div>
                  <div id="active-rentals-list">
                    <div v-for="rental in activeRentals" :key="rental.id" class="rental-card">
                      <a :href="productHref(rental.clothing_item?.sku || '')" class="rental-card-image">
                        <img v-if="getItemImage(rental)" :src="getItemImage(rental)" :alt="itemName(rental)" loading="lazy">
                      </a>
                      <div class="rental-card-content">
                        <div class="rental-card-name">{{ itemName(rental) }}</div>
                        <div class="rental-card-date">{{ t('rentedOn') }} {{ formatDate(rental.rental_start_date) }}</div>
                        <div v-if="hasPrice(rental.clothing_item)" class="rental-card-purchase-section">
                          <div class="rental-card-purchase-label">{{ t('wantToKeep') }}</div>
                          <div class="rental-card-purchase-prices">
                            <span class="price-original">{{ formatPrice(getRetailPrice(rental.clothing_item)) }}</span>
                            <span class="price-discount">{{ formatPrice(getPurchasePrice(rental.clothing_item)) }}</span>
                            <span class="price-badge">{{ t('percentOff') }}</span>
                          </div>
                        </div>
                        <div class="rental-card-actions">
                          <template v-if="hasPrice(rental.clothing_item)">
                            <button v-if="isInCart(rental.clothing_item?.id)" class="rental-card-btn rental-card-btn-in-cart" @click="removeFromCart(rental.clothing_item.id)">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              {{ t('inCart') }}
                            </button>
                            <button v-else class="rental-card-btn" @click="addToCart(rental.id)">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                              {{ t('addToCartLabel') }}
                            </button>
                          </template>
                          <a :href="productHref(rental.clothing_item?.sku || '')" class="rental-card-link">{{ t('viewItem') }}</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="rentals-history" class="rentals-section" :style="{ display: showHistorySection ? 'block' : 'none' }">
                  <div class="rentals-section-title"><span class="lang-en">rental history</span><span class="lang-nl">huurgeschiedenis</span></div>
                  <div id="history-rentals-list">
                    <div v-for="group in historyGroups" :key="group.dateKey" class="history-group" @click="openGroupModal(group.dateKey)">
                      <div class="history-group-header">
                        <div class="history-group-images" :style="{ width: groupImagesWidth(group) + 'px' }">
                          <div v-for="(r, index) in group.rentals.slice(0, MAX_THUMBS)" :key="r.id" class="history-group-thumb" :style="{ zIndex: MAX_THUMBS - index, left: (index * 28) + 'px' }">
                            <img v-if="getItemImage(r)" :src="getItemImage(r)" :alt="r.clothing_item?.name || 'item'">
                          </div>
                          <div v-if="group.rentals.length > MAX_THUMBS" class="history-group-more-badge" :style="{ left: (Math.min(group.rentals.length, MAX_THUMBS) * 28 - 6) + 'px' }">
                            +{{ group.rentals.length - MAX_THUMBS }}
                          </div>
                        </div>
                        <div class="history-group-info">
                          <div class="history-group-date">{{ groupDateLabel(group) }}</div>
                          <div class="history-group-count">{{ group.rentals.length }} {{ itemsWord(group.rentals.length) }}</div>
                        </div>
                        <div class="history-group-arrow">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="rentals-contact" class="rentals-contact" :style="showContact ? undefined : { display: 'none' }">
                  <p><span class="lang-en">For any rental-related inquiries, please <a href="https://wa.me/31612345678">contact us on WhatsApp</a> or send an email to <a href="mailto:reservations@dematerialized.nl">support@dematerialized.nl</a>.</span><span class="lang-nl">Voor vragen over je verhuur kun je <a href="https://wa.me/31612345678">contact met ons opnemen via WhatsApp</a> of een e-mail sturen naar <a href="mailto:reservations@dematerialized.nl">support@dematerialized.nl</a>.</span></p>
                </div>
              </template>
            </div>
            <div id="rental-detail-backdrop" class="rental-modal-backdrop" :class="{ 'rental-modal-backdrop-open': modalOpen }" @click="closeRentalModal"></div>
            <div id="rental-detail-modal" class="rental-modal" :class="{ 'rental-modal-open': modalOpen }">
              <div class="rental-modal-container">
                <div class="rental-modal-header">
                  <div class="rental-modal-title">
                    <template v-if="modalTitleText">{{ modalTitleText }}</template>
                    <template v-else><span class="lang-en">rental details</span><span class="lang-nl">huurgegevens</span></template>
                  </div>
                  <button class="rental-modal-close" @click="closeRentalModal">&times;</button>
                </div>
                <div id="rental-modal-content" class="rental-modal-content">
                  <div v-if="modalRentals.length" class="history-modal-items">
                    <a v-for="r in modalRentals" :key="r.id" :href="productHref(r.clothing_item?.sku || '')" class="history-modal-item">
                      <div class="history-modal-item-image">
                        <img v-if="getItemImage(r)" :src="getItemImage(r)" :alt="itemName(r)">
                      </div>
                      <div class="history-modal-item-info">
                        <div class="history-modal-item-name">{{ itemName(r) }}</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-footer-spacer"></div>
</template>

<style>
/* ============================================
   MY RENTALS PAGE STYLES
   Add to Page Settings → Custom Code → Head Code
   Wrap in <style> tags
   ============================================ */
:root {
  --purple: #4b073f;
  --purple-dark: #3a052f;
  --pink: #a92296;
  --gray-dark: #24282d;
  --gray-medium: #46535e;
  --gray-light: #ced5da;
  --gray-very-light: #f6f8f9;
  --pink-light: #fff4fe;
  --green: #16a34a;
}
/* Container */
#rentals-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}
/* Loading State */
.rentals-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 16px;
}
.rentals-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-light);
  border-top-color: var(--purple);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.rentals-loading-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0;
}
/* Empty State */
.rentals-empty {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}
.rentals-empty-icon {
  color: var(--gray-light);
  margin-bottom: 16px;
}
.rentals-empty-icon svg {
  stroke: currentColor;
}
.rentals-empty-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}
.rentals-empty-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0 0 24px 0;
}
.rentals-empty-btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--purple);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: background 0.2s ease;
}
.rentals-empty-btn:hover {
  background: var(--purple-dark);
  color: white;
}
/* Sections */
.rentals-section {
  display: none;
  margin-bottom: 48px;
}
.rentals-section-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--gray-medium);
  margin-bottom: 20px;
}
/* No Active Rentals (shown when history exists but no current rentals) */
.rentals-no-active {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  background: var(--gray-very-light);
  border-radius: 16px;
  margin-bottom: 24px;
}
.rentals-no-active-icon {
  color: var(--gray-light);
  margin-bottom: 12px;
}
.rentals-no-active-icon svg {
  stroke: currentColor;
}
.rentals-no-active-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}
.rentals-no-active-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0 0 20px 0;
}
.rentals-no-active-btn {
  display: inline-block;
  padding: 12px 28px;
  background: var(--purple);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: background 0.2s ease;
}
.rentals-no-active-btn:hover {
  background: var(--purple-dark);
  color: white;
}
/* Active Rental Cards */
.rental-card {
  display: flex;
  gap: 20px;
  background: white;
  border: 1px solid var(--gray-light);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.rental-card:hover {
  border-color: var(--purple);
  box-shadow: 0 2px 12px rgba(75, 7, 63, 0.08);
}
.rental-card-image {
  width: 160px;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--gray-very-light);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.rental-card-image img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}
.rental-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.rental-card-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 8px;
  line-height: 1.3;
}
.rental-card-date {
  font-size: 16px;
  color: var(--gray-medium);
}
/* Purchase Section */
.rental-card-purchase-section {
  background: var(--pink-light);
  border-radius: 8px;
  padding: 14px;
  margin-top: 16px;
}
.rental-card-purchase-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--purple);
  margin-bottom: 8px;
}
.rental-card-purchase-prices {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.price-original {
  font-size: 16px;
  color: var(--gray-medium);
  text-decoration: line-through;
}
.price-discount {
  font-size: 20px;
  font-weight: 700;
  color: var(--pink);
}
.price-badge {
  background: var(--pink);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
  letter-spacing: 0.3px;
}
/* Actions */
.rental-card-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
}
.rental-card-link {
  font-size: 16px;
  color: var(--gray-medium);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.rental-card-link:hover {
  color: var(--purple);
}
.rental-card-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--purple);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.rental-card-btn:hover {
  background: var(--purple-dark);
}
.rental-card-btn svg {
  flex-shrink: 0;
}
.rental-card-btn-in-cart {
  background: #04314d;
}
.rental-card-btn-in-cart:hover {
  background: #032640;
}
/* History Groups (date-grouped) */
#history-rentals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.history-group {
  background: white;
  border: 1px solid var(--gray-light);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.history-group:hover {
  border-color: var(--purple);
  box-shadow: 0 2px 8px rgba(75, 7, 63, 0.08);
}
.history-group-header {
  display: flex;
  align-items: center;
  gap: 20px;
}
.history-group-images {
  display: flex;
  position: relative;
  height: 64px;
  flex-shrink: 0;
}
.history-group-thumb {
  position: absolute;
  width: 52px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--gray-very-light);
  border: 2.5px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.history-group-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.history-group-more-badge {
  position: absolute;
  bottom: -4px;
  z-index: 10;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--purple);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.history-group-info {
  flex: 1;
  min-width: 0;
}
.history-group-date {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 4px;
}
.history-group-count {
  font-size: 14px;
  color: var(--gray-medium);
}
.history-group-arrow {
  color: var(--gray-medium);
  flex-shrink: 0;
}
@media (max-width: 600px) {
  .history-group-thumb {
    width: 44px;
    height: 54px;
  }
  .history-group-images {
    height: 54px;
  }
}
/* History Modal Items */
.history-modal-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}
.history-modal-item {
  display: block;
  text-decoration: none;
  background: var(--gray-very-light);
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s ease;
}
.history-modal-item:hover {
  transform: translateY(-2px);
}
.history-modal-item-image {
  width: 100%;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--gray-very-light);
}
.history-modal-item-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.history-modal-item-info {
  padding: 12px;
}
.history-modal-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Sign In State */
.rentals-signin {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}
.rentals-signin-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}
.rentals-signin-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0 0 24px 0;
}
.rentals-signin-btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--purple);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.rentals-signin-btn:hover {
  background: var(--purple-dark);
}
/* Contact Footer */
.rentals-contact {
  margin-top: 48px;
  padding: 24px;
  background: var(--gray-very-light);
  border-radius: 12px;
  text-align: center;
}
.rentals-contact p {
  margin: 0;
  font-size: 16px;
  color: var(--gray-medium);
  line-height: 1.6;
}
.rentals-contact a {
  color: var(--purple);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.rentals-contact a:hover {
  color: var(--pink);
}
/* Modal */
.rental-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.rental-modal-backdrop-open {
  opacity: 1;
  visibility: visible;
}
.rental-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
}
.rental-modal-open {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}
.rental-modal-container {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.rental-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--gray-light);
}
.rental-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-dark);
}
.rental-modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--gray-medium);
  line-height: 1;
}
.rental-modal-content {
  padding: 24px;
  overflow-y: auto;
}
/* Responsive */
@media (max-width: 600px) {
  .rental-card {
    flex-direction: column;
    gap: 16px;
  }
  .rental-card-image {
    width: 100%;
    height: 280px;
    padding: 20px;
  }
  .rental-card-actions {
    align-items: stretch;
  }
  .rental-card-btn {
    justify-content: center;
  }
  .rental-card-link {
    text-align: center;
  }
  .history-group-images {
    width: 65px;
  }
  .history-group-thumb {
    width: 40px;
    height: 50px;
  }
  .history-group-thumb:nth-child(2) { left: 12px; }
  .history-group-thumb:nth-child(3) { left: 24px; }
  .history-group-thumb:nth-child(4) { left: 36px; }
  .history-modal-items {
    grid-template-columns: repeat(2, 1fr);
  }
}
/* No Membership State */
.rentals-no-membership {
  display: none;
  flex-direction: column;
  align-items: center;
  background: #eff9ff;
  border: 1px solid #b8e4ff;
  border-radius: 20px;
  padding: 60px 32px;
  text-align: center;
}
.rentals-no-membership-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: #04314d;
  opacity: 0.5;
}
.rentals-no-membership-title {
  font-size: 22px;
  font-weight: 600;
  color: #24282d;
  margin: 0 0 8px 0;
}
.rentals-no-membership-text {
  color: #46535e;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 28px 0;
  max-width: 400px;
}
.rentals-no-membership-btn {
  display: inline-block;
  padding: 16px 40px;
  background: #04314d;
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  border-radius: 50px;
  transition: background 0.2s ease, transform 0.2s ease;
}
.rentals-no-membership-btn:hover {
  background: #032640;
  transform: translateY(-1px);
  color: #fff;
}
@media (max-width: 600px) {
  .rentals-no-membership {
    padding: 40px 24px;
  }
}
</style>
