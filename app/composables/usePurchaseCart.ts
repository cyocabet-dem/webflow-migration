// Port of old/demat-webflow-test/purchase-cart.js (window.PurchaseCart).
// Same storage key/shape, endpoints, payloads, credit logic and user-visible strings.

export interface PurchaseCartItem {
  clothing_item_id: number
  name: string
  image_url?: string
  purchase_price_cents: number | null
  retail_price_cents?: number | null
  [key: string]: unknown
}

const STORAGE_KEY = 'demat_purchase_cart'

let toastShowTimer: ReturnType<typeof setTimeout> | null = null
let toastHideTimer: ReturnType<typeof setTimeout> | null = null
let toastRemoveTimer: ReturnType<typeof setTimeout> | null = null

export function usePurchaseCart() {
  const apiBase = useRuntimeConfig().public.apiBase as string

  const items = useState<PurchaseCartItem[]>('purchase-cart-items', () => [])
  const panelOpen = useState('purchase-cart-panel-open', () => false)
  const checkoutOpen = useState('purchase-checkout-open', () => false)
  const checkoutView = useState<'summary' | 'success'>('purchase-checkout-view', () => 'summary')
  const creditBalance = useState('purchase-checkout-credit-balance', () => 0)
  const creditsLoading = useState('purchase-checkout-credits-loading', () => false)
  const isCheckingOut = useState('purchase-checkout-processing', () => false)
  const checkoutError = useState('purchase-checkout-error', () => '')
  const successOrder = useState<Record<string, any> | null>('purchase-checkout-success-order', () => null)
  const toastMounted = useState('purchase-cart-toast-mounted', () => false)
  const toastVisible = useState('purchase-cart-toast-visible', () => false)

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + (item.purchase_price_cents || 0), 0)
  )
  const count = computed(() => items.value.length)
  const creditsToApply = computed(() => Math.min(creditBalance.value, total.value))
  const finalTotal = computed(() => Math.max(0, total.value - creditsToApply.value))

  function getApiBase(): string {
    return apiBase
  }

  function init() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        items.value = JSON.parse(saved)
      } catch {
        items.value = []
      }
    }
    updateCartBadge()
  }

  function save() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    updateCartBadge()
  }

  function hasItem(clothingItemId: number): boolean {
    return items.value.some((item) => item.clothing_item_id === clothingItemId)
  }

  function addItem(item: PurchaseCartItem) {
    if (hasItem(item.clothing_item_id)) {
      return
    }
    items.value = [...items.value, item]
    save()
    showAddedToast(item.name)
  }

  function removeItem(clothingItemId: number) {
    const index = items.value.findIndex((item) => item.clothing_item_id === clothingItemId)
    if (index > -1) {
      const next = [...items.value]
      next.splice(index, 1)
      items.value = next
      save()
    }
  }

  function clear() {
    items.value = []
    save()
  }

  function getItems(): PurchaseCartItem[] {
    return [...items.value]
  }

  function getTotal(): number {
    return total.value
  }

  function formatPrice(cents: number | null | undefined): string {
    if (cents === null || cents === undefined) return '€0,00'
    return `€${(cents / 100).toFixed(2).replace('.', ',')}`
  }

  // Same DOM contract as the old code: toggles the inline display of
  // .purchase-cart-badge / .purchase-cart-nav (incl. #purchase-cart-nav, which
  // SiteNavbar watches with a MutationObserver).
  function updateCartBadge() {
    if (!import.meta.client) return
    const c = items.value.length

    document.querySelectorAll<HTMLElement>('.purchase-cart-badge').forEach((badge) => {
      badge.textContent = String(c)
      badge.style.display = c > 0 ? 'flex' : 'none'
    })

    document.querySelectorAll<HTMLElement>('.purchase-cart-nav').forEach((navItem) => {
      navItem.style.display = c > 0 ? 'flex' : 'none'
    })
  }

  function showAddedToast(_itemName?: string) {
    if (toastShowTimer) clearTimeout(toastShowTimer)
    if (toastHideTimer) clearTimeout(toastHideTimer)
    if (toastRemoveTimer) clearTimeout(toastRemoveTimer)

    toastVisible.value = false
    toastMounted.value = true

    toastShowTimer = setTimeout(() => {
      toastVisible.value = true
    }, 10)

    toastHideTimer = setTimeout(() => {
      toastVisible.value = false
      toastRemoveTimer = setTimeout(() => {
        toastMounted.value = false
      }, 300)
    }, 2500)
  }

  function openCartPanel() {
    panelOpen.value = true
    if (import.meta.client) document.body.style.overflow = 'hidden'
  }

  function closeCartPanel() {
    panelOpen.value = false
    if (import.meta.client) document.body.style.overflow = ''
  }

  function toggleCartDropdown() {
    if (panelOpen.value) {
      closeCartPanel()
    } else {
      openCartPanel()
    }
  }

  async function fetchCreditBalance(): Promise<number> {
    try {
      const auth0Client = (window as any).auth0Client
      if (!auth0Client) {
        return 0
      }

      const isAuthenticated = await auth0Client.isAuthenticated()
      if (!isAuthenticated) {
        return 0
      }

      const token = await auth0Client.getTokenSilently()
      const url = `${apiBase}/private_clothing_items/donation_session/`

      // Credit balance comes from the donation sessions endpoint
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.credit_balance_cents || 0
      } else {
        console.error('Failed to fetch credits:', response.status)
      }
    } catch (err) {
      console.error('Error fetching credit balance:', err)
    }
    return 0
  }

  async function refreshCheckoutData() {
    creditsLoading.value = true
    creditBalance.value = await fetchCreditBalance()
    creditsLoading.value = false
  }

  async function openCheckoutModal() {
    closeCartPanel()

    checkoutView.value = 'summary'
    checkoutError.value = ''
    successOrder.value = null
    checkoutOpen.value = true
    if (import.meta.client) document.body.style.overflow = 'hidden'

    await refreshCheckoutData()
  }

  function closeCheckoutModal() {
    checkoutOpen.value = false
    if (import.meta.client) document.body.style.overflow = ''
  }

  function showSuccessMessage(order: Record<string, any>) {
    successOrder.value = order
    checkoutView.value = 'success'
  }

  async function processCheckout() {
    if (isCheckingOut.value) return
    isCheckingOut.value = true
    checkoutError.value = ''

    try {
      const auth0Client = (window as any).auth0Client
      if (!auth0Client) {
        throw new Error('Authentication required')
      }

      const isAuthenticated = await auth0Client.isAuthenticated()
      if (!isAuthenticated) {
        throw new Error('Please sign in to complete your purchase')
      }

      const token = await auth0Client.getTokenSilently()
      const cartItems = getItems()

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty')
      }

      // Step 1: Create the order
      const orderResponse = await fetch(`${apiBase}/private_clothing_items/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          clothing_item_ids: cartItems.map((item) => item.clothing_item_id),
          shipping_address: '', // Not needed for rental purchases (pickup)
          order_type: 'purchase',
        }),
      })

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text()
        console.error('Order creation error response:', errorText)
        let errorDetail = 'Failed to create order'
        try {
          const errorData = JSON.parse(errorText)
          errorDetail = errorData.detail || errorDetail
        } catch {
          // Response wasn't JSON
        }
        throw new Error(errorDetail)
      }

      const order = await orderResponse.json()

      // Check if fully paid by credits
      if (order.total_amount_in_cents === 0 || order.payment_status === 'paid') {
        clear()
        closeCheckoutModal()
        showSuccessMessage(order)
        return
      }

      // Step 2: Need to pay remaining balance via Stripe
      // Native apps send the production site's origin (Stripe requires https URLs);
      // the return is handled in plugins/native.client.ts.
      const currentUrl = isNativeApp() ? WEB_ORIGIN : window.location.origin
      const successUrl = `${currentUrl}/purchases?payment=success`
      const cancelUrl = `${currentUrl}/purchases?payment=cancelled`

      const checkoutResponse = await fetch(
        `${apiBase}/private_clothing_items/orders/${order.id}/checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            success_url: successUrl,
            cancel_url: cancelUrl,
          }),
        }
      )

      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text()
        console.error('Checkout error response (raw):', errorText)
        let errorDetail = 'Failed to create checkout session'
        try {
          const errorData = JSON.parse(errorText)
          console.error('Parsed error data:', errorData)
          console.error('Error detail type:', typeof errorData.detail)
          console.error('Error detail value:', errorData.detail)

          // Handle various error formats
          if (typeof errorData.detail === 'string') {
            errorDetail = errorData.detail
          } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            // FastAPI validation errors come as array
            errorDetail = errorData.detail
              .map((e: any) => e.msg || e.message || JSON.stringify(e))
              .join(', ')
          } else if (errorData.detail?.message) {
            errorDetail = errorData.detail.message
          } else if (errorData.detail?.msg) {
            errorDetail = errorData.detail.msg
          } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
            errorDetail = JSON.stringify(errorData.detail)
          } else if (errorData.message) {
            errorDetail = errorData.message
          } else if (errorData.error) {
            errorDetail =
              typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
          }
          console.error('Final error message:', errorDetail)
        } catch {
          console.error('Could not parse error response as JSON')
          errorDetail = errorText || 'Failed to create checkout session'
        }
        throw new Error(String(errorDetail))
      }

      const checkoutData = await checkoutResponse.json()

      // Clear cart before redirecting
      clear()

      // Redirect to Stripe - check multiple possible field names
      const redirectUrl = checkoutData.checkout_url || checkoutData.url || checkoutData.session_url
      if (redirectUrl) {
        if (isNativeApp()) {
          // Open first: if it fails, the catch below shows the error in the
          // still-open modal and no pending-checkout flag is left to falsely
          // settle on a later resume/browserFinished event.
          await openInAppBrowser(redirectUrl)
          setPendingNativeCheckout('purchase')
          closeCheckoutModal()
        } else {
          window.location.href = redirectUrl
        }
      } else {
        console.error('No checkout URL in response. Full response:', checkoutData)
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)

      // Extract error message properly
      let errorMessage = 'Something went wrong. Please try again.'
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        const msg = error.message
        errorMessage =
          msg === 'Failed to fetch' || msg === 'NetworkError when attempting to fetch resource.'
            ? 'Connection error — please check your internet and try again.'
            : msg
      } else if (error?.detail) {
        errorMessage = error.detail
      }

      checkoutError.value = errorMessage
    } finally {
      isCheckingOut.value = false
    }
  }

  return {
    items,
    panelOpen,
    checkoutOpen,
    checkoutView,
    creditBalance,
    creditsLoading,
    isCheckingOut,
    checkoutError,
    successOrder,
    toastMounted,
    toastVisible,
    total,
    count,
    creditsToApply,
    finalTotal,
    getApiBase,
    init,
    save,
    hasItem,
    addItem,
    removeItem,
    clear,
    getItems,
    getTotal,
    formatPrice,
    updateCartBadge,
    showAddedToast,
    openCartPanel,
    closeCartPanel,
    toggleCartDropdown,
    fetchCreditBalance,
    refreshCheckoutData,
    openCheckoutModal,
    closeCheckoutModal,
    showSuccessMessage,
    processCheckout,
  }
}
