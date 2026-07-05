<script setup lang="ts">
// Reservation confirmation modal — markup ported verbatim from components.js.
// Dual-mode: local members see the "confirm reservation" pickup flow, shipping
// members see the "confirm your shipment" rental flow (openReservationModal's
// text/button/policy swaps from site-wide-footer.js, expressed reactively).
const CartManager = useCartManager()
const ui = useReservationCartUi()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const isOpen = computed(() => ui.reservationModalOpen.value)
const isRental = computed(() => ui.reservationFlowType.value === 'rental')
const submitting = computed(() => ui.reservationSubmitting.value)
const error = computed(() => ui.reservationError.value)

function lp(path: string) {
  return (isNL.value ? '/nl' : '') + path
}

const modalTitle = computed(() =>
  isRental.value ? 'confirm your shipment' : 'confirm reservation',
)

const itemCountText = computed(() => {
  const n = CartManager.items.value.length
  const plural = n !== 1 ? 's' : ''
  return isRental.value
    ? `${n} item${plural} selected for your shipment`
    : `${n} item${plural} ready to reserve`
})

const confirmBtnText = computed(() => {
  if (submitting.value) return isRental.value ? 'creating rental...' : 'creating reservation...'
  return isRental.value ? 'confirm rental' : 'confirm reservation'
})

function close() {
  ;(window as any).closeReservationModal?.()
}

function confirm() {
  ;(window as any).confirmReservation?.()
}
</script>

<template>
  <div>
    <!-- Reservation Confirmation Modal -->
    <div id="reservation-modal-backdrop" class="modal-backdrop" :style="{ display: isOpen ? 'block' : 'none' }" @click="close"></div>
    <div id="reservation-modal" class="modal-container" :style="{ display: isOpen ? 'block' : 'none' }">
      <div class="modal-header">
        <span class="modal-title">{{ modalTitle }}</span>
        <button class="modal-close" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="reservation-item-count-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
          </svg>
          <span id="reservation-item-count">{{ itemCountText }}</span>
          <p
            v-show="isRental"
            class="shipping-note"
            style="font-size: 14px; color: #46535e; margin-top: 8px; font-family: Urbanist, sans-serif;"
          >these items will be shipped to your address on file.</p>
        </div>
        <div class="reservation-policy">
          <h4>before you confirm:</h4>
          <div class="policy-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span v-if="isRental">we'll notify you by email when your items have been shipped, along with a tracking code. items typically arrive within 1-3 business days.</span>
            <span v-else>we'll notify you by email when your items are ready for pickup at our store, typically within one business day</span>
          </div>
          <div class="policy-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
            <span v-if="isRental"><a :href="lp('/contact-us')" class="link-text-html">contact us</a> if you have any questions or would like to make a change to your order.</span>
            <span v-else><a :href="lp('/contact-us')" class="link-text-html">contact us</a> as soon as possible if you are unable to make it to your reservation. please note that a €5 cancellation / no-show fee may apply. see our <a :href="lp('/cancellation-policy')" class="link-text-html">cancellation policy</a>.</span>
          </div>
        </div>
        <div id="reservation-error" class="modal-error" :style="{ display: error ? 'block' : 'none' }">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button
          id="confirm-reservation-btn"
          class="btn-primary"
          :disabled="submitting"
          :style="{ opacity: submitting ? '0.7' : '1' }"
          @click="confirm"
        >{{ confirmBtnText }}</button>
        <button class="btn-secondary" @click="close">go back</button>
      </div>
    </div>
  </div>
</template>
