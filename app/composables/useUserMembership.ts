// One-to-one port of window.UserMembership from site-wide-footer.js:
// cached /users/me fetch (5-minute TTL) + membership-name checks.
// Pages/sidenavs call window.UserMembership.isShippingMember().

export interface UserMembershipApi {
  _cache: any | null
  _cacheTime: number | null
  CACHE_DURATION: number
  API_BASE: string
  premium_name: string
  basic_name: string
  SHIPPING_MEMBERSHIPS: string[]
  fetch(): Promise<any | null>
  getMembershipId(): Promise<any>
  getMembershipName(): Promise<string | null>
  isPremium(): Promise<boolean>
  isBasic(): Promise<boolean>
  isShippingMember(): Promise<boolean>
  isLocalMember(): Promise<boolean>
  canReserveOnline(): Promise<boolean>
  clearCache(): void
}

function createUserMembership(apiBase: string): UserMembershipApi {
  return {
    _cache: null,
    _cacheTime: null,
    CACHE_DURATION: 5 * 60 * 1000,
    API_BASE: apiBase,
    premium_name: 'Premium',
    basic_name: 'Basic',

    // Shipping membership names
    SHIPPING_MEMBERSHIPS: [
      '5 items, 1 shipment per month',
      '5 items per shipment, 2 shipments per month',
    ],

    async fetch() {
      if (this._cache && this._cacheTime && (Date.now() - this._cacheTime < this.CACHE_DURATION)) {
        return this._cache
      }

      try {
        const auth0Client = (window as any).auth0Client
        if (!auth0Client) return null

        const isAuthenticated = await auth0Client.isAuthenticated()
        if (!isAuthenticated) return null

        const token = await auth0Client.getTokenSilently()

        const response = await fetch(`${this.API_BASE}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('Failed to fetch user:', response.status)
          return null
        }

        const userData = await response.json()

        this._cache = userData
        this._cacheTime = Date.now()

        return userData
      } catch (err) {
        console.error('Error fetching user:', err)
        return null
      }
    },

    async getMembershipId() {
      const user = await this.fetch()
      return user?.membership_id || user?.membership?.id || null
    },

    async getMembershipName() {
      const user = await this.fetch()
      return user?.membership?.name || null
    },

    async isPremium() {
      const membershipName = await this.getMembershipName()
      return membershipName === this.premium_name
    },

    async isBasic() {
      const membershipName = await this.getMembershipName()
      return membershipName === this.basic_name
    },

    async isShippingMember() {
      const membershipName = await this.getMembershipName()
      const isShipping = this.SHIPPING_MEMBERSHIPS.includes(membershipName as string)
      return isShipping
    },

    async isLocalMember() {
      const membershipName = await this.getMembershipName()
      if (!membershipName) return false
      return !this.SHIPPING_MEMBERSHIPS.includes(membershipName)
    },

    async canReserveOnline() {
      return await this.isPremium()
    },

    clearCache() {
      this._cache = null
      this._cacheTime = null
    },
  }
}

let _userMembership: UserMembershipApi | null = null

export function useUserMembership(): UserMembershipApi {
  const { apiBase } = useRuntimeConfig().public
  // Never cache across SSR requests — the /users/me cache is per-user state.
  if (import.meta.server) return createUserMembership(apiBase as string)
  if (!_userMembership) {
    _userMembership = createUserMembership(apiBase as string)
  }
  return _userMembership
}
