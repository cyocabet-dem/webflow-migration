<script setup lang="ts">
useHead({
  title: 'Donations & Credits',
  meta: [
    { property: 'og:title', content: 'Donations & Credits' },
    { name: 'twitter:title', content: 'Donations & Credits' },
    { name: 'robots', content: 'noindex' },
  ],
})

const config = useRuntimeConfig()
const route = useRoute()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const sidenavPath = computed(() =>
  route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, ''),
)
function isSidenavActive(href: string) {
  const h = href.replace(/\/$/, '')
  return sidenavPath.value === h || sidenavPath.value.startsWith(h + '/')
}

const { userData: authUserData } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const isShippingMember = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(authUserData.value?.membership?.name ?? ''))

const DONATIONS_T = {
  availableStoreCredit:   { en: 'available store credit', nl: 'beschikbaar winkeltegoed' },
  earnCreditsLine:        { en: 'earn credits by donating your pre-loved clothing.', nl: 'verdien tegoed door je pre-loved kleding te doneren.' },
  useCreditsLine:         { en: 'use credits towards eligible purchases in store and online.', nl: 'gebruik je tegoed voor in aanmerking komende aankopen in de winkel en online.' },
  donationLabel:          { en: 'donation', nl: 'donatie' },
  badgeComplete:          { en: 'complete', nl: 'voltooid' },
  badgeProcessing:        { en: 'processing', nl: 'in behandeling' },
  date:                   { en: 'date', nl: 'datum' },
  items:                  { en: 'items', nl: 'items' },
  creditsEarned:          { en: 'credits earned', nl: 'tegoed verdiend' },
  notesFrom:              { en: 'notes from dematerialized', nl: 'opmerkingen van dematerialized' },
  viewDetails:            { en: 'view details', nl: 'details bekijken' },
  donatedItemFallback:    { en: 'donated item', nl: 'gedoneerd item' },
  creditWord:             { en: 'credit', nl: 'tegoed' },
  viewItem:               { en: 'view item', nl: 'bekijk item' },
  itemDetailsUnavailable: { en: 'item details not available', nl: 'itemgegevens niet beschikbaar' },
  creditsAdded:           { en: 'credits have been added to your account', nl: 'tegoed is toegevoegd aan je account' },
  reviewingItems:         { en: "we're reviewing your donated items", nl: 'we beoordelen je gedoneerde items' },
  donationSummary:        { en: 'donation summary', nl: 'donatieoverzicht' },
  donationDate:           { en: 'donation date', nl: 'donatiedatum' },
  location:               { en: 'location', nl: 'locatie' },
  inStoreFallback:        { en: 'in-store', nl: 'in de winkel' },
  itemsAccepted:          { en: 'items accepted', nl: 'items geaccepteerd' },
  totalCredits:           { en: 'total credits', nl: 'totaal tegoed' },
  donatedItems:           { en: 'donated items', nl: 'gedoneerde items' },
  howCreditsWorkTitle:    { en: 'how store credits work', nl: 'hoe winkeltegoed werkt' },
  howCreditsWorkText:     { en: "store credits can be used towards any material purchase at dematerialized. credits don't expire and can be combined with other payment methods.", nl: 'winkeltegoed kan worden gebruikt voor elke materiële aankoop bij dematerialized. tegoed verloopt niet en kan worden gecombineerd met andere betaalmethoden.' },
  loadError:              { en: 'unable to load donations. please try again later.', nl: 'kan donaties niet laden. probeer het later opnieuw.' },
  noDonationsTitle:       { en: 'no donations yet', nl: 'nog geen donaties' },
  noDonationsText:        { en: 'bring your pre-loved clothing to dematerialized to earn store credit', nl: 'breng je pre-loved kleding naar dematerialized om winkeltegoed te verdienen' },
  learnMore:              { en: 'learn more', nl: 'meer weten' },
  yourDonations:          { en: 'your donations', nl: 'jouw donaties' },
  signinTitle:            { en: 'sign in to view your donations', nl: 'log in om je donaties te bekijken' },
  signinText:             { en: 'you need to be logged in to see your donation history and store credits.', nl: 'je moet ingelogd zijn om je donatiegeschiedenis en winkeltegoed te zien.' },
  signin:                 { en: 'sign in', nl: 'inloggen' },
}

function t(key: keyof typeof DONATIONS_T): string {
  const e = DONATIONS_T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

function itemsWord(n: number) { return isNL.value ? 'items' : (n === 1 ? 'item' : 'items') }
function donationsWord(n: number) { return isNL.value ? (n === 1 ? 'donatie' : 'donaties') : (n === 1 ? 'donation' : 'donations') }

type View = 'loading' | 'signin' | 'noMembership' | 'content'
const view = ref<View>('loading')
const loadFailed = ref(false)
const sessions = ref<any[]>([])
const creditBalance = ref(0)
const pricingCategories = ref<any[] | null>(null)

const modalOpen = ref(false)
const modalSession = ref<any | null>(null)

const modalIdText = computed(() => {
  const s = modalSession.value
  if (!s) return ''
  return `#${s.hash_id?.substring(0, 8) || s.id}`
})
const modalItems = computed<any[]>(() => modalSession.value?.clothing_items || [])

async function getAuthToken(): Promise<string | null> {
  const auth0Client = (window as any).auth0Client
  if (!auth0Client) return null
  try {
    return await auth0Client.getTokenSilently()
  } catch {
    return null
  }
}

async function fetchPricingCategories() {
  if (pricingCategories.value) return pricingCategories.value
  try {
    const response = await fetch(`${config.public.apiBase}/clothing_items/pricing_categories`, {
      headers: { 'Accept': 'application/json' },
    })
    if (response.ok) {
      pricingCategories.value = await response.json()
    }
  } catch (err) {
    console.error('Error fetching pricing categories:', err)
  }
  return pricingCategories.value
}

function getItemCredits(item: any): number | null {
  if (!pricingCategories.value || !item.category?.pricing_group) return null
  const pricingGroup = item.category.pricing_group
  const isFastFashion = item.brand?.is_fast_fashion || false
  const match = pricingCategories.value.find((pc: any) =>
    pc.display_name === pricingGroup && pc.is_fast_fashion === isFastFashion,
  )
  return match?.store_credits_cents ?? null
}

async function fetchDonations() {
  const token = await getAuthToken()
  if (!token) return null
  try {
    const response = await fetch(`${config.public.apiBase}/private_clothing_items/donation_session/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (!response.ok) {
      console.error('Failed to fetch donations:', response.status)
      return null
    }
    return await response.json()
  } catch (err) {
    console.error('Error fetching donations:', err)
    return null
  }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'n/a'
  const date = new Date(dateString)
  return date.toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toLowerCase()
}

function formatCredits(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '€0.00'
  return `€${(cents / 100).toFixed(2)}`
}

function getItemImage(item: any): string {
  if (!item.images?.length) return ''
  const sorted = [...item.images].sort((a: any, b: any) => {
    const keyA = (a.image_key || a.image_name || '').toLowerCase()
    const keyB = (b.image_key || b.image_name || '').toLowerCase()
    return keyA.localeCompare(keyB)
  })
  const frontImg = sorted.find((img: any) =>
    img.image_type === 'front'
    || (img.image_key && img.image_key.toLowerCase().includes('front'))
    || (img.image_name && img.image_name.toLowerCase().includes('front')),
  )
  return frontImg?.object_url || sorted[0]?.object_url || ''
}

function itemUrl(item: any): string {
  const sku = item.sku || ''
  return sku ? `${isNL.value ? '/nl/product' : '/product'}?sku=${encodeURIComponent(sku)}` : ''
}

async function renderDonationsPage() {
  view.value = 'loading'
  loadFailed.value = false
  await fetchPricingCategories()
  const data = await fetchDonations()
  if (!data) {
    console.error('No data returned from fetchDonations')
    loadFailed.value = true
    view.value = 'content'
    return
  }
  const list = [...(data.sessions || [])]
  list.sort((a: any, b: any) => {
    const dateA = new Date(a.donated_date || a.started_at)
    const dateB = new Date(b.donated_date || b.started_at)
    return dateB.getTime() - dateA.getTime()
  })
  sessions.value = list
  creditBalance.value = data.credit_balance_cents || 0
  view.value = 'content'
}

async function viewDonation(sessionId: number) {
  await fetchPricingCategories()
  let session = sessions.value.find((s: any) => s.id === sessionId)
  if (!session || !session.clothing_items || session.clothing_items.length === 0) {
    try {
      const token = await getAuthToken()
      if (token) {
        const response = await fetch(`${config.public.apiBase}/private_clothing_items/donation_session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
        if (response.ok) {
          session = await response.json()
        }
      }
    } catch (err) {
      console.error('Error fetching donation details:', err)
    }
  }
  if (!session) {
    console.error('Donation session not found')
    return
  }
  modalSession.value = session
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeDonationDetailModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
}

function openAuthModal() {
  // TODO Phase 4: wire Auth0 — old code called window.openAuthModal() from auth.js.
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

async function initDonationsPage() {
  // TODO Phase 4: auth.js port sets window.auth0Client (old embed polled up to
  // 5s for it before deciding). Until auth is wired there is no client, so the
  // page's own signed-out state shows by default.
  const w = window as any
  if (!w.auth0Client) {
    view.value = 'signin'
    return
  }
  try {
    const isAuth = await w.auth0Client.isAuthenticated()
    if (!isAuth) {
      view.value = 'signin'
      return
    }
    try {
      const token = await w.auth0Client.getTokenSilently()
      const userResponse = await fetch(`${config.public.apiBase}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (!userData.stripe_id) {
          view.value = 'noMembership'
          return
        }
      }
    } catch (err) {
      console.error('Error checking membership:', err)
    }
    await renderDonationsPage()
  } catch (err) {
    console.error('Error initializing donations page:', err)
    view.value = 'signin'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalOpen.value) {
    closeDonationDetailModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  initDonationsPage()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (modalOpen.value) document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-1300 full-screen w-container">
      <div class="div-header-policies rentals">
        <div class="div-heading-content-policies account">
          <div class="heading-text-policies rentals">Donations &amp; Credits</div>
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
              <a v-show="!isShippingMember" href="/reservations" class="account-sidenav-link" :class="{ active: isSidenavActive('/reservations') }" data-nav="reservations" data-auth-gate>
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
            <div class="code-embed-donations w-embed">
              <div id="donations-container">
                <div v-if="view === 'signin'" class="donations-signin">
                  <h2 class="donations-signin-title">{{ t('signinTitle') }}</h2>
                  <p class="donations-signin-text">{{ t('signinText') }}</p>
                  <button class="donations-signin-btn" @click="openAuthModal">{{ t('signin') }}</button>
                </div>
                <template v-else>
                  <div v-show="view === 'loading'" id="donations-loading" class="donations-loading">
                    <div class="donations-loading-spinner"></div>
                    <p class="donations-loading-text"><span class="lang-en">loading your donations...</span><span class="lang-nl">je donaties worden geladen...</span></p>
                  </div>
                  <div id="donations-no-membership" class="donations-no-membership" :style="{ display: view === 'noMembership' ? 'flex' : 'none' }">
                    <svg class="donations-no-membership-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <h2 class="donations-no-membership-title"><span class="lang-en">want to earn store credits?</span><span class="lang-nl">winkeltegoed verdienen?</span></h2>
                    <p class="donations-no-membership-text"><span class="lang-en">that's a members-only perk ;)</span><span class="lang-nl">dat is alleen voor leden ;)</span></p>
                    <a href="/memberships" class="donations-no-membership-btn"><span class="lang-en">explore memberships</span><span class="lang-nl">bekijk lidmaatschappen</span></a>
                  </div>
                  <div id="donations-empty" style="display: none;"></div>
                  <div v-show="view === 'content'" id="donations-content">
                    <div v-if="loadFailed" class="donations-error">
                      <div class="donations-error-icon">⚠️</div>
                      <p class="donations-error-text">{{ t('loadError') }}</p>
                    </div>
                    <template v-else>
                      <div class="donations-balance-card">
                        <div class="donations-balance-label">{{ t('availableStoreCredit') }}</div>
                        <div class="donations-balance-amount">{{ formatCredits(creditBalance) }}</div>
                        <div class="donations-balance-desc">
                          {{ t('earnCreditsLine') }}<br>
                          {{ t('useCreditsLine') }}
                        </div>
                      </div>
                      <div v-if="sessions.length === 0" class="donations-empty">
                        <h3 class="donations-empty-title">{{ t('noDonationsTitle') }}</h3>
                        <p class="donations-empty-text">
                          {{ t('noDonationsText') }}
                        </p>
                        <a href="/donations" class="donations-empty-btn">{{ t('learnMore') }}</a>
                      </div>
                      <template v-else>
                        <div class="donations-section-header">
                          <div class="donations-section-title">{{ t('yourDonations') }}</div>
                          <div class="donations-section-count">{{ sessions.length }} {{ donationsWord(sessions.length) }}</div>
                        </div>
                        <div v-for="session in sessions" :key="session.id" class="donation-card">
                          <div class="donation-card-header">
                            <div>
                              <div class="donation-card-id-label">{{ t('donationLabel') }}</div>
                              <div class="donation-card-id">#{{ session.hash_id?.substring(0, 8) || session.id }}</div>
                            </div>
                            <span v-if="session.ended_at" class="donation-badge donation-badge-complete">{{ t('badgeComplete') }}</span>
                            <span v-else class="donation-badge donation-badge-processing">{{ t('badgeProcessing') }}</span>
                          </div>
                          <div class="donation-card-stats">
                            <div>
                              <div class="donation-card-stat-label">{{ t('date') }}</div>
                              <div class="donation-card-stat-value">{{ formatDate(session.donated_date || session.started_at) }}</div>
                            </div>
                            <div>
                              <div class="donation-card-stat-label">{{ t('items') }}</div>
                              <div class="donation-card-stat-value">{{ session.item_count || 0 }} {{ itemsWord(session.item_count || 0) }}</div>
                            </div>
                            <div>
                              <div class="donation-card-stat-label">{{ t('creditsEarned') }}</div>
                              <div class="donation-card-stat-value donation-card-stat-value--credits">{{ formatCredits(session.total_credits_cents || 0) }}</div>
                            </div>
                          </div>
                          <div v-if="session.notes" class="donation-card-notes">
                            <div class="donation-card-notes-label">{{ t('notesFrom') }}</div>
                            <div class="donation-card-notes-text">{{ session.notes }}</div>
                          </div>
                          <button class="donation-card-btn" @click="viewDonation(session.id)">
                            {{ t('viewDetails') }}
                          </button>
                        </div>
                      </template>
                    </template>
                  </div>
                </template>
              </div>
              <div id="donation-detail-backdrop" class="donation-modal-backdrop" :style="{ display: modalOpen ? 'block' : 'none' }" @click="closeDonationDetailModal"></div>
              <div id="donation-detail-modal" class="donation-modal" :style="{ display: modalOpen ? 'flex' : 'none' }">
                <div class="donation-modal-container">
                  <div class="donation-modal-header">
                    <div>
                      <div class="donation-modal-title"><span class="lang-en">donation details</span><span class="lang-nl">donatiegegevens</span></div>
                      <div id="donation-modal-id" class="donation-modal-id">{{ modalIdText }}</div>
                    </div>
                    <button class="donation-modal-close" @click="closeDonationDetailModal">×</button>
                  </div>
                  <div id="donation-modal-content" class="donation-modal-content">
                    <template v-if="modalSession">
                      <div class="donation-modal-status">
                        <template v-if="modalSession.ended_at">
                          <span class="donation-badge donation-badge-complete">{{ t('badgeComplete') }}</span>
                          <span class="donation-modal-status-text">{{ t('creditsAdded') }}</span>
                        </template>
                        <template v-else>
                          <span class="donation-badge donation-badge-processing">{{ t('badgeProcessing') }}</span>
                          <span class="donation-modal-status-text">{{ t('reviewingItems') }}</span>
                        </template>
                      </div>
                      <div>
                        <div class="donation-modal-summary-title">{{ t('donationSummary') }}</div>
                        <div class="donation-modal-summary-grid">
                          <div class="donation-modal-summary-item">
                            <div class="donation-modal-summary-label">{{ t('donationDate') }}</div>
                            <div class="donation-modal-summary-value">{{ formatDate(modalSession.donated_date || modalSession.started_at) }}</div>
                          </div>
                          <div class="donation-modal-summary-item">
                            <div class="donation-modal-summary-label">{{ t('location') }}</div>
                            <div class="donation-modal-summary-value">{{ (modalSession.location || t('inStoreFallback')).toLowerCase() }}</div>
                          </div>
                          <div class="donation-modal-summary-item">
                            <div class="donation-modal-summary-label">{{ t('itemsAccepted') }}</div>
                            <div class="donation-modal-summary-value">{{ modalSession.item_count || 0 }} {{ itemsWord(modalSession.item_count || 0) }}</div>
                          </div>
                          <div class="donation-modal-summary-item donation-modal-summary-item--highlight">
                            <div class="donation-modal-summary-label">{{ t('totalCredits') }}</div>
                            <div class="donation-modal-summary-value donation-modal-summary-value--credits">{{ formatCredits(modalSession.total_credits_cents) }}</div>
                          </div>
                        </div>
                      </div>
                      <div v-if="modalSession.notes" class="donation-modal-notes">
                        <div class="donation-modal-notes-label">{{ t('notesFrom') }}</div>
                        <div class="donation-modal-notes-text">{{ modalSession.notes }}</div>
                      </div>
                      <div>
                        <div class="donation-modal-items-title">{{ t('donatedItems') }}</div>
                        <template v-if="modalItems.length > 0">
                          <component
                            :is="itemUrl(item) ? 'a' : 'div'"
                            v-for="(item, index) in modalItems"
                            :key="index"
                            :href="itemUrl(item) || undefined"
                            class="donation-modal-item"
                            :style="itemUrl(item) ? undefined : 'cursor: default;'"
                          >
                            <div class="donation-modal-item-img">
                              <img v-if="getItemImage(item)" :src="getItemImage(item)" :alt="(item.name || t('donatedItemFallback')).toLowerCase()">
                              <div v-else class="donation-modal-item-placeholder">👕</div>
                            </div>
                            <div class="donation-modal-item-details">
                              <div class="donation-modal-item-name">{{ (item.name || t('donatedItemFallback')).toLowerCase() }}</div>
                              <div v-if="getItemCredits(item) !== null" class="donation-modal-item-credits">
                                +{{ formatCredits(getItemCredits(item)) }} {{ t('creditWord') }}
                              </div>
                              <span v-if="itemUrl(item)" class="donation-modal-item-link">{{ t('viewItem') }} →</span>
                            </div>
                          </component>
                        </template>
                        <div v-else style="padding: 20px; text-align: center; color: var(--gray-medium);">{{ t('itemDetailsUnavailable') }}</div>
                      </div>
                      <div class="donation-modal-info">
                        <div class="donation-modal-info-title">{{ t('howCreditsWorkTitle') }}</div>
                        <div class="donation-modal-info-text">
                          {{ t('howCreditsWorkText') }}
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div class="div-section-wrap-account hidden">
              <div class="subheading-account">Store Credits</div>
              <div class="grid-item-wrapper rentals">
                <div class="div-item-block rentals"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item">
                  <div class="div-res-item-info">
                    <div class="res-item-name">Item name</div>
                    <div class="paragraph-text-account">Color</div>
                    <div class="paragraph-text-account">Size</div>
                    <a href="#" class="btn-purchase-item w-button">purchase item</a>
                  </div>
                </div>
                <div class="div-item-block rentals"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item">
                  <div class="div-res-item-info">
                    <div class="res-item-name">Item name</div>
                    <div class="paragraph-text-account">Color</div>
                    <div class="paragraph-text-account">Size</div>
                    <a href="#" class="btn-purchase-item w-button">purchase item</a>
                  </div>
                </div>
                <div class="div-item-block rentals"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item">
                  <div class="div-res-item-info">
                    <div class="res-item-name">Item name</div>
                    <div class="paragraph-text-account">Color</div>
                    <div class="paragraph-text-account">Size</div>
                    <a href="#" class="btn-purchase-item w-button">purchase item</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="div-no-donations-yet">
              <div class="icon-error-donations w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg></div>
              <div class="text-no-donations-subhead">You don&#x27;t have any donations yet.</div>
              <a href="/faq" class="link-no-donations">Learn More</a>
            </div>
            <div class="div-section-wrap-account rental-history hidden">
              <div class="subheading-account">Donation history</div>
              <div class="div-wrapper-rental-history">
                <a href="#" class="grid-item-wrapper rental-history w-inline-block">
                  <div id="w-node-a56256ef-fd98-8695-047e-a9bbe9439646-b0c6f25e" class="div-item-block rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history hidden"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history hidden"></div>
                  <div class="div-history-nav">
                    <div class="div-rental-history-info">
                      <div class="res-item-name align-right">24 Nov 2025</div>
                      <div class="paragraph-text-account align-right">5 items</div>
                    </div>
                    <div class="icon-chevron-right-24px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
                        <path d="m9 18 6-6-6-6"></path>
                      </svg></div>
                  </div>
                </a>
                <a href="#" class="grid-item-wrapper rental-history w-inline-block">
                  <div id="w-node-_258e9620-b131-7751-e408-6b3b762613d5-b0c6f25e" class="div-item-block rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history hidden"><img src="/images/BLZ-S-HM-BK-SOL-001_front.png" loading="lazy" sizes="(max-width: 767px) 100vw, (max-width: 991px) 728px, 800px" srcset="/images/BLZ-S-HM-BK-SOL-001_front-p-500.png 500w, /images/BLZ-S-HM-BK-SOL-001_front.png 800w" alt="" class="image-res-item rental-history hidden"></div>
                  <div class="div-history-nav">
                    <div class="div-rental-history-info">
                      <div class="res-item-name align-right">5 Nov 2025</div>
                      <div class="paragraph-text-account align-right">5 items</div>
                    </div>
                    <div class="icon-chevron-right-24px w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
                        <path d="m9 18 6-6-6-6"></path>
                      </svg></div>
                  </div>
                </a>
              </div>
            </div>
            <div class="div-section-wrap-account faq-account hidden">
              <div class="subheading-account extra-padding">frequently asked questions</div>
              <div class="div-wrapper-rental-history">
                <div class="div-faq-account-wrapper">
                  <a href="#" class="faq-account-link">How can I return my current rental items?</a>
                  <a href="#" class="faq-account-link">What are the opening hours for the Dematerialized store?</a>
                  <a href="#" class="faq-account-link">Do I have to wash my rental items before returning?</a>
                  <a href="#" class="faq-account-link">How can I make a reservation to try items on in-store from the online collection?</a>
                  <a href="#" class="faq-account-link">Do I have to make a reservation to rent new items?</a>
                  <a href="#" class="faq-account-link">Do I have to schedule an appointment to return my current rental items?</a>
                  <a href="#" class="faq-account-link">Do I have to schedule an appointment to pick out new rental items?</a>
                  <a href="#" class="faq-account-link">How can I report a damaged item?</a>
                  <a href="#" class="faq-account-link">How can I purchase an item that I am currently renting?</a>
                  <a href="#" class="faq-account-link">How long can I rent the same item? Is there a maximum rental period?</a>
                  <a href="/faq" class="faq-account-link view-more">View all FAQs</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
