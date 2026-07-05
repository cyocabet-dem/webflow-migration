// Faithful port of old/demat-webflow-test/clothing.js — client-side catalog with
// slide-out filter panel, live counts, chips, URL sync, search and pagination.

export interface CatalogItem {
  id?: number | string
  sku: string
  name?: string
  status?: string
  front_image?: string
  back_image?: string
  category_id?: number | string
  category_name?: string
  subcategory_id?: number | string
  subcategory_name?: string
  color_names?: string[]
  color_ids?: Array<number | string>
  size?: string | { name?: string; size?: string; value?: string }
  size_name?: string
  attributes?: Array<{ key: string; value: string }>
  [key: string]: unknown
}

export interface FilterOption {
  id: number | string
  name: string
  category_id?: number | string
}

export interface FilterRow extends FilterOption {
  count: number
  checked: boolean
}

export const EXTRA_FILTERS = [
  { type: 'sleeve_length', label: 'sleeve length', field: 'sleeve_length', attrKey: 'sleeve_length' },
  { type: 'rise', label: 'rise', field: 'rise', attrKey: 'rise' },
  { type: 'length', label: 'length', field: 'length', attrKey: 'length' },
  { type: 'material', label: 'material', field: 'material', attrKey: 'material' },
  { type: 'fit', label: 'fit', field: 'fit', attrKey: 'fit' },
  { type: 'pattern', label: 'pattern', field: 'pattern', attrKey: 'pattern' },
  { type: 'neckline', label: 'neckline', field: 'neckline', attrKey: 'neckline' },
] as const

type ExtraFilterDef = (typeof EXTRA_FILTERS)[number]

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

const STORAGE_KEY = 'dm_catalog'
const ITEMS_PER_PAGE = 20
const STANDARD_PROFILE_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const SIZE_ORDER_REF = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', 'One Size']

export function useCatalog() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const router = useRouter()
  const { locale } = useI18n()

  const BASE = config.public.apiBase
  const CATALOG_URL = `${BASE}/search`
  const SUBCATEGORIES_URL = `${BASE}/clothing_items/subcategories`
  const SIZES_URL = `${BASE}/clothing_items/sizes`

  const isNL = computed(() => locale.value.startsWith('nl'))

  // ============================================================
  // STATE
  // ============================================================

  const catalogData = ref<{ items: CatalogItem[]; filters?: unknown; query?: string } | null>(null)
  const items = computed<CatalogItem[]>(() => catalogData.value?.items || [])
  const loaded = ref(false)
  const loadError = ref(false)
  const currentPage = ref(1)
  const searchQuery = ref('')
  const searchInputValue = ref('')
  const apiSubcategories = ref<Array<{ id: number | string; name: string; category_id?: number | string; active?: boolean }>>([])

  // Size profile data (from GET /clothing_items/sizes)
  const sizeMaps = shallowRef({
    profileToSpecific: new Map<string, Set<string>>(),
    specificToProfile: new Map<string, string>(),
    standardSizeOrder: [] as string[],
  })

  const selected = reactive<Record<string, string[]>>({
    categories: [],
    subcategories: [],
    colors: [],
    size: [],
    status: [],
    sleeve_length: [],
    rise: [],
    length: [],
    material: [],
    fit: [],
    pattern: [],
    neckline: [],
  })

  function selKey(type: string): string {
    if (type === 'category') return 'categories'
    if (type === 'subcategory') return 'subcategories'
    if (type === 'color') return 'colors'
    return type
  }

  function countsKey(type: string): string {
    if (type === 'category') return 'categories'
    if (type === 'subcategory') return 'subcategories'
    if (type === 'color') return 'colors'
    return type
  }

  // ============================================================
  // STATUS + LOCALE HELPERS
  // ============================================================

  function formatStatus(status?: string): string {
    const map = isNL.value ? STATUS_DISPLAY_NL : STATUS_DISPLAY
    const s = (status || '').toLowerCase().trim()
    if (!s) return map['available']!
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1)
  }

  function productPath(sku: string): string {
    const base = isNL.value ? '/nl/product' : '/product'
    return `${base}?sku=${encodeURIComponent(sku)}`
  }

  function cardMeta(item: CatalogItem): string {
    const size = getItemSize(item)
    const displayStatus = formatStatus(item.status).toLowerCase()
    const sizeUpper = size ? size.toUpperCase() : ''
    return sizeUpper ? `${sizeUpper} | ${displayStatus}` : displayStatus
  }

  function statusClass(item: CatalogItem): string {
    return 'status-' + (item.status || 'available').toLowerCase().trim().replace(/\s+/g, '-')
  }

  // ============================================================
  // EXTRA FILTER VALUE LOOKUP
  // ============================================================

  function getExtraValue(item: CatalogItem, filterDef: ExtraFilterDef): string {
    let val = item[filterDef.field] as string | undefined
    if (!val && filterDef.field && item[filterDef.type]) {
      const nested = item[filterDef.type] as Record<string, string> | string
      if (typeof nested === 'object' && nested !== null) {
        val = nested.name || nested[filterDef.field] || nested.value
      } else if (typeof nested === 'string') {
        val = nested
      }
    }
    if (!val && filterDef.attrKey && Array.isArray(item.attributes)) {
      const attr = item.attributes.find((a) => a.key === filterDef.attrKey)
      if (attr) val = attr.value
    }
    if (typeof val === 'string') val = val.trim()
    return val || ''
  }

  // ============================================================
  // FETCH: SUBCATEGORIES
  // ============================================================

  async function fetchSubcategories() {
    try {
      const res = await fetch(SUBCATEGORIES_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      apiSubcategories.value = (data.subcategories || data || []).filter(
        (s: { active?: boolean }) => s.active !== false,
      )
    } catch (err) {
      console.warn('[Catalog] Could not fetch subcategories:', err)
      apiSubcategories.value = []
    }
  }

  // ============================================================
  // FETCH: SIZES
  // ============================================================

  async function fetchSizesData() {
    try {
      const res = await fetch(SIZES_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      let sizesData = await res.json()
      if (!Array.isArray(sizesData)) sizesData = sizesData.sizes || []

      const profileToSpecific = new Map<string, Set<string>>()
      const specificToProfile = new Map<string, string>()
      const orderSet = new Set<string>()

      sizesData.forEach((s: { size?: string; name?: string; standard_size?: { standard_size?: string } }) => {
        const specific = s.size || s.name || ''
        const profile = s.standard_size?.standard_size || ''
        if (!specific) return

        if (profile) {
          if (!profileToSpecific.has(profile)) profileToSpecific.set(profile, new Set())
          profileToSpecific.get(profile)!.add(specific)
          profileToSpecific.get(profile)!.add(profile) // profile name itself
          specificToProfile.set(specific, profile)
          orderSet.add(profile)
        }
      })

      const standardSizeOrder = Array.from(orderSet).sort((a, b) => {
        const ai = SIZE_ORDER_REF.indexOf(a)
        const bi = SIZE_ORDER_REF.indexOf(b)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return a.localeCompare(b)
      })

      sizeMaps.value = { profileToSpecific, specificToProfile, standardSizeOrder }
    } catch (err) {
      console.warn('[Catalog] Could not fetch sizes:', err)
    }
  }

  // ============================================================
  // SIZE HELPERS
  // ============================================================

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

  function isSizeProfileMode(): boolean {
    return selected.categories.length === 0
  }

  function buildSizeOptions(list: CatalogItem[]): FilterOption[] {
    const { specificToProfile, standardSizeOrder } = sizeMaps.value
    if (isSizeProfileMode() && standardSizeOrder.length > 0) {
      // Show ONLY standard letter sizes (XXS through XXL)
      const available = new Set<string>()
      list.forEach((item) => {
        const sz = getItemSize(item)
        if (!sz) return
        const profile = specificToProfile.get(sz) || sz
        if (STANDARD_PROFILE_SIZES.includes(profile)) {
          available.add(profile)
        }
      })
      return STANDARD_PROFILE_SIZES.filter((p) => available.has(p)).map((p) => ({ id: p, name: p }))
    } else {
      // Show specific sizes from items
      const valMap = new Map<string, FilterOption>()
      list.forEach((item) => {
        const sz = getItemSize(item)
        if (sz) valMap.set(sz, { id: sz, name: sz })
      })
      return Array.from(valMap.values())
    }
  }

  function translateSizeSelections(oldSelections: string[]): string[] {
    if (!oldSelections.length) return []
    const { profileToSpecific, specificToProfile } = sizeMaps.value
    const newSelections = new Set<string>()

    if (isSizeProfileMode()) {
      // Specific → Profile
      oldSelections.forEach((sz) => {
        const profile = specificToProfile.get(sz) || sz
        newSelections.add(profile)
      })
    } else {
      // Profile → Specific
      oldSelections.forEach((sz) => {
        if (profileToSpecific.has(sz)) {
          profileToSpecific.get(sz)!.forEach((s) => newSelections.add(s))
        } else {
          newSelections.add(sz)
        }
      })
    }
    return Array.from(newSelections)
  }

  function itemMatchesSize(item: CatalogItem, selectedSizes: string[]): boolean {
    if (!selectedSizes.length) return true
    const sz = getItemSize(item)
    if (!sz) return false

    if (isSizeProfileMode()) {
      const profile = sizeMaps.value.specificToProfile.get(sz) || sz
      return selectedSizes.includes(profile)
    } else {
      return selectedSizes.includes(sz)
    }
  }

  // ============================================================
  // STORAGE (sessionStorage catalog cache, 5-min TTL)
  // ============================================================

  function saveCatalog(data: { query?: string }) {
    if (data.query) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch (e) {
      console.warn('[Catalog] Could not save:', e)
    }
  }

  function loadCatalog() {
    if (searchQuery.value) return null
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const { data, timestamp } = JSON.parse(stored)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem(STORAGE_KEY)
        return null
      }
      return data
    } catch (e) {
      return null
    }
  }

  // ============================================================
  // FETCH: CATALOG
  // ============================================================

  async function fetchCatalog(query = '') {
    const url = query ? `${CATALOG_URL}?q=${encodeURIComponent(query)}&limit=500` : CATALOG_URL
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data
  }

  async function initCatalog() {
    catalogData.value = loadCatalog()
    if (!catalogData.value) {
      catalogData.value = await fetchCatalog()
      saveCatalog(catalogData.value!)
    }
    return catalogData.value
  }

  // ============================================================
  // FILTERING LOGIC
  // ============================================================

  function countActiveFilters(): number {
    let count = 0
    count += selected.categories.length
    count += selected.subcategories.length
    count += selected.colors.length
    count += selected.size.length
    count += selected.status.length
    EXTRA_FILTERS.forEach((def) => {
      count += (selected[def.type] || []).length
    })
    return count
  }

  function filterItems(list: CatalogItem[], filters: Record<string, string[]>): CatalogItem[] {
    return list.filter((item) => {
      // Status filter
      if (filters.status!.length > 0) {
        const itemStatus = (item.status || 'available').toLowerCase().trim()
        if (!filters.status!.some((s) => itemStatus === s.toLowerCase())) return false
      }

      if (filters.categories!.length > 0 && !filters.categories!.includes(item.category_name || '')) return false
      if (filters.subcategories!.length > 0 && !filters.subcategories!.includes(item.subcategory_name || '')) return false
      if (filters.colors!.length > 0 && !(item.color_names || []).some((c) => filters.colors!.includes(c))) return false

      // Size filter with profile support
      if (filters.size!.length > 0 && !itemMatchesSize(item, filters.size!)) return false

      // Extra filters
      for (const def of EXTRA_FILTERS) {
        const sel = filters[def.type] || []
        if (sel.length > 0) {
          const val = getExtraValue(item, def)
          if (!val || !sel.includes(val)) return false
        }
      }

      return true
    })
  }

  function calculateFilterCounts(allItems: CatalogItem[]): Record<string, Record<string, number>> {
    const counts: Record<string, Record<string, number>> = {
      categories: {},
      subcategories: {},
      colors: {},
      size: {},
    }
    EXTRA_FILTERS.forEach((def) => {
      counts[def.type] = {}
    })

    const currentFilters = selected

    function itemsExcluding(excludeType: string): CatalogItem[] {
      return allItems.filter((item) => {
        // Always apply status filter
        if (excludeType !== 'status' && currentFilters.status.length > 0) {
          const itemStatus = (item.status || 'available').toLowerCase().trim()
          if (!currentFilters.status.some((s) => itemStatus === s.toLowerCase())) return false
        }
        if (excludeType !== 'category' && currentFilters.categories.length > 0 && !currentFilters.categories.includes(item.category_name || '')) return false
        if (excludeType !== 'subcategory' && currentFilters.subcategories.length > 0 && !currentFilters.subcategories.includes(item.subcategory_name || '')) return false
        if (excludeType !== 'color' && currentFilters.colors.length > 0 && !(item.color_names || []).some((c) => currentFilters.colors.includes(c))) return false
        if (excludeType !== 'size' && currentFilters.size.length > 0 && !itemMatchesSize(item, currentFilters.size)) return false

        for (const def of EXTRA_FILTERS) {
          if (excludeType === def.type) continue
          const sel = currentFilters[def.type] || []
          if (sel.length > 0) {
            const val = getExtraValue(item, def)
            if (!val || !sel.includes(val)) return false
          }
        }
        return true
      })
    }

    // Category counts
    itemsExcluding('category').forEach((item) => {
      if (item.category_name) counts.categories![item.category_name] = (counts.categories![item.category_name] || 0) + 1
    })

    // Subcategory counts
    itemsExcluding('subcategory').forEach((item) => {
      if (item.subcategory_name) counts.subcategories![item.subcategory_name] = (counts.subcategories![item.subcategory_name] || 0) + 1
    })

    // Color counts
    itemsExcluding('color').forEach((item) => {
      ;(item.color_names || []).forEach((color) => {
        counts.colors![color] = (counts.colors![color] || 0) + 1
      })
    })

    // Size counts (profile or specific)
    const sizeItems = itemsExcluding('size')
    if (isSizeProfileMode() && sizeMaps.value.standardSizeOrder.length > 0) {
      sizeItems.forEach((item) => {
        const sz = getItemSize(item)
        if (!sz) return
        const profile = sizeMaps.value.specificToProfile.get(sz) || sz
        if (STANDARD_PROFILE_SIZES.includes(profile)) {
          counts.size![profile] = (counts.size![profile] || 0) + 1
        }
      })
    } else {
      sizeItems.forEach((item) => {
        const sz = getItemSize(item)
        if (sz) counts.size![sz] = (counts.size![sz] || 0) + 1
      })
    }

    // Extra filter counts
    EXTRA_FILTERS.forEach((def) => {
      itemsExcluding(def.type).forEach((item) => {
        const val = getExtraValue(item, def)
        if (val) counts[def.type]![val] = (counts[def.type]![val] || 0) + 1
      })
    })

    return counts
  }

  // ============================================================
  // BUILD FILTER OPTIONS
  // ============================================================

  function buildFiltersFromItems(list: CatalogItem[]) {
    const categories = new Map<string, FilterOption>()
    const subcategories = new Map<string, FilterOption>()
    const colors = new Map<string, FilterOption>()

    list.forEach((item) => {
      if (item.category_id && item.category_name) {
        categories.set(item.category_name, { id: item.category_id, name: item.category_name })
      }
      if (item.subcategory_id && item.subcategory_name) {
        subcategories.set(item.subcategory_name, {
          id: item.subcategory_id,
          name: item.subcategory_name,
          category_id: item.category_id,
        })
      }
      ;(item.color_names || []).forEach((colorName, idx) => {
        const colorId = item.color_ids?.[idx] || colorName
        colors.set(colorName, { id: colorId, name: colorName })
      })
    })

    return {
      categories: Array.from(categories.values()),
      subcategories: Array.from(subcategories.values()),
      colors: Array.from(colors.values()),
    }
  }

  // Build subcategory options: prefer API data, fallback to item data
  function buildSubcategoryOptions(
    itemFilters: { categories: FilterOption[]; subcategories: FilterOption[] },
    selectedCategories: string[],
  ): FilterOption[] {
    if (apiSubcategories.value.length > 0) {
      let subcats = apiSubcategories.value

      // If categories are selected, filter to matching ones
      if (selectedCategories.length > 0) {
        const selectedCatIds = (itemFilters.categories || [])
          .filter((c) => selectedCategories.includes(c.name))
          .map((c) => c.id)
        if (selectedCatIds.length > 0) {
          subcats = subcats.filter((s) => selectedCatIds.includes(s.category_id!))
        }
      }

      return subcats.map((s) => ({
        id: s.id,
        name: s.name,
        category_id: s.category_id,
      }))
    }

    // Fallback to item-derived subcategories
    let subcatsToShow = itemFilters.subcategories || []
    if (selectedCategories.length > 0) {
      const selectedCatIds = (itemFilters.categories || [])
        .filter((c) => selectedCategories.includes(c.name))
        .map((c) => c.id)
      subcatsToShow = subcatsToShow.filter((s) => selectedCatIds.includes(s.category_id!))
    }
    return subcatsToShow
  }

  function buildExtraFilterOptions(list: CatalogItem[]): Record<string, FilterOption[]> {
    const extraOptions: Record<string, FilterOption[]> = {}
    EXTRA_FILTERS.forEach((def) => {
      const valMap = new Map<string, FilterOption>()
      list.forEach((item) => {
        const val = getExtraValue(item, def)
        if (val) valMap.set(val, { id: val, name: val })
      })
      extraOptions[def.type] = Array.from(valMap.values())
    })
    return extraOptions
  }

  // ============================================================
  // DERIVED STATE (the old render() pipeline as computeds)
  // ============================================================

  const filteredItems = computed(() => filterItems(items.value, selected))

  const totalPages = computed(() => Math.ceil(filteredItems.value.length / ITEMS_PER_PAGE) || 1)

  const pageItems = computed(() => {
    const start = (currentPage.value - 1) * ITEMS_PER_PAGE
    return filteredItems.value.slice(start, start + ITEMS_PER_PAGE)
  })

  const availableFilters = computed(() => {
    const fromItems = buildFiltersFromItems(items.value)
    if (searchQuery.value) return fromItems
    return (catalogData.value?.filters as ReturnType<typeof buildFiltersFromItems> | undefined) || fromItems
  })

  const extraOptions = computed(() => buildExtraFilterOptions(items.value))

  const counts = computed(() => calculateFilterCounts(items.value))

  function makeSection(options: FilterOption[] | undefined, filterType: string): { empty: boolean; rows: FilterRow[] } {
    const raw = options || []
    if (!raw.length) return { empty: true, rows: [] }

    // Deduplicate
    const seen = new Set<string>()
    const uniqueOptions = raw.filter((opt) => {
      if (seen.has(opt.name)) return false
      seen.add(opt.name)
      return true
    })

    // Sort
    if (filterType === 'size') {
      uniqueOptions.sort((a, b) => {
        const ai = SIZE_ORDER_REF.indexOf(a.name.toUpperCase())
        const bi = SIZE_ORDER_REF.indexOf(b.name.toUpperCase())
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        const an = parseFloat(a.name)
        const bn = parseFloat(b.name)
        if (!isNaN(an) && !isNaN(bn)) return an - bn
        return a.name.localeCompare(b.name)
      })
    } else {
      uniqueOptions.sort((a, b) => a.name.localeCompare(b.name))
    }

    const sectionCounts = counts.value[countsKey(filterType)] || {}
    const activeValues = new Set(selected[selKey(filterType)] || [])

    const rows = uniqueOptions
      .map((opt) => ({
        id: opt.id,
        name: opt.name,
        category_id: opt.category_id,
        count: sectionCounts[opt.name] || 0,
        checked: activeValues.has(opt.name),
      }))
      .filter((row) => row.count > 0 || row.checked)

    return { empty: false, rows }
  }

  const sections = computed<Record<string, { empty: boolean; rows: FilterRow[] }>>(() => {
    const result: Record<string, { empty: boolean; rows: FilterRow[] }> = {}
    result.category = makeSection(availableFilters.value.categories, 'category')
    result.subcategory = makeSection(buildSubcategoryOptions(availableFilters.value, selected.categories), 'subcategory')
    result.size = makeSection(buildSizeOptions(items.value), 'size')
    result.color = makeSection(availableFilters.value.colors, 'color')
    EXTRA_FILTERS.forEach((def) => {
      result[def.type] = makeSection(extraOptions.value[def.type], def.type)
    })
    return result
  })

  const activeFilterCount = computed(() => countActiveFilters())

  const statusAvailableCount = computed(
    () => items.value.filter((i) => (i.status || 'available').toLowerCase().trim() === 'available').length,
  )

  const applyBtnText = computed(() => {
    if (!loaded.value) return 'show results'
    const total = filteredItems.value.length
    return total === 1 ? 'show 1 item' : `show ${total} items`
  })

  const chips = computed(() => {
    const list: Array<{ value: string; type: string; label: string }> = []
    const addChips = (values: string[], filterType: string, label: string) => {
      values.forEach((val) => list.push({ value: val, type: filterType, label }))
    }

    addChips(selected.categories, 'category', 'category')
    addChips(selected.subcategories, 'subcategory', 'type')
    addChips(selected.colors, 'color', 'color')
    addChips(selected.size, 'size', 'size')
    if (selected.status.length > 0) {
      list.push({ value: 'available only', type: 'status', label: 'status' })
    }

    EXTRA_FILTERS.forEach((def) => {
      addChips(selected[def.type] || [], def.type, def.label)
    })

    return list
  })

  // ============================================================
  // URL SYNC (same param names + repeated-param format as the old site)
  // ============================================================

  function syncURL() {
    const query: Record<string, string | string[]> = { page: String(currentPage.value) }
    if (searchQuery.value) query.q = searchQuery.value
    if (selected.categories.length) query.categories = [...selected.categories]
    if (selected.subcategories.length) query.subcategories = [...selected.subcategories]
    if (selected.colors.length) query.colors = [...selected.colors]
    if (selected.size.length) query.size = [...selected.size]
    if (selected.status.length) query.status = [...selected.status]

    EXTRA_FILTERS.forEach((def) => {
      if (selected[def.type]!.length) query[def.type] = [...selected[def.type]!]
    })

    router.replace({ query })
  }

  function getAllParam(value: unknown): string[] {
    const arr = Array.isArray(value) ? value : value != null ? [value] : []
    return arr.filter(Boolean).map(String)
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearAllSelections() {
    Object.keys(selected).forEach((key) => {
      selected[key] = []
    })
  }

  function onFilterChange(type: string, value: string, checked: boolean) {
    const key = selKey(type)
    const arr = selected[key]!
    if (checked) {
      if (!arr.includes(value)) arr.push(value)
    } else {
      const idx = arr.indexOf(value)
      if (idx > -1) arr.splice(idx, 1)
    }

    // Category change: translate size selections between profile/specific modes
    if (type === 'category') {
      if (selected.size.length > 0) {
        const translated = translateSizeSelections(selected.size)
        const validSizes = new Set(buildSizeOptions(items.value).map((o) => o.name))
        selected.size = translated.filter((s) => validSizes.has(s))
      }
      // Subcategory rows outside the selected categories disappear from the panel
      if (selected.categories.length > 0) {
        const names = new Set(
          buildSubcategoryOptions(availableFilters.value, selected.categories).map((o) => o.name),
        )
        selected.subcategories = selected.subcategories.filter((n) => names.has(n))
      }
    }

    currentPage.value = 1
    syncURL()
  }

  function removeChip(type: string, value: string) {
    if (type === 'status') {
      selected.status = []
    } else {
      const key = selKey(type)
      selected[key] = selected[key]!.filter((v) => v !== value)
      if (type === 'category') {
        selected.subcategories = []
      }
    }
    currentPage.value = 1
    syncURL()
    scrollTop()
  }

  async function handleSearch(query: string) {
    searchQuery.value = query.trim()
    clearAllSelections()

    if (!searchQuery.value) {
      catalogData.value = loadCatalog() || (await fetchCatalog())
      saveCatalog(catalogData.value!)
    } else {
      catalogData.value = await fetchCatalog(searchQuery.value)
    }

    currentPage.value = 1
    syncURL()
  }

  async function handleResetAll() {
    clearAllSelections()
    searchInputValue.value = ''
    searchQuery.value = ''

    catalogData.value = loadCatalog() || (await fetchCatalog())
    saveCatalog(catalogData.value!)

    currentPage.value = 1
    syncURL()
    scrollTop()
  }

  function prevPage() {
    if (currentPage.value > 1) {
      currentPage.value -= 1
      syncURL()
      scrollTop()
    }
  }

  function nextPage() {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1
      syncURL()
      scrollTop()
    }
  }

  // ============================================================
  // WISHLIST (shared WishlistManager port)
  // ============================================================

  const wishlist = useWishlistManager()

  async function toggleWishlist(itemId: number | string | undefined) {
    const id = Number(itemId)
    if (!id) return

    if ((window as any).auth0Client) {
      const isAuthenticated = await (window as any).auth0Client.isAuthenticated()
      if (!isAuthenticated) {
        try {
          await (window as any).auth0Client.loginWithPopup()
        } catch (err) {
          console.error('[Wishlist] Login error:', err)
          return
        }
        const nowAuthenticated = await (window as any).auth0Client.isAuthenticated()
        if (!nowAuthenticated) return
        await wishlist.syncWithAPI()
      }
    }

    await wishlist.toggle(id)
  }

  // ============================================================
  // INIT
  // ============================================================

  async function init() {
    try {
      const url = route.query
      const urlQ = typeof url.q === 'string' ? url.q : ''

      // Fetch subcategories + sizes in parallel with catalog
      const initPromises: Promise<unknown>[] = [fetchSubcategories(), fetchSizesData()]

      if (urlQ) {
        searchQuery.value = urlQ
        searchInputValue.value = urlQ
        initPromises.push(fetchCatalog(urlQ).then((d) => {
          catalogData.value = d
        }))
      } else {
        initPromises.push(initCatalog())
      }

      await Promise.all(initPromises)

      // Apply URL filters + status
      selected.categories = getAllParam(url.categories)
      selected.subcategories = getAllParam(url.subcategories)
      selected.colors = getAllParam(url.colors)
      selected.size = getAllParam(url.size)
      selected.status = getAllParam(url.status)
      EXTRA_FILTERS.forEach((def) => {
        selected[def.type] = getAllParam(url[def.type])
      })

      const page = parseInt(String(url.page || '1'), 10)
      currentPage.value = Number.isFinite(page) && page > 0 ? page : 1

      loaded.value = true
      syncURL()
    } catch (err) {
      console.error('[Catalog] Init failed:', err)
      loadError.value = true
    }
  }

  return {
    // state
    isNL,
    loaded,
    loadError,
    currentPage,
    searchQuery,
    searchInputValue,
    selected,
    // derived
    filteredItems,
    totalPages,
    pageItems,
    sections,
    extraOptions,
    activeFilterCount,
    statusAvailableCount,
    applyBtnText,
    chips,
    // helpers
    productPath,
    cardMeta,
    statusClass,
    // actions
    init,
    onFilterChange,
    removeChip,
    handleSearch,
    handleResetAll,
    prevPage,
    nextPage,
    // wishlist
    loadWishlist: () => { wishlist.init() },
    isInWishlist: wishlist.isInWishlist,
    toggleWishlist,
  }
}
