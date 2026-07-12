// Partner reservation cart — STUB for this phase. The reservation-flow phase replaces
// the internals (localStorage 'demat_partner_cart' persistence, the 10-item cap, the
// slide-out panel and the checkout modal) but keeps this exact interface, so PDP
// callers can already ship their reserve buttons: until then addItem answers
// {success: false, reason: 'not_ready'} and the cart stays empty.

export interface PartnerCartItem {
  pp_id: string
  intent: 'purchase' | 'rental'
  title: string
  partner_slug: string
  partner_name: string
  image: string
  price_cents: number | null
  member_price_cents: number | null
  hold_deposit_cents: number | null
  addedAt: number
}

export interface PartnerCartAddResult {
  success: boolean
  reason?: string
}

export function usePartnerCart() {
  // localStorage 'demat_partner_cart' NOT wired yet — items stay empty this phase.
  const items = useState<PartnerCartItem[]>('pp-cart-items', () => [])
  const panelOpen = useState<boolean>('pp-cart-panel-open', () => false)
  const checkoutOpen = useState<boolean>('pp-cart-checkout-open', () => false)

  const count = computed(() => items.value.length)

  function addItem(_item: PartnerCartItem): PartnerCartAddResult {
    return { success: false, reason: 'not_ready' }
  }

  function removeItem(pp_id: string) {
    items.value = items.value.filter((i) => i.pp_id !== pp_id)
  }

  function clear() {
    items.value = []
  }

  function openPanel() {
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  function openCheckout() {
    checkoutOpen.value = true
  }

  return {
    items,
    count,
    addItem,
    removeItem,
    clear,
    openPanel,
    closePanel,
    panelOpen,
    openCheckout,
    checkoutOpen,
  }
}
