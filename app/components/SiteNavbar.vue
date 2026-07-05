<script setup lang="ts">
const switchLocalePath = useSwitchLocalePath()

const desktopLangOpen = ref(false)
const mobileLangOpen = ref(false)
const accountOpen = ref(false)

const desktopLangRef = ref<HTMLElement | null>(null)
const mobileLangRef = ref<HTMLElement | null>(null)
const accountRef = ref<HTMLElement | null>(null)
const purchaseCartNavRef = ref<HTMLElement | null>(null)

const { isAuthenticated, user, firstName, hasActiveMembership, openAuthModal, logout } = useAuth()

const displayName = computed(() => firstName.value || user.value?.name || user.value?.email || 'User')

function togglePurchaseCartDropdown() {
  ;(window as any).PurchaseCart?.toggleCartDropdown()
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (desktopLangRef.value && !desktopLangRef.value.contains(target)) desktopLangOpen.value = false
  if (mobileLangRef.value && !mobileLangRef.value.contains(target)) mobileLangOpen.value = false
  if (accountRef.value && !accountRef.value.contains(target)) accountOpen.value = false
}

let cartObserver: MutationObserver | null = null

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  // Keeps the .code-embed-37 wrapper's visibility in sync with #purchase-cart-nav,
  // whose inline display the Phase 4 cart code toggles.
  const nav = purchaseCartNavRef.value
  if (nav && nav.parentElement) {
    const wrapper = nav.parentElement
    wrapper.style.margin = '0'
    wrapper.style.padding = '0'
    wrapper.style.display = 'none'
    cartObserver = new MutationObserver(() => {
      const isVisible = nav.style.display !== 'none'
      wrapper.style.display = isVisible ? 'inline-flex' : 'none'
    })
    cartObserver.observe(nav, { attributes: true, attributeFilter: ['style'] })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  cartObserver?.disconnect()
  cartObserver = null
})
</script>

<template>
  <div class="navbar-desktop">
    <div class="code-embed-26 w-embed w-script"></div>
    <div class="div-navbar-wrapper desktop-nav">
      <div class="div-upper-nav-wrapper">
        <div class="language-selector-wrapper">
          <div class="locales-wrapper w-locales-list">
            <div ref="desktopLangRef" data-hover="false" data-delay="0" class="w-dropdown">
              <div class="dropdown-toggle-6 w-dropdown-toggle" :class="{ 'w--open': desktopLangOpen }" @click="desktopLangOpen = !desktopLangOpen">
                <div class="div-lang-wrapper">
                  <div class="icon-lang-18px desktop w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe-icon lucide-globe">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                      <path d="M2 12h20"></path>
                    </svg></div>
                  <div class="icon-lang-18px mobile w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages-icon lucide-languages">
                      <path d="m5 8 6 6"></path>
                      <path d="m4 14 6-6 2-3"></path>
                      <path d="M2 5h12"></path>
                      <path d="M7 2h1"></path>
                      <path d="m22 22-5-10-5 10"></path>
                      <path d="M14 18h6"></path>
                    </svg></div>
                  <div class="navbar-text"><span class="lang-nl">Dutch</span></div>
                </div>
              </div>
              <nav class="dropdown-list-4 w-dropdown-list" :class="{ 'w--open': desktopLangOpen }">
                <div role="list" class="locales-list w-locales-items">
                  <div role="listitem" class="locale w-locales-item">
                    <a hreflang="en" :href="switchLocalePath('en')" class="locale-link">en</a>
                  </div>
                  <div role="listitem" class="locale w-locales-item">
                    <a hreflang="nl" :href="switchLocalePath('nl')" class="locale-link">nl</a>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
        <a href="/" aria-current="page" class="home-link-nav w--current">dematerialized</a>
        <div class="div-right-nav-links">
          <div data-auth="logged-out" class="div-container-user-account"></div>
          <div class="auth0-btn sign-in w-embed" data-auth-gate v-show="!isAuthenticated">
            <button data-auth="logged-out" @click="openAuthModal" style="
    background-color: transparent;
    padding: 0;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  " onmouseover="this.querySelector('svg').style.opacity='0.6'" onmouseout="this.querySelector('svg').style.opacity='1'">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-icon lucide-user-round" style="display: block;">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21a8 8 0 0 0-16 0"></path>
              </svg>
            </button>
          </div>
          <div ref="accountRef" data-auth="logged-in" class="div-container-user-account" data-auth-gate v-show="isAuthenticated">
            <div class="desktop-nav-icons user-account w-embed" @click="accountOpen = !accountOpen"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-icon lucide-user-round" style="min-width: 22px; min-height: 22px; flex-shrink: 0;">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21a8 8 0 0 0-16 0"></path>
              </svg></div>
            <div class="div-user-account-nav logged-in" :style="accountOpen ? { display: 'flex' } : undefined">
              <div class="div-account-nav-wrapper">
                <div class="div-user-greeting div-block-67">
                  <div class="text-user-greeting"><span class="lang-en">hi </span><span class="lang-nl">hoi </span></div>
                  <div data-auth="user-name" class="text-user-greeting">{{ displayName }}</div>
                </div>
                <div class="div-spacer-account-nav"></div>
                <div class="div-account-menu-options">
                  <a href="/profile" class="link-account-menu-option"><span class="lang-en">profile</span><span class="lang-nl">profiel</span></a>
                  <a href="/my-rentals" class="link-account-menu-option"><span class="lang-en">rentals</span><span class="lang-nl">verhuur</span></a>
                  <a href="/reservations" class="link-account-menu-option"><span class="lang-en">reservations</span><span class="lang-nl">reserveringen</span></a>
                  <a href="/donations-credits" class="link-account-menu-option"><span class="lang-en">donations &amp; credits</span><span class="lang-nl">donaties &amp; tegoeden</span></a>
                  <a href="/purchases" class="link-account-menu-option"><span class="lang-en">purchases</span><span class="lang-nl">aankopen</span></a>
                  <a href="/my-membership" class="link-account-menu-option"><span class="lang-en">membership</span><span class="lang-nl">lidmaatschap</span></a>
                </div>
                <div class="div-spacer-account-nav"></div>
                <div class="auth0-btn sign-out w-embed">
                  <button data-auth="logged-out" @click="openAuthModal" style="
    color: #fff;
    letter-spacing: 0.3px;
    text-transform: lowercase;
    background-color: #4b073f;
    padding: 10px 20px;
    font-family: 'Urbanist', sans-serif;
    font-size: 18px;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
    display: none;
    width: 100%;
  " onmouseover="this.style.backgroundColor='#3a0630'" onmouseout="this.style.backgroundColor='#4b073f'">
                    sign in
                  </button>
                  <button data-auth="logged-in" data-auth-action="logout" @click="logout" style="
    color: #4b073f;
    letter-spacing: 0.3px;
    text-transform: lowercase;
    background-color: #fff;
    padding: 10px 20px;
    font-family: 'Urbanist', sans-serif;
    font-size: 18px;
    font-weight: 600;
    border: 2px solid #4b073f;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
    display: none;
    width: 100%;
  " onmouseover="this.style.backgroundColor='#fff4fe'" onmouseout="this.style.backgroundColor='#fff'">
                    sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
          <a href="/wish-list" class="link-block-nav-icon w-inline-block">
            <div class="desktop-nav-icons w-embed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
                <path fill="#24282d" d="M378.9 80c-27.3 0-53 13.1-69 35.2l-34.4 47.6c-4.5 6.2-11.7 9.9-19.4 9.9s-14.9-3.7-19.4-9.9l-34.4-47.6c-16-22.1-41.7-35.2-69-35.2-47 0-85.1 38.1-85.1 85.1 0 49.9 32 98.4 68.1 142.3 41.1 50 91.4 94 125.9 120.3 3.2 2.4 7.9 4.2 14 4.2s10.8-1.8 14-4.2c34.5-26.3 84.8-70.4 125.9-120.3 36.2-43.9 68.1-92.4 68.1-142.3 0-47-38.1-85.1-85.1-85.1zM271 87.1c25-34.6 65.2-55.1 107.9-55.1 73.5 0 133.1 59.6 133.1 133.1 0 68.6-42.9 128.9-79.1 172.8-44.1 53.6-97.3 100.1-133.8 127.9-12.3 9.4-27.5 14.1-43.1 14.1s-30.8-4.7-43.1-14.1C176.4 438 123.2 391.5 79.1 338 42.9 294.1 0 233.7 0 165.1 0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1l15 20.7 15-20.7z"></path>
              </svg></div>
          </a>
          <div class="code-embed-37 w-embed w-script">
            <div id="purchase-cart-nav" ref="purchaseCartNavRef" class="purchase-cart-nav" style="display: none; align-items: center;">
              <button class="purchase-cart-toggle" @click="togglePurchaseCartDropdown" aria-label="Shopping cart">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span id="purchase-cart-badge" class="purchase-cart-badge" style="display: none;">0</span>
              </button>
            </div>
          </div>
          <div data-cart-trigger="" class="link-block-nav-icon hidden user">
            <div class="desktop-nav-icons w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag-icon lucide-shopping-bag">
                <path d="M16 10a4 4 0 0 1-8 0"></path>
                <path d="M3.103 6.034h17.794"></path>
                <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path>
              </svg></div>
            <div class="code-embed-29 w-embed">
              <span data-cart-count="" style="
    position: absolute;
    top: -6px;
    right: -6px;
    background-color: #4b073f;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    font-family: 'Urbanist', sans-serif;
    min-width: 18px;
    height: 18px;
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  ">0</span>
            </div>
          </div>
          <div class="code-embed-38 w-embed w-script" data-auth-gate>
            <!-- v-show (not :class) — class bindings that differ from SSR are not patched during hydration -->
            <div id="join-now-container" v-show="!hasActiveMembership">
              <a href="/memberships" class="join-now-btn" id="join-now-btn">join now</a>
            </div>
          </div>
          <a v-show="!hasActiveMembership" href="/memberships" class="button-navbar w-button" data-auth-gate><span class="lang-en">Join now</span><span class="lang-nl">Meld je nu aan</span></a>
        </div>
      </div>
      <div class="div-nav-links-wrapper desktop-nav">
        <a href="/clothing" class="navbar-links"><span class="lang-en">browse all</span><span class="lang-nl">alles bekijken</span></a>
        <a href="/clothing" class="navbar-links"><span class="lang-en">new in</span><span class="lang-nl">Nieuw binnen</span></a>
        <a href="/clothing?page=1&amp;categories=Jeans&amp;categories=Knitwear&amp;categories=Tops" class="navbar-links"><span class="lang-en">everyday</span><span class="lang-nl">dagelijks</span></a>
        <a href="/clothing?page=1&amp;categories=Blazers&amp;categories=Pants" class="navbar-links">workwear</a>
        <a href="/clothing?page=1&amp;categories=Blazers&amp;categories=Dresses&amp;categories=Jeans&amp;categories=Pants&amp;categories=Skirts&amp;categories=Tops&amp;colors=gray&amp;colors=green&amp;colors=iridescent&amp;colors=multicolor&amp;colors=off-white&amp;colors=olive+green&amp;colors=red&amp;colors=white" class="navbar-links">date night</a>
        <a href="/clothing?page=1&amp;categories=Dresses&amp;categories=Jumpsuits&amp;categories=Sets&amp;categories=Tops" class="navbar-links">summer vibes</a>
        <a href="/also-this" class="navbar-links"><span class="lang-en">also this...</span><span class="lang-nl">ook dit...</span></a>
        <a href="#" class="navbar-links hidden bags"><span class="lang-en">bags</span><span class="lang-nl">tassen</span></a>
        <a href="/how-it-works" class="navbar-links dark-pink"><span class="lang-en">How it works</span><span class="lang-nl">Hoe het werkt</span></a>
        <a data-sort="new" href="/memberships" class="navbar-links hidden pink"><span class="lang-en">join now</span><span class="lang-nl">Lid worden</span></a>
      </div>
      <div class="w-embed"></div>
    </div>
  </div>
  <div data-animation="default" data-collapse="medium" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" class="top-navbar-mobile w-nav">
    <div class="top-navbar-mobile-wrapper w-container">
      <div class="div-navbar-links">
        <div class="language-selector-wrapper">
          <div class="locales-wrapper w-locales-list">
            <div ref="mobileLangRef" data-hover="false" data-delay="0" class="w-dropdown">
              <div class="dropdown-toggle-6 w-dropdown-toggle" :class="{ 'w--open': mobileLangOpen }" @click="mobileLangOpen = !mobileLangOpen">
                <div class="div-lang-wrapper">
                  <div class="icon-lang-18px desktop w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe-icon lucide-globe">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                      <path d="M2 12h20"></path>
                    </svg></div>
                  <div class="icon-lang-18px mobile w-embed"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages-icon lucide-languages">
                      <path d="m5 8 6 6"></path>
                      <path d="m4 14 6-6 2-3"></path>
                      <path d="M2 5h12"></path>
                      <path d="M7 2h1"></path>
                      <path d="m22 22-5-10-5 10"></path>
                      <path d="M14 18h6"></path>
                    </svg></div>
                  <div class="navbar-text"><span class="lang-nl">Dutch</span></div>
                </div>
              </div>
              <nav class="dropdown-list-4 w-dropdown-list" :class="{ 'w--open': mobileLangOpen }">
                <div role="list" class="locales-list w-locales-items">
                  <div role="listitem" class="locale w-locales-item">
                    <a hreflang="en" :href="switchLocalePath('en')" class="locale-link">en</a>
                  </div>
                  <div role="listitem" class="locale w-locales-item">
                    <a hreflang="nl" :href="switchLocalePath('nl')" class="locale-link">nl</a>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
        <a href="/" aria-current="page" class="home-link-mobile-nav w-inline-block w--current">
          <div class="brand-text-top-nav">dematerialized</div>
        </a>
        <div data-cart-trigger="" class="link-block-nav-icon hidden user">
          <div class="div-position-cart-icons">
            <div class="code-embed-39 w-embed">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div data-cart-trigger="" style="position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                    <path d="M3.103 6.034h17.794"></path>
                    <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path>
                  </svg>
                  <span data-cart-count="" style="position: absolute; top: -6px; right: -6px; background-color: #a92296; color: #fff; font-size: 10px; font-weight: 500; font-family: 'Urbanist', sans-serif; min-width: 16px; height: 16px; border-radius: 50%; display: none; align-items: center; justify-content: center; padding: 0 4px;">0</span>
                </div>
                <div class="purchase-cart-nav" data-purchase-cart="" style="display: none; align-items: center;">
                  <button class="purchase-cart-toggle" @click="togglePurchaseCartDropdown" aria-label="Shopping cart" style="position: relative; background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#24282d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span class="purchase-cart-badge" style="position: absolute; top: -6px; right: -6px; background-color: #a92296; color: #fff; font-size: 10px; font-weight: 500; font-family: 'Urbanist', sans-serif; min-width: 16px; height: 16px; border-radius: 50%; display: none; align-items: center; justify-content: center; padding: 0 4px;">0</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  #join-now-container {
    display: block;
  }
  .join-now-btn {
    display: inline-block;
    padding: 10px 20px;
    background: #4b073f;
    color: white;
    text-decoration: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.2s ease;
  }
  .join-now-btn:hover {
    background: #3a052f;
    color: white;
  }
  #join-now-container.has-membership {
    display: none;
  }
  .div-nav-links-wrapper {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    max-width: 100% !important;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .div-nav-links-wrapper::-webkit-scrollbar {
    display: none;
  }
  .div-nav-links-wrapper .navbar-links {
    flex-shrink: 0 !important;
    white-space: nowrap !important;
  }
</style>
