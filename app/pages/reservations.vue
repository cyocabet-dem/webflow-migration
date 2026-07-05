<script setup lang="ts">
useHead({
  title: 'Reservations',
  meta: [
    { name: 'description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:title', content: 'Reservations' },
    { property: 'og:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { name: 'twitter:title', content: 'Reservations' },
    { name: 'twitter:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ],
})

interface ReservationImage {
  image_key?: string
  image_name?: string
  image_type?: string
  object_url?: string
}

interface ReservationClothingItem {
  name?: string
  sku?: string
  images?: ReservationImage[]
}

interface ReservationItem {
  picked_up?: boolean
  clothing_item?: ReservationClothingItem
}

interface Reservation {
  id: number
  hash_id?: string
  status?: string
  request_date?: string
  ready_for_pickup_date?: string
  items?: ReservationItem[]
}

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const RESERVATIONS_T = {
  badgePending:         { en: 'pending', nl: 'in behandeling' },
  badgeReady:           { en: 'ready for pickup', nl: 'ligt klaar' },
  badgeCompleted:       { en: 'completed', nl: 'voltooid' },
  badgeCancelled:       { en: 'cancelled', nl: 'geannuleerd' },
  badgeExpired:         { en: 'expired', nl: 'verlopen' },
  statusPending:        { en: 'your items are being prepared', nl: 'je items worden klaargemaakt' },
  statusReady:          { en: 'your items are ready for pickup!', nl: 'je items liggen klaar!' },
  statusCompleted:      { en: 'this reservation has been completed', nl: 'deze reservering is voltooid' },
  statusCancelled:      { en: 'this reservation was cancelled', nl: 'deze reservering is geannuleerd' },
  statusExpired:        { en: 'this reservation has expired', nl: 'deze reservering is verlopen' },
  reservationLabel:     { en: 'reservation', nl: 'reservering' },
  requested:            { en: 'requested', nl: 'aangevraagd' },
  readyBy:              { en: 'ready by', nl: 'klaar op' },
  pickupBy:             { en: 'pickup by', nl: 'ophalen voor' },
  noItemsInReservation: { en: 'no items in this reservation', nl: 'geen items in deze reservering' },
  viewDetails:          { en: 'view details', nl: 'details bekijken' },
  unknownItemFallback:  { en: 'unknown item', nl: 'onbekend item' },
  pickedUp:             { en: '✓ picked up', nl: '✓ opgehaald' },
  awaitingPickup:       { en: 'awaiting pickup', nl: 'wacht op ophalen' },
  viewItem:             { en: 'view item', nl: 'bekijk item' },
  reservationDetails:   { en: 'reservation details', nl: 'reserveringsgegevens' },
  readyForPickup:       { en: 'ready for pickup', nl: 'ligt klaar' },
  pickupDeadline:       { en: 'pickup deadline', nl: 'ophaaldeadline' },
  items:                { en: 'items', nl: 'items' },
  reservedItems:        { en: 'reserved items', nl: 'gereserveerde items' },
  pickupLocation:       { en: 'pickup location', nl: 'ophaallocatie' },
  yourReservations:     { en: 'your reservations', nl: 'jouw reserveringen' },
  signinTitle:          { en: 'sign in to view your reservations', nl: 'log in om je reserveringen te bekijken' },
  signinText:           { en: 'you need to be logged in to see your reservations.', nl: 'je moet ingelogd zijn om je reserveringen te zien.' },
  signin:               { en: 'sign in', nl: 'inloggen' },
  tbd:                  { en: 'tbd', nl: 'n.t.b.' },
} as const

function t(key: keyof typeof RESERVATIONS_T): string {
  const e = RESERVATIONS_T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

// Pluralization helpers ('item' invariant; 'reservering' -> 'reserveringen')
function itemsWord(n: number) {
  return isNL.value ? 'items' : (n === 1 ? 'item' : 'items')
}
function reservationsWord(n: number) {
  return isNL.value ? (n === 1 ? 'reservering' : 'reserveringen') : (n === 1 ? 'reservation' : 'reservations')
}

const runtimeConfig = useRuntimeConfig()
const apiBase = runtimeConfig.public.apiBase

type PageState = 'loading' | 'signin' | 'no-membership' | 'empty' | 'list'
const state = ref<PageState>('loading')
const reservationsCache = ref<Reservation[] | null>(null)
const validReservations = ref<Reservation[]>([])
const activeReservation = ref<Reservation | null>(null)

const route = useRoute()

// Active sidenav link, computed from the route (replaces the old auto-highlight script).
// Strip a leading /nl so NL pages match the English-slug hrefs.
function isSidenavActive(href: string) {
  const currentPath = route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, '')
  const normalized = href.replace(/\/$/, '')
  return currentPath === normalized || currentPath.startsWith(normalized + '/')
}

// Hide the reservations sidenav link for shipping members (synchronous, from auth plugin state)
const { userData: authUserData } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const hideReservationsLink = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(authUserData.value?.membership?.name ?? ''))

function openAuthModal() {
  // TODO Phase 4: wire Auth0 — old code called window.openAuthModal() from auth.js.
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

function formatDate(dateString?: string | Date) {
  if (!dateString) return 'n/a'
  const date = new Date(dateString as any)
  return date.toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toLowerCase()
}

// Pickup deadline: 'tbd' until ready, then ready_for_pickup_date + 7 days.
// When status is set to 'ready', the backend stamps ready_for_pickup_date to
// that moment (it matches updated_at to the millisecond in the API response).
function pickupByValue(reservation: Reservation) {
  const status = (reservation.status || '').toLowerCase()
  if (status !== 'ready') return t('tbd')
  const readyRaw = reservation.ready_for_pickup_date
  if (!readyRaw) return t('tbd')
  const d = new Date(readyRaw)
  if (isNaN(d.getTime())) return t('tbd')
  d.setDate(d.getDate() + 7)
  return formatDate(d)
}

function statusBadge(status?: string) {
  const styles: Record<string, { cls: string, label: string }> = {
    'pending':   { cls: 'reservation-badge-pending', label: t('badgePending') },
    'ready':     { cls: 'reservation-badge-ready', label: t('badgeReady') },
    'completed': { cls: 'reservation-badge-completed', label: t('badgeCompleted') },
    'cancelled': { cls: 'reservation-badge-cancelled', label: t('badgeCancelled') },
    'expired':   { cls: 'reservation-badge-expired', label: t('badgeExpired') },
  }
  return styles[status || ''] || styles['pending']!
}

function statusText(status?: string) {
  const texts: Record<string, string> = {
    'pending': t('statusPending'),
    'ready': t('statusReady'),
    'completed': t('statusCompleted'),
    'cancelled': t('statusCancelled'),
    'expired': t('statusExpired'),
  }
  return texts[status || ''] || ''
}

function getItemImage(item: ReservationItem) {
  if (!item.clothing_item?.images?.length) return ''

  const sorted = [...item.clothing_item.images].sort((a, b) => {
    const keyA = (a.image_key || a.image_name || '').toLowerCase()
    const keyB = (b.image_key || b.image_name || '').toLowerCase()
    return keyA.localeCompare(keyB)
  })

  const frontImg = sorted.find(img =>
    img.image_type === 'front'
    || (img.image_key && img.image_key.toLowerCase().includes('front'))
    || (img.image_name && img.image_name.toLowerCase().includes('front')),
  )

  return frontImg?.object_url || sorted[0]?.object_url || ''
}

function itemCount(reservation: Reservation) {
  return reservation.items?.length || 0
}

function previewItems(reservation: Reservation) {
  return (reservation.items || []).slice(0, 4)
}

function itemName(item: ReservationItem) {
  return (item.clothing_item?.name || t('unknownItemFallback')).toLowerCase()
}

function itemUrl(item: ReservationItem) {
  const sku = item.clothing_item?.sku || ''
  return sku ? (isNL.value ? '/nl/product' : '/product') + '?sku=' + encodeURIComponent(sku) : ''
}

// Auth-gated fetch: Phase 4 wires window.auth0Client; until then this
// early-returns and the page stays in its unauthenticated state.
async function fetchReservations(): Promise<Reservation[] | null> {
  const w = window as any
  if (!w.auth0Client) {
    console.error('Auth0 not initialized')
    return null
  }

  try {
    const isAuthenticated = await w.auth0Client.isAuthenticated()
    if (!isAuthenticated) {
      return null
    }

    const token = await w.auth0Client.getTokenSilently()

    const response = await fetch(`${apiBase}/private_clothing_items/reservations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch reservations:', response.status)
      return null
    }

    const reservations = await response.json()
    reservationsCache.value = reservations
    return reservations
  }
  catch (err) {
    console.error('Error fetching reservations:', err)
    return null
  }
}

async function renderReservationsPage() {
  state.value = 'loading'

  const reservations = await fetchReservations()

  if (!reservations || reservations.length === 0) {
    state.value = 'empty'
    return
  }

  const valid = reservations.filter(r => r.items && r.items.length > 0)

  if (valid.length === 0) {
    state.value = 'empty'
    return
  }

  valid.sort((a, b) => new Date(b.request_date ?? '').getTime() - new Date(a.request_date ?? '').getTime())

  validReservations.value = valid
  state.value = 'list'
}

function viewReservation(reservationId: number) {
  const reservation = reservationsCache.value?.find(r => r.id === reservationId)

  if (!reservation) {
    console.error('Reservation not found in cache')
    return
  }

  activeReservation.value = reservation
  document.body.style.overflow = 'hidden'
}

function closeReservationDetailModal() {
  activeReservation.value = null
  document.body.style.overflow = ''
}

// Auth-gated init: reproduces the old auto-init (membership check via /users/me,
// then reservations render). Early-returns to the signed-out state until Phase 4
// wires window.auth0Client.
async function initReservations() {
  const w = window as any
  if (!w.auth0Client) {
    state.value = 'signin'
    return
  }

  const isAuth = await w.auth0Client.isAuthenticated()
  if (!isAuth) {
    state.value = 'signin'
    return
  }

  // Check membership status first
  try {
    const token = await w.auth0Client.getTokenSilently()
    const userResponse = await fetch(`${apiBase}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })

    if (userResponse.ok) {
      const userData = await userResponse.json()

      if (!userData.stripe_id) {
        // No membership
        state.value = 'no-membership'
        return
      }
    }
  }
  catch (err) {
    console.error('Error checking membership:', err)
  }

  // Has membership — render reservations as normal
  await renderReservationsPage()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activeReservation.value) {
    closeReservationDetailModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  initReservations()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="w-layout-blockcontainer container-1300 full-screen w-container">
    <div class="div-header-policies res"></div>
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
            <a v-show="!hideReservationsLink" href="/reservations" class="account-sidenav-link" :class="{ active: isSidenavActive('/reservations') }" data-nav="reservations" data-auth-gate>
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
          <div class="code-embed-36 w-embed">
            <div id="reservations-container">
              <template v-if="state !== 'signin'">
                <div id="reservations-loading" class="reservations-loading" :style="{ display: state === 'loading' ? 'block' : 'none' }">
                  <div class="reservations-loading-spinner"></div>
                  <p class="reservations-loading-text"><span class="lang-en">loading your reservations...</span><span class="lang-nl">je reserveringen worden geladen...</span></p>
                </div>
                <div id="reservations-no-membership" class="reservations-no-membership" :style="{ display: state === 'no-membership' ? 'flex' : 'none' }">
                  <svg class="reservations-no-membership-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <h2 class="reservations-no-membership-title"><span class="lang-en">no active membership</span><span class="lang-nl">geen actief lidmaatschap</span></h2>
                  <p class="reservations-no-membership-text"><span class="lang-en">to reserve items from our shared closet, you'll need a membership first</span><span class="lang-nl">om items uit onze gedeelde kast te reserveren heb je eerst een lidmaatschap nodig</span></p>
                  <a href="/memberships" class="reservations-no-membership-btn"><span class="lang-en">explore memberships</span><span class="lang-nl">bekijk lidmaatschappen</span></a>
                </div>
                <div id="reservations-empty" class="reservations-empty" :style="{ display: state === 'empty' ? 'block' : 'none' }">
                  <div class="reservations-empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                      <path d="m7.5 4.27 9 5.15"></path>
                      <polyline points="3.29 7 12 12 20.71 7"></polyline>
                      <line x1="12" y1="22" x2="12" y2="12"></line>
                      <circle cx="18.5" cy="15.5" r="2.5"></circle>
                      <path d="M20.27 17.27 22 19"></path>
                    </svg>
                  </div>
                  <h2 class="reservations-empty-title"><span class="lang-en">no reservations yet</span><span class="lang-nl">nog geen reserveringen</span></h2>
                  <p class="reservations-empty-text"><span class="lang-en">browse our collection and reserve items to try on in store</span><span class="lang-nl">bekijk onze collectie en reserveer items om in de winkel te passen</span></p>
                  <a href="/clothing" class="reservations-empty-btn"><span class="lang-en">browse collection</span><span class="lang-nl">bekijk collectie</span></a>
                </div>
                <div id="reservations-list" :style="{ display: state === 'list' ? 'block' : 'none' }">
                  <div class="reservations-section-header">
                    <div class="reservations-section-title">{{ t('yourReservations') }}</div>
                    <div class="reservations-section-count">{{ validReservations.length }} {{ reservationsWord(validReservations.length) }}</div>
                  </div>
                  <div v-for="reservation in validReservations" :key="reservation.id" class="reservation-card">
                    <div class="reservation-card-header">
                      <div>
                        <div class="reservation-card-id-label">{{ t('reservationLabel') }}</div>
                        <div class="reservation-card-id">#{{ reservation.hash_id?.substring(0, 8) || reservation.id }}</div>
                      </div>
                      <span class="reservation-badge" :class="statusBadge(reservation.status).cls">{{ statusBadge(reservation.status).label }}</span>
                    </div>
                    <div class="reservation-card-stats">
                      <div>
                        <div class="reservation-card-stat-label">{{ t('requested') }}</div>
                        <div class="reservation-card-stat-value">{{ formatDate(reservation.request_date) }}</div>
                      </div>
                      <div>
                        <div class="reservation-card-stat-label">{{ t('pickupBy') }}</div>
                        <div class="reservation-card-stat-value reservation-card-stat-value--highlight">{{ pickupByValue(reservation) }}</div>
                      </div>
                    </div>
                    <template v-if="itemCount(reservation) > 0">
                      <div class="reservation-card-items-label">{{ itemCount(reservation) }} {{ itemsWord(itemCount(reservation)) }}</div>
                      <div class="reservation-card-items-preview">
                        <div v-for="(item, i) in previewItems(reservation)" :key="i" class="reservation-card-thumb">
                          <img v-if="getItemImage(item)" :src="getItemImage(item)" alt="">
                        </div>
                        <div v-if="itemCount(reservation) > 4" class="reservation-card-thumb-more">+{{ itemCount(reservation) - 4 }}</div>
                      </div>
                    </template>
                    <div v-else class="reservation-card-no-items">{{ t('noItemsInReservation') }}</div>
                    <button class="reservation-card-btn" @click="viewReservation(reservation.id)">{{ t('viewDetails') }}</button>
                  </div>
                </div>
              </template>
              <div v-else class="reservations-signin">
                <h2 class="reservations-signin-title">{{ t('signinTitle') }}</h2>
                <p class="reservations-signin-text">{{ t('signinText') }}</p>
                <button class="reservations-signin-btn" @click="openAuthModal">{{ t('signin') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-footer-spacer"></div>
  <div id="reservation-detail-backdrop" class="modal-backdrop" :style="{ display: activeReservation ? 'block' : 'none' }" @click="closeReservationDetailModal"></div>
  <div id="reservation-detail-modal" class="modal-container modal-large reservation-modal-redesigned" :style="{ display: activeReservation ? 'flex' : 'none' }">
    <div class="modal-header">
      <div>
        <span class="modal-label">{{ t('reservationDetails') }}</span>
        <div id="detail-modal-id" class="modal-title">{{ activeReservation ? '#' + (activeReservation.hash_id?.substring(0, 8) || activeReservation.id) : '' }}</div>
      </div>
      <button class="modal-close" @click="closeReservationDetailModal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div id="detail-modal-content" class="modal-body modal-scroll">
      <template v-if="activeReservation">
        <div class="reservation-modal-status">
          <span class="reservation-badge" :class="statusBadge(activeReservation.status).cls">{{ statusBadge(activeReservation.status).label }}</span>
          <span class="reservation-modal-status-text">{{ statusText(activeReservation.status) }}</span>
        </div>
        <div>
          <div class="reservation-modal-summary-title">{{ t('reservationDetails') }}</div>
          <div class="reservation-modal-summary-grid">
            <div class="reservation-modal-summary-item">
              <div class="reservation-modal-summary-label">{{ t('requested') }}</div>
              <div class="reservation-modal-summary-value">{{ formatDate(activeReservation.request_date) }}</div>
            </div>
            <div class="reservation-modal-summary-item reservation-modal-summary-item--highlight">
              <div class="reservation-modal-summary-label">{{ t('pickupDeadline') }}</div>
              <div class="reservation-modal-summary-value reservation-modal-summary-value--highlight">{{ pickupByValue(activeReservation) }}</div>
            </div>
            <div class="reservation-modal-summary-item">
              <div class="reservation-modal-summary-label">{{ t('items') }}</div>
              <div class="reservation-modal-summary-value">{{ itemCount(activeReservation) }} {{ itemsWord(itemCount(activeReservation)) }}</div>
            </div>
          </div>
        </div>
        <div>
          <div class="reservation-modal-items-title">{{ t('reservedItems') }}</div>
          <template v-if="itemCount(activeReservation) > 0">
            <component
              :is="itemUrl(item) ? 'a' : 'div'"
              v-for="(item, i) in activeReservation.items"
              :key="i"
              :href="itemUrl(item) || undefined"
              :style="itemUrl(item) ? undefined : { cursor: 'default' }"
              class="reservation-modal-item"
            >
              <div class="reservation-modal-item-img">
                <img v-if="getItemImage(item)" :src="getItemImage(item)" :alt="itemName(item)">
              </div>
              <div class="reservation-modal-item-details">
                <div class="reservation-modal-item-name">{{ itemName(item) }}</div>
                <div class="reservation-modal-item-status" :class="item.picked_up ? 'reservation-modal-item-status--picked-up' : 'reservation-modal-item-status--awaiting'">{{ item.picked_up ? t('pickedUp') : t('awaitingPickup') }}</div>
                <span v-if="itemUrl(item)" class="reservation-modal-item-link">{{ t('viewItem') }} →</span>
              </div>
            </component>
          </template>
          <div v-else style="padding: 20px; text-align: center; color: #46535e;">{{ t('noItemsInReservation') }}</div>
        </div>
        <div class="reservation-modal-location">
          <div class="reservation-modal-location-title">{{ t('pickupLocation') }}</div>
          <div class="reservation-modal-location-text">dematerialized<br>lange putstraat 4<br>5211 kn 's-hertogenbosch</div>
        </div>
      </template>
    </div>
    <div class="modal-footer">
      <button class="btn-primary" @click="closeReservationDetailModal">close</button>
    </div>
  </div>
</template>
