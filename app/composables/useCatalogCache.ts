// Catalog sessionStorage cache ('dm_catalog', 5-min TTL) — ported from pdp.js / clothing.js.
export function useCatalogCache() {
  const CATALOG_STORAGE_KEY = 'dm_catalog'
  const config = useRuntimeConfig()

  function getCachedCatalog(): any[] | null {
    try {
      const stored = sessionStorage.getItem(CATALOG_STORAGE_KEY)
      if (!stored) return null
      const { data, timestamp } = JSON.parse(stored)
      // 5 min TTL
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data.items || []
      }
    } catch (e) {}
    return null
  }

  async function fetchAndCacheCatalog(): Promise<any[]> {
    try {
      const res = await fetch(`${config.public.apiBase}/clothing_items/catalog/full`, {
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) return []
      const data = await res.json()

      try {
        sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({
          data,
          timestamp: Date.now(),
        }))
      } catch (e) {}

      return data.items || []
    } catch (e) {
      console.warn('[PDP] Catalog fetch failed:', e)
      return []
    }
  }

  return { getCachedCatalog, fetchAndCacheCatalog }
}
