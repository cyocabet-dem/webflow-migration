// Native-shell bootstrap for the Capacitor iOS/Android apps (see MOBILE.md):
// status bar, splash screen, Android back button, deep links, and Stripe-checkout
// return handling. Exits immediately in browsers, so the web app is untouched.
import { Capacitor } from '@capacitor/core'
import {
  WEB_ORIGIN,
  isNativeApp,
  closeInAppBrowser,
  takePendingNativeCheckout,
} from '~/composables/useNativeApp'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!isNativeApp()) return

  const router = useRouter()
  const { refreshUserData } = useAuth()

  // Scopes assets/css/8-native-app.css. Registered through useHead so it merges
  // with per-page bodyAttrs (e.g. welcome-to-dematerialized's body-pink).
  useHead({ bodyAttrs: { class: 'native-app' } })

  const [{ App }, { Browser }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/browser'),
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
  ])

  // White site chrome → dark status-bar icons. On Android 15+ the SystemBars
  // config in capacitor.config.ts covers this; the call is a no-op there.
  try {
    await StatusBar.setStyle({ style: Style.Light })
  } catch (err) {
    console.warn('StatusBar setup failed:', err)
  }

  // A Stripe checkout was opened in the in-app browser. Its success/cancel URLs
  // point at the production website (WEB_ORIGIN): with universal links configured
  // the return arrives as appUrlOpen below; otherwise the user closes the browser
  // and we land them where the web return URLs would have.
  async function settlePendingCheckout(returnPath?: string) {
    const kind = takePendingNativeCheckout()
    if (!kind) return
    if (returnPath) {
      void router.push(returnPath)
      return
    }
    if (kind === 'membership') {
      // Mirrors the web flow: success lands on /welcome-to-dematerialized,
      // cancel stays put. The backend is the source of truth for which happened —
      // and Stripe's webhook may land a beat after the user returns, so retry
      // briefly before concluding the checkout was cancelled.
      for (let attempt = 0; attempt < 4; attempt++) {
        const data = await refreshUserData()
        if (data?.stripe_id) {
          void router.push('/welcome-to-dematerialized')
          return
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
    } else {
      // Web sends both success and cancel to /purchases — same destination here.
      void router.push('/purchases')
    }
  }

  // Deep links. Auth0's custom-scheme callbacks (nl.dematerialized.app://…) are
  // handled in plugins/auth0.client.ts; this listener handles universal links to
  // the production site (https://dematerialized.nl/… once Associated Domains /
  // App Links are configured) by routing them in-app.
  // Strict origin match: 'https://dematerialized.nl.evil.com' must not pass.
  const isSiteUrl = (url: string) =>
    url === WEB_ORIGIN ||
    url.startsWith(WEB_ORIGIN + '/') ||
    url.startsWith(WEB_ORIGIN + '?') ||
    url.startsWith(WEB_ORIGIN + '#')
  const routeSiteUrl = (url: string) => {
    const path = url.slice(WEB_ORIGIN.length) || '/'
    void closeInAppBrowser()
    takePendingNativeCheckout() // returning via deep link supersedes browser-close settlement
    void router.push(path)
  }
  void App.addListener('appUrlOpen', ({ url }) => {
    if (isSiteUrl(url)) routeSiteUrl(url)
  })
  // Cold start from a universal link: the launching intent/retained event never
  // reaches the listener above, so route the launch URL explicitly.
  try {
    const launch = await App.getLaunchUrl()
    if (launch?.url && isSiteUrl(launch.url)) routeSiteUrl(launch.url)
  } catch {
    // getLaunchUrl unavailable — normal app-icon launch.
  }

  void Browser.addListener('browserFinished', () => void settlePendingCheckout())
  // Android Custom Tabs background the app; settle when it comes forward again.
  // iOS must NOT do this: SFSafariViewController keeps the app foreground, and any
  // active/inactive blip while the Stripe sheet is open (Control Center, a call
  // banner) fires 'resume' — which would consume the pending flag mid-checkout.
  if (Capacitor.getPlatform() === 'android') {
    void App.addListener('resume', () => void settlePendingCheckout())
  }

  // Android hardware/gesture back: behave like browser back; minimize at the root
  // (Android UX guidance — don't exit outright).
  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else void App.minimizeApp()
  })

  // The mobile bundle ships without the heavy Webflow media (see
  // scripts/prune-mobile-bundle.mjs) — rewrite DOM-level /images/ and /videos/
  // references to the production site, which serves the exact same files.
  // CSS url() references aren't reachable here; those files stay bundled.
  const MEDIA_RE = /^\/(images|videos)\//
  function rewriteMediaAttr(el: Element, attr: string) {
    const value = el.getAttribute(attr)
    if (!value) return
    if (attr === 'srcset') {
      if (!value.includes('/images/') && !value.includes('/videos/')) return
      const rewritten = value
        .split(',')
        .map((part) => {
          const [url, ...desc] = part.trim().split(/\s+/)
          return (MEDIA_RE.test(url) ? WEB_ORIGIN + url : url) + (desc.length ? ' ' + desc.join(' ') : '')
        })
        .join(', ')
      if (rewritten !== value) el.setAttribute(attr, rewritten)
      return
    }
    if (MEDIA_RE.test(value)) {
      el.setAttribute(attr, WEB_ORIGIN + value)
      if (el.tagName === 'VIDEO' || el.parentElement?.tagName === 'VIDEO') {
        ;(el.tagName === 'VIDEO' ? (el as HTMLVideoElement) : (el.parentElement as HTMLVideoElement)).load()
      }
    }
  }
  const MEDIA_ATTRS: Record<string, string[]> = {
    IMG: ['src', 'srcset'],
    SOURCE: ['src', 'srcset'],
    VIDEO: ['src', 'poster'],
  }
  function rewriteMediaTree(root: Element) {
    const attrs = MEDIA_ATTRS[root.tagName]
    if (attrs) for (const a of attrs) rewriteMediaAttr(root, a)
    for (const [tag, tagAttrs] of Object.entries(MEDIA_ATTRS)) {
      for (const el of root.querySelectorAll(tag)) {
        for (const a of tagAttrs) rewriteMediaAttr(el, a)
      }
    }
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes') {
        rewriteMediaAttr(m.target as Element, m.attributeName!)
      } else {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) rewriteMediaTree(node as Element)
        }
      }
    }
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'poster'],
  })
  rewriteMediaTree(document.documentElement)

  // Splash stays up (launchAutoHide: false) until the app has actually mounted.
  // (The never-strand safety net lives in plugins/00.splash-fallback.client.ts,
  // which runs before the awaited auth0 plugin can delay this one.)
  nuxtApp.hook('app:mounted', () => {
    void SplashScreen.hide({ fadeOutDuration: 250 })
  })
})
