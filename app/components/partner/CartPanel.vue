<script setup lang="ts">
// Partner reservation cart — slide-out panel (right side, PurchaseCartPanel mechanics)
// listing items grouped by partner, plus the floating bottom-right trigger pill (the
// cart's only entry point — deliberately not touching the navbar).
//
// Hydration safety: the cart is loaded from localStorage after mount (plugin app:mounted
// → cart.init()), while the server always renders the closed/empty state. Everything
// that depends on cart contents or auth state is gated behind the post-mount hydrated
// ref so SSR HTML and the first client render match.
const { locale } = useI18n()
const langPrefix = computed(() => (locale.value.startsWith('nl') ? '/nl' : ''))

const cart = usePartnerCart()
const { items, grouped, count, holdDepositTotal, panelOpen } = cart
const { isAuthenticated, hasActiveMembership } = useAuth()
const bodyLock = usePpBodyLock()

const hydrated = ref(false)
const hasItems = computed(() => hydrated.value && count.value > 0)
const showTrigger = computed(() => hydrated.value && count.value > 0 && !panelOpen.value)

function priceFor(item: { price_cents: number | null; member_price_cents: number | null }) {
  if (hasActiveMembership.value && item.member_price_cents !== null) {
    return item.member_price_cents
  }
  return item.price_cents
}

function onReserve() {
  if (!(window as any).auth0Client || !isAuthenticated.value) {
    ;(window as any).openAuthModal?.()
    return
  }
  cart.openCheckout()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && panelOpen.value) cart.closePanel()
}

// Body overflow lock for the panel — shared counter with the checkout modal, so
// closing one overlay never unfreezes the page while the other is still open.
watch(panelOpen, (open) => {
  if (!import.meta.client) return
  if (open) bodyLock.lock()
  else bodyLock.unlock()
})

onMounted(() => {
  hydrated.value = true
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  // The watcher dies with the component — release a lock still held for an open panel.
  if (panelOpen.value) bodyLock.unlock()
})
</script>

<template>
  <div>
    <!-- floating trigger pill (only entry point to the cart) -->
    <button
      v-if="showTrigger"
      class="pp-btn pp-btn-primary pp-cart-trigger"
      type="button"
      @click="cart.openPanel()"
    >
      {{ $t('partner.cart.trigger') }}
      <span class="pp-cart-trigger-count">{{ count }}</span>
    </button>

    <!-- backdrop + slide-out panel -->
    <div
      class="pp-cart-backdrop"
      :class="{ 'pp-cart-backdrop-open': panelOpen }"
      @click="cart.closePanel()"
    ></div>
    <aside class="pp-cart-panel" :class="{ 'pp-cart-panel-open': panelOpen }">
      <div class="pp-cart-header">
        <span class="pp-cart-title">
          {{ $t('partner.cart.title') }}<template v-if="hasItems"> ({{ count }})</template>
        </span>
        <button class="pp-cart-close" type="button" :aria-label="$t('partner.checkout.closeLabel')" @click="cart.closePanel()">&times;</button>
      </div>

      <div v-if="!hasItems" class="pp-cart-empty">
        <p>{{ $t('partner.cart.empty') }}</p>
      </div>

      <template v-else>
        <div class="pp-cart-items">
          <div v-for="group in grouped" :key="group.partner_slug" class="pp-cart-group">
            <div class="pp-cart-group-header">
              <span class="pp-cart-group-name">{{ group.partner_name }}</span>
              <NuxtLink
                :to="`${langPrefix}/partners/${encodeURIComponent(group.partner_slug)}`"
                class="pp-cart-group-link"
                @click="cart.closePanel()"
              >
                {{ $t('partner.cart.visitStore') }}
              </NuxtLink>
            </div>
            <div v-for="item in group.items" :key="item.pp_id" class="pp-cart-item">
              <div class="pp-cart-item-thumb">
                <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" decoding="async">
              </div>
              <div class="pp-cart-item-info">
                <div class="pp-cart-item-title">{{ item.title }}</div>
                <div class="pp-cart-item-meta">
                  <span class="pp-chip" :class="item.intent === 'purchase' ? 'pp-chip-available' : 'pp-chip-rented'">
                    {{ item.intent === 'purchase' ? $t('partner.cart.intentBuy') : $t('partner.cart.intentRent') }}
                  </span>
                  <span class="pp-price-row">
                    <template v-if="hasActiveMembership && item.member_price_cents !== null">
                      <span class="pp-price-struck">{{ ppFormatPrice(item.price_cents) }}</span>
                      <span class="pp-price-member">{{ ppFormatPrice(item.member_price_cents) }}</span>
                    </template>
                    <template v-else>
                      <span class="pp-price-regular">{{ ppFormatPrice(priceFor(item)) }}</span>
                    </template>
                  </span>
                </div>
                <div v-if="item.hold_deposit_cents" class="pp-cart-item-hold">
                  {{ $t('partner.cart.holdDeposit', { amount: ppFormatPrice(item.hold_deposit_cents) }) }}
                </div>
              </div>
              <button
                class="pp-cart-item-remove"
                type="button"
                :aria-label="$t('partner.cart.remove')"
                @click="cart.removeItem(item.pp_id)"
              >&times;</button>
            </div>
          </div>
        </div>

        <div class="pp-cart-footer">
          <p v-if="holdDepositTotal > 0" class="pp-cart-hold-note">
            {{ $t('partner.cart.holdTotal', { amount: ppFormatPrice(holdDepositTotal) }) }}
          </p>
          <button class="pp-btn pp-btn-primary pp-cart-cta" type="button" @click="onReserve()">
            {{ $t('partner.cart.reserveCta') }}
          </button>
        </div>
      </template>
    </aside>
  </div>
</template>

<style>
/* Partner cart panel — .pp- scope only. z-order: trigger (9985) < panel (9992/9993)
   < checkout modal (9996, see partner/CheckoutModal.vue); mobile bottom nav is 9990. */
.pp-cart-trigger {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9985;
  padding: 12px 22px;
  font-size: 15px;
  text-transform: lowercase;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}
.pp-cart-trigger-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: #fff;
  color: var(--pp-magenta);
  font-size: 13px;
  font-weight: 700;
}
@media (max-width: 767px) {
  /* clear the mobile bottom nav */
  .pp-cart-trigger {
    bottom: 86px;
  }
}

.pp-cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9992;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.pp-cart-backdrop-open {
  opacity: 1;
  visibility: visible;
}

.pp-cart-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100%;
  background: #fff;
  z-index: 9993;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  font-family: 'Urbanist', sans-serif;
  color: var(--pp-ink);
}
.pp-cart-panel-open {
  transform: translateX(0);
}
@media (max-width: 600px) {
  .pp-cart-panel {
    width: 100%;
  }
}

.pp-cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--pp-gray-light);
}
.pp-cart-title {
  font-size: 22px;
  font-weight: 600;
  text-transform: lowercase;
}
.pp-cart-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: var(--pp-gray);
  line-height: 1;
  padding: 0;
}
.pp-cart-close:hover {
  color: var(--pp-ink);
}

.pp-cart-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--pp-gray);
  font-size: 16px;
  text-align: center;
}

.pp-cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 12px 24px;
}
.pp-cart-group {
  padding: 10px 0 4px;
}
.pp-cart-group + .pp-cart-group {
  border-top: 1px solid var(--pp-gray-light);
}
.pp-cart-group-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}
.pp-cart-group-name {
  font-size: 15px;
  font-weight: 700;
}
.pp-cart-group-link {
  font-size: 12px;
  color: var(--pp-magenta);
  text-decoration: underline;
  white-space: nowrap;
}
.pp-cart-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--pp-bg-light);
}
.pp-cart-group .pp-cart-item:last-child {
  border-bottom: none;
}
.pp-cart-item-thumb {
  width: 60px;
  height: 76px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--pp-bg-light);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pp-cart-item-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.pp-cart-item-info {
  flex: 1;
  min-width: 0;
}
.pp-cart-item-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  overflow-wrap: anywhere;
}
.pp-cart-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}
.pp-cart-item-hold {
  margin-top: 4px;
  font-size: 12px;
  color: var(--pp-gray);
}
.pp-cart-item-remove {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  padding: 4px;
  cursor: pointer;
  color: var(--pp-gray);
  opacity: 0.6;
  flex-shrink: 0;
}
.pp-cart-item-remove:hover {
  opacity: 1;
  color: var(--pp-ink);
}

.pp-cart-footer {
  padding: 18px 24px;
  background: var(--pp-bg-light);
  border-top: 1px solid var(--pp-gray-light);
}
.pp-cart-hold-note {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--pp-gray);
}
.pp-cart-cta {
  width: 100%;
  padding: 14px 20px;
  font-size: 16px;
  text-transform: lowercase;
}
</style>
