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

const T = {
  shipmentConfirmed: { en: 'shipment confirmed!', nl: 'zending bevestigd!' },
  reservationConfirmed: { en: 'reservation confirmed!', nl: 'reservering bevestigd!' },
  rentalMessage: {
    en: "your items are being prepared. you'll receive an email with a tracking code as soon as we've shipped them.",
    nl: "your items are being prepared. you'll receive an email with a tracking code as soon as we've shipped them.",
  },
  pickupMessage: {
    en: "you'll receive an email when your items are ready and waiting for you at our showroom.",
    nl: "you'll receive an email when your items are ready and waiting for you at our showroom.",
  },
  shipmentId: { en: 'shipment id', nl: 'zendings-id' },
  reservationId: { en: 'reservation id', nl: 'reserverings-id' },
  happyBorrowing: { en: 'happy borrowing!', nl: 'veel leenplezier!' },
  seeYouSoon: { en: 'see you soon!', nl: 'tot snel!' },
  viewMyRentals: { en: 'view my rentals', nl: 'view my rentals' },
  viewMyReservations: { en: 'view my reservations', nl: 'bekijk mijn reserveringen' },
  continueShopping: { en: 'continue shopping', nl: 'verder winkelen' },
} as const

function lp(path: string) {
  return (isNL.value ? '/nl' : '') + path
}

const heading = computed(() =>
  isRental.value
    ? (isNL.value ? T.shipmentConfirmed.nl : T.shipmentConfirmed.en)
    : (isNL.value ? T.reservationConfirmed.nl : T.reservationConfirmed.en),
)

const message = computed(() =>
  isRental.value
    ? (isNL.value ? T.rentalMessage.nl : T.rentalMessage.en)
    : (isNL.value ? T.pickupMessage.nl : T.pickupMessage.en),
)

const idLabel = computed(() =>
  isRental.value
    ? (isNL.value ? T.shipmentId.nl : T.shipmentId.en)
    : (isNL.value ? T.reservationId.nl : T.reservationId.en),
)
const subtext = computed(() =>
  isRental.value
    ? (isNL.value ? T.happyBorrowing.nl : T.happyBorrowing.en)
    : (isNL.value ? T.seeYouSoon.nl : T.seeYouSoon.en),
)
const viewLinkText = computed(() =>
  isRental.value
    ? (isNL.value ? T.viewMyRentals.nl : T.viewMyRentals.en)
    : (isNL.value ? T.viewMyReservations.nl : T.viewMyReservations.en),
)
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
        <button class="btn-primary" @click="close">{{ isNL ? T.continueShopping.nl : T.continueShopping.en }}</button>
        <a :href="viewLinkHref" class="btn-secondary" @click="close">{{ viewLinkText }}</a>
      </div>
    </div>
  </div>
</template>
