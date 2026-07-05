<script setup lang="ts">
useHead({
  title: 'Clothing Rental Memberships | Dematerialized',
  meta: [
    {
      name: 'description',
      content:
        "Buying is overrated. Join the Dematerialized community and rent your dream wardrobe instead. Unlimited looks, zero buyer's remorse.",
    },
    { property: 'og:title', content: 'Clothing Rental Memberships | Dematerialized' },
    {
      property: 'og:description',
      content:
        "Buying is overrated. Join the Dematerialized community and rent your dream wardrobe instead. Unlimited looks, zero buyer's remorse.",
    },
    {
      property: 'og:image',
      content:
        'https://dematerialized.nl/images/meta/memberships-meta.png',
    },
    { name: 'twitter:title', content: 'Clothing Rental Memberships | Dematerialized' },
    {
      name: 'twitter:description',
      content:
        "Buying is overrated. Join the Dematerialized community and rent your dream wardrobe instead. Unlimited looks, zero buyer's remorse.",
    },
    {
      name: 'twitter:image',
      content:
        'https://dematerialized.nl/images/meta/memberships-meta.png',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

// EN is the default/fallback text from the old HTML; NL is the page's embedded
// translations dict, verbatim (the old data-i18n textContent swap).
const MEMBERSHIPS_T = {
  en: {
    eyebrow: 'choose a plan',
    heading: '100% guilt-free shopping',
    shipping_group_title: 'home delivery memberships',
    shipping_group_subtitle: 'pick your pieces online and have them delivered straight to your door.',
    card_ship_5_1: '5 items · 1 shipment per month',
    card_ship_5_2: '10 items · 2 shipments per month',
    first_month: 'first month',
    after_55: '€55/month after',
    after_70: '€70/month after',
    after_25: '€25/month after',
    after_35: '€35/month after',
    features_ship_5_1: 'borrow up to 5 items at a time · 1 shipment per month · shipping included (both ways)',
    features_ship_5_2: 'borrow up to 10 items at a time · 2 shipments per month · shipping included (both ways)',
    join_now: 'join now',
    local_group_title: 'local memberships',
    local_group_subtitle: 'for women living in or around Den Bosch, just pick up and return your items at our showroom. ',
    card_local_2: '2 items · unlimited monthly exchanges',
    card_local_5: '5 items · unlimited monthly exchanges',
    features_local_2: "borrow up to 2 items at a time · pick new pieces as often as you want · shipping not necessary (you just stop by our showroom when you're ready for something new) · reserve online to try on in-store",
    features_local_5: "borrow up to 5 items at a time · pick new pieces as often as you want · shipping not necessary (you just stop by our showroom when you're ready for something new) · reserve online to try on in-store",
    info_title: 'memberships are flexible',
    info_body: 'pause, change, or cancel your membership anytime after your first month.',
    your_membership: 'your membership',
  },
  nl: {
    eyebrow: 'kies een lidmaatschap',
    heading: '100% guilt-free shoppen',
    shipping_group_title: 'lidmaatschappen inclusief verzending',
    shipping_group_subtitle: 'kies je artikelen online en ontvang ze direct in huis.',
    card_ship_5_1: '5 artikelen · 1 zending per maand',
    card_ship_5_2: '10 artikelen · 2 zendingen per maand',
    first_month: 'eerste maand',
    after_55: 'daarna €55/maand',
    after_70: 'daarna €70/maand',
    after_25: 'daarna €25/maand',
    after_35: 'daarna €35/maand',
    features_ship_5_1: 'leen tot 5 artikelen tegelijk · 1 zending per maand · verzending inbegrepen (heen en terug)',
    features_ship_5_2: 'leen tot 10 artikelen tegelijk · 2 zendingen per maand · verzending inbegrepen (heen en terug)',
    join_now: 'word lid',
    local_group_title: 'lokale lidmaatschappen (den bosch)',
    local_group_subtitle: 'Voor vrouwen in en rond Den Bosch. Haal je artikelen op en breng ze terug in onze showroom.',
    card_local_2: '2 artikelen tegelijk · onbeperkt ruilen',
    card_local_5: '5 artikelen tegelijk · onbeperkt ruilen',
    features_local_2: '2 artikelen tegelijk · onbeperkt ruilen per maand · geen verzending nodig (je komt gewoon langs in onze showroom) · online reserveren, in de showroom passen',
    features_local_5: '5 artikelen tegelijk · onbeperkt ruilen per maand · geen verzending nodig (je komt gewoon langs in onze showroom) · online reserveren, in de showroom passen',
    info_title: 'lidmaatschappen zijn altijd flexibel',
    info_body: 'na de eerste maand kun je jouw lidmaatschap altijd pauzeren, wisselen of opzeggen.',
    your_membership: 'jouw lidmaatschap',
  },
}

const T = computed(() => (isNL.value ? MEMBERSHIPS_T.nl : MEMBERSHIPS_T.en))

const offerBannerVisible = ref(true)

const openFaqs = ref<boolean[]>([false, false, false, false])
function toggleFaq(i: number) {
  openFaqs.value[i] = !openFaqs.value[i]
}

// ── Membership / auth check (Auth0 arrives in Phase 4; early-returns without a token) ──
const currentMembership = ref<string | null>(null)

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

async function checkCurrentMembership() {
  const token = await getAuthToken()
  if (!token) return
  try {
    const apiBase = useRuntimeConfig().public.apiBase
    const res = await fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!res.ok) return
    const user = await res.json()
    if (!user || !user.stripe_id || !user.membership?.name) return
    currentMembership.value = user.membership.name
    console.log('🎫 Current membership:', user.membership.name)
  } catch (err) {
    console.error('🎫 Membership check error:', err)
  }
}
onMounted(checkCurrentMembership)

function isOwned(name: string) {
  return currentMembership.value === name
}
const ownedStyle = { opacity: '0.7', cursor: 'default', pointerEvents: 'none' }

// Stripe checkout: document-level [data-membership] capture handler + post-login
// replay, per the old site-wide-footer.js MEMBERSHIP SIGNUP HANDLER.
useMembershipCheckout().install()
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-top-padding w-container">
      <div v-if="offerBannerVisible" class="div-offer-banner">
        <div class="div-offer-banner-container">
          <div class="div-spacer-banner"></div>
          <div class="banner-text"><span class="lang-en">Get 50% off your first month with code: SHOPDEMAT.  <a href="/terms-and-conditions">Terms apply.</a></span><span class="lang-nl">Krijg 50% korting op je eerste maand met code: SHOPDEMAT.  <a href="/terms-and-conditions">Voorwaarden zijn van toepassing.</a></span>
          </div>
          <div class="banner-close" @click="offerBannerVisible = false">x</div>
        </div>
      </div>
      <div class="w-embed w-script">
        <section class="memberships-section">
          <div class="memberships-container">
            <div class="memberships-header">
              <div class="header-sticker header-sticker-1">
                <img src="/images/blue-button-down.png" alt="">
              </div>
              <div class="header-sticker header-sticker-2">
                <img src="/images/cat-on-back_2.png" alt="">
              </div>
              <div class="header-sticker header-sticker-3">
                <img src="/images/pancakes.png" alt="">
              </div>
              <p class="memberships-eyebrow" data-i18n="eyebrow">{{ T.eyebrow }}</p>
              <h2 class="memberships-heading" data-i18n="heading">{{ T.heading }}</h2>
            </div>
            <div class="tier-group">
              <div class="tier-group-header">
                <div class="tier-group-icon" style="background: var(--blue-light);">
                  <svg viewBox="0 0 24 24">
                    <rect x="1" y="3" width="15" height="13" rx="1"></rect>
                    <path d="M16 8h4l3 3v5h-7V8z"></path>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <div>
                  <h3 class="tier-group-title" data-i18n="shipping_group_title">{{ T.shipping_group_title }}</h3>
                  <p class="tier-group-subtitle" data-i18n="shipping_group_subtitle">{{ T.shipping_group_subtitle }}</p>
                </div>
              </div>
              <div class="tier-cards-container shipping">
                <div class="tier-cards">
                  <div class="tier-card">
                    <p class="tier-card-name" data-i18n="card_ship_5_1">{{ T.card_ship_5_1 }}</p>
                    <div class="tier-pricing">
                      <div class="tier-price-info">
                        <span class="tier-price-old">€55</span>
                        <span class="tier-price-current">€27.50</span>
                        <div class="tier-price-details">
                          <span class="tier-price-period" data-i18n="first_month">{{ T.first_month }}</span>
                          <span class="tier-price-after" data-i18n="after_55">{{ T.after_55 }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="tier-features" data-i18n="features_ship_5_1">{{ T.features_ship_5_1 }}</p>
                    <button
                      class="tier-cta"
                      :class="isOwned('5 items, 1 shipment per month') ? 'tier-cta-secondary' : 'tier-cta-primary'"
                      :disabled="isOwned('5 items, 1 shipment per month')"
                      :style="isOwned('5 items, 1 shipment per month') ? ownedStyle : undefined"
                      data-membership="5 items, 1 shipment per month"
                      data-price="55"
                    >
                      <template v-if="isOwned('5 items, 1 shipment per month')">{{ T.your_membership }}</template>
                      <template v-else>
                        <span data-i18n="join_now">{{ T.join_now }}</span>
                        <span class="cta-divider"></span>
                        €27.50
                      </template>
                    </button>
                  </div>
                  <div class="tier-card">
                    <p class="tier-card-name" data-i18n="card_ship_5_2">{{ T.card_ship_5_2 }}</p>
                    <div class="tier-pricing">
                      <div class="tier-price-info">
                        <span class="tier-price-old">€70</span>
                        <span class="tier-price-current">€35</span>
                        <div class="tier-price-details">
                          <span class="tier-price-period" data-i18n="first_month">{{ T.first_month }}</span>
                          <span class="tier-price-after" data-i18n="after_70">{{ T.after_70 }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="tier-features" data-i18n="features_ship_5_2">{{ T.features_ship_5_2 }}</p>
                    <button
                      class="tier-cta"
                      :class="isOwned('5 items per shipment, 2 shipments per month') ? 'tier-cta-secondary' : 'tier-cta-primary'"
                      :disabled="isOwned('5 items per shipment, 2 shipments per month')"
                      :style="isOwned('5 items per shipment, 2 shipments per month') ? ownedStyle : undefined"
                      data-membership="5 items per shipment, 2 shipments per month"
                      data-price="70"
                    >
                      <template v-if="isOwned('5 items per shipment, 2 shipments per month')">{{ T.your_membership }}</template>
                      <template v-else>
                        <span data-i18n="join_now">{{ T.join_now }}</span>
                        <span class="cta-divider"></span>
                        €35
                      </template>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="tier-group">
              <div class="tier-group-header">
                <div class="tier-group-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 class="tier-group-title" data-i18n="local_group_title">{{ T.local_group_title }}</h3>
                  <p class="tier-group-subtitle" data-i18n="local_group_subtitle">{{ T.local_group_subtitle }}</p>
                </div>
              </div>
              <div class="tier-cards-container">
                <div class="tier-cards">
                  <div class="tier-card">
                    <p class="tier-card-name" data-i18n="card_local_2">{{ T.card_local_2 }}</p>
                    <div class="tier-pricing">
                      <div class="tier-price-info">
                        <span class="tier-price-old">€25</span>
                        <span class="tier-price-current">€12.50</span>
                        <div class="tier-price-details">
                          <span class="tier-price-period" data-i18n="first_month">{{ T.first_month }}</span>
                          <span class="tier-price-after" data-i18n="after_25">{{ T.after_25 }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="tier-features" data-i18n="features_local_2">{{ T.features_local_2 }}</p>
                    <button
                      class="tier-cta"
                      :class="isOwned('2 items at a time, local') ? 'tier-cta-secondary' : 'tier-cta-primary'"
                      :disabled="isOwned('2 items at a time, local')"
                      :style="isOwned('2 items at a time, local') ? ownedStyle : undefined"
                      data-membership="2 items at a time, local"
                      data-price="25"
                    >
                      <template v-if="isOwned('2 items at a time, local')">{{ T.your_membership }}</template>
                      <template v-else>
                        <span data-i18n="join_now">{{ T.join_now }}</span>
                        <span class="cta-divider"></span>
                        €12.50
                      </template>
                    </button>
                  </div>
                  <div class="tier-card">
                    <p class="tier-card-name" data-i18n="card_local_5">{{ T.card_local_5 }}</p>
                    <div class="tier-pricing">
                      <div class="tier-price-info">
                        <span class="tier-price-old">€35</span>
                        <span class="tier-price-current">€17.50</span>
                        <div class="tier-price-details">
                          <span class="tier-price-period" data-i18n="first_month">{{ T.first_month }}</span>
                          <span class="tier-price-after" data-i18n="after_35">{{ T.after_35 }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="tier-features" data-i18n="features_local_5">{{ T.features_local_5 }}</p>
                    <button
                      class="tier-cta"
                      :class="isOwned('5 items at a time, local') ? 'tier-cta-secondary' : 'tier-cta-primary'"
                      :disabled="isOwned('5 items at a time, local')"
                      :style="isOwned('5 items at a time, local') ? ownedStyle : undefined"
                      data-membership="5 items at a time, local"
                      data-price="35"
                    >
                      <template v-if="isOwned('5 items at a time, local')">{{ T.your_membership }}</template>
                      <template v-else>
                        <span data-i18n="join_now">{{ T.join_now }}</span>
                        <span class="cta-divider"></span>
                        €17.50
                      </template>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M9 16l2 2 4-4"></path>
                </svg>
              </div>
              <div class="info-card-content">
                <h3 data-i18n="info_title">{{ T.info_title }}</h3>
                <p data-i18n="info_body">{{ T.info_body }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section class="full-page-section memberships">
        <div class="w-layout-blockcontainer container-wrapper-mem memberships w-container">
          <div class="div-mem-card-wrapper">
            <div class="div-membership-card">
              <div class="card-wrapper pink">
                <div class="mem-card-content-wrapper gray">
                  <div class="mem-card-outline pink">
                    <div class="div-mem-price">
                      <div class="heading-mobile"><span class="lang-en">Basic</span><span class="lang-nl">Basis</span></div>
                      <div class="subheading-mem-price"><span class="lang-en">€ 25 / month</span><span class="lang-nl">€25 / maand</span></div>
                      <div class="heading-3-mem-price"><span class="lang-en">€ 25 / month after that</span><span class="lang-nl">€25 / maand daarna</span></div>
                    </div>
                    <div class="separator-mem-card"></div>
                    <ul role="list" class="list membership-details">
                      <li class="list-item"><span class="lang-en"><strong>2 rental items</strong> at a time</span><span class="lang-nl"><strong>2 kledingstukken</strong> tegelijk huren</span></li>
                      <li class="list-item"><span class="lang-en">Unlimited monthly swaps</span><span class="lang-nl">Onbeperkt maandelijks wisselen</span></li>
                      <li class="list-item"><span class="lang-en">Access to the full collection (<strong>in-store and online</strong>)</span><span class="lang-nl">Toegang tot de hele collectie (<strong>winkel en online</strong>)</span></li>
                      <li class="list-item"><span class="lang-en"><strong>Reserve items</strong> online to try on in-store</span><span class="lang-nl"><strong>Items online reserveren </strong>om in de winkel te passen</span></li>
                      <li class="list-item"><span class="lang-en">50% off retail price for rentals you want to keep</span><span class="lang-nl">50% korting op de verkoopprijs van gehuurde items</span></li>
                      <li class="list-item"><span class="lang-en">Earn store credits for donations</span><span class="lang-nl">Verdien winkeltegoed voor donaties</span></li>
                      <li class="list-item"><span class="lang-en">Unlimited freebies</span><span class="lang-nl">Onbeperkte freebies</span></li>
                    </ul>
                    <a
                      href="#"
                      data-membership="Basic"
                      class="button-mem-card basic w-button"
                      :class="{ 'tier-cta-secondary': isOwned('Basic') }"
                      :style="isOwned('Basic') ? ownedStyle : undefined"
                    ><template v-if="isOwned('Basic')">{{ T.your_membership }}</template><template v-else><span class="lang-en">sign me up!</span><span class="lang-nl">Inschrijven</span></template></a>
                  </div>
                </div>
              </div>
            </div>
            <div class="div-membership-card">
              <div class="card-wrapper pink">
                <div class="mem-card-content-wrapper pink">
                  <div class="mem-card-outline">
                    <div class="div-mem-price">
                      <div class="heading-mobile"><span class="lang-en">premium</span><span class="lang-nl">premie</span></div>
                      <div class="subheading-mem-price"><span class="lang-en">€ 35 / month</span><span class="lang-nl">€35 / maand</span></div>
                      <div class="heading-3-mem-price"><span class="lang-en">€ 60 / month after that</span><span class="lang-nl">€60 / maand daarna</span></div>
                    </div>
                    <div class="separator-mem-card"></div>
                    <ul role="list" class="list membership-details">
                      <li class="list-item"><span class="lang-en"><strong>5 rental items</strong> at a time</span><span class="lang-nl"><strong>5 kledingstukken</strong> tegelijk huren</span></li>
                      <li class="list-item"><span class="lang-en">Unlimited monthly swaps</span><span class="lang-nl">Onbeperkt maandelijks wisselen</span></li>
                      <li class="list-item"><span class="lang-en">Access to the full collection (<strong>in-store and online</strong>)</span><span class="lang-nl">Toegang tot de hele collectie (<strong>winkel en online</strong>)</span></li>
                      <li class="list-item"><span class="lang-en"><strong>Reserve items</strong> online to try on in-store</span><span class="lang-nl"><strong>Items online reserveren</strong> om in de winkel te passen</span></li>
                      <li class="list-item"><span class="lang-en">50% off retail price for rentals you want to keep</span><span class="lang-nl">50% korting op de verkoopprijs van gehuurde items</span></li>
                      <li class="list-item"><span class="lang-en">Earn store credits for donations</span><span class="lang-nl">Verdien winkeltegoed voor donaties</span></li>
                      <li class="list-item"><span class="lang-en">Unlimited freebies</span><span class="lang-nl">Onbeperkte freebies</span></li>
                    </ul>
                    <a
                      data-membership="Premium"
                      href="#"
                      class="button-mem-card premium w-button"
                      :class="{ 'tier-cta-secondary': isOwned('Premium') }"
                      :style="isOwned('Premium') ? ownedStyle : undefined"
                    ><template v-if="isOwned('Premium')">{{ T.your_membership }}</template><template v-else><span class="lang-en">sign me up!</span><span class="lang-nl">Inschrijven</span></template></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="div-section mem">
          <div class="div-content-wrapper">
            <div class="heading-centered mem"><span class="lang-en">signs you&#x27;ll love being a demat member</span><span class="lang-nl">Tekenen dat Demat echt iets voor jou is</span></div>
            <div class="div-section-wrapper">
              <div class="div-icon-text-wrapper">
                <div class="wrapper-mem-signs">
                  <div class="icon-slot">
                    <div class="code-embed-21 w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crown-icon lucide-crown">
                        <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                        <path d="M5 21h14"></path>
                      </svg></div>
                  </div>
                  <div class="icon-text"><span class="lang-en">you don&#x27;t follow fashion rules, you wear whatever the f*** you want</span><span class="lang-nl">je volgt geen moderegels, you wear whatever the f*** you want</span></div>
                </div>
                <div class="wrapper-mem-signs">
                  <div class="icon-slot">
                    <div class="code-embed-18 w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-drama-icon lucide-drama">
                        <path d="M10 11h.01"></path>
                        <path d="M14 6h.01"></path>
                        <path d="M18 6h.01"></path>
                        <path d="M6.5 13.1h.01"></path>
                        <path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3"></path>
                        <path d="M17.4 9.9c-.8.8-2 .8-2.8 0"></path>
                        <path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"></path>
                        <path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4"></path>
                      </svg></div>
                  </div>
                  <div class="icon-text"><span class="lang-en">you like when your outfit matches your mood, and you have many moods</span><span class="lang-nl">Je houdt ervan als je outfit bij je mood past, en je hebt veel verschillende moods</span></div>
                </div>
                <div class="wrapper-mem-signs">
                  <div class="icon-slot">
                    <div class="code-embed-23 w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2cc4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-skull-icon lucide-skull">
                        <path d="m12.5 17-.5-1-.5 1h1z"></path>
                        <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                      </svg></div>
                  </div>
                  <div class="icon-text"><span class="lang-en">you feel like you have a closet full of clothes and nothing to wear</span><span class="lang-nl">je hebt een kast vol kleren en niks om aan te trekken</span></div>
                </div>
              </div>
              <div class="div-icon-text-wrapper">
                <div class="wrapper-mem-signs">
                  <div class="icon-slot">
                    <div class="code-embed-24 w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2cc4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame-icon lucide-flame">
                        <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"></path>
                      </svg></div>
                  </div>
                  <div class="icon-text"><span class="lang-en">you don&#x27;t judge (secondhand) clothing based on brand</span><span class="lang-nl">je beoordeelt (tweedehands) kleding niet op het merk</span></div>
                </div>
                <div class="wrapper-mem-signs">
                  <div class="icon-slot">
                    <div class="code-embed-22 w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-piggy-bank-icon lucide-piggy-bank">
                        <path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"></path>
                        <path d="M16 10h.01"></path>
                        <path d="M2 8v1a2 2 0 0 0 2 2h1"></path>
                      </svg></div>
                  </div>
                  <div class="icon-text"><span class="lang-en">you&#x27;re tired of fast fashion and want an affordable alternative</span><span class="lang-nl">Je bent fast fashion beu en wilt een betaalbaar alternatief</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="div-faq-section">
          <div class="content-wrapper-mem faq hiw">
            <div class="heading-centered bottom-margin"><span class="lang-en">frequently asked questions</span><span class="lang-nl">Veelgestelde vragen</span></div>
            <div class="div-faq-wrapper">
              <div class="div-faq-question" @click="toggleFaq(0)">
                <div class="faq-question"><span class="lang-en">What kind of clothes can I find at Dematerialized?</span><span class="lang-nl">Wat voor kleding kan ik vinden bij Dematerialized?</span></div>
                <div v-show="!openFaqs[0]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
                <div class="icon-faq-min w-embed" :style="{ display: openFaqs[0] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
              </div>
              <div class="div-faq-answer" :style="{ display: openFaqs[0] ? 'flex' : 'none' }">
                <div class="faq-answer"><span class="lang-en">A little bit of everything, honestly. For a special occasion or no occasion at all (we prefer the latter). <br><br>We’ve got everyday staples, fun statement pieces, and the kind of things that make picking out an outfit feel easy. Our racks are filled with a mix of local donations and curated finds—blazers, dresses, outerwear, denim, tops, and more.<br><br>You’ll find hundreds of brands—some premium, some fast fashion, some high-street—but we don’t obsess over labels. Actually, we cut them out. It&#x27;s the piece that matters, not the name inside.<br><br>Everything you&#x27;ll find in our collection has been cleaned, steamed, and approved for another round in someone’s closet (maybe yours).</span><span class="lang-nl">Een beetje van alles, eerlijk gezegd. Voor een speciale gelegenheid of gewoon zomaar (wij stemmen voor dat laatste).<br><br>We hebben opvallende items, everyday basics, en kleding waarmee je in no-time een outfit samenstelt. Onze rekken hangen vol met een mix van lokaal gedoneerde kleding en toffe vondsten—blazers, jurken, jassen, jeans, tops en meer.<br><br>Je vindt er honderden merken—sommige premium, sommige fast fashion, sommige high-street—maar wij zijn niet gek op labels. We knippen ze er eigenlijk gewoon uit. Het gaat om het stuk, niet om de naam erin.<br><br>Alles wat je in onze collectie vindt, is gewassen, gestoomd en goedgekeurd voor een volgende ronde in iemands kledingkast. Misschien die van jou.</span></div>
              </div>
            </div>
            <div class="div-faq-wrapper">
              <div class="div-faq-question" @click="toggleFaq(1)">
                <div class="faq-question"><span class="lang-en">How do clothing rentals work?</span><span class="lang-nl">Hoe werkt kleding lenen (huren) bij Dematerialized?</span></div>
                <div v-show="!openFaqs[1]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
                <div class="icon-faq-min w-embed" :style="{ display: openFaqs[1] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
              </div>
              <div class="div-faq-answer" :style="{ display: openFaqs[1] ? 'flex' : 'none' }">
                <div class="faq-answer"><span class="lang-en">It’s really simple. You subscribe to a membership, pick out the items you want to wear, wear them, give them back to us, and pick out new items. No need to wash anything before returning—we’ll take care of that before another member rents it.<br><br>If you&#x27;re a <strong>home delivery member</strong> (i.e., your membership includes shipping), you&#x27;ll typically receive your items in 1-3 business days. <br><br>If you&#x27;re a<strong> local member</strong>, all you have to do is stop by our showroom to pick out your items, or reserve them online to try on in store.<br><br>You can keep your rental items as long as you&#x27;d like. There&#x27;s no return deadline. <br><br>And if you like something enough to keep it, you&#x27;ll get 50% off the resale price.</span><span class="lang-nl">Het is heel simpel. Je neemt een lidmaatschap, kiest de items die je wil dragen, draagt ze, geeft ze terug, en kiest nieuwe items. Je hoeft niets te wassen voor je ze teruggeeft—dat doen wij, voordat een ander lid ze huurt.<br><br>Als je lidmaatschap verzending inbegrepen heeft, ontvang je je items binnen 1-3 werkdagen.<br><br>Ben je een lokaal lid? Dan hoef je alleen maar langs te komen in onze showroom om items uit te kiezen, of reserveer je ze online om ze in de winkel te passen.<br><br>Je mag je gehuurde items zo lang houden als je wil. Er is geen inleverdatum zolang je lid bent.<br><br>En als je iets zo mooi vindt dat je het wil houden, krijg je 50% korting op de verkoopprijs.</span></div>
              </div>
            </div>
            <div class="div-faq-wrapper">
              <div class="div-faq-question" @click="toggleFaq(2)">
                <div class="faq-question"><span class="lang-en">What happens if I damage a rental item?</span><span class="lang-nl">Wat gebeurt er als ik een huurartikel beschadig?</span></div>
                <div v-show="!openFaqs[2]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
                <div class="icon-faq-min w-embed" :style="{ display: openFaqs[2] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
              </div>
              <div class="div-faq-answer" :style="{ display: openFaqs[2] ? 'flex' : 'none' }">
                <div class="faq-answer"><span class="lang-en">We expect normal wear—clothes are meant to be lived in. But we also know accidents happen. Maybe it’s red wine, maybe it’s spaghetti. It happens. Don’t stress about it.<br>‍<br>All we ask is that you treat your rentals with love, but don’t obsess over keeping them perfect. Live your life. If something comes back with a small, barely noticeable flaw, we won’t charge you for it.<br>‍<br>If an item is returned in a truly unusable condition, we may charge 50% of the retail price—but even then, it’s not the end of the world. Our prices are low, and we’re human. If you tell us what happened before we find out ourselves, chances are we’ll just let it slide.</span><span class="lang-nl">We rekenen op normaal gebruik—kleding is er om in te leven. Maar we weten ook dat ongelukjes gebeuren. Misschien is het rode wijn, misschien is het spaghetti. Het overkomt de beste. Maak je er niet druk om.<br><br>Het enige wat we vragen is dat je je gehuurde items met wat liefde behandelt, maar ga er niet gestrest over doen om ze perfect te houden. Live your life. Als er iets terugkomt met een klein, nauwelijks zichtbaar vlekje, brengen we je daar niets voor in rekening.<br><br>Als een item echt in onbruikbare staat wordt teruggebracht, kunnen we 50% van de verkoopprijs in rekening brengen—maar ook dan is het niet het einde van de wereld. Onze prijzen zijn laag, en we zijn gewoon mensen. Als je ons vertelt wat er is gebeurd voordat wij het zelf ontdekken, is de kans groot dat we er gewoon overheen stappen.</span></div>
              </div>
            </div>
            <div class="div-faq-wrapper">
              <div class="div-faq-question" @click="toggleFaq(3)">
                <div class="faq-question"><span class="lang-en">Do I have to be a member to shop at Dematerialized?</span><span class="lang-nl">Moet ik lid zijn om bij Dematerialized te shoppen?</span></div>
                <div v-show="!openFaqs[3]" class="icon-faq-plus w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg></div>
                <div class="icon-faq-min w-embed" :style="{ display: openFaqs[3] ? 'inline-flex' : 'none' }"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus">
                    <path d="M5 12h14"></path>
                  </svg></div>
              </div>
              <div class="div-faq-answer" :style="{ display: openFaqs[3] ? 'flex' : 'none' }">
                <div class="faq-answer"><span class="lang-en">Nope! Anyone can shop at Dematerialized, but this is currently limited to in-person shopping in our showroom. Please note that new-in pieces are only available to our members (these are always on a clearly designated members-only rack). <br>‍<br>If you want to have access to the entire collection (in-store and online), we highly suggest that you become a member. Because whatever you may buy from us, you&#x27;ll probably get tired of it sooner rather than later. So why not just borrow it and give it back when you&#x27;re done (and pick something new in its place)? Shopping is way more fun (and sustainable) this way.</span><span class="lang-nl">Iedereen (ook niet-leden) kan items kopen in onze showroom in Den Bosch. We hebben op elk moment zo&#x27;n 175 items op de rekken hangen. <br><br>Wil je items huren uit de gedeelde kledingkast en/of toegang hebben tot de volledige collectie (alles wat je online ziet), dan heb je wel een actief lidmaatschap nodig.</span></div>
              </div>
            </div>
            <a href="/faq" class="faq-link hiw"><span class="lang-en">learn more</span><span class="lang-nl">meer tonen</span></a>
          </div>
        </div>
      </section>
    </div>
    <HomeMailBanner />
    <div class="mobile-footer-spacer"></div>
  </div>
</template>

<style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    :root {
      --purple: #4b073f;
      --purple-dark: #a92296;
      --blue: #04314d;
      --black: #000000;
      --gray-dark: #24282d;
      --gray-medium: #46535e;
      --gray-light: #ced5da;
      --gray-very-light: #f6f8f9;
      --pink-light: #fff4fe;
      --blue-light: #b6e8ff;
      --white: #ffffff;
      --radius: 20px;
    }
    body {
      font-family: 'Urbanist', sans-serif;
      background: var(--white);
      color: var(--gray-dark);
      line-height: 1.6;
    }
    .memberships-section {
      padding: 80px 2rem;
      overflow: visible;
    }
    .memberships-container {
      max-width: 1100px;
      margin: 0 auto;
      overflow: visible;
    }
    /* Section Header */
    .memberships-header {
      text-align: center;
      margin-bottom: 48px;
      background: var(--pink-light);
      border-radius: var(--radius);
      padding: 40px 28px;
      position: relative;
      overflow: visible;
    }
    .memberships-eyebrow {
      font-size: 18px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--gray-medium);
      margin-bottom: 12px;
    }
    .memberships-heading {
      font-size: clamp(1.75rem, 4vw, 3rem);
      font-weight: 600;
      letter-spacing: 0.5px;
      color: var(--gray-dark);
    }
    /* Header Stickers */
    .header-sticker {
      position: absolute;
      pointer-events: none;
      z-index: 10;
    }
    .header-sticker img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .header-sticker-1 {
      width: 120px;
      height: 120px;
      top: -40px;
      right: -30px;
    }
    .header-sticker-2 {
      width: 110px;
      height: 110px;
      top: -20px;
      right: 80px;
    }
    .header-sticker-3 {
      width: 120px;
      height: 120px;
      bottom: -40px;
      left: -30px;
    }
    /* Tier Group */
    .tier-group {
      margin-bottom: 48px;
      overflow: visible;
    }
    .tier-group:last-child {
      margin-bottom: 0;
    }
    .tier-group-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }
    .tier-group-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--pink-light);
      border-radius: 12px;
      flex-shrink: 0;
      margin-top: 1.5rem;
    }
    .tier-group-icon svg {
      width: 24px;
      height: 24px;
      stroke: var(--purple);
      stroke-width: 1.5;
      fill: none;
    }
    .tier-group-title {
      font-size: 32px;
      font-weight: 600;
      line-height: 38px;
      color: var(--gray-dark);
    }
    .tier-group-subtitle {
      font-size: 18px;
      color: var(--gray-medium);
      margin-top: 2px;
    }
    .tier-cards-container {
      background: var(--gray-very-light);
      border-radius: var(--radius);
      padding: 28px;
      padding-top: 48px;
      overflow: visible;
    }
    .tier-cards-container.shipping {
      background: var(--blue-light);
    }
    .tier-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      overflow: visible;
    }
    @media (max-width: 700px) {
      .tier-cards {
        grid-template-columns: 1fr;
      }
    }
    .tier-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 28px;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s ease;
      position: relative;
      overflow: visible;
    }
    .tier-card:nth-child(odd) {
      z-index: 2;
    }
    .tier-card:nth-child(even) {
      z-index: 1;
    }
    .tier-card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .tier-card-name {
      font-size: 18px;
      font-weight: 700;
      color: var(--gray-dark);
      margin-bottom: 16px;
    }
    .tier-pricing {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .tier-price-info {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .tier-price-old {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--gray-medium);
      text-decoration: line-through;
    }
    .tier-price-current {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--gray-dark);
      line-height: 1;
    }
    .tier-price-details {
      display: flex;
      flex-direction: column;
      margin-left: 6px;
    }
    .tier-price-period {
      font-size: 18px;
      font-weight: 500;
      color: var(--gray-dark);
    }
    .tier-price-after {
      font-size: 16px;
      color: var(--gray-medium);
    }
    .tier-features {
      font-size: 18px;
      color: var(--gray-medium);
      padding-top: 20px;
      border-top: 1px solid var(--gray-light);
      margin-bottom: 24px;
      flex-grow: 1;
    }
    .tier-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      border-radius: 50px;
      font-family: 'Urbanist', sans-serif;
      font-size: 18px;
      font-weight: 600;
      text-decoration: none;
      letter-spacing: 0.3px;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .tier-cta-primary {
      background: var(--purple);
      color: var(--white);
      border: none;
    }
    .tier-cta-primary:hover {
      background: var(--purple-dark);
      transform: translateY(-1px);
    }
    .tier-cta-secondary {
      background: transparent;
      color: var(--purple);
      border: 2px solid var(--purple);
    }
    .tier-cta-secondary:hover {
      background: var(--pink-light);
      transform: translateY(-1px);
    }
    .cta-divider {
      width: 1px;
      height: 14px;
      background: rgba(255, 255, 255, 0.4);
    }
    .cta-divider-dark {
      background: rgba(75, 7, 63, 0.3);
    }
    .info-card {
      background: var(--pink-light);
      border-radius: var(--radius);
      padding: 20px 24px;
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .info-card-icon {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--white);
      border-radius: 12px;
    }
    .info-card-icon svg {
      width: 28px;
      height: 28px;
      stroke: var(--purple);
      stroke-width: 1.5;
      fill: none;
    }
    .info-card-content h3 {
      font-size: 22px;
      font-weight: 600;
      color: var(--gray-dark);
      margin-bottom: 2px;
    }
    .info-card-content p {
      font-size: 18px;
      color: var(--gray-medium);
    }
    @media (max-width: 600px) {
      .memberships-section {
        padding: 60px 1.5rem;
      }
      .tier-cards-container {
        padding: 20px;
        padding-top: 40px;
      }
      .tier-card {
        padding: 24px;
      }
      .header-sticker-1 {
        width: 90px;
        height: 90px;
        top: -30px;
        right: -15px;
      }
      .header-sticker-2 {
        width: 80px;
        height: 80px;
        top: -15px;
        right: 55px;
      }
      .header-sticker-3 {
        width: 90px;
        height: 90px;
        bottom: -30px;
        left: -15px;
      }
      .info-card {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
    }
</style>
