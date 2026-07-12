// Partner platform — public catalog access (CONTRACT §3.2) + CatalogItem mapping
// (CONTRACT §6). Everything degrades gracefully, same as useBlogPosts: the list
// fetchers resolve [] and fetchItemDetail resolves null on ANY failure, so the site
// renders exactly as it did before this feature existed when the API is down.
// fetchStorefront is the one deliberate exception: it resolves null ONLY for an
// unknown slug (a genuine 404) and throws on transport errors so the storefront
// page can show a retry state instead of a wrong "not found".

import type { CatalogItem } from './useCatalog'

// ============================================================
// CONTRACT §3.2 response shapes
// ============================================================

export type PartnerItemStatus = 'available' | 'reserved' | 'rented'

export interface PartnerCatalogPhoto {
  url: string
  kind: string | null
}

export interface PartnerPublicRef {
  hash_id: string
  name: string
  slug: string
}

export interface PartnerCatalogItem {
  hash_id: string
  title: string
  brand: string | null
  size: string | null
  category: string | null
  condition: string | null
  status: PartnerItemStatus
  photos: PartnerCatalogPhoto[]
  partner: PartnerPublicRef
  available_for_purchase: boolean
  available_for_rental: boolean
  // Price fields are null when that capability is off; member + non-member prices
  // are always both present when the capability is on. Never computed locally.
  purchase_price_cents: number | null
  member_purchase_price_cents: number | null
  rental_price_2wk_cents: number | null
  member_rental_price_2wk_cents: number | null
  member_discount_pct: number
}

export interface PartnerTermsRef {
  hash_id: string
  type: string
  version: number | string
}

export interface PartnerItemDetail extends PartnerCatalogItem {
  description: string | null
  rental_min_weeks: number | null
  rental_max_weeks: number | null
  rental_deposit_cents: number | null
  hold_deposit_cents: number | null
  partner: PartnerPublicRef & { address: string | null; pickup_instructions: string | null }
  current_terms: PartnerTermsRef[]
}

export interface PartnerDirectoryEntry {
  hash_id: string
  name: string
  slug: string
  photo_url: string | null
  address: string | null
  lat: number | null
  lng: number | null
  item_count: number
}

export interface PartnerOpeningHour {
  day: string
  open: string
  close: string
}

export interface PartnerStorefrontTermsRef extends PartnerTermsRef {
  effective_from: string | null
}

export interface PartnerStorefront {
  hash_id: string
  name: string
  slug: string
  about: string | null
  hours: PartnerOpeningHour[] | null
  address: string | null
  lat: number | null
  lng: number | null
  pickup_instructions: string | null
  photos: string[]
  member_discount_pct: number
  terms: PartnerStorefrontTermsRef[]
  items: PartnerCatalogItem[]
}

export interface PartnerTermsDoc {
  hash_id: string
  type: string
  version: number | string
  body_text: string | null
  pdf_url: string | null
  effective_from: string | null
}

// ============================================================
// CatalogItem-compatible mapping (CONTRACT §6)
// ============================================================

export interface PartnerMappedItem extends CatalogItem {
  is_partner: true
  pp_id: string
  sku: string
  name: string
  status: PartnerItemStatus
  front_image: string
  back_image: string
  brand: string
  condition: string
  partner_name: string
  partner_slug: string
  available_for_purchase: boolean
  available_for_rental: boolean
  purchase_price_cents: number | null
  member_purchase_price_cents: number | null
  rental_price_2wk_cents: number | null
  member_rental_price_2wk_cents: number | null
  member_discount_pct: number
}

export function mapToCatalogItem(item: PartnerCatalogItem): PartnerMappedItem {
  const photos = item.photos || []
  return {
    is_partner: true,
    pp_id: item.hash_id,
    sku: 'pp-' + item.hash_id,
    name: item.title || '',
    status: item.status,
    front_image: photos[0]?.url || '',
    back_image: photos[1]?.url || photos[0]?.url || '',
    brand: item.brand || '',
    size: item.size || '',
    category: item.category || '',
    category_name: item.category || '',
    condition: item.condition || '',
    partner_name: item.partner?.name || '',
    partner_slug: item.partner?.slug || '',
    available_for_purchase: !!item.available_for_purchase,
    available_for_rental: !!item.available_for_rental,
    purchase_price_cents: item.purchase_price_cents ?? null,
    member_purchase_price_cents: item.member_purchase_price_cents ?? null,
    rental_price_2wk_cents: item.rental_price_2wk_cents ?? null,
    member_rental_price_2wk_cents: item.member_rental_price_2wk_cents ?? null,
    member_discount_pct: item.member_discount_pct ?? 0,
  }
}

// ============================================================
// Price formatting — cents ints from the API, € with comma decimals
// ============================================================

export function ppFormatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return ''
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`
}

// ============================================================
// sessionStorage cache ('dm_partner_catalog', 5-min TTL — mirrors useCatalogCache)
// ============================================================

const CACHE_KEY = 'dm_partner_catalog'
const CACHE_TTL_MS = 5 * 60 * 1000

function getCachedItems(): PartnerCatalogItem[] | null {
  try {
    const stored = sessionStorage.getItem(CACHE_KEY)
    if (!stored) return null
    const { data, timestamp } = JSON.parse(stored)
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return Array.isArray(data?.items) ? data.items : null
    }
  } catch {
    /* corrupt cache — refetch */
  }
  return null
}

function cacheItems(data: { items: PartnerCatalogItem[] }) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    /* storage full/blocked — fetch still succeeded */
  }
}

// ============================================================
// Public fetchers (all auth:'none'; client-only surfaces call these onMounted)
// ============================================================

/** GET /public/items → CatalogItem-compatible array. [] on ANY failure (never throws). */
export async function fetchPartnerItems(): Promise<PartnerMappedItem[]> {
  if (!import.meta.client) return []
  try {
    const cached = getCachedItems()
    if (cached) return cached.map(mapToCatalogItem)
    const { ppFetch } = usePartnerPlatform()
    const data = await ppFetch<{ items: PartnerCatalogItem[] }>('/public/items', { auth: 'none' })
    const items = Array.isArray(data?.items) ? data.items : []
    cacheItems({ items })
    return items.map(mapToCatalogItem)
  } catch {
    return []
  }
}

/** GET /public/partners → directory entries. [] on ANY failure (never throws). */
export async function fetchPartnerDirectory(): Promise<PartnerDirectoryEntry[]> {
  if (!import.meta.client) return []
  try {
    const { ppFetch } = usePartnerPlatform()
    const data = await ppFetch<PartnerDirectoryEntry[]>('/public/partners', { auth: 'none' })
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * GET /public/partners/{slug} → storefront.
 * null ONLY when the slug is unknown (404 → real not-found page); throws on other
 * failures so callers can degrade to an error/retry state instead of a wrong 404.
 */
export async function fetchStorefront(slug: string): Promise<PartnerStorefront | null> {
  const { ppFetch } = usePartnerPlatform()
  try {
    return await ppFetch<PartnerStorefront>(`/public/partners/${encodeURIComponent(slug)}`, {
      auth: 'none',
    })
  } catch (e) {
    if (e instanceof PartnerApiError && e.status === 404) return null
    throw e
  }
}

/** GET /public/items/{hash_id} → item detail. null on ANY failure (never throws). */
export async function fetchItemDetail(hashId: string): Promise<PartnerItemDetail | null> {
  if (!import.meta.client) return null
  try {
    const { ppFetch } = usePartnerPlatform()
    return await ppFetch<PartnerItemDetail>(`/public/items/${encodeURIComponent(hashId)}`, {
      auth: 'none',
    })
  } catch {
    return null
  }
}

/** GET /public/partners/{slug}/terms → current term versions with body/pdf. [] on ANY failure. */
export async function fetchPartnerTerms(slug: string): Promise<PartnerTermsDoc[]> {
  if (!import.meta.client) return []
  try {
    const { ppFetch } = usePartnerPlatform()
    const data = await ppFetch<PartnerTermsDoc[]>(
      `/public/partners/${encodeURIComponent(slug)}/terms`,
      { auth: 'none' },
    )
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Convenience bundle for pages that want a single import point. */
export function usePartnerCatalog() {
  return {
    fetchPartnerItems,
    fetchPartnerDirectory,
    fetchStorefront,
    fetchItemDetail,
    fetchPartnerTerms,
    mapToCatalogItem,
    ppFormatPrice,
  }
}
