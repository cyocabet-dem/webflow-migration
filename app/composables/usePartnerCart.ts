// Partner reservation cart — real implementation (reservation-flow phase).
// Interface superset of the phase-1 stub: the frozen surface (items/count/addItem/
// removeItem/clear/openPanel/closePanel/panelOpen/openCheckout/checkoutOpen) is
// unchanged, so PDP callers keep working; this phase adds localStorage persistence
// (CONTRACT §6: 'demat_partner_cart', cap 10), partner grouping, and the checkout
// orchestration (card on file → terms → confirm → per-item results, CONTRACT §3.3).
//
// Hydration note: items are ONLY read from localStorage in init(), which the
// partner-cart plugin calls on app:mounted — the server and the first client render
// always see an empty cart, and the components additionally gate on a hydrated ref.

import type { PartnerTermsDoc } from './usePartnerCatalog'

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

export interface PartnerCartGroup {
  partner_slug: string
  partner_name: string
  items: PartnerCartItem[]
}

// GET /user/card (CONTRACT §3.3)
export interface PartnerCardStatus {
  has_card: boolean
  brand: string | null
  last4: string | null
  pending_setup: boolean
}

export interface PartnerCheckoutTermsGroup {
  partner_slug: string
  partner_name: string
  partner_hash_id: string
  address: string | null
  terms: PartnerTermsDoc[]
  accepted: boolean
}

// POST /user/reservations per-item result, enriched with a cart snapshot of
// title/image so the results step can still render items that succeeded
// (successes are removed from the cart immediately).
export interface PartnerCheckoutResult {
  item_hash_id: string
  ok: boolean
  title: string
  image: string
  reservation: Record<string, any> | null
  error: { code: string; message: string } | null
}

export type PartnerCheckoutStep = 'card' | 'terms' | 'confirm' | 'results'

export interface PartnerCheckoutState {
  step: PartnerCheckoutStep
  cardStatus: PartnerCardStatus | null
  cardLoading: boolean
  termsByPartner: PartnerCheckoutTermsGroup[]
  termsLoading: boolean
  results: PartnerCheckoutResult[] | null
  submitting: boolean
  /** Known code ('card_required', 'stale_terms', 'network', …) the UI maps via partner.errors.* */
  error: string | null
  /** Raw backend message fallback for codes without dedicated copy */
  errorMessage: string | null
  /** User came back from Stripe setup with ?pp_setup=cancelled — gentle note on the card step */
  setupCancelled: boolean
}

const STORAGE_KEY = 'demat_partner_cart'
const SNAPSHOT_KEY = 'pp_pending_checkout'
const MAX_ITEMS = 10

function emptyCheckoutState(): PartnerCheckoutState {
  return {
    step: 'card',
    cardStatus: null,
    cardLoading: false,
    termsByPartner: [],
    termsLoading: false,
    results: null,
    submitting: false,
    error: null,
    errorMessage: null,
    setupCancelled: false,
  }
}

/** Defensive parse of persisted cart entries (localStorage / sessionStorage snapshot). */
function sanitizeItems(raw: unknown): PartnerCartItem[] {
  if (!Array.isArray(raw)) return []
  const out: PartnerCartItem[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const it = entry as Record<string, unknown>
    if (typeof it.pp_id !== 'string' || !it.pp_id) continue
    if (it.intent !== 'purchase' && it.intent !== 'rental') continue
    if (seen.has(it.pp_id)) continue
    seen.add(it.pp_id)
    out.push({
      pp_id: it.pp_id,
      intent: it.intent,
      title: typeof it.title === 'string' ? it.title : '',
      partner_slug: typeof it.partner_slug === 'string' ? it.partner_slug : '',
      partner_name: typeof it.partner_name === 'string' ? it.partner_name : '',
      image: typeof it.image === 'string' ? it.image : '',
      price_cents: typeof it.price_cents === 'number' ? it.price_cents : null,
      member_price_cents: typeof it.member_price_cents === 'number' ? it.member_price_cents : null,
      hold_deposit_cents: typeof it.hold_deposit_cents === 'number' ? it.hold_deposit_cents : null,
      addedAt: typeof it.addedAt === 'number' ? it.addedAt : Date.now(),
    })
    if (out.length >= MAX_ITEMS) break
  }
  return out
}

export function usePartnerCart() {
  const { ppFetch } = usePartnerPlatform()

  const items = useState<PartnerCartItem[]>('pp-cart-items', () => [])
  const panelOpen = useState<boolean>('pp-cart-panel-open', () => false)
  const checkoutOpen = useState<boolean>('pp-cart-checkout-open', () => false)
  const checkoutState = useState<PartnerCheckoutState>('pp-checkout-state', emptyCheckoutState)

  const count = computed(() => items.value.length)

  /** Items grouped by partner (insertion order preserved) for the panel + confirm step. */
  const grouped = computed<PartnerCartGroup[]>(() => {
    const map = new Map<string, PartnerCartGroup>()
    for (const item of items.value) {
      let group = map.get(item.partner_slug)
      if (!group) {
        group = { partner_slug: item.partner_slug, partner_name: item.partner_name, items: [] }
        map.set(item.partner_slug, group)
      }
      group.items.push(item)
    }
    return [...map.values()]
  })

  /** Sum of hold deposits across the cart (authorised, never charged) — footer note. */
  const holdDepositTotal = computed(() =>
    items.value.reduce((sum, i) => sum + (i.hold_deposit_cents || 0), 0),
  )

  // ============================================================
  // Persistence — localStorage 'demat_partner_cart' (CONTRACT §6)
  // ============================================================

  /** Called by the partner-cart plugin on app:mounted (never during SSR/hydration). */
  function init() {
    if (!import.meta.client) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) items.value = sanitizeItems(JSON.parse(saved))
    } catch {
      /* corrupt/blocked storage — start empty */
    }
  }

  function save() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch {
      /* storage full/blocked — in-memory cart still works */
    }
  }

  // ============================================================
  // Cart mutations
  // ============================================================

  function addItem(item: PartnerCartItem): PartnerCartAddResult {
    if (items.value.some((i) => i.pp_id === item.pp_id)) {
      // One unique piece — an item can only be reserved once, regardless of intent.
      return { success: false, reason: 'already_in_cart' }
    }
    if (items.value.length >= MAX_ITEMS) {
      return { success: false, reason: 'max_items' }
    }
    items.value = [...items.value, item]
    save()
    return { success: true }
  }

  function removeItem(pp_id: string) {
    items.value = items.value.filter((i) => i.pp_id !== pp_id)
    save()
  }

  function clear() {
    items.value = []
    save()
  }

  // ============================================================
  // Panel / modal visibility (body overflow lock lives in the components)
  // ============================================================

  function openPanel() {
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  function resetCheckout() {
    checkoutState.value = emptyCheckoutState()
  }

  function openCheckout() {
    panelOpen.value = false
    resetCheckout()
    checkoutOpen.value = true
    if (import.meta.client) loadCard()
  }

  function closeCheckout() {
    checkoutOpen.value = false
  }

  // ============================================================
  // Checkout orchestration — card step
  // ============================================================

  /** GET /user/card — the backend lazy-syncs the last setup session (no webhook needed). */
  async function loadCard() {
    const s = checkoutState.value
    s.cardLoading = true
    s.error = null
    s.errorMessage = null
    try {
      s.cardStatus = await ppFetch<PartnerCardStatus>('/user/card')
    } catch (e) {
      s.cardStatus = null
      s.error = 'network'
      if (e instanceof PartnerApiError) s.errorMessage = e.message
    } finally {
      s.cardLoading = false
    }
  }

  /**
   * POST /user/card-setup → hosted Stripe redirect. The cart is snapshotted to
   * sessionStorage BEFORE navigating away so resumeFromSetup can restore it even
   * if localStorage was cleared mid-flight.
   */
  async function startCardSetup() {
    if (!import.meta.client) return
    const s = checkoutState.value
    s.error = null
    s.errorMessage = null
    s.setupCancelled = false
    const base = window.location.origin + window.location.pathname
    try {
      const data = await ppFetch<{ checkout_url: string; session_id: string }>(
        '/user/card-setup',
        {
          method: 'POST',
          body: {
            success_url: `${base}?pp_setup=success`,
            cancel_url: `${base}?pp_setup=cancelled`,
          },
        },
      )
      if (!data?.checkout_url) throw new PartnerApiError(502, 'no checkout url')
      try {
        sessionStorage.setItem(
          SNAPSHOT_KEY,
          JSON.stringify({ items: items.value, step: 'card' }),
        )
      } catch {
        /* snapshot is belt-and-braces on top of localStorage */
      }
      window.location.href = data.checkout_url
    } catch (e) {
      s.error = 'network'
      if (e instanceof PartnerApiError) s.errorMessage = e.message
    }
  }

  /**
   * Called by the partner-cart plugin when the page loads with ?pp_setup=success|cancelled
   * (back from the Stripe setup redirect): restore the sessionStorage snapshot into the
   * cart (conservative merge — keep whichever list is non-empty), strip the query param,
   * reopen checkout on the card step and re-check the card (the backend lazy-syncs the
   * setup session). On 'cancelled' the card step shows a gentle inline note.
   */
  function resumeFromSetup(outcome: 'success' | 'cancelled') {
    if (!import.meta.client) return
    try {
      const raw = sessionStorage.getItem(SNAPSHOT_KEY)
      if (raw) {
        const snapshotItems = sanitizeItems(JSON.parse(raw)?.items)
        if (items.value.length === 0 && snapshotItems.length > 0) {
          items.value = snapshotItems
          save()
        }
      }
    } catch {
      /* unreadable snapshot — the localStorage cart is still there */
    }
    try {
      sessionStorage.removeItem(SNAPSHOT_KEY)
    } catch {
      /* ignore */
    }
    stripSetupParam()
    panelOpen.value = false
    resetCheckout()
    checkoutState.value.setupCancelled = outcome === 'cancelled'
    checkoutOpen.value = true
    loadCard()
  }

  function stripSetupParam() {
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('pp_setup')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    } catch {
      /* ignore */
    }
  }

  // ============================================================
  // Checkout orchestration — terms step
  // ============================================================

  /**
   * Fetch each partner group's current terms (GET /public/partners/{slug}/terms via
   * fetchPartnerTerms) filtered to the types the group's intents need (purchase →
   * 'purchase', rental → 'rental'). A partner with nothing published for a needed type
   * simply shows an empty/partial list and acceptance proceeds (empty accepted list) —
   * the backend is authoritative and 409s stale_terms if we're out of sync.
   * Partner hash_ids (needed for accepted_terms) come from the public directory in one
   * request; unknown slugs fall back to the storefront endpoint.
   */
  async function loadTerms() {
    const s = checkoutState.value
    s.termsLoading = true
    s.error = null
    s.errorMessage = null
    try {
      const directory = await fetchPartnerDirectory() // [] on any failure
      const bySlug = new Map(directory.map((p) => [p.slug, p]))
      const groups: PartnerCheckoutTermsGroup[] = []
      for (const g of grouped.value) {
        const neededTypes = new Set(g.items.map((i) => (i.intent === 'purchase' ? 'purchase' : 'rental')))
        const allTerms = await fetchPartnerTerms(g.partner_slug) // [] on any failure
        const relevant = allTerms.filter((t) => neededTypes.has(t.type))
        let hashId = bySlug.get(g.partner_slug)?.hash_id || ''
        if (!hashId) {
          try {
            hashId = (await fetchStorefront(g.partner_slug))?.hash_id || ''
          } catch {
            /* transport failure — submit will surface the backend's verdict */
          }
        }
        groups.push({
          partner_slug: g.partner_slug,
          partner_name: g.partner_name,
          partner_hash_id: hashId,
          address: bySlug.get(g.partner_slug)?.address ?? null,
          terms: relevant,
          accepted: relevant.length === 0, // nothing published → nothing to tick
        })
      }
      s.termsByPartner = groups
    } finally {
      s.termsLoading = false
    }
  }

  const allTermsAccepted = computed(() =>
    checkoutState.value.termsByPartner.every((g) => g.accepted),
  )

  async function continueToTerms() {
    const s = checkoutState.value
    s.step = 'terms'
    await loadTerms()
  }

  function continueToConfirm() {
    const s = checkoutState.value
    if (!allTermsAccepted.value) return
    s.error = null
    s.errorMessage = null
    s.step = 'confirm'
  }

  function goToStep(step: PartnerCheckoutStep) {
    checkoutState.value.step = step
  }

  // ============================================================
  // Checkout orchestration — submit (CONTRACT §3.3 POST /user/reservations)
  // ============================================================

  async function submit() {
    const s = checkoutState.value
    if (s.submitting || items.value.length === 0) return
    s.submitting = true
    s.error = null
    s.errorMessage = null
    // Snapshot titles/images now: successful items leave the cart before rendering.
    const snapshot = new Map(items.value.map((i) => [i.pp_id, i]))
    try {
      const body = {
        items: items.value.map((i) => ({ item_hash_id: i.pp_id, intent: i.intent })),
        accepted_terms: s.termsByPartner.map((g) => ({
          partner_hash_id: g.partner_hash_id,
          terms_version_hash_ids: g.terms.map((t) => String(t.hash_id)),
        })),
      }
      const data = await ppFetch<{ results: Array<Record<string, any>> }>('/user/reservations', {
        method: 'POST',
        body,
      })
      const raw = Array.isArray(data?.results) ? data.results : []
      const results: PartnerCheckoutResult[] = raw.map((r) => {
        const cartItem = snapshot.get(r.item_hash_id)
        return {
          item_hash_id: String(r.item_hash_id ?? ''),
          ok: r.ok === true,
          title: cartItem?.title || r.reservation?.item?.title || '',
          image: cartItem?.image || r.reservation?.item?.photo_url || '',
          reservation: r.reservation ?? null,
          error: r.error ?? null,
        }
      })
      for (const r of results) {
        if (r.ok) removeItem(r.item_hash_id) // failures stay in the cart for a retry
      }
      s.results = results
      s.step = 'results'
    } catch (e) {
      if (e instanceof PartnerApiError && e.status === 409 && e.code === 'card_required') {
        // Whole-request reject: no card on file (it may have been removed since the
        // card step) — jump back and re-check.
        s.step = 'card'
        s.error = 'card_required'
        loadCard()
      } else if (e instanceof PartnerApiError && e.status === 409 && e.code === 'stale_terms') {
        // Terms changed under us. error.detail.current lists the now-current versions;
        // the public terms endpoint returns exactly those, so re-sync by refetching and
        // force re-acceptance with a notice.
        s.step = 'terms'
        s.error = 'stale_terms'
        await loadTerms()
      } else if (e instanceof PartnerApiError) {
        s.error = e.code || 'generic'
        s.errorMessage = e.message
      } else {
        s.error = 'network'
      }
    } finally {
      s.submitting = false
    }
  }

  return {
    // frozen stub surface
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
    // persistence + grouping
    init,
    save,
    grouped,
    holdDepositTotal,
    // checkout orchestration
    checkoutState,
    allTermsAccepted,
    closeCheckout,
    resetCheckout,
    loadCard,
    startCardSetup,
    resumeFromSetup,
    loadTerms,
    continueToTerms,
    continueToConfirm,
    goToStep,
    submit,
  }
}
