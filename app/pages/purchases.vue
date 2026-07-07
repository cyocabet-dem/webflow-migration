<script setup lang="ts">
useHead({
  title: 'Purchases',
  meta: [
    { name: 'description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:title', content: 'Purchases' },
    { property: 'og:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { name: 'twitter:title', content: 'Purchases' },
    { name: 'twitter:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ],
})

const config = useRuntimeConfig()
const route = useRoute()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

// ── Localization dict (page content is JS-rendered, so .lang spans can't be used here)
const PURCHASES_T: Record<string, { en: string; nl: string }> = {
  purchaseDetails:  { en: 'purchase details', nl: 'aankoopdetails' },
  purchasedOn:      { en: 'purchased on', nl: 'gekocht op' },
  viewItem:         { en: 'view item', nl: 'bekijk item' },
  payment:          { en: 'payment', nl: 'betaling' },
  subtotal:         { en: 'subtotal (50% off)', nl: 'subtotaal (50% korting)' },
  creditsApplied:   { en: 'store credits applied', nl: 'winkeltegoed toegepast' },
  totalCharged:     { en: 'total charged incl. VAT', nl: 'totaal in rekening gebracht incl. btw' },
  storeCreditsWord: { en: 'store credits', nl: 'winkeltegoed' },
  cardWord:         { en: 'card', nl: 'kaart' },
  fullyPaidCredits: { en: 'fully paid with store credits', nl: 'volledig betaald met winkeltegoed' },
  paidWithCard:     { en: 'paid with card', nl: 'betaald met kaart' },
  orderHasBeen:     { en: 'this order has been', nl: 'deze bestelling is' },
  orderDetails:     { en: 'order details', nl: 'bestelgegevens' },
  date:             { en: 'date', nl: 'datum' },
  items:            { en: 'items', nl: 'items' },
  itemsPurchased:   { en: 'items purchased', nl: 'gekochte items' },
  statusPaid:       { en: 'paid', nl: 'betaald' },
  statusRefunded:   { en: 'refunded', nl: 'terugbetaald' },
  statusPending:    { en: 'pending', nl: 'in behandeling' },
  statusFailed:     { en: 'failed', nl: 'mislukt' },
}

function t(key: string): string {
  const e = PURCHASES_T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

// 'item' is invariant in both languages
function itemsWord(n: number): string {
  return isNL.value ? 'items' : (n === 1 ? 'item' : 'items')
}

// Map a backend payment/order status to a localized word (falls back to raw value)
function statusLabel(status: string): string {
  const map: Record<string, string> = { paid: 'statusPaid', refunded: 'statusRefunded', pending: 'statusPending', failed: 'statusFailed' }
  const key = map[(status || '').toLowerCase()]
  return key ? t(key) : (status || '')
}

// ── Formatting
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'n/a'
  const date = new Date(dateString)
  return date.toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toLowerCase()
}

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '€0,00'
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`
}

// ── Order helpers
type AnyRecord = Record<string, any>

const maxThumbs = 3

function orderItems(order: AnyRecord): AnyRecord[] {
  return order.items || []
}

function shortOrderId(order: AnyRecord): string | number {
  const orderId = order.hash_id || order.id || 'unknown'
  return typeof orderId === 'string' ? orderId.substring(0, 8) : orderId
}

// Show subtotal (sum of item prices) on the card, not just the card charge
function cardTotal(order: AnyRecord): number {
  const items = orderItems(order)
  const calculatedSubtotal = items.reduce((sum: number, item: AnyRecord) => sum + (item.price_in_cents || 0), 0)
  return order.subtotal_cents || calculatedSubtotal || order.total_amount_in_cents || 0
}

function extraCount(order: AnyRecord): number {
  return orderItems(order).length - maxThumbs
}

function imagesWidth(order: AnyRecord): number {
  return Math.min(orderItems(order).length, maxThumbs) * 28 + 30
}

function moreBadgeLeft(order: AnyRecord): number {
  return (Math.min(orderItems(order).length, maxThumbs) * 28) - 6
}

function getItemImage(item: AnyRecord | null): string | null {
  if (!item) return null
  if (item.images && item.images.length > 0) {
    const frontImage = item.images.find((img: AnyRecord) => img.image_type === 'front') || item.images[0]
    return frontImage?.object_url || null
  }
  if (item.image_url) return item.image_url
  return null
}

function itemImage(item: AnyRecord): string | null {
  return getItemImage(item.clothing_item || {})
}

function itemName(item: AnyRecord): string {
  const clothingItem = item.clothing_item || {}
  return clothingItem.name?.toLowerCase() || 'item'
}

function itemSku(item: AnyRecord): string {
  const clothingItem = item.clothing_item || {}
  return clothingItem.sku || ''
}

function itemRetailCents(item: AnyRecord): number | null {
  const clothingItem = item.clothing_item || {}
  return item.retail_price_cents
    || clothingItem.retail_price_cents
    || clothingItem.pricing_category?.retail_price_cents
    || null
}

function productLink(sku: string): string {
  return (isNL.value ? '/nl/product' : '/product') + '?sku=' + encodeURIComponent(sku)
}

// ── Page state: loading first, then the auth check picks the view (matches purchases.js)
type View = 'loading' | 'signin' | 'no-membership' | 'empty' | 'content'
const view = ref<View>('loading')
const orders = ref<AnyRecord[]>([])

function openAuthModal() {
  // TODO Phase 4: wire Auth0 — old code called window.openAuthModal() from auth.js.
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

async function getAuthToken(): Promise<string | null> {
  // Phase 4 wires window.auth0Client; until then this early-returns and the sign-in state shows.
  const w = window as any
  if (!w.auth0Client) return null
  try {
    const isAuthenticated = await w.auth0Client.isAuthenticated()
    if (!isAuthenticated) return null
    return await w.auth0Client.getTokenSilently()
  } catch (err) {
    console.error('Auth check failed:', err)
    return null
  }
}

async function fetchOrders(token: string): Promise<AnyRecord[] | null> {
  try {
    const response = await fetch(`${config.public.apiBase}/private_clothing_items/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (!response.ok) {
      console.error('Failed to fetch orders:', response.status)
      return null
    }
    return await response.json()
  } catch (err) {
    console.error('Error fetching orders:', err)
    return null
  }
}

async function renderPurchasesPage(token: string) {
  try {
    const allOrders = await fetchOrders(token)

    // Filter to only show paid/completed orders
    const paidOrders = (allOrders || []).filter((order: AnyRecord) => {
      const paymentStatus = (order.payment_status || '').toLowerCase()
      const status = (order.status || '').toLowerCase()
      return paymentStatus === 'paid' || status === 'completed'
    })

    if (!paidOrders || paidOrders.length === 0) {
      view.value = 'empty'
      return
    }

    // Sort orders by date descending (newest first)
    paidOrders.sort((a: AnyRecord, b: AnyRecord) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())

    orders.value = paidOrders
    view.value = 'content'
  } catch (err) {
    console.error('Error rendering purchases page:', err)
    view.value = 'empty'
  }
}

async function initPurchasesPage() {
  const token = await getAuthToken()
  if (!token) {
    view.value = 'signin'
    return
  }
  view.value = 'loading'

  // Check membership status first
  try {
    const userResponse = await fetch(`${config.public.apiBase}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (!userData.stripe_id) {
        view.value = 'no-membership'
        return
      }
    }
  } catch (err) {
    console.error('Error checking membership:', err)
  }

  // Has membership — render purchases
  await renderPurchasesPage(token)
}

// ── Detail modal
const modalOpen = ref(false)
const selectedOrder = ref<AnyRecord | null>(null)

const modalStatus = computed(() => ((selectedOrder.value?.payment_status || 'paid') as string).toLowerCase())

const modalSubtotal = computed(() => {
  const order = selectedOrder.value
  if (!order) return 0
  // Calculate subtotal from item prices (more reliable than subtotal_cents which may be 0)
  const calculatedSubtotal = orderItems(order).reduce((sum: number, item: AnyRecord) => sum + (item.price_in_cents || 0), 0)
  return order.subtotal_cents || calculatedSubtotal
})

const modalTotalCharged = computed(() => selectedOrder.value?.total_amount_in_cents || 0)

// Credits: use API value if available, otherwise derive from subtotal - total
const modalCredits = computed(() => {
  const order = selectedOrder.value
  if (!order) return 0
  return order.credits_applied_cents || Math.max(0, modalSubtotal.value - modalTotalCharged.value)
})

function openOrderModal(order: AnyRecord) {
  selectedOrder.value = order
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeOrderModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeOrderModal()
}

// ── Account sidenav (active link computed from the route, replacing the old auto-highlight script)
const sidenavPath = computed(() => route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, ''))

function isNavActive(href: string): boolean {
  return sidenavPath.value === href || sidenavPath.value.startsWith(href + '/')
}

// Hide the reservations link for shipping members (synchronous, from auth plugin state)
const { userData: authUserData } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const hideReservationsLink = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(authUserData.value?.membership?.name ?? ''))

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  initPurchasesPage()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="w-layout-blockcontainer container-1300 full-screen w-container">
    <div class="div-header-policies purchases">
      <div class="div-heading-content-policies account">
        <div class="heading-text-policies purchases">purchases</div>
      </div>
    </div>
    <div class="div-section-policies rentals">
      <div class="sidenav-account-pages w-embed w-script">
        <nav class="account-sidenav" aria-label="Account navigation">
          <div class="account-sidenav-inner">
            <a href="/profile" class="account-sidenav-link" :class="{ active: isNavActive('/profile') }" data-nav="profile">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M20 21a8 8 0 1 0-16 0"></path>
                </svg>
              </span>
              <span class="lang-en">profile</span><span class="lang-nl">profiel</span>
            </a>
            <a href="/my-rentals" class="account-sidenav-link" :class="{ active: isNavActive('/my-rentals') }" data-nav="my-rentals">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="m21 16-9-6.5V6a2 2 0 1 0-4 0"></path>
                  <path d="M3 16h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </span>
              <span class="lang-en">my rentals</span><span class="lang-nl">mijn huurartikelen</span>
            </a>
            <a v-show="!hideReservationsLink" href="/reservations" class="account-sidenav-link" :class="{ active: isNavActive('/reservations') }" data-nav="reservations" data-auth-gate="collapse">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                  <path d="M16 2v4M8 2v4M3 10h18"></path>
                </svg>
              </span>
              <span class="lang-en">reservations</span><span class="lang-nl">reserveringen</span>
            </a>
            <div class="account-sidenav-sep"></div>
            <a href="/donations-credits" class="account-sidenav-link" :class="{ active: isNavActive('/donations-credits') }" data-nav="donations">
              <span class="account-sidenav-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </span>
              <span class="lang-en">donations &amp; credits</span><span class="lang-nl">donaties &amp; tegoed</span>
            </a>
            <a href="/purchases" class="account-sidenav-link" :class="{ active: isNavActive('/purchases') }" data-nav="purchases">
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
            <a href="/my-membership" class="account-sidenav-link" :class="{ active: isNavActive('/my-membership') }" data-nav="membership">
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
          <div class="code-embed-42 w-embed">
            <div id="purchases-container">
              <div id="purchases-loading" class="purchases-loading" :style="{ display: view === 'loading' ? 'flex' : 'none' }">
                <div class="purchases-loading-spinner"></div>
                <p class="purchases-loading-text"><span class="lang-en">loading your purchases...</span><span class="lang-nl">je aankopen worden geladen...</span></p>
              </div>
              <div id="purchases-no-membership" class="purchases-no-membership" :style="{ display: view === 'no-membership' ? 'flex' : 'none' }">
                <svg class="purchases-no-membership-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h2 class="purchases-no-membership-title"><span class="lang-en">want to make a purchase?</span><span class="lang-nl">iets kopen?</span></h2>
                <p class="purchases-no-membership-text"><span class="lang-en">that's a members-only perk ;)</span><span class="lang-nl">dat is alleen voor leden ;)</span></p>
                <a href="/memberships" class="purchases-no-membership-btn"><span class="lang-en">explore memberships</span><span class="lang-nl">bekijk lidmaatschappen</span></a>
              </div>
              <div id="purchases-signin" class="purchases-signin" :style="{ display: view === 'signin' ? 'flex' : 'none' }">
                <div class="purchases-signin-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h2 class="purchases-signin-title"><span class="lang-en">sign in to view your purchases</span><span class="lang-nl">log in om je aankopen te bekijken</span></h2>
                <p class="purchases-signin-text"><span class="lang-en">you need to be logged in to see your purchase history.</span><span class="lang-nl">je moet ingelogd zijn om je aankoopgeschiedenis te zien.</span></p>
                <button class="purchases-signin-btn" @click="openAuthModal"><span class="lang-en">sign in</span><span class="lang-nl">inloggen</span></button>
              </div>
              <div id="purchases-empty" class="purchases-empty" :style="{ display: view === 'empty' ? 'flex' : 'none' }">
                <div class="purchases-empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <h2 class="purchases-empty-title"><span class="lang-en">no purchases yet</span><span class="lang-nl">nog geen aankopen</span></h2>
                <p class="purchases-empty-text"><span class="lang-en">items you purchase online will appear here.</span><span class="lang-nl">items die je online koopt verschijnen hier.</span></p>
                <a href="/my-rentals" class="purchases-empty-btn"><span class="lang-en">view my rentals</span><span class="lang-nl">bekijk mijn verhuur</span></a>
              </div>
              <div id="purchases-content" class="purchases-content" :style="{ display: view === 'content' ? 'block' : 'none' }">
                <div class="purchases-section-title"><span class="lang-en">your purchases</span><span class="lang-nl">jouw aankopen</span></div>
                <div id="purchases-list" class="purchases-list">
                  <div v-for="(order, orderIndex) in orders" :key="order.hash_id || order.id || orderIndex" class="purchase-group" @click="openOrderModal(order)">
                    <div class="purchase-group-header">
                      <div class="purchase-group-images" :style="{ width: imagesWidth(order) + 'px' }">
                        <div v-for="(item, index) in orderItems(order).slice(0, maxThumbs)" :key="index" class="purchase-group-thumb" :style="{ zIndex: maxThumbs - index, left: (index * 28) + 'px' }">
                          <img v-if="itemImage(item)" :src="itemImage(item)" :alt="itemName(item)">
                        </div>
                        <div v-if="extraCount(order) > 0" class="purchase-group-more-badge" :style="{ left: moreBadgeLeft(order) + 'px' }">
                          +{{ extraCount(order) }}
                        </div>
                      </div>
                      <div class="purchase-group-info">
                        <div class="purchase-group-summary">{{ orderItems(order).length }} {{ itemsWord(orderItems(order).length) }} {{ t('purchasedOn') }} {{ formatDate(order.order_date) }}</div>
                        <div class="purchase-group-meta">#{{ shortOrderId(order) }} · {{ formatPrice(cardTotal(order)) }}</div>
                      </div>
                      <div class="purchase-group-arrow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="purchases-contact" class="purchases-contact" :style="{ display: view === 'no-membership' ? 'none' : '' }">
                <p><span class="lang-en">questions about a purchase? <a href="https://wa.me/31624673835">contact us on whatsapp</a> or email <a href="mailto:info@dematerialized.nl">support@dematerialized.nl</a>.</span><span class="lang-nl">vragen over een aankoop? <a href="https://wa.me/31624673835">neem contact op via whatsapp</a> of mail naar <a href="mailto:info@dematerialized.nl">support@dematerialized.nl</a>.</span></p>
              </div>
            </div>
            <div id="purchase-detail-backdrop" class="purchase-modal-backdrop" :class="{ open: modalOpen }" @click="closeOrderModal"></div>
            <div id="purchase-detail-modal" class="purchase-modal" :class="{ open: modalOpen }">
              <div class="purchase-modal-container">
                <div class="purchase-modal-header">
                  <div class="purchase-modal-header-info">
                    <div class="purchase-modal-title"><span class="lang-en">purchase details</span><span class="lang-nl">aankoopdetails</span></div>
                    <div class="purchase-modal-subtitle">{{ selectedOrder ? '#' + shortOrderId(selectedOrder) : '' }}</div>
                  </div>
                  <button class="purchase-modal-close" @click="closeOrderModal">&times;</button>
                </div>
                <div id="purchase-modal-content" class="purchase-modal-content">
                  <template v-if="selectedOrder">
                    <div class="purchase-modal-status-banner">
                      <span class="purchase-modal-status">{{ statusLabel(modalStatus) }}</span>
                      <span>{{ t('orderHasBeen') }} {{ statusLabel(modalStatus) }}</span>
                    </div>
                    <div class="purchase-modal-details-title">{{ t('orderDetails') }}</div>
                    <div class="purchase-modal-details-grid">
                      <div class="purchase-modal-detail-card">
                        <span class="purchase-modal-detail-label">{{ t('date') }}</span>
                        <span class="purchase-modal-detail-value">{{ formatDate(selectedOrder.order_date) }}</span>
                      </div>
                      <div class="purchase-modal-detail-card">
                        <span class="purchase-modal-detail-label">{{ t('items') }}</span>
                        <span class="purchase-modal-detail-value">{{ orderItems(selectedOrder).length }} {{ itemsWord(orderItems(selectedOrder).length) }}</span>
                      </div>
                    </div>
                    <div class="purchase-modal-items-title">{{ t('itemsPurchased') }}</div>
                    <div v-for="(item, index) in orderItems(selectedOrder)" :key="index" class="purchase-modal-item-card">
                      <div class="purchase-modal-item-image">
                        <img v-if="itemImage(item)" :src="itemImage(item)" :alt="itemName(item)">
                      </div>
                      <div class="purchase-modal-item-info">
                        <div class="purchase-modal-item-name">{{ itemName(item) }}</div>
                        <div class="purchase-modal-item-price">{{ formatPrice(item.price_in_cents || 0) }} <span v-if="itemRetailCents(item)" class="purchase-modal-item-retail">{{ formatPrice(itemRetailCents(item)) }}</span></div>
                        <a v-if="itemSku(item)" :href="productLink(itemSku(item))" class="purchase-modal-item-link">{{ t('viewItem') }} →</a>
                      </div>
                    </div>
                    <div class="purchase-modal-payment">
                      <div class="purchase-modal-payment-title">{{ t('payment') }}</div>
                      <div class="purchase-modal-payment-row">
                        <span>{{ t('subtotal') }}</span>
                        <span>{{ formatPrice(modalSubtotal) }}</span>
                      </div>
                      <div v-if="modalCredits > 0" class="purchase-modal-payment-row credits">
                        <span>{{ t('creditsApplied') }}</span>
                        <span>-{{ formatPrice(modalCredits) }}</span>
                      </div>
                      <div class="purchase-modal-payment-row total">
                        <span>{{ t('totalCharged') }}</span>
                        <span>{{ formatPrice(modalTotalCharged) }}</span>
                      </div>
                      <div v-if="modalCredits > 0 && modalTotalCharged > 0" class="purchase-modal-payment-method">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                          <path d="M12 18V6"/>
                        </svg>
                        <span>{{ formatPrice(modalCredits) }} {{ t('storeCreditsWord') }} + {{ formatPrice(modalTotalCharged) }} {{ t('cardWord') }}</span>
                      </div>
                      <div v-else-if="modalCredits > 0 && modalTotalCharged === 0" class="purchase-modal-payment-method">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                          <path d="M12 18V6"/>
                        </svg>
                        <span>{{ t('fullyPaidCredits') }}</span>
                      </div>
                      <div v-else class="purchase-modal-payment-method">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                          <line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                        <span>{{ t('paidWithCard') }}</span>
                      </div>
                    </div>
                  </template>
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
   PURCHASES PAGE STYLES — UPDATED
   Add to Page Head Code (wrap in <style> tags)
   ============================================ */

:root {
  --purple: #4b073f;
  --purple-dark: #3a052f;
  --pink: #a92296;
  --pink-light: #fff4fe;
  --gray-dark: #24282d;
  --gray-medium: #46535e;
  --gray-light: #ced5da;
  --gray-very-light: #f6f8f9;
  --green: #16a34a;
  --navy: #04314d;
}

/* Container */
#purchases-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Loading State */
.purchases-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.purchases-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-light);
  border-top-color: var(--purple);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.purchases-loading-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0;
}

/* Sign In State */
.purchases-signin {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.purchases-signin-icon {
  color: var(--gray-light);
  margin-bottom: 16px;
}

.purchases-signin-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}

.purchases-signin-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0 0 24px 0;
}

.purchases-signin-btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--purple);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.purchases-signin-btn:hover {
  background: var(--purple-dark);
}

/* Empty State */
.purchases-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.purchases-empty-icon {
  color: var(--gray-light);
  margin-bottom: 16px;
}

.purchases-empty-icon svg {
  stroke: currentColor;
}

.purchases-empty-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}

.purchases-empty-text {
  color: var(--gray-medium);
  font-size: 16px;
  margin: 0 0 24px 0;
}

.purchases-empty-btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--purple);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 18px;
  transition: background 0.2s ease;
}

.purchases-empty-btn:hover {
  background: var(--purple-dark);
  color: white;
}

/* No Membership State */
.purchases-no-membership {
  display: none;
  flex-direction: column;
  align-items: center;
  background: #eff9ff;
  border: 1px solid #b8e4ff;
  border-radius: 20px;
  padding: 60px 32px;
  text-align: center;
}

.purchases-no-membership-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: #04314d;
  opacity: 0.5;
}

.purchases-no-membership-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--gray-dark);
  margin: 0 0 8px 0;
}

.purchases-no-membership-text {
  color: var(--gray-medium);
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 28px 0;
  max-width: 400px;
}

.purchases-no-membership-btn {
  display: inline-block;
  padding: 16px 40px;
  background: #04314d;
  color: #fff;
  text-decoration: none;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  font-weight: 600;
  border-radius: 50px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.purchases-no-membership-btn:hover {
  background: #032640;
  transform: translateY(-1px);
  color: #fff;
}

/* Section Title */
.purchases-section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-dark);
  margin-bottom: 24px;
}

/* Purchases List */
.purchases-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Compact Order Card (like rental history groups) ── */
.purchase-group {
  background: white;
  border: 1px solid var(--gray-light);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.purchase-group:hover {
  border-color: var(--purple);
  box-shadow: 0 2px 8px rgba(75, 7, 63, 0.08);
}

.purchase-group-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.purchase-group-images {
  display: flex;
  position: relative;
  height: 64px;
  flex-shrink: 0;
}

.purchase-group-thumb {
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

.purchase-group-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.purchase-group-more-badge {
  position: absolute;
  bottom: -4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--purple);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  z-index: 10;
}

.purchase-group-info {
  flex: 1;
  min-width: 0;
}

.purchase-group-summary {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 4px;
}

.purchase-group-meta {
  font-size: 16px;
  color: var(--gray-medium);
}

.purchase-group-arrow {
  color: var(--gray-medium);
  flex-shrink: 0;
}

/* ── Purchase Detail Modal (centered popup) ── */
.purchase-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.purchase-modal-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.purchase-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.purchase-modal.open {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}

.purchase-modal-container {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.purchase-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px;
  flex-shrink: 0;
}

.purchase-modal-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.purchase-modal-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--gray-dark);
}

.purchase-modal-subtitle {
  font-size: 14px;
  color: var(--gray-medium);
}

.purchase-modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--gray-medium);
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}

.purchase-modal-close:hover {
  color: var(--gray-dark);
}

.purchase-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

/* Modal: Status Banner */
.purchase-modal-status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--gray-very-light);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--gray-medium);
}

.purchase-modal-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: #dcfce7;
  color: #15803d;
  flex-shrink: 0;
}

/* Modal: Details Grid */
.purchase-modal-details-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 12px;
}

.purchase-modal-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 28px;
}

.purchase-modal-detail-card {
  background: var(--gray-very-light);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.purchase-modal-detail-label {
  font-size: 13px;
  color: var(--pink);
  font-weight: 500;
}

.purchase-modal-detail-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-dark);
}

/* Modal: Items List */
.purchase-modal-items-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 12px;
}

.purchase-modal-item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--gray-very-light);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.purchase-modal-item-card:last-of-type {
  margin-bottom: 0;
}

.purchase-modal-item-image {
  width: 56px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  background: white;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.purchase-modal-item-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.purchase-modal-item-info {
  flex: 1;
  min-width: 0;
}

.purchase-modal-item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-dark);
  margin-bottom: 2px;
}

.purchase-modal-item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--pink);
  margin-bottom: 4px;
}

.purchase-modal-item-retail {
  font-weight: 400;
  color: var(--gray-medium);
  text-decoration: line-through;
  margin-left: 6px;
}

.purchase-modal-item-link {
  font-size: 14px;
  color: var(--purple);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.purchase-modal-item-link:hover {
  color: var(--pink);
}

/* Modal: Payment Breakdown */
.purchase-modal-payment {
  background: var(--gray-very-light);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.purchase-modal-payment-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-medium);
  margin-bottom: 16px;
}

.purchase-modal-payment-row {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: var(--gray-dark);
  margin-bottom: 10px;
}

.purchase-modal-payment-row:last-child {
  margin-bottom: 0;
}

.purchase-modal-payment-row.credits {
  color: var(--pink);
}

.purchase-modal-payment-row.total {
  font-weight: 600;
  font-size: 18px;
  padding-top: 12px;
  border-top: 1px solid var(--gray-light);
  margin-top: 12px;
}

.purchase-modal-payment-method {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--gray-light);
  font-size: 14px;
  color: var(--gray-medium);
}

.purchase-modal-payment-method svg {
  flex-shrink: 0;
}

/* Contact Footer */
.purchases-contact {
  margin-top: 48px;
  padding: 24px;
  background: var(--gray-very-light);
  border-radius: 12px;
  text-align: center;
}

.purchases-contact p {
  margin: 0;
  font-size: 16px;
  color: var(--gray-medium);
  line-height: 1.6;
}

.purchases-contact a {
  color: var(--purple);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.purchases-contact a:hover {
  color: var(--pink);
}

/* Responsive */
@media (max-width: 600px) {
  .purchase-group-thumb {
    width: 44px;
    height: 54px;
  }

  .purchase-group-images {
    height: 54px;
  }

  .purchase-modal {
    width: 95%;
    max-height: 85vh;
  }

  .purchases-no-membership {
    padding: 40px 24px;
  }
}
</style>
