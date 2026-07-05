// Site-wide wishlist manager — one-to-one port of the WishlistManager block in
// demat-webflow components.js: localStorage 'dematerialized_wishlist' (numeric-id
// array), optimistic local toggles with API revert-on-failure, and DOM heart-icon
// updates for [data-item-id] (Webflow cards) and [data-wishlist-id] (custom cards).
export const WISHLIST_STORAGE_KEY = 'dematerialized_wishlist'

export function useWishlistManager() {
  const { getToken } = useAuth()
  const apiBase = useRuntimeConfig().public.apiBase as string

  const wishlistIds = useState<number[]>('wishlist-ids', () => [])
  const initialized = useState('wishlist-initialized', () => false)
  const syncing = useState('wishlist-syncing', () => false)

  function loadLocal() {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (stored) {
        const ids = JSON.parse(stored)
        if (Array.isArray(ids)) {
          wishlistIds.value = Array.from(new Set(ids.map(Number)))
        }
      }
    } catch (err) {
      console.error('[Wishlist] Error loading local:', err)
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds.value))
    } catch (err) {
      console.error('[Wishlist] Error saving local:', err)
    }
  }

  async function init() {
    if (initialized.value) return

    loadLocal()

    let attempts = 0
    while (!(window as any).auth0Client && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if ((window as any).auth0Client) {
      try {
        const isAuthenticated = await (window as any).auth0Client.isAuthenticated()
        if (isAuthenticated) {
          await syncWithAPI()
        }
      } catch (err) {
        console.error('[Wishlist] Init error:', err)
      }
    }

    initialized.value = true
  }

  async function fetchAPIWishlist(): Promise<number[] | null> {
    const token = await getToken()
    if (!token) return null

    try {
      const response = await fetch(`${apiBase}/private_clothing_items/wishlist/clothing_items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('[Wishlist] API fetch failed:', response.status)
        return null
      }

      const data = await response.json()
      const items = Array.isArray(data) ? data : (data.items || data.clothing_items || [])
      return items.map((item: any) => Number(item.id || item.clothing_item_id))
    } catch (err) {
      console.error('[Wishlist] API fetch error:', err)
      return null
    }
  }

  async function syncWithAPI() {
    if (syncing.value) return
    syncing.value = true

    try {
      const apiIds = await fetchAPIWishlist()
      if (apiIds !== null) {
        wishlistIds.value = Array.from(new Set(apiIds))
        saveLocal()
        updateAllUI()
      }
    } catch (err) {
      console.error('[Wishlist] Sync error:', err)
    } finally {
      syncing.value = false
    }
  }

  function isInWishlist(itemId: number | string | undefined): boolean {
    return wishlistIds.value.includes(Number(itemId))
  }

  function _add(id: number) {
    if (!wishlistIds.value.includes(id)) wishlistIds.value = [...wishlistIds.value, id]
  }

  function _delete(id: number) {
    wishlistIds.value = wishlistIds.value.filter((v) => v !== id)
  }

  async function addToWishlist(itemId: number | string): Promise<boolean> {
    const id = Number(itemId)

    // Optimistic local update
    _add(id)
    saveLocal()
    updateUI(id, true)

    const token = await getToken()
    if (token) {
      try {
        const response = await fetch(`${apiBase}/private_clothing_items/wishlist/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('[Wishlist] API add failed:', response.status)
          _delete(id)
          saveLocal()
          updateUI(id, false)
          return false
        }
      } catch (err) {
        console.error('[Wishlist] API add error:', err)
        _delete(id)
        saveLocal()
        updateUI(id, false)
        return false
      }
    }

    return true
  }

  async function removeFromWishlist(itemId: number | string): Promise<boolean> {
    const id = Number(itemId)

    // Optimistic local update
    _delete(id)
    saveLocal()
    updateUI(id, false)

    const token = await getToken()
    if (token) {
      try {
        const response = await fetch(`${apiBase}/private_clothing_items/wishlist/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('[Wishlist] API remove failed:', response.status)
          _add(id)
          saveLocal()
          updateUI(id, true)
          return false
        }
      } catch (err) {
        console.error('[Wishlist] API remove error:', err)
        _add(id)
        saveLocal()
        updateUI(id, true)
        return false
      }
    }

    return true
  }

  async function toggle(itemId: number | string): Promise<boolean> {
    if (isInWishlist(itemId)) {
      return await removeFromWishlist(itemId)
    } else {
      return await addToWishlist(itemId)
    }
  }

  // Update heart icon UI for a single item (works with both Webflow cards and custom cards)
  function updateUI(itemId: number | string, inWishlist: boolean) {
    if (!import.meta.client) return
    const id = Number(itemId)

    // Webflow template cards: [data-item-id]
    document.querySelectorAll(`[data-item-id="${id}"]`).forEach((card) => {
      const outline = card.querySelector<HTMLElement>('.heart-icon-outline-20px')
      const filled = card.querySelector<HTMLElement>('.heart-icon-filled-20px')
      if (outline) outline.style.display = inWishlist ? 'none' : 'block'
      if (filled) filled.style.display = inWishlist ? 'block' : 'none'
    })

    // Custom cards (homepage): [data-wishlist-id]
    document.querySelectorAll(`[data-wishlist-id="${id}"]`).forEach((btn) => {
      if (inWishlist) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }

  // Update ALL heart icons on the page
  function updateAllUI() {
    if (!import.meta.client) return

    // Webflow template cards
    document.querySelectorAll('[data-item-id]').forEach((card) => {
      const itemId = Number(card.getAttribute('data-item-id'))
      const isIn = isInWishlist(itemId)
      const outline = card.querySelector<HTMLElement>('.heart-icon-outline-20px')
      const filled = card.querySelector<HTMLElement>('.heart-icon-filled-20px')
      if (outline) outline.style.display = isIn ? 'none' : 'block'
      if (filled) filled.style.display = isIn ? 'block' : 'none'
    })

    // Custom cards (homepage)
    document.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
      const itemId = Number(btn.getAttribute('data-wishlist-id'))
      if (isInWishlist(itemId)) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }

  return {
    wishlistIds,
    initialized,
    syncing,
    init,
    loadLocal,
    saveLocal,
    getToken,
    fetchAPIWishlist,
    syncWithAPI,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggle,
    updateUI,
    updateAllUI,
  }
}
