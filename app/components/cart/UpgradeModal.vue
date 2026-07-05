<script setup lang="ts">
// Premium upgrade modal — markup ported verbatim from components.js.
const ui = useReservationCartUi()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const isOpen = computed(() => ui.upgradeModalOpen.value)

function lp(path: string) {
  return (isNL.value ? '/nl' : '') + path
}

function close() {
  ;(window as any).closeUpgradeModal?.()
}
</script>

<template>
  <div>
    <!-- Premium Upgrade Modal -->
    <div id="upgrade-modal-backdrop" class="modal-backdrop" :style="{ display: isOpen ? 'block' : 'none' }" @click="close"></div>
    <div id="upgrade-modal" class="modal-container modal-centered" :style="{ display: isOpen ? 'block' : 'none' }">
      <div class="modal-header">
        <span class="modal-title">premium feature</span>
        <button class="modal-close" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body text-center">
        <div class="modal-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h3 class="modal-heading">upgrade to premium</h3>
        <p class="modal-text">online reservations are available exclusively for premium members. upgrade your membership to reserve items online and try them on in-store.</p>
        <div class="benefits-box">
          <div class="benefits-title">premium benefits include:</div>
          <ul class="benefits-list">
            <li>rent up to 5 items at a time</li>
            <li>access the full collection (in-store / online)</li>
            <li>reserve items online to try in-store</li>
          </ul>
        </div>
      </div>
      <div class="modal-footer">
        <a :href="lp('/memberships')" class="btn-primary" @click="close">view membership options</a>
        <button class="btn-secondary" @click="close">maybe later</button>
      </div>
    </div>
  </div>
</template>
