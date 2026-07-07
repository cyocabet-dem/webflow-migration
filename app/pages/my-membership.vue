<script setup lang="ts">
useHead({
  title: 'My Membership',
  meta: [
    { name: 'description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:title', content: 'My Membership' },
    { property: 'og:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { name: 'twitter:title', content: 'My Membership' },
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

const sidenavPath = computed(() =>
  route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, ''),
)
function isSidenavActive(href: string) {
  const h = href.replace(/\/$/, '')
  return sidenavPath.value === h || sidenavPath.value.startsWith(h + '/')
}

// Aliased: this page already has its own local `userData` ref for /users/me state below.
const { userData: authUserData } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const isShippingMember = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(authUserData.value?.membership?.name ?? ''))

const T = {
  memberSince: { en: 'member since', nl: 'lid sinds' },
  itemsAtATime: { en: 'items at a time', nl: 'items tegelijk' },
}
function t(key: keyof typeof T) {
  const e = T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

// Feature phrase translations (returns original if not found / on EN)
const FEAT_NL: Record<string, string> = {
  '2 items at a time': '2 items tegelijk',
  '5 items at a time': '5 items tegelijk',
  '5 items per shipment': '5 items per zending',
  'unlimited exchanges per month': 'onbeperkt ruilen per maand',
  '1 shipment per month': '1 zending per maand',
  '2 shipments per month — up to 10 items': '2 zendingen per maand, tot 10 items',
  'full access — in-store & online': 'volledige toegang, in de winkel & online',
}
function ft(text: string) {
  return (isNL.value && FEAT_NL[text]) ? FEAT_NL[text] : text
}

// Plan-name display translations (TIER_DETAILS stays keyed by the English name)
const PLAN_NAME_NL: Record<string, string> = {
  '2 items at a time, local': '2 items tegelijk, lokaal',
  '5 items at a time, local': '5 items tegelijk, lokaal',
  '5 items, 1 shipment per month': '5 items, 1 zending per maand',
  '5 items per shipment, 2 shipments per month': '5 items per zending, 2 zendingen per maand',
  'Membership': 'lidmaatschap',
}
function planName(tierName: string) {
  if (isNL.value && PLAN_NAME_NL[tierName]) return PLAN_NAME_NL[tierName]
  return tierName.toLowerCase()
}

// Tier details lookup
const TIER_DETAILS: Record<string, { price: string, features: { icon: string, text: string }[] }> = {
  '2 items at a time, local': {
    price: '€25',
    features: [
      { icon: 'tag', text: '2 items at a time' },
      { icon: 'refresh', text: 'unlimited exchanges per month' },
      { icon: 'store', text: 'full access — in-store & online' },
    ],
  },
  '5 items at a time, local': {
    price: '€35',
    features: [
      { icon: 'tag', text: '5 items at a time' },
      { icon: 'refresh', text: 'unlimited exchanges per month' },
      { icon: 'store', text: 'full access — in-store & online' },
    ],
  },
  '5 items, 1 shipment per month': {
    price: '€55',
    features: [
      { icon: 'tag', text: '5 items at a time' },
      { icon: 'refresh', text: '1 shipment per month' },
      { icon: 'store', text: 'full access — in-store & online' },
    ],
  },
  '5 items per shipment, 2 shipments per month': {
    price: '€70',
    features: [
      { icon: 'tag', text: '5 items per shipment' },
      { icon: 'refresh', text: '2 shipments per month — up to 10 items' },
      { icon: 'store', text: 'full access — in-store & online' },
    ],
  },
}

const ICONS: Record<string, string> = {
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
}

type MembershipView = 'loading' | 'active' | 'empty'
const view = ref<MembershipView>('loading')
const userData = ref<any>(null)

const tierName = computed(() => userData.value?.membership?.name || 'Membership')
const tierInfo = computed(() => TIER_DETAILS[tierName.value])
const displayPlanName = computed(() => (userData.value ? planName(tierName.value) : ''))
const memberSinceText = computed(() => {
  if (!userData.value || !userData.value.started_at) return ''
  const d = new Date(userData.value.started_at)
  return t('memberSince') + ' ' + d.toLocaleDateString(isNL.value ? 'nl-NL' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).toLowerCase()
})
const priceText = computed(() => (tierInfo.value ? tierInfo.value.price : '€--'))
const displayFeatures = computed<{ icon: string, text: string }[]>(() => {
  if (tierInfo.value) {
    return tierInfo.value.features.map(f => ({ icon: f.icon, text: ft(f.text) }))
  }
  // Fallback: use API data directly
  const membership = userData.value?.membership
  const fallbackFeatures: { icon: string, text: string }[] = []
  if (membership?.rental_items_at_a_time) {
    fallbackFeatures.push({ icon: 'tag', text: membership.rental_items_at_a_time + ' ' + t('itemsAtATime') })
  }
  if (membership?.collection_access) {
    fallbackFeatures.push({ icon: 'store', text: membership.collection_access.toLowerCase() })
  }
  return fallbackFeatures
})

// Phase 4 wires window.auth0Client; until then this returns null and the page
// shows the no-membership state. (The old page redirected unauthenticated
// visitors to '/' — restore that check in Phase 4.)
async function getAuthToken(): Promise<string | null> {
  const auth0Client = (window as any).auth0Client
  if (!auth0Client) return null
  try {
    const isAuthenticated = await auth0Client.isAuthenticated()
    if (!isAuthenticated) return null
    return await auth0Client.getTokenSilently()
  } catch {
    return null
  }
}

async function loadMembership() {
  console.log('👗 [Membership] Page loading...')
  const token = await getAuthToken()
  if (!token) {
    view.value = 'empty'
    return
  }
  try {
    const response = await fetch(`${config.public.apiBase}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch user data')
    userData.value = await response.json()
    console.log('👗 [Membership] User data loaded')
    if (userData.value.membership && userData.value.membership.active) {
      view.value = 'active'
      console.log('👗 [Membership] Active membership displayed')
    } else {
      view.value = 'empty'
      console.log('👗 [Membership] No active membership')
    }
  } catch (error) {
    console.error('👗 [Membership] Error:', error)
    view.value = 'empty'
  }
}

onMounted(() => {
  loadMembership()
})
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-1300 full-screen w-container">
      <div class="div-header-policies rentals">
        <div class="div-heading-content-policies account">
          <div class="heading-text-policies rentals">membership</div>
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
              <a v-show="!isShippingMember" href="/reservations" class="account-sidenav-link" :class="{ active: isSidenavActive('/reservations') }" data-nav="reservations" data-auth-gate="collapse">
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
          <div id="membership-content" class="div-content-wrapper-policies right rentals">
            <div class="code-embed-43 w-embed w-script">
              <div class="membership-redesigned">
                <div class="div-policy-menu rentals right">
                  <div class="div-content-wrapper-policies right rentals">
                    <div id="membership-loading" class="membership-loading" :class="{ 'is-hidden': view !== 'loading' }">
                      <div class="membership-loading-spinner"></div>
                      <p class="membership-loading-text"><span class="lang-en">loading your membership...</span><span class="lang-nl">je lidmaatschap wordt geladen...</span></p>
                    </div>
                    <div id="membership-active" :class="{ 'is-hidden': view !== 'active' }">
                      <div class="membership-section-header">
                        <div class="membership-section-title"><span class="lang-en">your membership</span><span class="lang-nl">jouw lidmaatschap</span></div>
                      </div>
                      <div class="membership-plan-card">
                        <div class="membership-plan-header">
                          <h2 id="ms-plan-name" class="membership-plan-name">{{ displayPlanName }}</h2>
                          <span class="membership-status-badge active">
                            <span class="membership-status-dot"></span>
                            <span class="lang-en">active</span><span class="lang-nl">actief</span>
                          </span>
                        </div>
                        <p id="ms-member-since" class="membership-member-since">{{ memberSinceText }}</p>
                        <div class="membership-price-row">
                          <span id="ms-price" class="membership-price-amount">{{ view === 'active' ? priceText : '' }}</span>
                          <span class="membership-price-period"><span class="lang-en">/ monthly</span><span class="lang-nl">/ maandelijks</span></span>
                        </div>
                        <div id="ms-features" class="membership-features">
                          <div v-for="(f, i) in displayFeatures" :key="i" class="membership-feature-item">
                            <div class="membership-feature-icon" v-html="ICONS[f.icon]"></div>
                            <span class="membership-feature-text">{{ f.text }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="membership-info-card">
                        <h3 class="membership-info-title"><span class="lang-en">need to make changes?</span><span class="lang-nl">wijzigingen doorgeven?</span></h3>
                        <p class="membership-info-text">
                          <span class="lang-en">to pause, cancel, or upgrade your membership, send us an email at
                            <a href="mailto:memberships@dematerialized.nl" class="membership-info-email">memberships@dematerialized.nl</a>
                            and we'll take care of it.
                          </span><span class="lang-nl">om je lidmaatschap te pauzeren, op te zeggen of te upgraden, stuur je ons een e-mail op
                            <a href="mailto:memberships@dematerialized.nl" class="membership-info-email">memberships@dematerialized.nl</a>
                            en wij regelen het.
                          </span>
                        </p>
                      </div>
                    </div>
                    <div id="membership-empty" :class="{ 'is-hidden': view !== 'empty' }">
                      <div class="membership-empty">
                        <svg class="membership-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <h2 class="membership-empty-title"><span class="lang-en">no active membership</span><span class="lang-nl">geen actief lidmaatschap</span></h2>
                        <p class="membership-empty-text">
                          <span class="lang-en">join the shared closet to wear, share, and repeat.</span><span class="lang-nl">word lid van de gedeelde kast om te dragen, delen en herhalen.</span>
                        </p>
                        <a href="/memberships" class="membership-cta-btn"><span class="lang-en">explore memberships</span><span class="lang-nl">bekijk lidmaatschappen</span></a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="div-section-wrap-account hidden">
              <div class="subheading-account less-padding">Payment Method</div><img src="/images/Image-25-11-2025-at-15.37.png" loading="lazy" width="204" alt="">
              <a href="#" class="btn-update-pymt w-button">Edit</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>
