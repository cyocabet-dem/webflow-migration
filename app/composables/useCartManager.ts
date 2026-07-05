// One-to-one port of window.CartManager from site-wide-footer.js:
// sessionStorage 'dematerialized_cart' (same item shape), 5-item max,
// API sync when authenticated (basket endpoints), [data-cart-count] badge updates.
// Also holds the shared reactive UI state for the cart overlay / reservation /
// upgrade / success modals (the old code toggled injected DOM instead).
import type { Ref } from 'vue'

export interface CartItem {
  id: number
  sku: string
  name: string
  brand: string
  size: string
  image: string
  addedAt: string
}

export type AddToCartResult =
  | { success: true }
  | { success: false; reason: 'max_items' | 'already_in_cart' }

export interface CartManagerApi {
  STORAGE_KEY: string
  MAX_ITEMS: number
  API_BASE: string
  _syncing: boolean
  _initialized: boolean
  items: Ref<CartItem[]>
  init(): Promise<void>
  getToken(): Promise<string | null>
  isUserAuthenticated(): Promise<boolean>
  fetchAPICart(): Promise<any[] | null>
  addToAPI(itemId: number): Promise<boolean>
  removeFromAPI(itemId: number): Promise<boolean>
  syncWithAPI(): Promise<void>
  getLocalCart(): CartItem[]
  saveLocalCart(cart: CartItem[]): boolean
  getCart(): CartItem[]
  getCartCount(): number
  isInCart(itemId: number): boolean
  addToCart(item: any): Promise<AddToCartResult>
  removeFromCart(itemId: number): Promise<boolean>
  clearCart(): void
  updateCartBadge(): void
  refreshItems(): void
}

function createCartManager(apiBase: string, items: Ref<CartItem[]>): CartManagerApi {
  const manager: CartManagerApi = {
    STORAGE_KEY: 'dematerialized_cart',
    MAX_ITEMS: 5,
    API_BASE: apiBase,
    _syncing: false,
    _initialized: false,
    items,

    // ========== INITIALIZATION ==========

    async init() {
      if (this._initialized) return

      // Wait for auth0Client
      let attempts = 0
      while (!(window as any).auth0Client && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!(window as any).auth0Client) {
        this._initialized = true
        this.updateCartBadge()
        return
      }

      try {
        const isAuthenticated = await (window as any).auth0Client.isAuthenticated()
        if (isAuthenticated) {
          await this.syncWithAPI()
        }
      } catch (err) {
        console.error('[Cart] Init error:', err)
      }

      this._initialized = true
      this.updateCartBadge()
    },

    // ========== API HELPERS ==========

    async getToken() {
      const auth0Client = (window as any).auth0Client
      if (!auth0Client) return null
      try {
        const isAuthenticated = await auth0Client.isAuthenticated()
        if (!isAuthenticated) return null
        return await auth0Client.getTokenSilently()
      } catch (err) {
        console.error('[Cart] Token error:', err)
        return null
      }
    },

    async isUserAuthenticated() {
      const auth0Client = (window as any).auth0Client
      if (!auth0Client) return false
      try {
        return await auth0Client.isAuthenticated()
      } catch {
        return false
      }
    },

    async fetchAPICart() {
      const token = await this.getToken()
      if (!token) return null

      try {
        const response = await fetch(`${this.API_BASE}/private_clothing_items/basket/clothing_items`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('[Cart] API fetch failed:', response.status)
          return null
        }

        const data = await response.json()

        return Array.isArray(data) ? data : (data.items || data.clothing_items || [])
      } catch (err) {
        console.error('[Cart] API fetch error:', err)
        return null
      }
    },

    async addToAPI(itemId) {
      const token = await this.getToken()
      if (!token) return false

      try {
        const response = await fetch(`${this.API_BASE}/private_clothing_items/basket/${itemId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('[Cart] API add failed:', response.status)
          return false
        }

        return true
      } catch (err) {
        console.error('[Cart] API add error:', err)
        return false
      }
    },

    async removeFromAPI(itemId) {
      const token = await this.getToken()
      if (!token) return false

      try {
        const response = await fetch(`${this.API_BASE}/private_clothing_items/basket/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.error('[Cart] API remove failed:', response.status)
          return false
        }

        return true
      } catch (err) {
        console.error('[Cart] API remove error:', err)
        return false
      }
    },

    // ========== SYNC LOGIC ==========

    async syncWithAPI() {
      if (this._syncing) return
      this._syncing = true

      try {
        const localCart = this.getLocalCart()
        const apiCart = await this.fetchAPICart()

        if (apiCart === null) {
          this._syncing = false
          return
        }

        const mergedMap = new Map<number, CartItem>()

        apiCart.forEach((item: any) => {
          let frontImage = ''
          if (item.images && item.images.length > 0) {
            const frontImg = item.images.find((img: any) =>
              img.image_type === 'front'
              || (img.image_name && img.image_name.toLowerCase().includes('front')),
            )
            frontImage = frontImg?.object_url || item.images[0]?.object_url || ''
          }

          mergedMap.set(item.id, {
            id: item.id,
            sku: item.sku,
            name: item.name,
            brand: item.brand?.brand_name || item.brand || '',
            size: item.size?.size || item.size || '',
            image: frontImage || item.front_image || item.frontImage || item.image || '',
            addedAt: item.started_at || new Date().toISOString(),
          })
        })

        const localOnlyItems = localCart.filter(
          (localItem) => !apiCart.some((apiItem: any) => apiItem.id === localItem.id),
        )

        for (const item of localOnlyItems) {
          if (mergedMap.size >= this.MAX_ITEMS) {
            console.warn('[Cart] Max items reached, skipping upload of:', item.name)
            break
          }

          const success = await this.addToAPI(item.id)

          if (success) {
            mergedMap.set(item.id, item)
          }
        }

        const mergedCart = Array.from(mergedMap.values())
        this.saveLocalCart(mergedCart)
      } catch (err) {
        console.error('[Cart] Sync error:', err)
      }

      this._syncing = false
      this.updateCartBadge()
    },

    // ========== LOCAL STORAGE METHODS ==========

    getLocalCart() {
      if (!import.meta.client) return []
      try {
        const cart = sessionStorage.getItem(this.STORAGE_KEY)
        return cart ? JSON.parse(cart) : []
      } catch (e) {
        console.error('Error reading cart:', e)
        return []
      }
    },

    saveLocalCart(cart) {
      try {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart))
        this.refreshItems()
        this.updateCartBadge()
        return true
      } catch (e) {
        console.error('Error saving cart:', e)
        return false
      }
    },

    // ========== PUBLIC METHODS ==========

    getCart() {
      return this.getLocalCart()
    },

    getCartCount() {
      return this.getLocalCart().length
    },

    isInCart(itemId) {
      const cart = this.getLocalCart()
      return cart.some((item) => item.id === itemId)
    },

    async addToCart(item) {
      const cart = this.getLocalCart()

      if (cart.length >= this.MAX_ITEMS) {
        console.warn('Cart is full (max 5 items)')
        return { success: false, reason: 'max_items' }
      }

      if (this.isInCart(item.id)) {
        console.warn('Item already in cart')
        return { success: false, reason: 'already_in_cart' }
      }

      const isAuth = await this.isUserAuthenticated()
      if (isAuth) {
        const apiSuccess = await this.addToAPI(item.id)
        if (!apiSuccess) {
          console.error('[Cart] Failed to add to API')
        }
      }

      const cartItem: CartItem = {
        id: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand?.brand_name || item.brand || '',
        size: item.size?.size || item.size || '',
        image: item.front_image || item.frontImage || item.image || '',
        addedAt: new Date().toISOString(),
      }

      cart.push(cartItem)
      this.saveLocalCart(cart)

      return { success: true }
    },

    async removeFromCart(itemId) {
      let cart = this.getLocalCart()
      const initialLength = cart.length
      cart = cart.filter((item) => item.id !== itemId)

      if (cart.length < initialLength) {
        const isAuth = await this.isUserAuthenticated()
        if (isAuth) {
          await this.removeFromAPI(itemId)
        }

        this.saveLocalCart(cart)
        return true
      }
      return false
    },

    clearCart() {
      sessionStorage.removeItem(this.STORAGE_KEY)
      this.refreshItems()
      this.updateCartBadge()
    },

    updateCartBadge() {
      if (!import.meta.client) return
      const count = this.getCartCount()
      const badges = document.querySelectorAll<HTMLElement>('[data-cart-count]')

      badges.forEach((badge) => {
        badge.textContent = String(count)
        badge.style.display = count > 0 ? 'flex' : 'none'
      })
    },

    refreshItems() {
      this.items.value = this.getLocalCart()
    },
  }

  return manager
}

let _cartManager: CartManagerApi | null = null

export function useCartManager(): CartManagerApi {
  const { apiBase } = useRuntimeConfig().public
  const items = useState<CartItem[]>('reservation-cart-items', () => [])
  // Never cache across SSR requests — the items ref is per-request state.
  if (import.meta.server) return createCartManager(apiBase as string, items)
  if (!_cartManager) {
    // items is seeded from sessionStorage on app:mounted (see the
    // reservation-cart plugin) so SSR HTML and first client render match.
    _cartManager = createCartManager(apiBase as string, items)
  }
  return _cartManager
}

// Shared reactive state that replaces the old code's DOM/display toggling
// (_cartFlowType, _currentFlowType, modal style.display mutations).
export function useReservationCartUi() {
  return {
    cartOverlayOpen: useState<boolean>('cart-overlay-open', () => false),
    // null = unknown/not logged in, 'local', or 'shipping'
    cartFlowType: useState<'local' | 'shipping' | null>('cart-flow-type', () => null),
    reservationModalOpen: useState<boolean>('reservation-modal-open', () => false),
    // 'reservation' or 'rental'
    reservationFlowType: useState<'reservation' | 'rental'>('reservation-flow-type', () => 'reservation'),
    reservationError: useState<string>('reservation-error', () => ''),
    reservationSubmitting: useState<boolean>('reservation-submitting', () => false),
    upgradeModalOpen: useState<boolean>('upgrade-modal-open', () => false),
    successModalOpen: useState<boolean>('success-modal-open', () => false),
    successIsRental: useState<boolean>('success-is-rental', () => false),
    successId: useState<string>('success-reservation-id', () => ''),
  }
}
