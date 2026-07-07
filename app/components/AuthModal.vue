<script setup lang="ts">
// Markup ported verbatim from the code-embed-26 injected modal; styles live in the
// global embed stylesheet (.auth-modal-*). Behavior per site-wide-footer.js: overlay
// click + × + Escape close; sign in → loginWithRedirect; create account → screen_hint signup.
const { authModalOpen, closeAuthModal, login, signup } = useAuth()
const { locale } = useI18n()
const isNL = computed(() => locale.value.startsWith('nl'))

const T = {
  welcome: { en: 'welcome', nl: 'welkom' },
  subtitle: { en: 'sign in to access your account or create a new one.', nl: 'log in voor toegang tot je account of maak een nieuwe aan.' },
  closeModal: { en: 'Close modal', nl: 'Venster sluiten' },
  signIn: { en: 'sign in', nl: 'inloggen' },
  or: { en: 'or', nl: 'of' },
  createAccount: { en: 'create account', nl: 'account aanmaken' },
  infoPre: { en: 'by continuing, you agree to our ', nl: 'door verder te gaan, ga je akkoord met onze ' },
  terms: { en: 'terms & conditions', nl: 'algemene voorwaarden' },
  infoAnd: { en: ' and ', nl: ' en ' },
  privacy: { en: 'privacy policy', nl: 'privacybeleid' },
} as const

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).id === 'authModal') closeAuthModal()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && authModalOpen.value) closeAuthModal()
}

watch(authModalOpen, (open) => {
  document.body.classList.toggle('auth-modal-open', open)
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('auth-modal-open')
})
</script>

<template>
  <div class="auth-modal-overlay" :class="{ 'is-visible': authModalOpen }" id="authModal" @click="onOverlayClick">
    <div class="auth-modal-container">
      <div class="auth-modal-header">
        <h2 class="auth-modal-title">{{ isNL ? T.welcome.nl : T.welcome.en }}</h2>
        <p class="auth-modal-subtitle">{{ isNL ? T.subtitle.nl : T.subtitle.en }}</p>
        <button class="auth-modal-close" :aria-label="isNL ? T.closeModal.nl : T.closeModal.en" @click="closeAuthModal">×</button>
      </div>
      <div class="auth-modal-body">
        <div class="auth-buttons-container">
          <button class="auth-button-primary" data-auth-action="login" id="modal-login-btn" @click="login">
            {{ isNL ? T.signIn.nl : T.signIn.en }}
          </button>
          <div class="auth-divider">{{ isNL ? T.or.nl : T.or.en }}</div>
          <button class="auth-button-secondary" data-auth-action="signup" id="modal-signup-btn" @click="signup">
            {{ isNL ? T.createAccount.nl : T.createAccount.en }}
          </button>
        </div>
        <p class="auth-info-text">
          {{ isNL ? T.infoPre.nl : T.infoPre.en }}<a href="/terms-and-conditions">{{ isNL ? T.terms.nl : T.terms.en }}</a>{{ isNL ? T.infoAnd.nl : T.infoAnd.en }}<a href="/privacy-policy">{{ isNL ? T.privacy.nl : T.privacy.en }}</a>
        </p>
      </div>
    </div>
  </div>
</template>
