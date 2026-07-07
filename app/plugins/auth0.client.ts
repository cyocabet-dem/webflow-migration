// Auth0 SPA client — one-to-one port of demat-webflow auth.js:
// same config (localstorage cache, refresh tokens, API audience), same redirect-callback
// handling with auth_return_path, same post-login no-membership → /memberships redirect,
// and the same window globals the ported pages consume (auth0Client, openAuthModal, …).
//
// In the Capacitor apps (MOBILE.md) the redirect flow runs through the in-app system
// browser with a custom-scheme callback (Auth0's Capacitor pattern) — the WebView never
// navigates away, so the callback arrives via the appUrlOpen deep-link listener below.
import { createAuth0Client } from '@auth0/auth0-spa-js'
import type { BackendUser } from '~/composables/useAuth'
import {
  NATIVE_APP_ID,
  auth0NativeCallbackUri,
  closeInAppBrowser,
  isNativeApp,
} from '~/composables/useNativeApp'

export default defineNuxtPlugin(async () => {
  const cfg = useRuntimeConfig().public
  const {
    authReady,
    isAuthenticated,
    user,
    userData,
    openAuthModal,
    closeAuthModal,
    refreshUserData,
  } = useAuth()

  // Dev-only mock session (pairs with scratchpad run_local_backend.py, which bypasses
  // the backend token check). Guarded by runtime config that is never set in production.
  if (cfg.devMockAuth && import.meta.dev) {
    const mockClient = {
      isAuthenticated: async () => true,
      getTokenSilently: async () => 'dev-mock-token',
      getUser: async () => ({ name: 'Dev User', email: 'dev@localhost' }),
      loginWithRedirect: async () => {},
      loginWithPopup: async () => {},
      logout: async () => {
        window.location.href = '/'
      },
      handleRedirectCallback: async () => {},
    }
    const wm = window as any
    wm.auth0Client = mockClient
    wm.openAuthModal = openAuthModal
    wm.closeAuthModal = closeAuthModal
    isAuthenticated.value = true
    user.value = (await mockClient.getUser()) as any
    try {
      await refreshUserData()
    } finally {
      authReady.value = true
      document.documentElement.classList.remove('auth-pending')
    }
    console.warn('[auth] DEV MOCK AUTH active — all requests impersonate the local-backend user')
    return
  }

  const native = isNativeApp()
  let client
  try {
    client = await createAuth0Client({
      domain: cfg.auth0Domain,
      clientId: cfg.auth0ClientId,
      authorizationParams: {
        redirect_uri: native
          ? auth0NativeCallbackUri(cfg.auth0Domain)
          : window.location.origin + '/',
        // Audience is the API identifier — same value for test and live, per auth.js.
        audience: 'https://api.dematerialized.nl/',
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    })
  } catch (error) {
    console.error('Auth0 initialization error:', error)
    authReady.value = true
    document.documentElement.classList.remove('auth-pending')
    return
  }

  const w = window as any
  w.auth0Client = client
  w.openAuthModal = openAuthModal
  w.closeAuthModal = closeAuthModal

  // auth.js checkUserStatus(): members (stripe_id) with an incomplete profile get the
  // onboarding modal 500ms after load, except on these pages and once dismissed.
  function maybeShowOnboardingModal(data: BackendUser | null) {
    const skipPages = ['/onboarding', '/complete-your-profile', '/profile', '/memberships', '/error-membership-signup']
    if (skipPages.includes(window.location.pathname)) return
    const hasActiveMembership = !!data?.stripe_id
    const hasCompletedProfile = data?.provided_information
    const modalDismissed = sessionStorage.getItem('onboarding_modal_dismissed') === 'true'
    if (hasActiveMembership && !hasCompletedProfile && !modalDismissed) {
      setTimeout(() => {
        w.openOnboardingModal?.()
      }, 500)
    }
  }

  // Native apps: the Auth0 redirect arrives as a custom-scheme deep link while the
  // WebView stays on the page the user was on — no page load, so the query-string
  // handling below never sees it. Logout returns use the same URI (no code/state)
  // and only need the in-app browser dismissed.
  if (native) {
    const router = useRouter()
    const { App } = await import('@capacitor/app')
    const handleNativeAuthUrl = async (url: string) => {
      try {
        if (url.includes('state=') && (url.includes('code=') || url.includes('error='))) {
          await client.handleRedirectCallback(url)
          sessionStorage.removeItem('auth_return_path')
          isAuthenticated.value = await client.isAuthenticated()
          if (isAuthenticated.value) {
            // On web the redirect reloads the page, which implicitly dismisses
            // the auth modal — natively nothing reloads, so dismiss it here.
            closeAuthModal()
            user.value = (await client.getUser()) ?? null
            const data = await refreshUserData()
            // Same post-login rule as the web flow: no membership → /memberships.
            if (data && !data.stripe_id) await router.push('/memberships')
            else maybeShowOnboardingModal(data)
          }
        }
      } catch (error) {
        console.error('Auth0 native callback error:', error)
      } finally {
        await closeInAppBrowser()
      }
    }
    void App.addListener('appUrlOpen', ({ url }) => {
      if (!url.startsWith(`${NATIVE_APP_ID}://`)) return
      void handleNativeAuthUrl(url)
    })
    // Cold start via the callback URL (process was killed mid-login): appUrlOpen
    // never fires for the launching intent, so check the launch URL explicitly.
    // The login transaction rarely survives a process death, but this guarantees
    // the in-app browser state is cleaned up either way.
    try {
      const launch = await App.getLaunchUrl()
      if (launch?.url?.startsWith(`${NATIVE_APP_ID}://`)) void handleNativeAuthUrl(launch.url)
    } catch {
      // getLaunchUrl unavailable — nothing to replay.
    }
  }

  try {
    const query = window.location.search
    if (query.includes('code=') && query.includes('state=')) {
      await client.handleRedirectCallback()
      const returnPath = sessionStorage.getItem('auth_return_path') || '/'
      sessionStorage.removeItem('auth_return_path')
      window.history.replaceState({}, document.title, returnPath)

      isAuthenticated.value = await client.isAuthenticated()
      if (isAuthenticated.value) {
        user.value = (await client.getUser()) ?? null
        const data = await refreshUserData()
        if (data && !data.stripe_id) {
          window.location.href = '/memberships'
          return
        }
        maybeShowOnboardingModal(data)
      }
    } else {
      isAuthenticated.value = await client.isAuthenticated()
      if (isAuthenticated.value) {
        user.value = (await client.getUser()) ?? null
        const data = await refreshUserData()
        maybeShowOnboardingModal(data)
      }
    }
  } catch (error) {
    console.error('Auth0 initialization error:', error)
  } finally {
    authReady.value = true
    document.documentElement.classList.remove('auth-pending')
  }
})
