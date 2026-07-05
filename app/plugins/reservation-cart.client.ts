// One-to-one port of the site-wide-footer.js cart overlay / reservation /
// upgrade / success modal flow. Exposes the same window.* globals the old
// embed exposed (already-ported pages call them), drives the reactive state
// rendered by components/cart/*.vue, and keeps the old document-level
// [data-cart-trigger] capture handler and Escape-key handling.
export default defineNuxtPlugin((nuxtApp) => {
  const CartManager = useCartManager()
  const UserMembership = useUserMembership()
  const ui = useReservationCartUi()
  const apiBase = useRuntimeConfig().public.apiBase as string

  function localizePath(path: string): string {
    const i18n = (nuxtApp as any).$i18n
    const isNL = !!i18n && String(i18n.locale.value).startsWith('nl')
    return (isNL ? '/nl' : '') + path
  }

  // ============================================
  // CART OVERLAY FUNCTIONS
  // ============================================

  function renderCartOverlay() {
    CartManager.refreshItems()
  }

  async function openCartOverlay() {
    // Add class to body to hide bottom navbar
    document.body.classList.add('cart-open')

    ui.cartOverlayOpen.value = true
    document.body.style.overflow = 'hidden'

    // Reset flow type until we know
    ui.cartFlowType.value = null
    renderCartOverlay()

    if (await CartManager.isUserAuthenticated()) {
      await CartManager.syncWithAPI()

      // Determine membership type for cart language
      const isShipping = await UserMembership.isShippingMember()
      ui.cartFlowType.value = isShipping ? 'shipping' : 'local'

      renderCartOverlay()
    }
  }

  function closeCartOverlay() {
    // Remove class from body
    document.body.classList.remove('cart-open')

    // Reset cart flow type
    ui.cartFlowType.value = null

    ui.cartOverlayOpen.value = false
    document.body.style.overflow = ''
  }

  function goToCartItem(sku: string) {
    closeCartOverlay()
    window.location.href = localizePath('/product?sku=' + encodeURIComponent(sku))
  }

  async function removeCartOverlayItem(event: Event, itemId: number) {
    event.stopPropagation()
    await CartManager.removeFromCart(itemId)
    renderCartOverlay()
  }

  // ============================================
  // RESERVATION / RENTAL MODAL FUNCTIONS
  // Adapts language and API endpoint based on membership type:
  // - Local members: "reserve" → POST /private_clothing_items/reservations
  // - Shipping members: "confirm rental" → POST /private_clothing_items/reservations
  //   (workaround until dedicated rental endpoint exists)
  // ============================================

  async function openReservationModal() {
    // Determine flow type based on membership
    const isShipping = await UserMembership.isShippingMember()
    ui.reservationFlowType.value = isShipping ? 'rental' : 'reservation'

    ui.reservationError.value = ''
    ui.reservationModalOpen.value = true
  }

  function closeReservationModal() {
    ui.reservationModalOpen.value = false
  }

  async function confirmReservation() {
    const isRental = ui.reservationFlowType.value === 'rental'
    const actionLabel = isRental ? 'Rental' : 'Reservation'

    ui.reservationSubmitting.value = true
    ui.reservationError.value = ''

    try {
      const auth0Client = (window as any).auth0Client
      if (!auth0Client) {
        throw new Error('Authentication not available')
      }

      const token = await auth0Client.getTokenSilently()
      const cart = CartManager.getCart()

      // Both flows: single call with all item IDs.
      // SHIPPING MEMBER WORKAROUND: uses the reservations endpoint for now.
      // TODO: Switch to dedicated rental endpoint once POST /private_clothing_items/rentals exists.
      const clothingItemIds = cart.map((item) => item.id)
      const endpoint = `${apiBase}/private_clothing_items/reservations`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          clothing_item_ids: clothingItemIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`${isRental ? 'Shipment' : 'Reservation'} API Error Response:`, errorData)

        let errorMessage = `${isRental ? 'Shipment' : 'Reservation'} failed (${response.status})`

        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => e.msg || e.message || String(e)).join(', ')
        } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail)
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      CartManager.clearCart()
      renderCartOverlay()

      closeReservationModal()
      closeCartOverlay()

      showReservationSuccess(result, isRental)
    } catch (err: any) {
      console.error(`${actionLabel} error:`, err)
      ui.reservationError.value = err?.message
        || `Failed to create ${ui.reservationFlowType.value}. Please try again.`
    } finally {
      ui.reservationSubmitting.value = false
    }
  }

  function showReservationSuccess(result: any, isRental?: boolean) {
    ui.successIsRental.value = !!isRental
    ui.successId.value = String(result?.hash_id || result?.id || '')
    ui.successModalOpen.value = true
  }

  function closeSuccessModal() {
    ui.successModalOpen.value = false
  }

  async function handleReserveClick() {
    const auth0Client = (window as any).auth0Client
    if (!auth0Client) {
      console.error('Auth0 not initialized')
      return
    }

    const isAuthenticated = await auth0Client.isAuthenticated()

    if (!isAuthenticated) {
      closeCartOverlay()
      ;(window as any).openAuthModal?.()
      return
    }

    openReservationModal()
  }

  // ============================================
  // UPGRADE MODAL FUNCTIONS
  // ============================================

  function openUpgradeModal() {
    ui.upgradeModalOpen.value = true
  }

  function closeUpgradeModal() {
    ui.upgradeModalOpen.value = false
  }

  // ============================================
  // GLOBALS (same names the old embed exposed)
  // ============================================

  const w = window as any
  w.CartManager = CartManager
  w.UserMembership = UserMembership
  w.openCartOverlay = openCartOverlay
  w.closeCartOverlay = closeCartOverlay
  w.renderCartOverlay = renderCartOverlay
  w.goToCartItem = goToCartItem
  w.removeCartOverlayItem = removeCartOverlayItem
  w.handleReserveClick = handleReserveClick
  w.openReservationModal = openReservationModal
  w.closeReservationModal = closeReservationModal
  w.confirmReservation = confirmReservation
  w.showReservationSuccess = showReservationSuccess
  w.closeSuccessModal = closeSuccessModal
  w.openUpgradeModal = openUpgradeModal
  w.closeUpgradeModal = closeUpgradeModal

  // ============================================
  // DOCUMENT-LEVEL LISTENERS (ported verbatim behavior)
  // ============================================

  // Cart handler - capture phase for all pages ([data-cart-trigger] in the navbar)
  function handleCartClick(e: Event) {
    const target = e.target as HTMLElement | null
    if (!target || typeof target.closest !== 'function') return
    // Skip purchase cart clicks - let them handle their own onclick
    if (target.closest('[data-purchase-cart]')) return

    const cartTrigger = target.closest('[data-cart-trigger]')
    if (cartTrigger) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      openCartOverlay()
    }
  }

  document.addEventListener('click', handleCartClick, true)
  document.addEventListener('touchend', handleCartClick, true)

  // Escape key handling (the old code's cart-overlay branch checked an inline
  // transform that was never set, so Escape never closed the cart — kept as-is)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (ui.upgradeModalOpen.value) {
        closeUpgradeModal()
        return
      }

      if (ui.reservationModalOpen.value) {
        closeReservationModal()
      }
    }
  })

  // Seed the reactive cart from sessionStorage and paint the navbar badge once
  // the DOM exists (the old code did this on DOMContentLoaded).
  nuxtApp.hook('app:mounted', () => {
    renderCartOverlay()
    CartManager.updateCartBadge()
  })

  // Old code ran CartManager.init() on DOMContentLoaded
  CartManager.init()
})
