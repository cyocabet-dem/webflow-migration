<script setup lang="ts">
// Markup ported verbatim from the code-embed-26 injected modal; styles live in the
// global embed stylesheet (.auth-modal-*). Behavior per site-wide-footer.js: overlay
// click + × + Escape close; sign in → loginWithRedirect; create account → screen_hint signup.
const { authModalOpen, closeAuthModal, login, signup } = useAuth()

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
        <h2 class="auth-modal-title">welcome</h2>
        <p class="auth-modal-subtitle">sign in to access your account or create a new one.</p>
        <button class="auth-modal-close" aria-label="Close modal" @click="closeAuthModal">×</button>
      </div>
      <div class="auth-modal-body">
        <div class="auth-buttons-container">
          <button class="auth-button-primary" data-auth-action="login" id="modal-login-btn" @click="login">
            sign in
          </button>
          <div class="auth-divider">or</div>
          <button class="auth-button-secondary" data-auth-action="signup" id="modal-signup-btn" @click="signup">
            create account
          </button>
        </div>
        <p class="auth-info-text">
          by continuing, you agree to our <a href="/terms-and-conditions">terms &amp; conditions</a> and <a href="/privacy-policy">privacy policy</a>
        </p>
      </div>
    </div>
  </div>
</template>
