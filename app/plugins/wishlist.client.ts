// Exposes the site-wide wishlist globals ported from demat-webflow components.js:
// window.WishlistManager (same method names/shape) and window.updateWishlistIcons
// (selector-based heart wiring called after product cards render), plus the same
// delayed auto-init the old embed ran.
export default defineNuxtPlugin(() => {
  const w = window as any

  // Skip if already defined (e.g. by homepage inline script)
  if (w.WishlistManager) {
    return
  }

  const manager = useWishlistManager()
  const apiBase = useRuntimeConfig().public.apiBase as string

  w.WishlistManager = {
    STORAGE_KEY: WISHLIST_STORAGE_KEY,
    API_BASE: apiBase,
    get _syncing() {
      return manager.syncing.value
    },
    get _initialized() {
      return manager.initialized.value
    },
    get _wishlistIds() {
      return new Set(manager.wishlistIds.value)
    },
    init: () => manager.init(),
    _loadLocal: () => manager.loadLocal(),
    _saveLocal: () => manager.saveLocal(),
    getToken: () => manager.getToken(),
    fetchAPIWishlist: () => manager.fetchAPIWishlist(),
    syncWithAPI: () => manager.syncWithAPI(),
    isInWishlist: (itemId: number | string) => manager.isInWishlist(itemId),
    addToWishlist: (itemId: number | string) => manager.addToWishlist(itemId),
    removeFromWishlist: (itemId: number | string) => manager.removeFromWishlist(itemId),
    toggle: (itemId: number | string) => manager.toggle(itemId),
    updateUI: (itemId: number | string, isInWishlist: boolean) => manager.updateUI(itemId, isInWishlist),
    updateAllUI: () => manager.updateAllUI(),
  }

  // updateWishlistIcons — called by the clothing page after rendering each page
  // of product cards. Sets up click handlers + visual state.
  w.updateWishlistIcons = function () {
    // Ensure WishlistManager is initialized
    if (!w.WishlistManager._initialized) {
      w.WishlistManager.init().then(() => {
        w.updateWishlistIcons()
      })
      return
    }

    document.querySelectorAll('[data-item-id]').forEach((card) => {
      const itemId = Number(card.getAttribute('data-item-id'))
      if (!itemId) return

      const wrapper = card.querySelector('.div-wish-list-wrapper')
      if (!wrapper) return

      // Skip if already wired up
      if (wrapper.hasAttribute('data-wishlist-bound')) return
      wrapper.setAttribute('data-wishlist-bound', 'true')

      // Set initial visual state
      const isIn = w.WishlistManager.isInWishlist(itemId)
      const outline = card.querySelector<HTMLElement>('.heart-icon-outline-20px')
      const filled = card.querySelector<HTMLElement>('.heart-icon-filled-20px')
      if (outline) outline.style.display = isIn ? 'none' : 'block'
      if (filled) filled.style.display = isIn ? 'block' : 'none'

      // Attach click handler (captures to beat Webflow IX2)
      wrapper.addEventListener('click', async function (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        // Check auth — prompt login if not authenticated
        if (w.auth0Client) {
          const isAuthenticated = await w.auth0Client.isAuthenticated()
          if (!isAuthenticated) {
            try {
              await w.auth0Client.loginWithPopup()
              const nowAuthenticated = await w.auth0Client.isAuthenticated()
              if (!nowAuthenticated) return
              await w.WishlistManager.syncWithAPI()
            } catch (err) {
              console.error('[Wishlist] Login error:', err)
              return
            }
          }
        }

        await w.WishlistManager.toggle(itemId)
      }, true) // capture phase to fire before IX2
    })
  }

  // Auto-initialize WishlistManager when auth is ready
  // (for pages that don't explicitly call init)
  function autoInit() {
    if (w.auth0Client || document.readyState === 'complete') {
      w.WishlistManager.init().then(() => {
        w.updateWishlistIcons()
      })
    } else {
      window.addEventListener('load', function () {
        setTimeout(() => {
          w.WishlistManager.init().then(() => {
            w.updateWishlistIcons()
          })
        }, 500)
      })
    }
  }

  // Kick off auto-init after a short delay to let auth load
  setTimeout(autoInit, 200)
})
