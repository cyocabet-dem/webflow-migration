// Consent-gated analytics loaders. Category mapping: GTM + Hotjar fire on "analytics",
// Meta Pixel on "marketing" — nothing loads before the user grants the category.
import { onConsentGranted } from '~/composables/useConsent'

declare global {
  interface Window {
    dataLayer: unknown[]
    hj?: { (...args: unknown[]): void; q?: unknown[] }
    _hjSettings?: { hjid: number; hjsv: number }
    fbq?: { (...args: unknown[]): void; callMethod?: (...args: unknown[]) => void; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string }
    _fbq?: unknown
  }
}

function injectScript(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

export default defineNuxtPlugin(() => {
  const { gtmId, hotjarId, metaPixelId } = useRuntimeConfig().public

  onConsentGranted('analytics', () => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`)

    window._hjSettings = { hjid: Number(hotjarId), hjsv: 6 }
    window.hj =
      window.hj ||
      function (...args: unknown[]) {
        ;(window.hj!.q = window.hj!.q || []).push(args)
      }
    injectScript(`https://static.hotjar.com/c/hotjar-${hotjarId}.js?sv=6`)
  })

  onConsentGranted('marketing', () => {
    // Web-only: in the native apps the Meta Pixel would count as cross-app tracking,
    // which Apple requires an App Tracking Transparency prompt for (guideline 5.1.2).
    // Rather than ship the ATT dialog, the apps simply don't load the pixel.
    if (isNativeApp()) return
    if (window.fbq) return
    const fbq: any = (...args: unknown[]) => {
      fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)
    }
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = fbq
    window._fbq = fbq
    injectScript('https://connect.facebook.net/en_US/fbevents.js')
    window.fbq!('init', metaPixelId)
    window.fbq!('track', 'PageView')
  })
})
