// Onboarding modal globals — one-to-one port of the window.* API from
// old/demat-webflow-test/site-wide-footer.js (onboarding IIFE) so already-ported
// code (e.g. the auth.js checkUserStatus trigger) can keep calling them.
// The modal UI itself is components/OnboardingModal.vue, which shares the
// 'onboarding-modal-open' / 'onboarding-current-step' state and registers the
// step/submit/address globals on mount.
export default defineNuxtPlugin(() => {
  const isOpen = useState('onboarding-modal-open', () => false)
  const currentStep = useState('onboarding-current-step', () => 1)

  const w = window as any

  w.openOnboardingModal = function () {
    currentStep.value = 1
    isOpen.value = true
  }

  w.closeOnboardingModal = function () {
    isOpen.value = false
  }

  w.showOnboardingModal = w.openOnboardingModal

  w.skipOnboarding = function () {
    sessionStorage.setItem('onboarding_modal_dismissed', 'true')
    w.closeOnboardingModal()
  }

  w.testOnboardingModal = function () {
    if (w.openOnboardingModal) {
      w.openOnboardingModal()
    } else {
      console.error('Onboarding modal not initialized')
    }
  }
})
