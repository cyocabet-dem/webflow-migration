<script setup lang="ts">
// Cart overlay panel — markup ported verbatim from components.js, with the
// renderCartOverlay() DOM mutations from site-wide-footer.js expressed as
// reactive state. All styles live in the global embed CSS (3-demat-custom.css).
const CartManager = useCartManager()
const ui = useReservationCartUi()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const cart = CartManager.items
const isOpen = computed(() => ui.cartOverlayOpen.value)
const flowType = computed(() => ui.cartFlowType.value)
const removingIds = ref<number[]>([])

function lp(path: string) {
  return (isNL.value ? '/nl' : '') + path
}

const subtitleVisible = computed(() => !(cart.value.length === 0 && flowType.value === null))

const subtitleSuffix = computed(() => {
  if (flowType.value === 'shipping') return ' — select items for your shipment'
  if (flowType.value === 'local') return ' — reserve items to try on in store'
  return ''
})

const reserveBtnText = computed(() =>
  flowType.value === 'shipping' ? 'borrow these items' : 'reserve these items',
)

const footerCountSuffix = computed(() => {
  const plural = cart.value.length !== 1 ? 's' : ''
  return flowType.value === 'shipping'
    ? ` item${plural} selected for shipment`
    : ` item${plural} ready to reserve`
})

const emptyText = computed(() =>
  flowType.value === 'shipping'
    ? 'browse our collection and add items to borrow'
    : 'browse our collection and add items to reserve',
)

function close() {
  ;(window as any).closeCartOverlay?.()
}

function reserve() {
  ;(window as any).handleReserveClick?.()
}

function goToCartItem(sku: string) {
  close()
  window.location.href = lp('/product?sku=' + encodeURIComponent(sku))
}

async function removeItem(event: Event, itemId: number) {
  event.stopPropagation()
  removingIds.value = [...removingIds.value, itemId]
  await CartManager.removeFromCart(itemId)
  removingIds.value = removingIds.value.filter((id) => id !== itemId)
}
</script>

<template>
  <div>
    <!-- Cart Overlay Backdrop -->
    <div id="cart-backdrop" class="cart-overlay-backdrop" :class="{ 'is-open': isOpen }" @click="close"></div>

    <!-- Cart Overlay Panel -->
    <div id="cart-overlay" class="cart-overlay" :class="{ 'is-open': isOpen }">
      <div class="cart-overlay-header">
        <span class="cart-overlay-title">your cart (<span id="cart-overlay-header-count">{{ cart.length }}</span>)</span>
        <button class="cart-overlay-close" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div v-show="subtitleVisible" class="cart-overlay-subtitle">
        <span id="cart-overlay-count-text">{{ cart.length }} of 5 items</span>{{ subtitleSuffix }}
      </div>
      <div class="cart-overlay-content">
        <div id="cart-overlay-empty" class="cart-overlay-empty" :style="{ display: cart.length === 0 ? 'block' : 'none' }">
          <div class="cart-overlay-empty-title">your cart is empty</div>
          <p>{{ emptyText }}</p>
          <a :href="lp('/clothing')" class="cart-overlay-empty-link" @click="close">shop now</a>
        </div>
        <div id="cart-overlay-items" class="cart-overlay-items">
          <template v-if="cart.length > 0">
            <div
              v-for="item in cart"
              :key="item.id"
              class="cart-overlay-item"
              :style="removingIds.includes(item.id) ? { opacity: '0.5', pointerEvents: 'none' } : undefined"
              @click="goToCartItem(item.sku)"
            >
              <div class="cart-overlay-item-image">
                <img v-if="item.image" :src="item.image" :alt="item.name">
              </div>
              <div class="cart-overlay-item-details">
                <div class="cart-overlay-item-name">{{ item.name.toLowerCase() }}</div>
              </div>
              <button class="cart-overlay-item-remove" @click="removeItem($event, item.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </template>
        </div>
      </div>
      <div id="cart-overlay-footer" class="cart-overlay-footer" :style="{ display: cart.length > 0 ? 'block' : 'none' }">
        <div class="cart-overlay-count"><span id="cart-footer-count">{{ cart.length }}</span>{{ footerCountSuffix }}</div>
        <button id="cart-reserve-btn" class="cart-overlay-reserve-btn" @click="reserve">{{ reserveBtnText }}</button>
      </div>
    </div>
  </div>
</template>
