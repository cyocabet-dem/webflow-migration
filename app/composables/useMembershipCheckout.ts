// One-to-one port of the site-wide-footer.js "MEMBERSHIP SIGNUP HANDLER":
// a document-level capture-phase click handler for every [data-membership] button —
// GTM membership_checkout_click push → auth gate with sessionStorage postLoginAction
// replay → POST /stripe/create-checkout-session → redirect to Stripe.
export function useMembershipCheckout() {
  const { isAuthenticated, authReady, openAuthModal, getToken } = useAuth()
  const { apiBase } = useRuntimeConfig().public

  async function checkout(button: HTMLElement, opts: { isReplay?: boolean } = {}) {
    const membershipName = button.getAttribute('data-membership')
    if (!membershipName) return

    const pushCheckoutClick = () => {
      const w = window as any
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({
        event: 'membership_checkout_click',
        membership_name: membershipName,
        membership_price: parseFloat(button.getAttribute('data-price') || ''),
      })
    }

    if (!isAuthenticated.value) {
      if (!opts.isReplay) pushCheckoutClick()
      sessionStorage.setItem(
        'postLoginAction',
        JSON.stringify({ type: 'membership_signup', membershipName })
      )
      openAuthModal()
      return
    }

    if (!opts.isReplay) pushCheckoutClick()

    const originalHTML = button.innerHTML
    button.innerHTML = 'Loading...'
    button.style.pointerEvents = 'none'
    button.style.opacity = '0.7'

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      // Stripe requires https return URLs, so the native apps send the production
      // site's; the return is handled in plugins/native.client.ts (deep link or
      // in-app-browser close), landing on the same pages the web flow does.
      const native = isNativeApp()
      const origin = native ? WEB_ORIGIN : window.location.origin

      const response = await fetch(`${apiBase}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membership_name: membershipName,
          success_url: `${origin}/welcome-to-dematerialized`,
          cancel_url: `${origin}/error-membership-signup`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error((errorData as any).detail || `API error: ${response.status}`)
      }

      const data = await response.json()
      if (native) {
        // Flag only after the browser actually opened — an open failure falls
        // through to the catch below and must not leave a pending checkout
        // for a later resume/browserFinished event to falsely settle.
        await openInAppBrowser(data.checkout_url)
        setPendingNativeCheckout('membership')
        // The WebView never navigates away — restore the button for the return.
        button.innerHTML = originalHTML
        button.style.pointerEvents = 'auto'
        button.style.opacity = '1'
      } else {
        window.location.href = data.checkout_url
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert('Something went wrong: ' + error.message)
      button.innerHTML = originalHTML
      button.style.pointerEvents = 'auto'
      button.style.opacity = '1'
    }
  }

  function onDocumentClick(e: MouseEvent) {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-membership]')
    if (!button) return
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    void checkout(button)
  }

  // Call from the page's setup. Installs the capture-phase handler for the page's
  // lifetime and replays a pending post-login membership signup (the post-login
  // redirect lands users without a membership on /memberships).
  function install() {
    onMounted(() => document.addEventListener('click', onDocumentClick, true))
    onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick, true))

    const replay = () => {
      if (!isAuthenticated.value) return
      const action = sessionStorage.getItem('postLoginAction')
      if (!action) return
      try {
        const parsed = JSON.parse(action)
        if (parsed.type === 'membership_signup') {
          sessionStorage.removeItem('postLoginAction')
          setTimeout(() => {
            const button = document.querySelector<HTMLElement>(
              `[data-membership="${parsed.membershipName}"]`
            )
            if (button) void checkout(button, { isReplay: true })
            else console.error('Button not found for:', parsed.membershipName)
          }, 1500)
        }
      } catch (err) {
        console.error('Post-login check error:', err)
      }
    }

    watch(authReady, (ready) => ready && replay(), { immediate: true })
    // Native only: the web flow reloads the page after login (authReady flips on
    // the fresh mount, triggering the watcher above), but natively login happens
    // in-place via the in-app browser — replay when authentication lands instead.
    if (isNativeApp()) {
      watch(isAuthenticated, (authed) => authed && replay())
    }
  }

  return { checkout, install }
}
