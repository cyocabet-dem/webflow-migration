// Exposes window.PurchaseCart with the same method names/signatures as
// old/demat-webflow-test/purchase-cart.js, backed by usePurchaseCart().
// Already-ported pages (my-rentals.vue) call PurchaseCart.hasItem/addItem/removeItem.
import type { PurchaseCartItem } from '~/composables/usePurchaseCart'

export default defineNuxtPlugin((nuxtApp) => {
  const cart = usePurchaseCart()

  const PurchaseCart = {
    API_BASE: cart.getApiBase(),
    get _items() {
      return cart.getItems()
    },
    get _isCheckingOut() {
      return cart.isCheckingOut.value
    },
    init: () => cart.init(),
    save: () => cart.save(),
    hasItem: (clothingItemId: number) => cart.hasItem(clothingItemId),
    addItem: (item: PurchaseCartItem) => cart.addItem(item),
    removeItem: (clothingItemId: number) => cart.removeItem(clothingItemId),
    clear: () => cart.clear(),
    getItems: () => cart.getItems(),
    getTotal: () => cart.getTotal(),
    formatPrice: (cents: number | null | undefined) => cart.formatPrice(cents),
    updateCartBadge: () => cart.updateCartBadge(),
    showAddedToast: (itemName?: string) => cart.showAddedToast(itemName),
    toggleCartDropdown: () => cart.toggleCartDropdown(),
    createCartPanel: () => cart.openCartPanel(),
    openCartPanel: () => cart.openCartPanel(),
    closeCartPanel: () => cart.closeCartPanel(),
    // Panels render reactively in <CartPurchaseCartPanel>/<CartCheckoutModal>;
    // the render methods stay callable for old-code parity.
    renderCartPanel: () => {},
    renderDropdown: () => {},
    openCheckoutModal: () => cart.openCheckoutModal(),
    closeCheckoutModal: () => cart.closeCheckoutModal(),
    fetchCreditBalance: () => cart.fetchCreditBalance(),
    renderCheckoutModal: () => cart.refreshCheckoutData(),
    getApiBase: () => cart.getApiBase(),
    processCheckout: () => cart.processCheckout(),
    showSuccessMessage: (order: Record<string, any>) => cart.showSuccessMessage(order),
    injectCartStyles: () => {},
  }

  ;(window as any).PurchaseCart = PurchaseCart

  // Close dropdown when clicking outside (legacy dropdown parity from the old file)
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('purchase-cart-dropdown')
    const navItem = document.getElementById('purchase-cart-nav')

    if (dropdown && dropdown.style.display === 'block') {
      if (!navItem?.contains(e.target as Node)) {
        dropdown.style.display = 'none'
      }
    }
  })

  // Old code initialized on DOMContentLoaded; the badge DOM exists only after
  // the app mounts, so re-run the badge sync then.
  cart.init()
  nuxtApp.hook('app:mounted', () => cart.updateCartBadge())
})
