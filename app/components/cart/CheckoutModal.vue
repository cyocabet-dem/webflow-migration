<script setup lang="ts">
// Port of the checkout modal purchase-cart.js injected into document.body
// (openCheckoutModal/renderCheckoutModal/showSuccessMessage). Same ids/classes.
const {
  items,
  checkoutOpen,
  checkoutView,
  creditBalance,
  creditsLoading,
  isCheckingOut,
  checkoutError,
  successOrder,
  total,
  creditsToApply,
  finalTotal,
  formatPrice,
  closeCheckoutModal,
  processCheckout,
} = usePurchaseCart()

const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  purchaseSuccessful: { en: 'purchase successful!', nl: 'aankoop geslaagd!' },
  viewHistory: { en: 'you can view your purchase history in your account.', nl: 'je kunt je aankoopgeschiedenis bekijken in je account.' },
  creditsAppliedSuffix: { en: ' in store credits applied', nl: ' aan winkeltegoed toegepast' },
  viewMyPurchases: { en: 'view my purchases', nl: 'bekijk mijn aankopen' },
  continueBrowsing: { en: 'continue browsing', nl: 'verder winkelen' },
  checkout: { en: 'checkout', nl: 'afrekenen' },
  itemsLabel: { en: 'items', nl: 'items' },
  itemFallback: { en: 'item', nl: 'item' },
  subtotal: { en: 'subtotal (50% off)', nl: 'subtotaal (50% korting)' },
  yourStoreCredits: { en: 'your store credits', nl: 'jouw winkeltegoed' },
  creditsApplied: { en: 'credits applied', nl: 'tegoed toegepast' },
  total: { en: 'total', nl: 'totaal' },
  redirectInfo: { en: "by clicking 'complete purchase' you will be redirected to our payment provider.", nl: "by clicking 'complete purchase' you will be redirected to our payment provider." },
  creditsCover: { en: 'your credits cover this purchase!', nl: 'je tegoed dekt deze aankoop!' },
  processing: { en: 'processing...', nl: 'verwerken...' },
  completePurchase: { en: 'complete purchase', nl: 'aankoop afronden' },
} as const

const successCreditsApplied = computed(() => successOrder.value?.credits_applied_cents || 0)

function continueBrowsing() {
  closeCheckoutModal()
  window.location.reload()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && checkoutOpen.value) closeCheckoutModal()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (checkoutOpen.value) document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <div
      id="checkout-modal-backdrop"
      class="checkout-modal-backdrop"
      :class="{ 'checkout-modal-backdrop-open': checkoutOpen }"
      @click="closeCheckoutModal()"
    ></div>
    <div id="checkout-modal" class="checkout-modal" :class="{ 'checkout-modal-open': checkoutOpen }">
      <div v-if="checkoutView === 'success'" class="checkout-modal-container">
        <div class="checkout-success">
          <div class="checkout-success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="16 10 10.5 15.5 8 13"></polyline>
            </svg>
          </div>
          <h2>{{ isNL ? T.purchaseSuccessful.nl : T.purchaseSuccessful.en }}</h2>
          <p>{{ isNL ? T.viewHistory.nl : T.viewHistory.en }}</p>
          <div v-if="successCreditsApplied > 0" class="checkout-success-credits">
            <span>{{ formatPrice(successCreditsApplied) }}{{ isNL ? T.creditsAppliedSuffix.nl : T.creditsAppliedSuffix.en }}</span>
          </div>
          <div class="checkout-success-actions">
            <a href="/purchases" class="checkout-success-btn">{{ isNL ? T.viewMyPurchases.nl : T.viewMyPurchases.en }}</a>
            <button class="checkout-success-btn-secondary" @click="continueBrowsing()">{{ isNL ? T.continueBrowsing.nl : T.continueBrowsing.en }}</button>
          </div>
        </div>
      </div>
      <div v-else-if="!creditsLoading" class="checkout-modal-container">
        <div class="checkout-modal-header">
          <h2>{{ isNL ? T.checkout.nl : T.checkout.en }}</h2>
          <button class="checkout-modal-close" @click="closeCheckoutModal()">&times;</button>
        </div>

        <div class="checkout-modal-body">
          <div class="checkout-section">
            <div class="checkout-section-title">{{ isNL ? T.itemsLabel.nl : T.itemsLabel.en }} ({{ items.length }})</div>
            <div class="checkout-items">
              <div v-for="item in items" :key="item.clothing_item_id" class="checkout-item">
                <div class="checkout-item-image">
                  <img v-if="item.image_url" :src="item.image_url" :alt="item.name">
                </div>
                <div class="checkout-item-details">
                  <div class="checkout-item-name">{{ item.name?.toLowerCase() || (isNL ? T.itemFallback.nl : T.itemFallback.en) }}</div>
                </div>
                <div class="checkout-item-prices">
                  <span class="checkout-item-original">{{ formatPrice(item.retail_price_cents) }}</span>
                  <span class="checkout-item-final">{{ formatPrice(item.purchase_price_cents) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="checkout-summary">
            <div class="checkout-summary-row">
              <span>{{ isNL ? T.subtotal.nl : T.subtotal.en }}</span>
              <span>{{ formatPrice(total) }}</span>
            </div>
            <div class="checkout-summary-row">
              <span>{{ isNL ? T.yourStoreCredits.nl : T.yourStoreCredits.en }}</span>
              <span>{{ formatPrice(creditBalance) }}</span>
            </div>
            <div v-if="creditsToApply > 0" class="checkout-summary-row checkout-credits-applied">
              <span>{{ isNL ? T.creditsApplied.nl : T.creditsApplied.en }}</span>
              <span>-{{ formatPrice(creditsToApply) }}</span>
            </div>
            <div class="checkout-summary-row checkout-summary-total">
              <span>{{ isNL ? T.total.nl : T.total.en }}</span>
              <span>{{ formatPrice(finalTotal) }}</span>
            </div>
          </div>
        </div>

        <div class="checkout-modal-footer">
          <p v-show="checkoutError" id="checkout-error-msg" class="checkout-error-msg">{{ checkoutError }}</p>
          <p class="checkout-info">{{ finalTotal > 0 ? (isNL ? T.redirectInfo.nl : T.redirectInfo.en) : (isNL ? T.creditsCover.nl : T.creditsCover.en) }}</p>
          <button id="checkout-submit-btn" class="checkout-submit-btn" :disabled="isCheckingOut" @click="processCheckout()">
            <template v-if="isCheckingOut"><span class="checkout-spinner"></span> {{ isNL ? T.processing.nl : T.processing.en }}</template>
            <template v-else>{{ isNL ? T.completePurchase.nl : T.completePurchase.en }}</template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Ported verbatim from purchase-cart.js injectCartStyles() (checkout modal + success state). */
.checkout-modal-backdrop {
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
.checkout-modal-backdrop-open {
  opacity: 1;
  visibility: visible;
}
.checkout-modal {
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
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
}
.checkout-modal-open {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}
.checkout-modal-container {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.checkout-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--cart-gray-light);
}
.checkout-modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--cart-gray-dark);
}
.checkout-modal-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: var(--cart-gray-medium);
  line-height: 1;
  padding: 0;
}
.checkout-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.checkout-section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--cart-gray-medium);
  margin-bottom: 16px;
}
.checkout-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.checkout-item {
  display: flex;
  gap: 16px;
  align-items: center;
}
.checkout-item-image {
  width: 70px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--cart-gray-bg);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}
.checkout-item-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.checkout-item-details {
  flex: 1;
  min-width: 0;
}
.checkout-item-name {
  font-size: 18px;
  font-weight: 500;
  color: var(--cart-gray-dark);
}
.checkout-item-prices {
  text-align: right;
}
.checkout-item-original {
  display: block;
  font-size: 16px;
  color: var(--cart-gray-medium);
  text-decoration: line-through;
}
.checkout-item-final {
  font-size: 18px;
  font-weight: 600;
  color: var(--cart-pink);
}
.checkout-summary {
  background: var(--cart-gray-bg);
  border-radius: 12px;
  padding: 20px;
}
.checkout-summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 18px;
  color: var(--cart-gray-dark);
}
.checkout-summary-row:last-child {
  margin-bottom: 0;
}
.checkout-credits-applied {
  color: var(--cart-pink);
}
.checkout-summary-total {
  font-weight: 600;
  font-size: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--cart-gray-light);
  margin-top: 12px;
}
.checkout-modal-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--cart-gray-light);
  background: var(--cart-gray-bg);
}
.checkout-error-msg {
  font-size: 14px;
  color: #c0392b;
  background: #fdf0ef;
  border: 1px solid #f5c6c2;
  border-radius: 6px;
  padding: 10px 14px;
  margin: 0 0 12px 0;
  text-align: center;
}
.checkout-info {
  font-size: 14px;
  color: var(--cart-gray-medium);
  margin: 0 0 16px 0;
  text-align: center;
}
.checkout-submit-btn {
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.checkout-submit-btn:hover:not(:disabled) {
  background: var(--cart-purple-dark);
}
.checkout-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.checkout-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Success State */
.checkout-success {
  padding: 48px 24px;
  text-align: center;
}
.checkout-success-icon {
  color: #16a34a;
  margin-bottom: 16px;
}
.checkout-success h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: var(--cart-gray-dark);
}
.checkout-success p {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: var(--cart-gray-medium);
}
.checkout-success-credits {
  background: var(--cart-pink-light);
  padding: 14px 18px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 16px;
  color: var(--cart-purple);
}
.checkout-success-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.checkout-success-btn {
  display: inline-block;
  padding: 14px 36px;
  background: var(--cart-purple);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
}
.checkout-success-btn:hover {
  background: var(--cart-purple-dark);
  color: white;
}
.checkout-success-btn-secondary {
  background: transparent;
  border: none;
  color: var(--cart-gray-medium);
  font-size: 16px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 8px;
}
.checkout-success-btn-secondary:hover {
  color: var(--cart-purple);
}
</style>
