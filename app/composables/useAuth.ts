// Reactive auth state over the Auth0 SPA client (created in plugins/auth0.client.ts).
// Mirrors the old auth.js/site-wide-footer.js contract: window.auth0Client,
// window.openAuthModal/closeAuthModal, window.currentUserData, sessionStorage.auth_return_path.
import type { Auth0Client, User } from '@auth0/auth0-spa-js'

export interface BackendUser {
  stripe_id?: string | null
  provided_information?: boolean
  attributes?: Array<{ key: string; value: string }>
  membership?: { active?: boolean; name?: string } | null
  [key: string]: unknown
}

export function useAuth() {
  const authReady = useState('auth-ready', () => false)
  const isAuthenticated = useState('auth-is-authenticated', () => false)
  const user = useState<User | null>('auth-user', () => null)
  const userData = useState<BackendUser | null>('auth-user-data', () => null)
  const authModalOpen = useState('auth-modal-open', () => false)

  function client(): Auth0Client | null {
    if (!import.meta.client) return null
    return ((window as any).auth0Client as Auth0Client) ?? null
  }

  const firstName = computed(() => {
    const attr = userData.value?.attributes?.find((a) => a.key === 'first_name')
    return attr?.value || ''
  })

  const hasActiveMembership = computed(() => !!userData.value?.stripe_id)

  function openAuthModal() {
    authModalOpen.value = true
  }

  function closeAuthModal() {
    authModalOpen.value = false
  }

  async function login() {
    const c = client()
    if (!c) return
    sessionStorage.setItem('auth_return_path', window.location.pathname)
    await c.loginWithRedirect()
  }

  async function signup() {
    const c = client()
    if (!c) return
    sessionStorage.setItem('auth_return_path', window.location.pathname)
    await c.loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })
  }

  async function logout() {
    const c = client()
    if (!c) return
    sessionStorage.removeItem('onboarding_modal_dismissed')
    await c.logout({ logoutParams: { returnTo: window.location.origin + '/' } })
  }

  async function getToken(): Promise<string | null> {
    const c = client()
    if (!c) return null
    try {
      if (!(await c.isAuthenticated())) return null
      return await c.getTokenSilently()
    } catch {
      return null
    }
  }

  async function refreshUserData(): Promise<BackendUser | null> {
    const token = await getToken()
    if (!token) return null
    const { apiBase } = useRuntimeConfig().public
    const res = await fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = (await res.json()) as BackendUser
    userData.value = data
    if (import.meta.client) (window as any).currentUserData = data
    return data
  }

  return {
    authReady,
    isAuthenticated,
    user,
    userData,
    firstName,
    hasActiveMembership,
    authModalOpen,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    logout,
    getToken,
    refreshUserData,
  }
}
