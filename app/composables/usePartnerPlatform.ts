// Partner platform (partner marketplace MVP) — shared API access, availability probe, role state.
//
// Every partner-facing surface keys off `enabled`: until the partner-platform backend
// module is deployed and its /public/status probe answers, the site renders exactly as
// it did before this feature existed (probe failure/timeout → all partner UI hidden).
// Same graceful-degradation pattern as useBlogPosts.

export interface PartnerRef {
  hash_id: string
  name: string
  slug: string
}

export interface PartnerMe {
  is_partner_user: boolean
  is_admin: boolean
  is_member: boolean
  partner: PartnerRef | null
  has_card_on_file: boolean
  card: { brand: string; last4: string } | null
}

export class PartnerApiError extends Error {
  status: number
  code: string | null
  detail: unknown

  constructor(status: number, detail: unknown) {
    let code: string | null = null
    let message = `Request failed (${status})`
    if (typeof detail === 'string') {
      message = detail
    } else if (detail && typeof detail === 'object') {
      const d = detail as Record<string, unknown>
      if (typeof d.code === 'string') code = d.code
      if (typeof d.message === 'string') message = d.message
    }
    super(message)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

const PROBE_TIMEOUT_MS = 5000

export function usePartnerPlatform() {
  const enabled = useState<boolean>('pp-enabled', () => false)
  const probed = useState<boolean>('pp-probed', () => false)
  const me = useState<PartnerMe | null>('pp-me', () => null)
  const meFetched = useState<boolean>('pp-me-fetched', () => false)
  const config = useRuntimeConfig()

  const apiBase = () => `${config.public.apiBase}/partner-platform`

  async function getToken(): Promise<string | null> {
    if (!import.meta.client) return null
    const client = (window as any).auth0Client
    if (!client) return null
    try {
      if (!(await client.isAuthenticated())) return null
      return await client.getTokenSilently()
    } catch {
      return null
    }
  }

  /** Availability probe. Safe to call repeatedly; only the first call hits the network. */
  async function probe(force = false): Promise<boolean> {
    if (!import.meta.client) return enabled.value
    if (probed.value && !force) return enabled.value
    probed.value = true
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
      const res = await fetch(`${apiBase()}/public/status`, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      enabled.value = data?.enabled === true
    } catch {
      enabled.value = false
    }
    return enabled.value
  }

  /**
   * Fetch wrapper for /partner-platform endpoints.
   * opts.auth: 'required' (throws PartnerApiError 401 when no token) | 'optional' | 'none'
   */
  async function ppFetch<T = any>(
    path: string,
    opts: {
      method?: string
      body?: unknown
      formData?: FormData
      auth?: 'required' | 'optional' | 'none'
      query?: Record<string, string | string[] | boolean | undefined>
    } = {},
  ): Promise<T> {
    const auth = opts.auth ?? 'required'
    const headers: Record<string, string> = {}
    if (auth !== 'none') {
      const token = await getToken()
      if (token) headers.Authorization = `Bearer ${token}`
      else if (auth === 'required') throw new PartnerApiError(401, 'not signed in')
    }
    let url = `${apiBase()}${path}`
    if (opts.query) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined) continue
        if (Array.isArray(v)) v.forEach((item) => params.append(k, item))
        else params.append(k, String(v))
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }
    let body: BodyInit | undefined
    if (opts.formData) {
      body = opts.formData
    } else if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(opts.body)
    }
    const res = await fetch(url, { method: opts.method || 'GET', headers, body })
    if (!res.ok) {
      let detail: unknown = null
      try {
        detail = (await res.json())?.detail ?? null
      } catch {
        /* non-JSON error body */
      }
      throw new PartnerApiError(res.status, detail)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  /** Resolve roles/card state. Cached; force=true refetches (e.g. after card setup). */
  async function fetchMe(force = false): Promise<PartnerMe | null> {
    if (!import.meta.client) return me.value
    if (meFetched.value && !force) return me.value
    if (!enabled.value) return null
    try {
      me.value = await ppFetch<PartnerMe>('/me')
      meFetched.value = true
    } catch {
      me.value = null
    }
    return me.value
  }

  function clearMe() {
    me.value = null
    meFetched.value = false
  }

  const partnerUiEnabled = computed(() => enabled.value)
  const isPartnerUser = computed(() => !!me.value?.is_partner_user)
  const isAdminUser = computed(() => !!me.value?.is_admin)

  return {
    enabled,
    partnerUiEnabled,
    me,
    isPartnerUser,
    isAdminUser,
    probe,
    fetchMe,
    clearMe,
    ppFetch,
    getToken,
    apiBase,
  }
}
