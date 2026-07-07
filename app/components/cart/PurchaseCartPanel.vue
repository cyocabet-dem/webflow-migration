<script setup lang="ts">
// Port of the cart panel + backdrop + toast that purchase-cart.js injected into
// document.body (createCartPanel/renderCartPanel/showAddedToast). Same ids/classes.
const {
  items,
  panelOpen,
  total,
  toastMounted,
  toastVisible,
  formatPrice,
  removeItem,
  closeCartPanel,
  openCheckoutModal,
  updateCartBadge,
} = usePurchaseCart()

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  yourCart: { en: 'your cart', nl: 'jouw winkelmand' },
  cartEmpty: { en: 'your cart is empty', nl: 'je winkelmand is leeg' },
  itemFallback: { en: 'item', nl: 'item' },
  total: { en: 'total', nl: 'totaal' },
  checkout: { en: 'checkout', nl: 'afrekenen' },
  addedToCart: { en: 'Added to cart', nl: 'Toegevoegd aan winkelmand' },
} as const

// The purchase cart is loaded from localStorage before hydration, while the
// server always renders the empty state. Gate the items branch on mount so
// hydration matches the server HTML (otherwise Vue reuses the
// .cart-panel-empty div for the items list, leaving items flex-centered).
const hydrated = ref(false)
const hasItems = computed(() => hydrated.value && items.value.length > 0)

function onRemove(clothingItemId: number) {
  removeItem(clothingItemId)
  const rentalsManager = (window as any).RentalsManager
  if (rentalsManager && typeof rentalsManager.renderRentalsPage === 'function') {
    rentalsManager.renderRentalsPage()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && panelOpen.value) closeCartPanel()
}

onMounted(() => {
  hydrated.value = true
  document.addEventListener('keydown', onKeydown)
  updateCartBadge()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (panelOpen.value) document.body.style.overflow = ''
})

watch(items, () => updateCartBadge(), { deep: true })
</script>

<template>
  <div>
    <div
      id="purchase-cart-backdrop"
      class="cart-panel-backdrop"
      :class="{ 'cart-panel-backdrop-open': panelOpen }"
      @click="closeCartPanel()"
    ></div>
    <div id="purchase-cart-panel" class="cart-panel" :class="{ 'cart-panel-open': panelOpen }">
      <template v-if="!hasItems">
        <div class="cart-panel-header">
          <span class="cart-panel-title">{{ isNL ? T.yourCart.nl : T.yourCart.en }}</span>
          <button class="cart-panel-close" @click="closeCartPanel()">&times;</button>
        </div>
        <div class="cart-panel-empty">
          <p>{{ isNL ? T.cartEmpty.nl : T.cartEmpty.en }}</p>
        </div>
      </template>
      <template v-else>
        <div class="cart-panel-header">
          <span class="cart-panel-title">{{ isNL ? T.yourCart.nl : T.yourCart.en }} ({{ items.length }})</span>
          <button class="cart-panel-close" @click="closeCartPanel()">&times;</button>
        </div>
        <div class="cart-panel-items">
          <div v-for="item in items" :key="item.clothing_item_id" class="cart-panel-item">
            <div class="cart-panel-item-image">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name">
            </div>
            <div class="cart-panel-item-info">
              <div class="cart-panel-item-name">{{ item.name?.toLowerCase() || (isNL ? T.itemFallback.nl : T.itemFallback.en) }}</div>
              <div class="cart-panel-item-price">{{ formatPrice(item.purchase_price_cents) }}</div>
            </div>
            <button class="cart-panel-item-remove" @click="onRemove(item.clothing_item_id)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="cart-panel-footer">
          <div class="cart-panel-total">
            <span>{{ isNL ? T.total.nl : T.total.en }}</span>
            <span>{{ formatPrice(total) }}</span>
          </div>
          <button class="cart-panel-checkout-btn" @click="openCheckoutModal()">
            {{ isNL ? T.checkout.nl : T.checkout.en }}
          </button>
        </div>
      </template>
    </div>
    <div
      v-if="toastMounted"
      id="cart-toast"
      class="cart-toast"
      :class="{ 'cart-toast-visible': toastVisible }"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{{ isNL ? T.addedToCart.nl : T.addedToCart.en }}</span>
    </div>
  </div>
</template>

<style>
/* Ported verbatim from purchase-cart.js injectCartStyles() (toast, nav badge, cart panel). */
:root {
  --cart-purple: #4b073f;
  --cart-purple-dark: #3a052f;
  --cart-pink: #a92296;
  --cart-gray-dark: #24282d;
  --cart-gray-medium: #46535e;
  --cart-gray-light: #ced5da;
  --cart-gray-bg: #f6f8f9;
  --cart-pink-light: #fff4fe;
  --cart-navy: #04314d;
}

/* Toast */
.cart-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--cart-purple);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10000;
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.cart-toast-visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Cart Nav */
#purchase-cart-nav,
.purchase-cart-nav {
  position: relative;
  display: none;
  align-items: center;
}
.purchase-cart-toggle {
  position: relative;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--cart-gray-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}
.purchase-cart-toggle:hover {
  color: var(--cart-purple);
}
#purchase-cart-badge,
.purchase-cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--cart-pink);
  color: white;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* Cart Panel Backdrop */
.cart-panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9998;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.cart-panel-backdrop-open {
  opacity: 1;
  visibility: visible;
}

/* Cart Panel - Slide from Right */
.cart-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 100%;
  background: white;
  z-index: 9999;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.12);
}
.cart-panel-open {
  transform: translateX(0);
}

.cart-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--cart-gray-light);
}
.cart-panel-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--cart-gray-dark);
}
.cart-panel-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: var(--cart-gray-medium);
  line-height: 1;
  padding: 0;
}
.cart-panel-close:hover {
  color: var(--cart-gray-dark);
}

.cart-panel-items {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}
.cart-panel-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--cart-gray-bg);
}
.cart-panel-item:last-child {
  border-bottom: none;
}
.cart-panel-item-image {
  width: 70px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--cart-gray-bg);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}
.cart-panel-item-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.cart-panel-item-info {
  flex: 1;
  min-width: 0;
}
.cart-panel-item-name {
  font-size: 18px;
  font-weight: 500;
  color: var(--cart-gray-dark);
  margin-bottom: 4px;
}
.cart-panel-item-price {
  font-size: 18px;
  color: var(--cart-pink);
  font-weight: 600;
}
.cart-panel-item-remove {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--cart-gray-medium);
  opacity: 0.6;
  flex-shrink: 0;
}
.cart-panel-item-remove:hover {
  opacity: 1;
  color: var(--cart-gray-dark);
}

.cart-panel-footer {
  padding: 20px 24px;
  background: var(--cart-gray-bg);
  border-top: 1px solid var(--cart-gray-light);
}
.cart-panel-total {
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--cart-gray-dark);
}
.cart-panel-checkout-btn {
  width: 100%;
  padding: 16px;
  background: var(--cart-purple);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.cart-panel-checkout-btn:hover {
  background: var(--cart-purple-dark);
}

.cart-panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--cart-gray-medium);
  font-size: 18px;
}

/* Mobile - Full screen cart */
@media (max-width: 600px) {
  .cart-panel {
    width: 100%;
  }
}
</style>
