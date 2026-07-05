<script setup lang="ts">
useHead({
  title: 'Purchase Success',
  meta: [
    { property: 'og:title', content: 'Purchase Success' },
    { name: 'twitter:title', content: 'Purchase Success' },
    { name: 'robots', content: 'noindex' },
  ],
})

const route = useRoute()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  msgSingular: { en: 'the item is now yours to keep (very poetic)', nl: 'het item is nu van jou (very poetic)' },
  msgPlural: { en: 'the items are now yours to keep (very poetic)', nl: 'de items zijn nu van jou (very poetic)' },
  sizeLabel: { en: 'size', nl: 'maat' },
} as const

function t(key: keyof typeof T): string {
  const e = T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

function formatPrice(cents: number): string {
  return '€' + (cents / 100).toFixed(2).replace('.', ',')
}

interface OrderItem {
  name: string
  image?: string | null
  size?: string | null
  purchase_price_cents: number
}

const loadingVisible = ref(true)
const successVisible = ref(false)
const errorVisible = ref(false)
const orderDetailsVisible = ref(true)
const creditsVisible = ref(false)
const orderItems = ref<OrderItem[]>([])
const subtotalCents = ref(0)
const totalCents = ref(0)
const creditsCents = ref(0)
const orderLoaded = ref(false)

const itemsMessage = computed(() =>
  orderLoaded.value ? (orderItems.value.length === 1 ? t('msgSingular') : t('msgPlural')) : null
)

// Phase 4 wires window.auth0Client (Auth0 SPA SDK). Until then this resolves
// null after the same wait loop the old embed used.
async function getAuthToken(): Promise<string | null> {
  const w = window as any
  let attempts = 0
  while (!w.auth0Client && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }
  if (!w.auth0Client) return null
  const isAuth = await w.auth0Client.isAuthenticated()
  if (!isAuth) return null
  return await w.auth0Client.getTokenSilently()
}

async function loadOrderDetails() {
  const raw = route.query.order_id
  const orderId = Array.isArray(raw) ? raw[0] : raw
  if (!orderId) {
    loadingVisible.value = false
    successVisible.value = true
    orderDetailsVisible.value = false
    return
  }
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Authentication not available')
    }
    const apiBase = useRuntimeConfig().public.apiBase
    const response = await fetch(`${apiBase}/private_clothing_items/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const order = await response.json()
    orderItems.value = order.items || []
    subtotalCents.value = order.subtotal_cents || 0
    totalCents.value = order.total_paid_cents || order.total_due_cents || 0
    if (order.credits_applied_cents > 0) {
      creditsVisible.value = true
      creditsCents.value = order.credits_applied_cents
    }
    orderLoaded.value = true
    loadingVisible.value = false
    successVisible.value = true
  } catch (err) {
    console.error('Error loading order:', err)
    loadingVisible.value = false
    successVisible.value = true
    orderDetailsVisible.value = false
  }
}

onMounted(() => {
  loadOrderDetails()
})

function darkBtnMouseover(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#f6f8f9'
  el.style.color = '#04314d'
  el.style.boxShadow = 'inset 0 0 0 1px #04314d'
}

function darkBtnMouseout(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#04314d'
  el.style.color = '#f6f8f9'
  el.style.boxShadow = 'none'
}

function lightBtnMouseover(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#eff9ff'
  el.style.color = '#04314d'
}

function lightBtnMouseout(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#f6f8f9'
  el.style.color = '#04314d'
}
</script>

<template>
  <div class="w-layout-blockcontainer container-top-padding purchase-success w-container">
    <div class="w-embed w-script">
      <div id="purchase-success-container" style="
  max-width: 600px;
  margin: 0 auto;
  padding: 60px 20px;
  text-align: center;
  font-family: 'Urbanist', sans-serif;
">
        <div id="purchase-loading" :style="{ display: loadingVisible ? 'block' : 'none' }">
          <div style="
      width: 40px;
      height: 40px;
      border: 3px solid #ced5da;
      border-top: 3px solid #4b073f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    "></div>
          <p style="color: #24282d; font-size: 18px; font-weight: 400;"><span class="lang-en">loading your order details...</span><span class="lang-nl">je bestelgegevens worden geladen...</span></p>
        </div>
        <div id="purchase-success-content" :style="{ display: successVisible ? 'block' : 'none' }">
          <div style="
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #fbefff, #f0d4f8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    ">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a92296" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 style="
      font-size: 28px;
      font-weight: 500;
      margin: 0 0 12px 0;
      color: #24282d;
      text-transform: lowercase;
    "><span class="lang-en">purchase complete</span><span class="lang-nl">aankoop voltooid</span></h1>
          <p style="
      font-size: 18px;
      color: #24282d;
      margin: 0 0 32px 0;
      line-height: 1.6;
      font-weight: 400;
    ">
            <span id="items-message"><template v-if="itemsMessage !== null">{{ itemsMessage }}</template><template v-else><span class="lang-en">the items are now yours to keep (very poetic)</span><span class="lang-nl">de items zijn nu van jou</span></template></span>
          </p>
          <div id="order-details" :style="orderDetailsVisible ? {} : { display: 'none' }" style="
      background: #f6f8f9;
      padding: 24px;
      border-radius: 20px;
      text-align: left;
      margin-bottom: 32px;
    ">
            <div style="
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.5px;
        color: #24282d;
        margin-bottom: 16px;
        text-transform: lowercase;
      "><span class="lang-en">order summary</span><span class="lang-nl">besteloverzicht</span></div>
            <div id="order-items">
              <div v-for="(item, index) in orderItems" :key="index" style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #ced5da;">
                <div style="width: 50px; height: 67px; background: #ced5da; flex-shrink: 0; overflow: hidden; border-radius: 8px;">
                  <img v-if="item.image" :src="item.image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 18px; font-weight: 400; color: #24282d;">{{ item.name }}</div>
                  <div v-if="item.size" style="font-size: 18px; color: #24282d; font-weight: 400;">{{ t('sizeLabel') }}: {{ item.size }}</div>
                </div>
                <div style="font-size: 18px; font-weight: 500; color: #24282d;">{{ formatPrice(item.purchase_price_cents) }}</div>
              </div>
            </div>
            <div style="border-top: 1px solid #ced5da; margin-top: 16px; padding-top: 16px;">
              <div id="order-subtotal" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #24282d; font-size: 18px; font-weight: 400;"><span class="lang-en">subtotal</span><span class="lang-nl">subtotaal</span></span>
                <span id="subtotal-value" style="font-size: 18px; font-weight: 400; color: #24282d;">{{ formatPrice(subtotalCents) }}</span>
              </div>
              <div id="order-credits" :style="{ display: creditsVisible ? 'flex' : 'none' }" style="justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #a92296; font-size: 18px; font-weight: 400;"><span class="lang-en">store credits applied</span><span class="lang-nl">winkeltegoed toegepast</span></span>
                <span id="credits-value" style="color: #a92296; font-size: 18px; font-weight: 400;">-{{ formatPrice(creditsCents) }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 500; margin-top: 12px; color: #24282d;">
                <span><span class="lang-en">total paid</span><span class="lang-nl">totaal betaald</span></span>
                <span id="total-value">{{ formatPrice(totalCents) }}</span>
              </div>
            </div>
          </div>
          <div style="
      background: #fff4fe;
      padding: 20px;
      border-radius: 20px;
      text-align: left;
      margin-bottom: 32px;
      border: 1px solid #f0d4f8;
    ">
            <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px; color: #4b073f;">
              <span class="lang-en">what happens next?</span><span class="lang-nl">wat gebeurt er nu?</span>
            </div>
            <p style="font-size: 18px; color: #24282d; margin: 0; line-height: 1.6; font-weight: 400;">
              <span class="lang-en">Continue wearing for as long as you'd like, you're the official owner!</span><span class="lang-nl">Draag het zolang je wilt, je bent nu de officiële eigenaar!</span>
            </p>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="/my-rentals" style="
        padding: 14px 28px;
        background: #04314d;
        color: #f6f8f9;
        text-decoration: none;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Urbanist', sans-serif;
        border-radius: 50px;
        text-transform: lowercase;
        letter-spacing: 1px;
        transition: all 0.2s;
      " @mouseover="darkBtnMouseover" @mouseout="darkBtnMouseout"><span class="lang-en">back to my rentals</span><span class="lang-nl">terug naar mijn huurartikelen</span></a>
            <a href="/clothing" style="
        padding: 14px 28px;
        background: #f6f8f9;
        color: #04314d;
        text-decoration: none;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Urbanist', sans-serif;
        border-radius: 50px;
        text-transform: lowercase;
        letter-spacing: 1px;
        border: 1px solid #04314d;
        transition: all 0.2s;
      " @mouseover="lightBtnMouseover" @mouseout="lightBtnMouseout"><span class="lang-en">browse collection</span><span class="lang-nl">bekijk collectie</span></a>
          </div>
        </div>
        <div id="purchase-error" :style="{ display: errorVisible ? 'block' : 'none' }">
          <div style="
      width: 80px;
      height: 80px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    ">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 style="font-size: 24px; font-weight: 500; margin: 0 0 12px 0; color: #24282d; text-transform: lowercase;"><span class="lang-en">something went wrong</span><span class="lang-nl">er ging iets mis</span></h2>
          <p id="error-message" style="color: #24282d; margin: 0 0 24px 0; font-size: 18px; font-weight: 400;"><span class="lang-en">we couldn't load your order details.</span><span class="lang-nl">we konden je bestelgegevens niet laden.</span></p>
          <a href="/my-rentals" style="
      display: inline-block;
      padding: 14px 28px;
      background: #04314d;
      color: #f6f8f9;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;
      font-family: 'Urbanist', sans-serif;
      border-radius: 50px;
      text-transform: lowercase;
      letter-spacing: 1px;
      transition: all 0.2s;
    " @mouseover="darkBtnMouseover" @mouseout="darkBtnMouseout"><span class="lang-en">back to my rentals</span><span class="lang-nl">terug naar mijn huurartikelen</span></a>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
