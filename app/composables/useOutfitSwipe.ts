// Style Match swipe feature — deck building from the cached catalog (same
// 'dm_catalog' sessionStorage cache + GET /search the clothing page uses),
// hidden-items list (don't-show-again) with undo, and saved outfits (pairs).
// API contract: /private_clothing_items/hidden_items/* and /private_clothing_items/outfits
// — Auth0 bearer token, account only (no membership check), same pattern as the wishlist.
import type { CatalogItem } from '~/composables/useCatalog'

export interface SwipeItem {
  id: number
  sku: string
  name: string
  brand: string
  size: string
  status: string
  categoryName: string
  image: string
}

export interface SwipeDeck {
  category: string
  rank: number
  /** Selection order — tiebreaker for equal ranks. */
  order: number
  items: SwipeItem[]
}

export interface HiddenToast {
  item: SwipeItem
  category: string
}

// Vertical layout rank per category group (rank 0 renders on top).
const CATEGORY_RANKS: Record<string, number> = {
  'tops': 0,
  'knitwear': 0,
  'blazers': 0,
  'outerwear': 0,
  'sport': 0,
  'loungewear': 0,
  'dresses': 0,
  'jumpsuits': 0,
  'matching sets': 0,
  'sets': 0,
  'jeans': 1,
  'pants': 1,
  'skirts': 1,
  'shorts': 1,
  'shoes': 2,
  'bags': 3,
  'accessories': 3,
}

export function categoryRank(category: string): number {
  const rank = CATEGORY_RANKS[(category || '').toLowerCase().trim()]
  return rank !== undefined ? rank : 1
}

// Same status labels as useCatalog's STATUS_DISPLAY maps.
const STATUS_DISPLAY: Record<string, string> = {
  available: 'Available',
  rented: 'Rented Out',
  reserved: 'Reserved',
  returned: 'Returning Soon',
  purchased: 'Purchased',
  sold: 'Sold',
  damaged: 'Unavailable',
  retired: 'No Longer Available',
  'in cleaning': 'Being Cleaned',
}

const STATUS_DISPLAY_NL: Record<string, string> = {
  available: 'Beschikbaar',
  rented: 'Verhuurd',
  reserved: 'Gereserveerd',
  returned: 'Binnenkort terug',
  purchased: 'Gekocht',
  sold: 'Verkocht',
  damaged: 'Niet beschikbaar',
  retired: 'Niet meer beschikbaar',
  'in cleaning': 'Wordt gereinigd',
}

const CATALOG_STORAGE_KEY = 'dm_catalog'
const HIDDEN_TOAST_MS = 6000

function isAvailable(status: string): boolean {
  const s = (status || 'available').toLowerCase().trim()
  return !s || s === 'available'
}

function getItemSize(item: CatalogItem): string {
  if (item.size_name) return String(item.size_name).trim()
  if (typeof item.size === 'string') return item.size.trim()
  if (item.size && typeof item.size === 'object') {
    return (item.size.name || item.size.size || item.size.value || '').toString().trim()
  }
  if (Array.isArray(item.attributes)) {
    const attr = item.attributes.find((a) => a.key === 'size')
    if (attr) return String(attr.value).trim()
  }
  return ''
}

function getItemBrand(item: CatalogItem): string {
  const brand = item.brand as { brand_name?: string; name?: string } | string | undefined
  if (typeof brand === 'string') return brand.trim()
  if (brand && typeof brand === 'object') return (brand.brand_name || brand.name || '').trim()
  return String(item.brand_name || '').trim()
}

function toSwipeItem(item: CatalogItem): SwipeItem | null {
  const id = Number(item.id)
  if (!id) return null
  const front = String(item.front_image || '')
  const back = String(item.back_image || '')
  const images = (item.images as Array<{ image_type?: string; object_url?: string }> | undefined) || []
  const firstImage = images.find((img) => img.image_type === 'front')?.object_url || images[0]?.object_url || ''
  return {
    id,
    sku: item.sku,
    name: item.name || item.sku || '',
    brand: getItemBrand(item),
    size: getItemSize(item),
    status: (item.status || 'available').toLowerCase().trim() || 'available',
    categoryName: item.category_name || '',
    // Front product image, fallback to the first image available.
    image: front || firstImage || back,
  }
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function pairKey(a: number, b: number): string {
  return [a, b].sort((x, y) => x - y).join('-')
}

export function useOutfitSwipe() {
  const { getToken, isAuthenticated } = useAuth()
  const { locale } = useI18n()
  const apiBase = useRuntimeConfig().public.apiBase as string
  const wishlist = useWishlistManager()

  // ============================================================
  // CATALOG (shared 'dm_catalog' sessionStorage cache + GET /search)
  // ============================================================

  const catalogItems = ref<CatalogItem[]>([])
  const catalogLoaded = ref(false)
  const catalogError = ref(false)

  function loadCachedCatalog(): CatalogItem[] | null {
    try {
      const stored = sessionStorage.getItem(CATALOG_STORAGE_KEY)
      if (!stored) return null
      const { data, timestamp } = JSON.parse(stored)
      if (Date.now() - timestamp > 5 * 60 * 1000) return null
      return data?.items || null
    } catch {
      return null
    }
  }

  async function loadCatalog() {
    catalogError.value = false
    try {
      const cached = loadCachedCatalog()
      if (cached && cached.length) {
        catalogItems.value = cached
      } else {
        const res = await fetch(`${apiBase}/search`, { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        catalogItems.value = data.items || []
        try {
          sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
        } catch {
          // sessionStorage full/unavailable — cache is best-effort only.
        }
      }
      catalogLoaded.value = true
    } catch (err) {
      console.error('[StyleMatch] Catalog load failed:', err)
      catalogError.value = true
    }
  }

  const categories = computed<string[]>(() => {
    const names = new Set<string>()
    catalogItems.value.forEach((item) => {
      if (item.category_name) names.add(item.category_name)
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  })

  function formatStatus(status: string): string {
    const map = locale.value.startsWith('nl') ? STATUS_DISPLAY_NL : STATUS_DISPLAY
    const s = (status || '').toLowerCase().trim()
    if (!s) return map['available']!
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1)
  }

  // ============================================================
  // HIDDEN ITEMS ("don't show me again")
  // ============================================================

  const hiddenIds = ref<number[]>([])

  async function fetchHiddenIds() {
    // Logged out: skip the call — browsing works freely without a hidden list.
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${apiBase}/private_clothing_items/hidden_items/clothing_item_ids/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
      if (!res.ok) {
        console.error('[StyleMatch] Hidden ids fetch failed:', res.status)
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        hiddenIds.value = data.map(Number)
        // With a warm catalog cache the user can start swiping before this
        // response lands — prune hidden items from any already-built decks.
        const hidden = new Set(hiddenIds.value)
        decks.value.forEach((deck) => {
          if (deck.items.some((i) => hidden.has(i.id))) {
            deck.items = deck.items.filter((i) => !hidden.has(i.id))
          }
        })
      }
    } catch (err) {
      console.error('[StyleMatch] Hidden ids fetch error:', err)
    }
  }

  // ============================================================
  // DECKS
  // ============================================================

  const decks = ref<SwipeDeck[]>([])

  function buildDeckItems(category: string): SwipeItem[] {
    const excluded = new Set<number>([...wishlist.wishlistIds.value, ...hiddenIds.value])
    const pool: SwipeItem[] = []
    catalogItems.value.forEach((raw) => {
      if ((raw.category_name || '') !== category) return
      const item = toSwipeItem(raw)
      if (!item || excluded.has(item.id)) return
      pool.push(item)
    })
    // Shuffle, then keep Available items ahead of Rented/Reserved/etc.
    const shuffled = shuffle(pool)
    return [...shuffled.filter((i) => isAvailable(i.status)), ...shuffled.filter((i) => !isAvailable(i.status))]
  }

  function buildDecks(selectedCategories: string[]) {
    decks.value = selectedCategories
      .map((category, order) => ({
        category,
        rank: categoryRank(category),
        order,
        items: buildDeckItems(category),
      }))
      .sort((a, b) => a.rank - b.rank || a.order - b.order)
  }

  function restartDeck(deck: SwipeDeck) {
    // By design there is NO swipe memory: reshuffle brings seen items back.
    deck.items = buildDeckItems(deck.category)
  }

  function removeFromDeck(deck: SwipeDeck, item: SwipeItem) {
    // By id, not by position: the swiped card only emits after its 260ms leave
    // animation, and an undo (or a failed hide) can restore another card to the
    // top of the deck in that window — shift() would remove the restored card
    // and strand the off-screen one as an inert top card.
    deck.items = deck.items.filter((i) => i.id !== item.id)
  }

  // ============================================================
  // HIDE + UNDO (optimistic, with snackbar)
  // ============================================================

  const hiddenToast = ref<HiddenToast | null>(null)
  const hideError = ref(false)
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  let hideErrorTimer: ReturnType<typeof setTimeout> | undefined

  function clearToast() {
    clearTimeout(toastTimer)
    hiddenToast.value = null
  }

  function flashHideError() {
    clearTimeout(hideErrorTimer)
    hideError.value = true
    hideErrorTimer = setTimeout(() => {
      hideError.value = false
    }, 4000)
  }

  async function hideItem(deck: SwipeDeck, item: SwipeItem) {
    // Optimistic: remove from the deck right away and show the undo snackbar.
    deck.items = deck.items.filter((i) => i.id !== item.id)
    clearToast()
    hiddenToast.value = { item, category: deck.category }
    toastTimer = setTimeout(() => {
      hiddenToast.value = null
    }, HIDDEN_TOAST_MS)

    const token = await getToken()
    if (!token) return

    try {
      const res = await fetch(`${apiBase}/private_clothing_items/hidden_items/${item.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!hiddenIds.value.includes(item.id)) hiddenIds.value = [...hiddenIds.value, item.id]
    } catch (err) {
      console.error('[StyleMatch] Hide failed:', err)
      // Revert: put the card back on top of its deck.
      if (hiddenToast.value?.item.id === item.id) clearToast()
      restoreToDeck(deck.category, item)
      flashHideError()
    }
  }

  function restoreToDeck(category: string, item: SwipeItem) {
    const deck = decks.value.find((d) => d.category === category)
    if (deck && !deck.items.some((i) => i.id === item.id)) {
      deck.items = [item, ...deck.items]
    }
  }

  async function undoHide() {
    const toast = hiddenToast.value
    if (!toast) return
    clearToast()
    // Optimistic: restore the card to the top of its deck.
    restoreToDeck(toast.category, toast.item)
    hiddenIds.value = hiddenIds.value.filter((id) => id !== toast.item.id)

    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${apiBase}/private_clothing_items/hidden_items/${toast.item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
      // 404 = it was never hidden (e.g. the POST had failed) — nothing to revert.
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      console.error('[StyleMatch] Undo hide failed:', err)
    }
  }

  // ============================================================
  // SAVE OUTFIT (pair of the two currently-visible cards)
  // ============================================================

  // Pair-key → outfit id, seeded from GET outfits so re-saving an existing
  // pair reports "already saved" instead of pretending it is new.
  const savedPairs = new Map<string, number>()
  let savedPairsSeeded = false

  async function seedSavedPairs() {
    if (savedPairsSeeded) return
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${apiBase}/private_clothing_items/outfits`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
      if (!res.ok) return
      const data = await res.json()
      const outfits = Array.isArray(data) ? data : []
      outfits.forEach((outfit: { id: number; items?: Array<{ id: number }>; clothing_item_ids?: number[] }) => {
        const ids = outfit.clothing_item_ids || (outfit.items || []).map((i) => Number(i.id))
        if (ids.length === 2) savedPairs.set(pairKey(Number(ids[0]), Number(ids[1])), Number(outfit.id))
      })
      savedPairsSeeded = true
    } catch (err) {
      console.error('[StyleMatch] Outfits seed failed:', err)
    }
  }

  async function saveOutfit(idA: number, idB: number): Promise<'saved' | 'exists' | 'error'> {
    const token = await getToken()
    if (!token) return 'error'
    const key = pairKey(idA, idB)
    try {
      const res = await fetch(`${apiBase}/private_clothing_items/outfits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ clothing_item_ids: [idA, idB] }),
      })
      if (!res.ok) return 'error'
      const outfit = await res.json()
      const outfitId = Number(outfit?.id)
      // The API returns the existing outfit for a duplicate pair.
      const exists = savedPairs.get(key) === outfitId && !!outfitId
      if (outfitId) savedPairs.set(key, outfitId)
      return exists ? 'exists' : 'saved'
    } catch (err) {
      console.error('[StyleMatch] Save outfit failed:', err)
      return 'error'
    }
  }

  // ============================================================
  // INIT
  // ============================================================

  async function init() {
    wishlist.init().catch(() => {})
    await Promise.all([loadCatalog(), fetchHiddenIds()])
  }

  function dispose() {
    clearTimeout(toastTimer)
    clearTimeout(hideErrorTimer)
  }

  return {
    // state
    catalogLoaded,
    catalogError,
    categories,
    decks,
    hiddenIds,
    hiddenToast,
    hideError,
    isAuthenticated,
    wishlist,
    // helpers
    formatStatus,
    categoryRank,
    // actions
    init,
    dispose,
    buildDecks,
    restartDeck,
    removeFromDeck,
    hideItem,
    undoHide,
    seedSavedPairs,
    saveOutfit,
  }
}
