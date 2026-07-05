<script setup lang="ts">
// Reservation/rental success modal — markup ported verbatim from components.js,
// with the showReservationSuccess() text swaps from site-wide-footer.js
// (reservation vs. shipment) expressed reactively.
const ui = useReservationCartUi()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const isOpen = computed(() => ui.successModalOpen.value)
const isRental = computed(() => ui.successIsRental.value)
const reservationId = computed(() => ui.successId.value)

function lp(path: string) {
  return (isNL.value ? '/nl' : '') + path
}

const heading = computed(() =>
  isRental.value ? 'shipment confirmed!' : 'reservation confirmed!',
)

const message = computed(() =>
  isRental.value
    ? 'your items are being prepared. you\'ll receive an email with a tracking code as soon as we\'ve shipped them.'
    : 'you\'ll receive an email when your items are ready and waiting for you at our showroom.',
)

const idLabel = computed(() => (isRental.value ? 'shipment id' : 'reservation id'))
const subtext = computed(() => (isRental.value ? 'happy borrowing!' : 'see you soon!'))
const viewLinkText = computed(() => (isRental.value ? 'view my rentals' : 'view my reservations'))
const viewLinkHref = computed(() => lp(isRental.value ? '/my-rentals' : '/reservations'))

function close() {
  ;(window as any).closeSuccessModal?.()
}
</script>

<template>
  <div>
    <!-- Reservation Success Modal -->
    <div id="success-modal-backdrop" class="modal-backdrop" style="z-index: 10002;" :style="{ display: isOpen ? 'block' : 'none' }" @click="close"></div>
    <div id="success-modal" class="modal-container modal-centered" style="z-index: 10003;" :style="{ display: isOpen ? 'block' : 'none' }">
      <div class="modal-body text-center" style="padding-top: 40px;">
        <div class="success-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 class="modal-heading">{{ heading }}</h3>
        <p class="modal-text">{{ message }}</p>
        <div class="reservation-id-box">
          <div class="reservation-id-label">{{ idLabel }}</div>
          <div id="success-reservation-id" class="reservation-id-value">{{ reservationId }}</div>
        </div>
        <p class="modal-subtext">{{ subtext }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" @click="close">continue shopping</button>
        <a :href="viewLinkHref" class="btn-secondary" @click="close">{{ viewLinkText }}</a>
      </div>
    </div>
  </div>
</template>
