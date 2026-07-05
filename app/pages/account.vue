<script setup lang="ts">
useHead({
  title: 'Account',
  meta: [
    { property: 'og:title', content: 'Account' },
    { name: 'twitter:title', content: 'Account' },
    { name: 'robots', content: 'noindex' },
  ],
})

const localePath = useLocalePath()

// Guest is the default state until Auth0 arrives in Phase 4.
const isAuthenticated = ref(false)

function openAuthModal() {
  // TODO Phase 4: wire Auth0 — old code called window.openAuthModal() from auth.js.
  const w = window as any
  if (typeof w.openAuthModal === 'function') w.openAuthModal()
}

function logout() {
  // TODO Phase 4: wire Auth0 — old auth.js handled [data-auth-action="logout"].
  const w = window as any
  if (w.auth0Client) w.auth0Client.logout({ logoutParams: { returnTo: window.location.origin } })
}

function signInMouseover(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#f6f8f9'
  el.style.color = '#04314d'
}

function signInMouseout(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#04314d'
  el.style.color = '#f6f8f9'
}

function signOutMouseover(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#04314d'
  el.style.color = '#f6f8f9'
}

function signOutMouseout(e: Event) {
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = '#f6f8f9'
  el.style.color = '#04314d'
}

function isMobileViewport() {
  return window.innerWidth <= 767
}

function onResize() {
  if (!isMobileViewport()) {
    navigateTo(localePath('/profile'))
  }
}

onMounted(() => {
  document.body.classList.add('checking-screen-size')
  if (!isMobileViewport()) {
    navigateTo(localePath('/profile'))
  } else {
    document.body.classList.remove('checking-screen-size')
  }
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  document.body.classList.remove('checking-screen-size')
})
</script>

<template>
  <div class="div-center-greeting-account">
    <div class="div-heading-wrapper-account">
      <div class="mobile-heading-account">welcome back!</div><img src="/images/logo-sticker.webp" loading="lazy" sizes="(max-width: 5000px) 100vw, 5000px" srcset="/images/logo-sticker-p-500.webp 500w, /images/logo-sticker-p-800.webp 800w, /images/logo-sticker-p-1080.webp 1080w, /images/logo-sticker-p-1600.webp 1600w, /images/logo-sticker-p-2000.webp 2000w, /images/logo-sticker-p-2600.webp 2600w, /images/logo-sticker-p-3200.webp 3200w, /images/logo-sticker.webp 5000w" alt="" class="image-20"><img src="/images/cat-on-back_1.png" loading="lazy" sizes="(max-width: 2042px) 100vw, 2042px" srcset="/images/cat-on-back_1-p-500.png 500w, /images/cat-on-back_1-p-800.png 800w, /images/cat-on-back_1-p-1080.png 1080w, /images/cat-on-back_1-p-1600.png 1600w, /images/cat-on-back_1-p-2000.png 2000w, /images/cat-on-back_1.png 2042w" alt="" class="image-21">
    </div>
  </div>
  <div class="w-layout-blockcontainer mobile-container-account w-container">
    <div class="div-content-wrapper-account">
      <div class="div-wrapper-account main-links">
        <a href="/profile" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">profile</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/my-rentals" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">my rentals</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/reservations" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">reservations</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/donations-credits" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">donations &amp; credits</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/purchases" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">purchases</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/my-membership" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">membership</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
      </div>
      <a href="/contact-us" class="div-wrapper-account contact-block w-inline-block">
        <div class="div-content-left-account">
          <div class="icon-support-mobile w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles-icon lucide-sparkles">
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
              <path d="M20 2v4"></path>
              <path d="M22 4h-4"></path>
              <circle cx="4" cy="20" r="2"></circle>
            </svg></div>
          <div class="div-icon-text-account">
            <div class="support-block-heading">Looking for something?</div>
            <div class="paragraph-account">We&#x27;re here to help</div>
          </div>
        </div>
        <div class="div-icon-right-account">
          <div class="code-embed-33 w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </div>
      </a>
      <div class="div-wrapper-account main-links">
        <a href="/faq" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">FAQ</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/contact-us" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">contact us</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
        <a href="/terms-and-conditions" class="div-link-wrapper-account w-inline-block">
          <div class="link-text-account-mobile">legal &amp; privacy</div>
          <div class="chevron-right-mobile-account w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg></div>
        </a>
      </div>
      <div class="auth0-btn sign-out w-embed">
        <button data-auth="logged-out" style="
    color: #f6f8f9;
    letter-spacing: 1px;
    text-transform: lowercase;
    background-color: #04314d;
    padding: 12px 16px;
    font-family: 'Urbanist', sans-serif;
    font-size: 16px;
    font-weight: 300;
    border: .5px solid #04314d;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
    display: none;
    width: 100%;
  " :style="{ display: isAuthenticated ? 'none' : 'block' }" @click="openAuthModal" @mouseover="signInMouseover" @mouseout="signInMouseout">
          sign in
        </button>
        <button data-auth="logged-in" data-auth-action="logout" style="
    color: #24282d;
    letter-spacing: 1px;
    text-transform: lowercase;
    background-color: #f6f8f9;
    padding: 12px 16px;
    font-family: 'Urbanist', sans-serif;
    font-size: 18px;
    font-weight: 600;
    border: 1px solid #a92296;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
    display: none;
    width: 100%;
  " :style="{ display: isAuthenticated ? 'block' : 'none' }" @click="logout" @mouseover="signOutMouseover" @mouseout="signOutMouseout">
          sign out
        </button>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>

<style>
/* Hide account page initially on non-mobile */
body.checking-screen-size {
  opacity: 0;
}
</style>
