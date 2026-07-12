// Partner platform bootstrap + partner reservation cart bridge.
// Named to sort after auth0.client.ts (plugins run in filename-alphabetical order and
// the auth0 plugin is awaited), so window.auth0Client exists here when auth init succeeded —
// still null-checked everywhere per house convention.
import type { PartnerCartItem } from '~/composables/usePartnerCart'

export default defineNuxtPlugin((nuxtApp) => {
  const pp = usePartnerPlatform()
  const cart = usePartnerCart()

  // Capture ?pp_setup= at plugin init, BEFORE any page-level navigateTo (e.g. the
  // partner PDP's missing-?id redirect) can rewrite location.search.
  const setupParam = new URLSearchParams(window.location.search).get('pp_setup')

  // House window.* convention — minimal surface for non-Vue callers.
  ;(window as any).PartnerCart = {
    addItem: (item: PartnerCartItem) => cart.addItem(item),
    openPanel: () => cart.openPanel(),
    get count() {
      return cart.count.value
    },
  }

  // Probe availability once per session; when the partner backend isn't deployed the
  // probe fails silently and every partner surface stays hidden (site unchanged).
  nuxtApp.hook('app:mounted', async () => {
    // Load the persisted cart only after mount so SSR HTML and the first client
    // render agree (the repo's #1 bug class); the panel gates on its own hydrated ref.
    cart.init()

    const enabled = await pp.probe()
    if (!enabled) return
    // Resolve roles for nav visibility when a session exists.
    await pp.fetchMe()

    // Back from the Stripe card-setup redirect (CONTRACT §6 resume param): restore the
    // snapshot, clean the URL, reopen checkout on the card step and re-check the card
    // (the backend lazy-syncs the setup session — no webhook dependency).
    if (setupParam === 'success' || setupParam === 'cancelled') {
      cart.resumeFromSetup(setupParam)
    }
  })
})
