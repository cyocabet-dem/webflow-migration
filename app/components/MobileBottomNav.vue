<script setup lang="ts">
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>`,
  shop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 10a4 4 0 0 1-8 0"/>
      <path d="M3.103 6.034h17.794"/>
      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>
    </svg>`,
  how: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>`,
  join: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>`,
  faq: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>`,
  wishlist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="5"/>
      <path d="M20 21a8 8 0 0 0-16 0"/>
    </svg>`,
} as const

interface NavItem {
  id: string
  label: string
  href: string
  icon: keyof typeof ICONS
  action?: string
}

type UserState = 'guest' | 'member_inactive' | 'member_active'

const NAV_CONFIGS: Record<UserState, NavItem[]> = {
  // State 1: Not logged in
  guest: [
    { id: 'home', label: 'home', href: '/', icon: 'home' },
    { id: 'shop', label: 'shop', href: '/clothing', icon: 'shop' },
    { id: 'how', label: 'how it works', href: '/how-it-works', icon: 'how' },
    { id: 'join', label: 'join', href: '/memberships', icon: 'join' },
    { id: 'account', label: 'log in', href: '#', icon: 'user', action: 'login' },
  ],
  // State 2: Logged in, no active membership
  member_inactive: [
    { id: 'home', label: 'home', href: '/', icon: 'home' },
    { id: 'shop', label: 'shop', href: '/clothing', icon: 'shop' },
    { id: 'wishlist', label: 'wishlist', href: '/wish-list', icon: 'wishlist' },
    { id: 'join', label: 'join', href: '/memberships', icon: 'join' },
    { id: 'account', label: 'account', href: '/account', icon: 'user' },
  ],
  // State 3: Active member (has Stripe subscription)
  member_active: [
    { id: 'home', label: 'home', href: '/', icon: 'home' },
    { id: 'shop', label: 'shop', href: '/clothing', icon: 'shop' },
    { id: 'wishlist', label: 'wish list', href: '/wish-list', icon: 'wishlist' },
    { id: 'faq', label: 'faq', href: '/faq', icon: 'faq' },
    { id: 'account', label: 'account', href: '/account', icon: 'user' },
  ],
}

// Guest nav is the default visible state; Phase 4 auth wiring switches this
// to 'member_inactive' / 'member_active' (Stripe subscription check).
const { isAuthenticated, hasActiveMembership, openAuthModal } = useAuth()

const userState = computed<UserState>(() => {
  if (!isAuthenticated.value) return 'guest'
  return hasActiveMembership.value ? 'member_active' : 'member_inactive'
})

function onNavAction(item: NavItem) {
  if (item.action === 'login') openAuthModal()
}

const items = computed(() => NAV_CONFIGS[userState.value] || NAV_CONFIGS.guest)

const route = useRoute()
const activePath = computed(() => route.path.replace(/\/$/, '') || '/')

function isActive(item: NavItem): boolean {
  return (
    activePath.value === item.href ||
    (item.href !== '/' && activePath.value.startsWith(item.href))
  )
}
</script>

<template>
  <nav id="mobile-bottom-nav" class="mobile-bottom-nav" data-auth-gate>
    <div class="mobile-nav-inner">
      <component
        :is="item.action ? 'button' : 'a'"
        v-for="item in items"
        :key="item.id"
        class="mobile-nav-item"
        :class="{ 'is-active': isActive(item) }"
        :href="item.action ? undefined : item.href"
        :data-nav-action="item.action || undefined"
        :aria-label="item.label"
        @click="item.action ? onNavAction(item) : undefined"
      >
        <span class="mobile-nav-icon" v-html="ICONS[item.icon]"></span>
        <span class="mobile-nav-label">{{ item.label }}</span>
      </component>
    </div>
  </nav>
</template>

<style>
  /* ============================================
     MOBILE BOTTOM NAV STYLES
     ============================================ */
  .mobile-bottom-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9990;
    padding: 0 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px;
    font-family: 'Urbanist', sans-serif;
    pointer-events: none;
  }
  .mobile-nav-inner {
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    max-width: 420px;
    margin: 0 auto;
    padding: 10px 12px 8px;
    background: rgba(255, 255, 255, 0.92);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    border-radius: 24px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
    pointer-events: auto;
  }
  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 6px 6px 4px;
    min-width: 56px;
    text-decoration: none;
    color: #24282d;
    cursor: pointer;
    border: none;
    background: none;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.2s ease, transform 0.15s ease;
    position: relative;
  }
  .mobile-nav-item:hover,
  .mobile-nav-item:focus {
    color: #e84dd8;
    outline: none;
  }
  .mobile-nav-item:active {
    transform: scale(0.92);
  }
  .mobile-nav-item.is-active {
    color: #e84dd8;
  }
  .mobile-nav-icon {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mobile-nav-icon svg {
    width: 26px;
    height: 26px;
  }
  .mobile-nav-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: 1;
    white-space: nowrap;
  }
  /* Show only on mobile */
  @media (max-width: 767px) {
    .mobile-bottom-nav {
      display: block;
    }
    body {
      padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    }
  }
  /* Hide on desktop/tablet */
  @media (min-width: 768px) {
    .mobile-bottom-nav {
      display: none !important;
    }
  }
</style>
