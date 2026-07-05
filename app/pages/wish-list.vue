<script setup lang="ts">
useHead({
  title: 'Wish List',
  meta: [
    { property: 'og:title', content: 'Wish List' },
    { name: 'twitter:title', content: 'Wish List' },
  ],
})

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))
const localePath = useLocalePath()
const apiBase = useRuntimeConfig().public.apiBase

// Status configuration - matches pdp.js (now with Dutch labels)
const ITEM_STATUS_CONFIG: Record<string, { canAddToCart: boolean; buttonText: string | null; buttonTextNL: string | null; buttonClass: string }> = {
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
  buttonTextNL: 'niet beschikbaar',
  buttonClass: 'status-unavailable',
}

// UI strings computed at runtime
const T: Record<string, { en: string; nl: string }> = {
  removeFromCart: { en: 'Remove From Cart', nl: 'uit winkelmand' },
  addToCart: { en: 'Add To Cart', nl: 'in winkelmand' },
  cartFull: { en: 'Cart Full', nl: 'winkelmand vol' },
  cartFullAlert: { en: 'Your cart is full (maximum 10 items).', nl: 'je winkelmand is vol (maximaal 10 items).' },
  loadError: { en: 'Failed to load your wishlist. Please try again.', nl: 'je wishlist kon niet worden geladen. probeer het opnieuw.' },
}

function t(key: string): string {
  const e = T[key]
  return e ? (isNL.value ? e.nl : e.en) : ''
}

function getStatusConfig(status: string) {
  const s = (status || '').toLowerCase().trim()
  // If status is empty/missing, default to 'available'
  if (!s) {
    return ITEM_STATUS_CONFIG['available']
  }
  return ITEM_STATUS_CONFIG[s] || DEFAULT_STATUS_CONFIG
}

// Resolves a status config's label to the active locale
function statusText(config: { buttonText: string | null; buttonTextNL: string | null }) {
  return (isNL.value && config.buttonTextNL) ? config.buttonTextNL : config.buttonText
}

const loading = ref(true)
const isAuthenticated = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])
const cartItems = ref<any[]>([])
const sizeLabel = computed(() => (isNL.value ? 'maat' : 'size'))

onMounted(async () => {
  updateCartState()
  await loadWishlistIfAuthenticated()
})

// TODO Phase 4: window.auth0Client is wired by the Auth0 integration; until then
// this early-returns and the designed logged-out state shows by default.
async function loadWishlistIfAuthenticated() {
  const w = window as any
  if (!w.auth0Client) {
    loading.value = false
    return
  }
  isAuthenticated.value = await w.auth0Client.isAuthenticated()
  if (!isAuthenticated.value) {
    loading.value = false
    return
  }
  await loadWishlist()
}

// TODO Phase 4: wire Auth0 — old code called auth0Client.loginWithRedirect().
async function signIn() {
  const w = window as any
  if (w.auth0Client) {
    await w.auth0Client.loginWithRedirect()
    return
  }
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

// TODO Phase 4: wire Auth0 — old code passed screen_hint: 'signup'.
async function createAccount() {
  const w = window as any
  if (w.auth0Client) {
    await w.auth0Client.loginWithRedirect({
      authorizationParams: { screen_hint: 'signup' },
    })
    return
  }
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

// TODO Phase 4: window.CartManager comes from the reservation-cart integration (components.js).
function updateCartState() {
  const w = window as any
  if (w.CartManager) {
    cartItems.value = w.CartManager.getCart().map((item: any) => item.id)
  }
}

function isInCart(itemId: any) {
  return cartItems.value.includes(itemId)
}

function getItemStatusConfig(item: any) {
  const status = item.status || 'available'
  return getStatusConfig(status)
}

function canAddToCart(item: any) {
  return getItemStatusConfig(item).canAddToCart
}

function getButtonText(item: any) {
  const config = getItemStatusConfig(item)
  if (!config.canAddToCart) {
    return statusText(config)
  }
  if (isInCart(item.id)) {
    return t('removeFromCart')
  }
  const w = window as any
  if (w.CartManager && w.CartManager.getCartCount() >= w.CartManager.MAX_ITEMS) {
    return t('cartFull')
  }
  return t('addToCart')
}

function getButtonClasses(item: any) {
  const config = getItemStatusConfig(item)
  const classes: string[] = []
  if (!config.canAddToCart) {
    classes.push('status-disabled', config.buttonClass)
  } else if (isInCart(item.id)) {
    classes.push('in-cart')
  }
  return classes
}

function isButtonDisabled(item: any) {
  const config = getItemStatusConfig(item)
  if (!config.canAddToCart) {
    return true
  }
  const w = window as any
  if (w.CartManager
    && w.CartManager.getCartCount() >= w.CartManager.MAX_ITEMS
    && !isInCart(item.id)) {
    return true
  }
  return false
}

async function toggleCart(item: any) {
  const config = getItemStatusConfig(item)
  if (!config.canAddToCart) {
    return
  }
  const w = window as any
  if (isInCart(item.id)) {
    await w.CartManager.removeFromCart(item.id)
  } else {
    const cartItem = {
      id: item.id,
      sku: item.sku,
      name: item.name,
      brand: item.brand?.brand_name || item.brand || '',
      size: item.size?.size || item.size || '',
      frontImage: getFrontImage(item),
    }
    const result = await w.CartManager.addToCart(cartItem)
    if (!result.success && result.reason === 'max_items') {
      alert(t('cartFullAlert'))
      return
    }
  }
  updateCartState()
}

async function loadWishlist() {
  try {
    const w = window as any
    // Bearer token arrives with the Phase 4 Auth0 wiring.
    const token = await w.auth0Client?.getTokenSilently?.()
    if (!token) return
    const response = await fetch(`${apiBase}/private_clothing_items/wishlist/clothing_items`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    items.value = Array.isArray(data) ? data : (data.items || data.clothing_items || [])
  } catch (err) {
    error.value = t('loadError')
  } finally {
    loading.value = false
  }
}

function getFrontImage(item: any) {
  const images = item.images || []
  const front = images.find((img: any) => img.image_type === 'front') || images[0]
  return front ? front.object_url : ''
}

function getBackImage(item: any) {
  const images = item.images || []
  const back = images.find((img: any) => img.image_type === 'back')
  return back ? back.object_url : getFrontImage(item)
}

async function removeFromWishlist(itemId: any) {
  try {
    const ok = await (window as any).WishlistManager.removeFromWishlist(itemId)
    if (ok) {
      items.value = items.value.filter((item: any) => item.id !== itemId)
    }
  } catch (err) {
    // matches old behavior: removal errors are non-fatal
  }
}

function goToItem(sku: string) {
  navigateTo({ path: localePath('/product'), query: { sku } })
}
</script>

<template>
  <section class="full-page-section wish-list">
    <div class="div-heading-wish-list">
      <div class="div-content-wrapper-wish-list">
        <div class="w-embed">
          <div id="wishlist-app">
            <div v-if="loading" class="wishlist-loading">
              <div class="wishlist-spinner"></div>
              <p><span class="lang-en">loading your wish list...</span><span class="lang-nl">je wishlist wordt geladen...</span></p>
            </div>
            <div v-if="!loading && !isAuthenticated" class="wishlist-logged-out">
              <div class="wishlist-logged-out-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4b073f" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h2 class="wishlist-logged-out-title"><span class="lang-en">save your favorite items</span><span class="lang-nl">bewaar je favoriete items</span></h2>
              <p class="wishlist-logged-out-text"><span class="lang-en">sign in or create an account to add items to your wish list and access them anytime.</span><span class="lang-nl">log in of maak een account aan om items aan je wishlist toe te voegen en ze altijd terug te vinden.</span></p>
              <div class="wishlist-logged-out-buttons">
                <button class="wishlist-btn-signin" @click="signIn"><span class="lang-en">sign in</span><span class="lang-nl">inloggen</span></button>
                <button class="wishlist-btn-create" @click="createAccount"><span class="lang-en">create account</span><span class="lang-nl">account aanmaken</span></button>
              </div>
            </div>
            <div v-if="!loading && isAuthenticated && error" class="wishlist-error">
              {{ error }}
            </div>
            <div v-if="!loading && isAuthenticated && !error && items.length === 0" class="wishlist-empty">
              <div class="wishlist-empty-title"><span class="lang-en">your wish list is empty</span><span class="lang-nl">je wishlist is leeg</span></div>
              <p><span class="lang-en">start adding items to your wish list</span><span class="lang-nl">begin met items toevoegen aan je wishlist</span></p>
              <a href="/clothing" class="wishlist-empty-link"><span class="lang-en">shop now</span><span class="lang-nl">shop nu</span></a>
            </div>
            <div v-if="!loading && isAuthenticated && !error && items.length > 0" class="wishlist-grid">
              <div v-for="item in items" :key="item.id" class="wishlist-item" @click="goToItem(item.sku)">
                <div class="wishlist-image-wrapper">
                  <img :src="getBackImage(item)" :alt="item.name + ' back'" class="wishlist-image-back">
                  <img :src="getFrontImage(item)" :alt="item.name" class="wishlist-image-front">
                  <div class="wishlist-heart-wrapper" @click.stop="removeFromWishlist(item.id)">
                    <div class="wishlist-heart-bg"></div>
                    <svg class="wishlist-heart-filled" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4b073f" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                    </svg>
                  </div>
                </div>
                <button class="wishlist-reserve-button" :class="getButtonClasses(item)" :disabled="isButtonDisabled(item)" @click.stop="toggleCart(item)">
                  {{ getButtonText(item) }}
                </button>
                <div class="wishlist-item-content">
                  <div class="wishlist-item-name">{{ item.name }}</div>
                  <div v-if="item.size" class="wishlist-item-size">{{ sizeLabel }}: {{ item.size.size || item.size }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </section>
</template>

<style>
.wishlist-page-container {
  padding: 24px 56px;
}

@media screen and (max-width: 767px) {
  .wishlist-page-container {
    padding-right: 32px;
    padding-left: 32px;
  }
}

@media screen and (max-width: 479px) {
  .wishlist-page-container {
    padding-right: 24px;
    padding-left: 24px;
  }
}

/* Loading State */
.wishlist-loading {
  text-align: center;
  padding: 80px 20px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  color: #24282d;
}

/* Error State */
.wishlist-error {
  text-align: center;
  padding: 40px 20px;
  color: #a92296;
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
}

/* Empty State */
.wishlist-empty {
  text-align: center;
  padding: 80px 20px;
  font-family: 'Urbanist', sans-serif;
  color: #24282d;
}

.wishlist-empty-title {
  font-size: 28px;
  font-weight: 500;
  color: #4b073f;
  margin-bottom: 12px;
  text-transform: lowercase;
}

.wishlist-empty p {
  font-size: 16px;
  color: #24282d;
  margin-bottom: 24px;
}

.wishlist-empty-link {
  display: inline-block;
  padding: 16px 32px;
  background-color: #a92296;
  color: #f6f8f9;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  text-decoration: none;
  letter-spacing: 0.5px;
  border-radius: 50px;
  transition: all 0.2s;
}

.wishlist-empty-link:hover {
  background-color: #4b073f;
  color: #f6f8f9;
}

/* Grid */
.wishlist-grid {
  display: grid;
  width: 100%;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

@media screen and (max-width: 991px) {
  .wishlist-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media screen and (max-width: 767px) {
  .wishlist-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Item card */
.wishlist-item {
  position: relative;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

/* Image container */
.wishlist-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background-color: #f6f8f9;
  overflow: hidden;
  border-radius: 20px;
}

/* Back image - base layer */
.wishlist-image-back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
  box-sizing: border-box;
  background-color: #f6f8f9;
}

/* Front image - top layer, hides on hover */
.wishlist-image-front {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
  box-sizing: border-box;
  background-color: #f6f8f9;
  transition: opacity 0.3s ease;
}

.wishlist-image-wrapper:hover .wishlist-image-front {
  opacity: 0;
}

/* Heart button container */
.wishlist-heart-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  cursor: pointer;
}

/* Heart background circle */
.wishlist-heart-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
}

/* Heart icon */
.wishlist-heart-filled {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  display: block;
}

/* Item content */
.wishlist-item-content {
  padding: 12px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wishlist-item-name {
  font-family: 'Urbanist', sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #24282d;
  text-transform: lowercase;
}

.wishlist-item-size,
.wishlist-item-category {
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.3px;
  color: #24282d;
}

/* Reserve button - matches pdp-button-solid */
.wishlist-reserve-button {
  width: 100%;
  padding: 16px 20px;
  margin-top: 12px;
  margin-bottom: 12px;
  background-color: #a92296;
  color: #f6f8f9;
  border: none;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.wishlist-reserve-button:hover {
  background-color: #4b073f;
  color: #f6f8f9;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Logged Out State */
.wishlist-logged-out {
  text-align: center;
  padding: 80px 20px;
  max-width: 400px;
  margin: 0 auto;
}

.wishlist-logged-out-icon {
  margin-bottom: 24px;
}

.wishlist-logged-out-icon svg {
  opacity: 0.4;
}

.wishlist-logged-out-title {
  font-family: 'Urbanist', sans-serif;
  font-size: 28px;
  font-weight: 500;
  color: #4b073f;
  margin: 0 0 12px 0;
  text-transform: lowercase;
}

.wishlist-logged-out-text {
  font-family: 'Urbanist', sans-serif;
  font-size: 16px;
  color: #46535e;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.wishlist-logged-out-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 280px;
  margin: 0 auto;
}

.wishlist-btn-signin {
  width: 100%;
  padding: 16px 20px;
  background-color: #a92296;
  color: #f6f8f9;
  border: none;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.wishlist-btn-signin:hover {
  background-color: #4b073f;
  color: #f6f8f9;
}

.wishlist-btn-create {
  width: 100%;
  padding: 16px 20px;
  background-color: #fff4fe;
  color: #24282d;
  border: 1px solid #a92296;
  border-radius: 50px;
  font-family: 'Urbanist', sans-serif;
  font-size: 18px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.wishlist-btn-create:hover {
  background-color: #f6f8f9;
  color: #24282d;
  border: 1px solid #4b073f;
}

/* In Cart button state - matches pdp-button-outline */
.wishlist-reserve-button.in-cart {
  background-color: #fff4fe;
  color: #24282d;
  border: 1px solid #a92296;
}

.wishlist-reserve-button.in-cart:hover {
  background-color: #f6f8f9;
  color: #24282d;
  border: 1px solid #4b073f;
}

/* Status-aware button styles */
.wishlist-reserve-button.status-disabled,
.wishlist-reserve-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.wishlist-reserve-button.status-disabled:hover,
.wishlist-reserve-button:disabled:hover {
  background-color: #a92296;
  color: #f6f8f9;
  box-shadow: none;
}

.wishlist-reserve-button.status-rented,
.wishlist-reserve-button.status-reserved,
.wishlist-reserve-button.status-purchased,
.wishlist-reserve-button.status-sold {
  background-color: #46535e;
}

.wishlist-reserve-button.status-returned {
  background-color: #4b073f;
}

.wishlist-reserve-button.status-unavailable,
.wishlist-reserve-button.status-retired {
  background-color: #ced5da;
  color: #46535e;
}

@media (max-width: 767px) {
  .wishlist-reserve-button.status-disabled {
    box-shadow: none !important;
  }
}

/* Mobile fix for wishlist buttons */
@media (max-width: 767px) {
  .wishlist-item {
    overflow: visible !important;
    padding: 2px;
  }

  .wishlist-reserve-button {
    box-sizing: border-box !important;
    margin: 8px 0;
    width: 100% !important;
  }

  .wishlist-reserve-button.in-cart {
    background-color: #fff4fe !important;
    color: #24282d !important;
    box-shadow: none !important;
    border: 1px solid #a92296 !important;
  }

  .wishlist-grid {
    overflow: visible !important;
    gap: 16px !important;
    padding: 0 2px;
  }
}
</style>
