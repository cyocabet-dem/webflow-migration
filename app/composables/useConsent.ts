// Custom GDPR/ePrivacy consent — replaces Finsweet ConsentPro (same four categories the old
// fs-consent_component exposed: essentials always-on, marketing, personalization, analytics).
export interface ConsentState {
  v: number
  essentials: true
  marketing: boolean
  personalization: boolean
  analytics: boolean
  ts: string
}

export type ConsentCategory = 'marketing' | 'personalization' | 'analytics'

const COOKIE_NAME = 'demat-consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days

export function useConsent() {
  const cookie = useCookie<ConsentState | null>(COOKIE_NAME, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    default: () => null,
  })

  const bannerOpen = useState('consent-banner-open', () => cookie.value === null)
  const preferencesOpen = useState('consent-preferences-open', () => false)

  const hasDecision = computed(() => cookie.value !== null)

  function granted(category: ConsentCategory): boolean {
    return cookie.value?.[category] === true
  }

  function save(categories: Record<ConsentCategory, boolean>) {
    cookie.value = {
      v: 1,
      essentials: true,
      ...categories,
      ts: new Date().toISOString(),
    }
    bannerOpen.value = false
    preferencesOpen.value = false
    if (import.meta.client) {
      window.dispatchEvent(new CustomEvent('demat:consent-changed', { detail: cookie.value }))
    }
  }

  function acceptAll() {
    save({ marketing: true, personalization: true, analytics: true })
  }

  function denyAll() {
    save({ marketing: false, personalization: false, analytics: false })
  }

  function openPreferences() {
    preferencesOpen.value = true
  }

  return {
    consent: cookie,
    bannerOpen,
    preferencesOpen,
    hasDecision,
    granted,
    save,
    acceptAll,
    denyAll,
    openPreferences,
  }
}

// Runs cb immediately if the category is already granted, or as soon as the user grants it.
export function onConsentGranted(category: ConsentCategory, cb: () => void) {
  if (!import.meta.client) return
  const { granted } = useConsent()
  if (granted(category)) {
    cb()
    return
  }
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<ConsentState>).detail
    if (detail?.[category]) {
      window.removeEventListener('demat:consent-changed', handler)
      cb()
    }
  }
  window.addEventListener('demat:consent-changed', handler)
}
