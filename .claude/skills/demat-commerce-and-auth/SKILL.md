---
name: demat-commerce-and-auth
description: Deep operational guide to the Dematerialized auth and money flows — Auth0 login lifecycle, the TWO separate carts (purchase vs reservation), wishlist sync, membership and purchase Stripe checkouts, and the full frontend-to-FastAPI endpoint map. Load this when working on sign-in/sign-up/logout, tokens, onboarding modal, cart badges, reserve/rent flows, wishlist hearts, credits, Stripe redirects, or anything touching app/plugins/auth0.client.ts, app/plugins/reservation-cart.client.ts, app/composables/use{Auth,CartManager,PurchaseCart,WishlistManager,UserMembership,MembershipCheckout}.ts, or wondering "which endpoint does X call" / "why are there two carts" / "why did the cart empty after a cancelled payment".
---

# Dematerialized commerce & auth

**What this covers:** how authentication (Auth0), the two carts, wishlist, membership checks, and both Stripe checkout flows actually work in `app/`, plus the verified map from every frontend call to its FastAPI source in the sibling repo `/Users/courtneyyocabet/demat-backend`.

**When to use:** any change, debug, or question involving login state, tokens, carts, reservations/rentals, wishlist, credits, membership signup, or purchase checkout.

**When NOT to use (→ sibling skill):** setting up the dev environment or the local auth-bypass backend → `demat-build-and-env`. Symptom-first debugging (hydration flashes, badge not updating) → `demat-debugging-playbook`. Storage-key registry and window.* bridge inventory in full → `demat-architecture-contract`. What the old Webflow embeds did and what "parity" means → `webflow-parity-reference`. Approval rules for any change → `demat-change-control` (nothing here routes around it). Consent/i18n → `demat-i18n-and-consent`. Production cutover → `demat-cutover-campaign`.

**Jargon:** *PDP* = product detail page (`app/pages/product.vue`). *Parity* = the migration doctrine that the Nuxt app reproduces the old Webflow site's behavior exactly, bugs included. *Hydration* = Vue attaching to server-rendered HTML; mismatches between server and first client render are the project's most repeated bug class. *JIT user creation* = the backend creating a DB user just-in-time on a user's first authenticated request.

> **Repo state note (2026-07-07):** the working tree carries uncommitted Capacitor (native iOS/Android app) work that added `isNativeApp()` branches to `auth0.client.ts`, `useAuth.ts`, `useMembershipCheckout.ts`, and `usePurchaseCart.ts`. Everything below is verified against that current tree. Native-only behavior is marked "(native)". On the web all native branches are inert.

---

## 1. Auth0 lifecycle

Everything starts in `app/plugins/auth0.client.ts` (client-only, `async` — Nuxt awaits it before later plugins, so `window.auth0Client` exists when the cart/wishlist plugins run; plugin order is filename-alphabetical).

| Stage | What happens | Where |
|---|---|---|
| Client creation | `createAuth0Client({ cacheLocation: 'localstorage', useRefreshTokens: true, authorizationParams: { redirect_uri: origin + '/', audience: 'https://api.dematerialized.nl/' } })`. **The audience is the hardcoded literal for BOTH test and live APIs — intentional**, matching old `auth.js` (comment in-file: "same value for test and live"). Do not "fix" it to the test URL. | `auth0.client.ts` (createAuth0Client call) |
| Globals exposed | `window.auth0Client`, `window.openAuthModal`, `window.closeAuthModal`; `refreshUserData()` also mirrors the backend user to `window.currentUserData` | `auth0.client.ts`; `useAuth.ts` `refreshUserData` |
| Login / signup | `useAuth().login()`/`signup()` set `sessionStorage.auth_return_path = location.pathname` then `loginWithRedirect` (signup adds `screen_hint: 'signup'`) | `useAuth.ts` |
| Redirect callback | URL has `code=` **and** `state=` → `handleRedirectCallback()`, read `sessionStorage.auth_return_path` (default `'/'`), remove it, `history.replaceState` back to that path | `auth0.client.ts` main try block |
| Post-login membership check | After callback, `refreshUserData()` (GET `/users/me`); if `data && !data.stripe_id` → **hard redirect `window.location.href = '/memberships'`**. This **discards the restored return path** — known, intentional (old-site behavior): a non-member always lands on /memberships after login. | `auth0.client.ts` |
| Onboarding trigger | `maybeShowOnboardingModal(data)`: skipped on `/onboarding`, `/complete-your-profile`, `/profile`, `/memberships`, `/error-membership-signup`; fires `window.openOnboardingModal?.()` after 500 ms **only when** `data.stripe_id && !data.provided_information && sessionStorage.onboarding_modal_dismissed !== 'true'` | `auth0.client.ts` `maybeShowOnboardingModal` |
| Auth-gate release | `authReady = true` + remove `auth-pending` class from `<html>` (releases the `7-auth-gate.css` visibility gate). **Three release paths**: (1) the main `finally`, (2) the `createAuth0Client` catch (init failure → gate still releases, but `window.auth0Client` is never set — downstream code polls/null-checks), (3) the dev-mock branch's `finally`. | `auth0.client.ts` |
| Logout | `logout()` removes `sessionStorage.onboarding_modal_dismissed`, Auth0 logout to `origin + '/'` | `useAuth.ts` |
| (native) Callback | Deep link via `@capacitor/app` `appUrlOpen` listener; same no-`stripe_id` → `/memberships` rule via `router.push` | `auth0.client.ts` native block |

**`useAuth()` state keys** (Nuxt `useState`): `auth-ready`, `auth-is-authenticated`, `auth-user`, `auth-user-data`, `auth-modal-open`. Computeds: `firstName` (from `userData.attributes` entry with `key === 'first_name'`), `hasActiveMembership` (`!!userData.stripe_id` — "member" everywhere in this app means *has a Stripe customer id*).

**JIT user creation (backend side effect):** `demat-backend/app/dependencies.py` `get_current_user` looks up the user by Auth0 `sub` and **creates the DB user on first authenticated request, firing a `SIGNED_UP` email event**. Hitting any authed endpoint with a fresh Auth0 account writes to the DB and sends email machinery into motion — see §8 testing discipline.

**Dev mock:** `cfg.devMockAuth && import.meta.dev` installs a fake `auth0Client` returning the literal `'dev-mock-token'` (not a JWT — only works against a token-bypassed local backend). See `demat-build-and-env`.

---

## 2. THE TWO CARTS (read this before touching anything cart-shaped)

There are two completely separate carts with confusingly similar names. They exist because the old site had two distinct embeds, each ported one-to-one. Never merge them; never let one's selector/storage leak into the other.

| | **PurchaseCart** (buy) | **CartManager** (rent/reserve) |
|---|---|---|
| Purpose | Buy the items you currently rent (money changes hands) | Reserve/rent items under a membership (no payment at confirm) |
| Old source | `old/demat-webflow-test/purchase-cart.js` (`window.PurchaseCart`) | `window.CartManager` in `old/demat-webflow-test/site-wide-footer.js` |
| Composable | `app/composables/usePurchaseCart.ts` | `app/composables/useCartManager.ts` |
| Plugin bridge | `app/plugins/purchase-cart.client.ts` → `window.PurchaseCart` | `app/plugins/reservation-cart.client.ts` → `window.CartManager` + overlay/modal globals |
| Storage | **localStorage `demat_purchase_cart`** (no TTL, survives sessions) | **sessionStorage `dematerialized_cart`** (per tab/session) |
| Item limit | None (dedupe by `clothing_item_id`) | **`MAX_ITEMS = 5`**, enforced on add and during sync merge |
| API sync of contents | **None** — purely local until checkout | Basket API merge-sync when authed: **API cart wins**, local-only items uploaded up to the 5 cap |
| Endpoints | `POST /private_clothing_items/orders`, `POST .../orders/{id}/checkout`, `GET .../donation_session/` (credits) | `GET /private_clothing_items/basket/clothing_items`, `POST`/`DELETE /private_clothing_items/basket/{itemId}` |
| Badge DOM | `.purchase-cart-badge` + `.purchase-cart-nav` inline display; `SiteNavbar.vue` watches `#purchase-cart-nav` with a MutationObserver | all `[data-cart-count]` elements (textContent + display flex/none) |
| Checkout | Order → Stripe checkout session → redirect (§6) | `confirmReservation()` → `POST /private_clothing_items/reservations` (§3), no Stripe |
| UI components | `components/cart/PurchaseCartPanel.vue`, `CheckoutModal.vue` | `components/cart/CartOverlay.vue`, `ReservationModal.vue`, `UpgradeModal.vue`, `ReservationSuccessModal.vue` |
| Click trigger | `[data-purchase-cart]` elements (skipped by the reservation handler) | Document-level **capture-phase** click/touchend on `[data-cart-trigger]` |

Both plugins run `init()` at plugin time and re-paint badges on the `app:mounted` hook (badge DOM exists only post-mount).

### Confirmed bug, approved to fix: PDP "up to 10 items" copy
`app/pages/product.vue` has a per-file translation dict entry `cartFullAlert: { en: 'Your cart is full! You can reserve up to 10 items at a time.', nl: 'je winkelmand is vol! je kunt maximaal 10 items tegelijk reserveren.' }` (line 56 as of 2026-07-07). It fires when `CartManager.addToCart` returns `reason 'max_items'` — which triggers at **5**, not 10. The mismatch is a verbatim-ported copy bug from the old site (`old/demat-webflow-test/pdp.js:145` says 10; `site-wide-footer.js:301` has `MAX_ITEMS: 5`). **Courtney's ruling (2026-07-07): CONFIRMED BUG, APPROVED TO FIX** — a sanctioned deviation from verbatim copy. When fixing: change both EN and NL to say 5 and log it in migration-map.md's "# Implementation log" section in the same turn.

---

## 3. Reservation flow — dual mode + the shipping-member workaround

The reservation cart serves two membership classes with different copy and (eventually) different endpoints:

- **Local members** pick items up in the store → flow is a *reservation*.
- **Shipping members** get items shipped → flow is a *rental*.

`isShippingMember()` is decided purely by **membership NAME string matching**: `useUserMembership.ts` `SHIPPING_MEMBERSHIPS = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']` (checked against `membership.name` from GET `/users/me`, cached in-memory 5 min).

**Hazard — the name list is hardcoded in 7 places** (verified by grep 2026-07-07). A backend/Stripe rename of a membership silently breaks all of them:

1. `composables/useUserMembership.ts` (`SHIPPING_MEMBERSHIPS`)
2. `pages/my-membership.vue:31` (`SHIPPING_MEMBERSHIP_NAMES`)
3. `pages/profile.vue:28`
4. `pages/my-rentals.vue:132`
5. `pages/donations-credits.vue:25`
6. `pages/reservations.vue:114`
7. `pages/purchases.vue:296`

(Plus `pages/memberships.vue` uses the same strings — and `'2 items at a time, local'`, `'5 items at a time, local'`, `'Basic'`, `'Premium'` — as `data-membership` attribute values on the checkout buttons.) The page copies hide the `/reservations` sidenav link for shipping members; consolidating them into the composable would be a refactor requiring change-control approval.

**Flow (all in `app/plugins/reservation-cart.client.ts`):**

1. `openCartOverlay()` — adds `body.cart-open`, syncs with the basket API when authed, sets `cartFlowType = isShippingMember ? 'shipping' : 'local'` (drives overlay copy in `CartOverlay.vue`).
2. `handleReserveClick()` — unauthenticated → close overlay + `window.openAuthModal?.()`; authed → `openReservationModal()`.
3. `openReservationModal()` — sets `reservationFlowType = isShipping ? 'rental' : 'reservation'` (drives modal copy: "confirm rental" vs reservation wording in `ReservationModal.vue`).
4. `confirmReservation()` — **BOTH flows** `POST ${apiBase}/private_clothing_items/reservations` with body `{ clothing_item_ids }`. The in-file comment reads "SHIPPING MEMBER WORKAROUND: uses the reservations endpoint for now. TODO: Switch to dedicated rental endpoint once POST /private_clothing_items/rentals exists." Verified: the backend `rentals.py` router has only `GET ""`, `GET /{rental_id}` and the three `/buy` POSTs — **no bare `POST /rentals` exists**, so the workaround is load-bearing, not a bug. Do not "correct" the endpoint.
5. Success → clear cart, close modals, `showReservationSuccess(result)` using `result.hash_id || result.id`.

**Parity quirk kept on purpose:** the Escape key closes the upgrade modal, then the reservation modal — but **deliberately never the cart overlay**. The old code's Escape branch checked an inline transform that was never set, so Escape never closed the cart; the bug is preserved for one-to-one parity (comment above the keydown handler). Don't fix without approval.

---

## 4. Wishlist

Port of the `WishlistManager` block in `old/demat-webflow-test/components.js`. `app/composables/useWishlistManager.ts` + `app/plugins/wishlist.client.ts` (exposes `window.WishlistManager` + `window.updateWishlistIcons`; skips install if already defined).

- **Storage:** localStorage `dematerialized_wishlist` — a plain numeric-id array, no TTL.
- **Optimistic writes:** `addToWishlist`/`removeFromWishlist` mutate local state + heart UI *first*, then call `POST`/`DELETE /private_clothing_items/wishlist/{id}` and **revert local + UI on failure**.
- **SERVER-WINS sync:** `syncWithAPI()` replaces the local list with `GET /private_clothing_items/wishlist/clothing_items` — **guest-added local items are overwritten (lost) on login. This is by design** (matches the old code); note the contrast with CartManager sync, which *does* upload local-only items.
- **Guest gate differs by surface — intentional, parity with two different old files:**
  - Catalog grid + legacy Webflow cards: guest heart click → `auth0Client.loginWithPopup()` then sync + toggle (`useCatalog.ts` `toggleWishlist`, `wishlist.client.ts` `updateWishlistIcons` handler — capture-phase to beat leftover Webflow IX2 markup, marks `data-wishlist-bound`).
  - PDP: guest wishlist click → `window.openAuthModal()` (redirect-style modal, no popup) — `product.vue` `onWishlistClick`. The PDP also checks membership of the wishlist **server-side** via `GET /private_clothing_items/wishlist/exists/{id}` rather than trusting localStorage.
- **DOM contract:** `[data-item-id]` Webflow cards flip `.heart-icon-outline-20px`/`.heart-icon-filled-20px` display; `[data-wishlist-id]` custom homepage cards toggle `.active`.

---

## 5. Membership Stripe checkout

`app/composables/useMembershipCheckout.ts`, installed only by `pages/memberships.vue` (`useMembershipCheckout().install()` at memberships.vue:145). A document-level **capture-phase** click handler catches every `[data-membership]` button.

Sequence per click:

1. **GTM push** — `{ event: 'membership_checkout_click', membership_name, membership_price: parseFloat(data-price) }` to `window.dataLayer`. This is **the only commerce dataLayer event in the entire app** (the purchase flow pushes nothing; `analytics.client.ts` only bootstraps GTM). Pushed once per *human* click — suppressed when `opts.isReplay` is set.
2. **Auth gate** — not authenticated → `sessionStorage.postLoginAction = JSON.stringify({ type: 'membership_signup', membershipName })` + `openAuthModal()`; stop.
3. **Checkout** — `POST ${apiBase}/stripe/create-checkout-session` with `{ membership_name, success_url: origin + '/welcome-to-dematerialized', cancel_url: origin + '/error-membership-signup' }` → redirect to `data.checkout_url`. (native: origin is `WEB_ORIGIN = 'https://dematerialized.nl'` because Stripe requires https return URLs; opened in the in-app browser.)
4. Error → `alert()` + button restored.

**Post-login replay:** `install()` watches `authReady` (immediate). Once ready and authenticated, it reads `postLoginAction`; on `type === 'membership_signup'` it removes the key and, **after a 1500 ms delay** (waiting for the buttons to exist in the DOM), finds `[data-membership="{name}"]` and calls `checkout(button, { isReplay: true })`. The loop closes because §1's post-login rule hard-redirects membership-less users to `/memberships`, where `install()` runs.

---

## 6. Purchase checkout (buy rented items)

`usePurchaseCart.processCheckout()`:

1. Requires `window.auth0Client` authenticated; empty cart throws.
2. **Credits math** (computed before checkout, shown in `CheckoutModal.vue`): `creditBalance` from `GET /private_clothing_items/donation_session/` field `credit_balance_cents`; `creditsToApply = min(creditBalance, total)`; `finalTotal = max(0, total − creditsToApply)`. (The backend applies credits itself during order creation — the frontend math is display-only.)
3. **Step 1** — `POST /private_clothing_items/orders` body `{ clothing_item_ids, shipping_address: '', order_type: 'purchase' }`.
4. **Fully-credit-paid short-circuit:** if `order.total_amount_in_cents === 0 || order.payment_status === 'paid'` → clear cart, close modal, show success view. **No Stripe involved.**
5. **Step 2** — `POST /private_clothing_items/orders/{order.id}/checkout` body `{ success_url: origin + '/purchases?payment=success', cancel_url: origin + '/purchases?payment=cancelled' }`.
6. **Trap: the cart is cleared BEFORE the Stripe redirect** (`clear()` runs, then `window.location.href = checkoutData.checkout_url || checkoutData.url || checkoutData.session_url`). A user who cancels on Stripe returns to an **empty cart**. This is ported behavior — do not fix without change-control approval.

Related read surfaces: `pages/purchases.vue` (`GET /private_clothing_items/orders`), `pages/purchase-success.vue` (`GET /private_clothing_items/orders/{orderId}`).

---

## 7. Endpoint map (frontend call → verified backend source)

API base: `runtimeConfig.public.apiBase` — default `https://test-api.dematerialized.nl`, `/dev-api` Nitro proxy in dev, prod overrides with `NUXT_PUBLIC_API_BASE=https://api.dematerialized.nl`. Backend paths verified 2026-07-07 in `/Users/courtneyyocabet/demat-backend` on branch `claude/blog-models`. The `private_clothing_items/` routes are a router package: parent prefix `/private_clothing_items` (`private_clothing_items/__init__.py`) + per-file sub-prefix; all require `get_current_user` (JIT-creating — §1).

| Endpoint | Frontend caller(s) | Backend source (route module, `app/api/routes/`) |
|---|---|---|
| `GET /users/me` | `useAuth.refreshUserData`, `useUserMembership.fetch`, plus direct calls in memberships/profile/my-membership/donations-credits/my-rentals/purchases/reservations pages | `user_management.py` `@router.get("/me")`, mounted `prefix="/users"` in `app/main.py` |
| `PATCH /users/me` | `OnboardingModal.vue` submit; `profile.vue` | `user_management.py` `@router.patch("/me")` |
| `GET /search` (full catalog; `?q=&limit=500`) | `useCatalog.ts` | `search_router.py` prefix `/search`, `@router.get("")` |
| `GET /clothing_items/clothing_item/{sku}` | `product.vue` | `clothing_items.py` prefix `/clothing_items` |
| `GET /clothing_items/{subcategories,sizes,catalog/full,pricing_categories}` | `useCatalog`, `useCatalogCache`, my-rentals, donations-credits | `clothing_items.py` |
| `GET /private_clothing_items/basket/clothing_items`; `POST`/`DELETE /basket/{id}` | `useCartManager` | `basket.py` (sub-prefix `/basket`) |
| `POST /private_clothing_items/reservations` (body `{clothing_item_ids}`); `GET` same path | `reservation-cart.client.ts` `confirmReservation` (both flows); `reservations.vue` | `reservations.py` (`@router.post("")`, `@router.get("")`) |
| `GET /private_clothing_items/rentals[?include_history=true]` | `my-rentals.vue` | `rentals.py` — **note: no bare POST exists** (only GETs + `/buy` POSTs), hence the §3 workaround |
| `POST /private_clothing_items/orders`; `POST /orders/{id}/checkout`; `GET /orders`; `GET /orders/{id}` | `usePurchaseCart`, purchases.vue, purchase-success.vue | `orders.py` |
| `GET /private_clothing_items/donation_session/`; `GET /donation_session/{sessionId}` | `usePurchaseCart.fetchCreditBalance`, donations-credits.vue | `donation_sessions.py` (sub-prefix `/donation_session`) |
| `GET /private_clothing_items/wishlist/clothing_items`; `POST`/`DELETE /wishlist/{id}`; `GET /wishlist/exists/{id}` | `useWishlistManager`, product.vue, wish-list.vue | `wishlist.py` |
| `POST /stripe/create-checkout-session` | `useMembershipCheckout` | `stripe_router.py` prefix `/stripe` |
| `POST /mailing-list/subscribe` | mailing-list.vue, also-this.vue, MailBanner.vue | `mailing_list_router.py` — public, no auth |
| `GET /blogs`, `GET /blogs/{slug}` | `useBlogPosts` (silent fallback to bundled `app/data/blog.json`) | `blog_router.py` — exists only on branch `claude/blog-models` / PR #46 (open as of 2026-07-07) |

**Never wire these:**
- `GET /private_members/me` — **never existed** in the backend (grep `private_members` across `demat-backend/app/` = zero hits). It appears in old Webflow embed code and in an old migration-map endpoint list; the app correctly uses `GET /users/me` instead.
- Bare `/memberships` — `membership_routes.py` declares `prefix="/memberships"` AND `main.py` mounts it with `prefix="/memberships"` again, so the effective paths are **`/memberships/memberships*`** (double prefix). The frontend does not consume these routes; leave it that way unless the backend fixes the mount (backend changes go through Edward — see `demat-change-control`).

---

## 8. Testing discipline (non-negotiable rules)

These are Courtney's standing rules (reaffirmed 2026-07-07). They bind every agent and every session:

1. **Real-money flows are HUMAN-ONLY.** Never automate *completing* a Stripe payment — not a membership join, not a purchase. You may drive a flow up to the Stripe redirect (e.g. verify the checkout session gets created and the redirect URL arrives); the Stripe payment page itself is for a human. No exceptions, including "test cards".
2. **Any write to the hosted TEST database requires Courtney's explicit OK, each time.** That includes the innocuous-looking ones this domain makes easy to trigger: `POST /orders` (creates an order row), `POST /reservations`, basket/wishlist `POST`/`DELETE`, `PATCH /users/me`, and — subtly — **any first authenticated call with a fresh Auth0 account**, which JIT-creates a user row and fires a `SIGNED_UP` email event (§1). Ask first, state exactly what will be written.
3. **What CAN be exercised, once approved:** order creation and the fully-credit-paid short-circuit against the test API; the reservation lifecycle (create → view → confirm-modal states); basket merge-sync; wishlist toggle+revert. Know that these leave artifacts — prior QA rounds already left a published €8.00 donation session and `height_cm="151"` on the test profile (recorded in migration-map.md's Implementation log). Every artifact you create must be declared.
4. **The zero-risk path** for auth-dependent UI work is `npm run dev:mock` + the local auth-bypass backend against a local DB — see `demat-build-and-env`.
5. Backend changes (e.g. the future `POST /private_clothing_items/rentals`) are **never committed directly**: new branch off the working branch, PR to `Edwardvaneechoud/demat-backend`, flagged to Edward before starting. Never `git push` or open a PR from either repo without asking. See `demat-change-control`.

---

## Provenance and maintenance

All facts verified **2026-07-07** against: `webflow-migration` working tree (HEAD `4ef31bf` + uncommitted Capacitor changes to auth/checkout files) and `demat-backend` branch `claude/blog-models` (PR #46 open). Line numbers cited are from that tree and may drift — the function/anchor names are the stable handles.

Re-verification one-liners (run from `/Users/courtneyyocabet/webflow-migration` unless noted):

| Claim | Command |
|---|---|
| Audience hardcoded for both APIs | `grep -n "audience" app/plugins/auth0.client.ts` |
| Auth-gate release paths | `grep -n "auth-pending" app/plugins/auth0.client.ts` |
| useAuth state keys | `grep -n "useState(" app/composables/useAuth.ts` |
| Two cart storage keys + cap | `grep -n "STORAGE_KEY\|MAX_ITEMS" app/composables/usePurchaseCart.ts app/composables/useCartManager.ts` |
| PDP "10 items" copy vs 5 cap (fixed yet?) | `grep -n "up to 10\|cartFullAlert" app/pages/product.vue` |
| Shipping-name hardcode count (expect 8 files: the 7 logic locations + memberships.vue's data-membership attrs) | `grep -rln "5 items, 1 shipment per month" app/pages app/composables` |
| Shipping-rental workaround still present | `grep -n "SHIPPING MEMBER WORKAROUND" app/plugins/reservation-cart.client.ts` |
| No POST /rentals yet (backend) | `grep -n "@router.post" /Users/courtneyyocabet/demat-backend/app/api/routes/private_clothing_items/rentals.py` |
| Wishlist server-wins sync | `grep -n "syncWithAPI" -A 8 app/composables/useWishlistManager.ts` |
| Guest gates differ (popup vs modal) | `grep -n "loginWithPopup" app/composables/useCatalog.ts app/plugins/wishlist.client.ts && grep -n "openAuthModal" app/pages/product.vue` |
| Only commerce GTM event | `grep -rn "dataLayer.push" app/ --include="*.ts" --include="*.vue"` |
| postLoginAction replay + 1500 ms | `grep -n "postLoginAction\|1500" app/composables/useMembershipCheckout.ts` |
| Cart cleared before Stripe redirect | `grep -n "Clear cart before redirect" -A 6 app/composables/usePurchaseCart.ts` |
| /private_members never existed | `grep -rn "private_members" /Users/courtneyyocabet/demat-backend/app/` (expect no hits) |
| Membership double prefix | `grep -n "memberships" /Users/courtneyyocabet/demat-backend/app/main.py /Users/courtneyyocabet/demat-backend/app/api/routes/membership_routes.py` |
| JIT + SIGNED_UP side effect | `grep -n "SIGNED_UP\|create_user" /Users/courtneyyocabet/demat-backend/app/dependencies.py` |
| PR #46 status | `gh pr view 46 --repo Edwardvaneechoud/demat-backend` |
| Capacitor work still uncommitted? | `git -C /Users/courtneyyocabet/webflow-migration status --short` |
