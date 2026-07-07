---
name: demat-architecture-contract
description: Load-bearing design decisions, invariants, and registries for the Dematerialized Nuxt app (app/). Load this before touching nuxt.config.ts, app/assets/css/, app/plugins/, app.vue, any storage key (localStorage/sessionStorage/cookies), any window.* global, or auth-dependent visibility — and whenever you're asking "why is it built this way?", "can I rename/reorder this?", "what writes this key?", "why does this element flash/stay hidden?", or "is this weird thing a bug?". Also covers the CSS load-order contract, the auth-gate + hydration visibility rule, and the known weak points.
---

# Dematerialized architecture contract

**What this covers:** the design decisions that hold the Nuxt port together — CSS load order, plugin ordering, the `window.*` parity bridges, the auth gate, the storage-key registry, the invariants, and the known weak points — each with the WHY, so you don't "fix" something load-bearing.

**When to use:** before editing `app/nuxt.config.ts`, `app/assets/css/*`, `app/plugins/*`, `app/app.vue`, anything touching auth-dependent visibility, storage keys, or globals; when triaging "why is X structured like this".

**When NOT to use (→ sibling):** step-by-step symptom triage → `demat-debugging-playbook`; the story behind an incident → `demat-failure-archaeology`; how the old Webflow site worked / reading `old/` → `webflow-parity-reference`; operating consent/i18n → `demat-i18n-and-consent`; cart/auth/Stripe flow details → `demat-commerce-and-auth`; whether a change is even allowed → `demat-change-control` (nothing in this skill authorizes deviations; all fixes to "weak points" below go through change control).

**Jargon:** *parity* = the site must reproduce the old Webflow site's layout/copy/URLs/behavior exactly (only cookie consent + i18n were sanctioned new engineering). *Hydration* = Vue attaching client behavior to server-rendered HTML; it reuses the SSR DOM instead of re-rendering. *IX2* = Webflow's interactions runtime (dropped in the port). *jsDelivr pin* = the old site loaded its custom JS/CSS from jsDelivr at pinned git commits.

**Repo state note (2026-07-07):** committed HEAD is `4ef31bf`; the working tree additionally carries **uncommitted Capacitor iOS/Android work** (`app/MOBILE.md`, `plugins/native.client.ts`, `assets/css/8-native-app.css`, `composables/useNativeApp.ts`, `ios/`, `android/`, plus edits to auth0/analytics/purchase/membership files). Facts below describe the working tree and flag native-app items explicitly. Do not commit or push any of it without Courtney's explicit OK (→ `demat-change-control`).

---

## 1. CSS load-order contract

`app/nuxt.config.ts` `css:` array, with the comment "Load order is a hard constraint: later sheets override earlier ones exactly as on the old site (export CSS → jsDelivr styles.css → account CSS). **Do not reorder.**"

Nine sheets exist in `app/assets/css/`; **eight are loaded, `4-my-account.css` is deliberately not**:

| # | Sheet | Loaded | Provenance (verified by `diff` 2026-07-07) |
|---|-------|--------|--------------------------------------------|
| 0 | `0-normalize.css` | yes | byte-identical to `old/dematerialized-24fc59.webflow (2)/css/normalize.css` |
| 1 | `1-webflow.css` | yes | byte-identical to `old/…/css/webflow.css`. Still contains `.w-webflow-badge` rules — inert, because the *runtime* (`webflow.js`, jQuery, IX2) was dropped, not the CSS |
| 2 | `2-dematerialized.webflow.css` | yes | identical to `old/…/css/dematerialized-24fc59.webflow.css` **except 47 changed lines, all `url()` rewrites**: `../images/…` → `/images/…`, plus one CloudFront checkbox SVG re-hosted at `/images/custom-checkbox-checkmark.svg`. Zero non-`url()` diff lines. Any other edit to this sheet is a parity deviation |
| 3 | `3-demat-custom.css` | yes | byte-identical to `old/demat-webflow-test/styles.css` (the production jsDelivr embed CSS) |
| 4 | `4-my-account.css` | **NO** | byte-identical to `old/demat-webflow-test/my-account.css`. Excluded on purpose: it styled the dead `account-app.js` UI and its generic selectors (`.reservation-card`, `.rental-card`, `.btn-primary`…) override the live design — loading it squashed the reservations card on mobile. Incident story → `demat-failure-archaeology`. **Never re-add it to the css array** |
| 5 | `5-sidenav.css` | yes | byte-identical to `old/demat-webflow-test/sidenav` (extensionless file, pure CSS) |
| 6 | `6-lang-toggle.css` | yes | **new work** — verbatim bridge for the ported `.lang-en`/`.lang-nl` span pairs, keyed off `html[lang]` which @nuxtjs/i18n sets; header says it retires once all copy moves into locale files |
| 7 | `7-auth-gate.css` | yes | **new work** — the auth gate (section 4) |
| 8 | `8-native-app.css` | yes (uncommitted, 2026-07-07) | **new work** — Capacitor shell chrome. Every rule scoped to `body.native-app`, set only by `plugins/native.client.ts` inside the apps; inert in browsers |

**Why order matters:** the old site's cascade was export CSS → jsDelivr `styles.css` → account CSS, and later sheets both override earlier ones and depend on their `:root` variables and base classes. Reordering changes which rule wins for thousands of selectors.

## 2. Plugin architecture

All plugins in `app/plugins/` are `.client.ts` (client-only). Nuxt runs plugins **sequentially in filename-alphabetical order**, and `auth0.client.ts` is an `async` plugin that is awaited before the next one runs. Execution order (working tree, 8 plugins):

1. `analytics.client.ts` — consent-gated loaders: GTM + Hotjar on the `analytics` grant, Meta Pixel on `marketing` (Pixel skipped inside the native apps to avoid Apple's ATT prompt — uncommitted change). Nothing loads before grant.
2. `auth0.client.ts` — **the load-bearing plugin.** Creates the Auth0 SPA client (`cacheLocation: 'localstorage'`, `useRefreshTokens: true`, audience `https://api.dematerialized.nl/` for test AND live — intentional, per old `auth.js`). Handles the `?code=&state=` redirect callback, restores `sessionStorage.auth_return_path`, hard-redirects members-less users to `/memberships`, triggers the onboarding modal, and releases the auth gate. Dev-mock branch behind `devMockAuth && import.meta.dev`. Uncommitted: a native branch handles Auth0's custom-scheme (`nl.dematerialized.app://…`) deep-link callback.
3. `locale-links.client.ts` — document-level click interceptor; keeps `/nl` sticky on verbatim EN `<a href="/…">` anchors and converts them to `router.push`. Exemptions: modified clicks, `target≠_self`, `download`, `hreflang` (the locale switcher), non-root-relative hrefs.
4. `native.client.ts` (uncommitted) — exits immediately in browsers (`if (!isNativeApp()) return`); Capacitor status bar/splash/back button/deep links/Stripe-return handling; sets `body.native-app`.
5. `onboarding.client.ts` — registers the onboarding `window.*` globals (table below).
6. `purchase-cart.client.ts` — exposes `window.PurchaseCart` with the exact old method surface; `cart.init()` at plugin time; badge re-sync on the `app:mounted` hook (the badge DOM only exists post-mount).
7. `reservation-cart.client.ts` — the reservation/rental overlay+modal flow; exposes `window.CartManager`, `window.UserMembership` and 13 more globals; `CartManager.init()` at plugin time, overlay render + badge on `app:mounted`. Escape deliberately does NOT close the cart overlay (old-site bug kept for parity — comment at ~line 246).
8. `wishlist.client.ts` — exposes `window.WishlistManager` + `window.updateWishlistIcons`; skips installation if `window.WishlistManager` already exists.

**Ordering guarantee and renaming hazard:** because `auth0.client.ts` sorts second and is awaited, every later plugin can assume `window.auth0Client` exists — **unless Auth0 client creation throws**, in which case the plugin returns *without* setting `window.auth0Client` (catch block sets `authReady` and removes the gate, then `return`). Two defenses exist: downstream code null-checks, and `useCartManager.init()` / `useWishlistManager.init()` **poll for `window.auth0Client` up to 50 × 100 ms** (5 s) before giving up (`useCartManager.ts:64-65`, `useWishlistManager.ts:43-44`). **Renaming any plugin file changes execution order** — a name sorting before `auth0.client.ts` would run before auth exists. Don't rename plugins; if you must add one that needs auth, name it to sort after `auth0.client.ts` and still null-check.

## 3. `window.*` parity-bridge inventory

**Why they exist:** the pages are verbatim ports of Webflow markup and page scripts that call the old embeds' globals by name (e.g. `my-rentals.vue` calls `PurchaseCart.hasItem`). The bridges keep those call sites working unchanged. Removing or renaming any of these breaks ported code silently.

| Owner | Globals |
|-------|---------|
| `auth0.client.ts` | `auth0Client`, `openAuthModal`, `closeAuthModal` |
| `useAuth.refreshUserData()` | `currentUserData` (mirror of GET `/users/me`) |
| `onboarding.client.ts` | `openOnboardingModal`, `closeOnboardingModal`, `showOnboardingModal` (alias), `skipOnboarding`, `testOnboardingModal` |
| `OnboardingModal.vue` (registered on mount, deleted on unmount) | `nextOnboardingStep`, `prevOnboardingStep`, `submitOnboarding`, `completeOnboarding`, `searchOnboardingAddress`, `selectOnboardingAddress`, `_onboardingAddressResults` |
| `purchase-cart.client.ts` | `PurchaseCart` — `init/save/hasItem/addItem/removeItem/clear/getItems/getTotal/formatPrice/updateCartBadge/showAddedToast/toggleCartDropdown/createCartPanel/openCartPanel/closeCartPanel/openCheckoutModal/closeCheckoutModal/fetchCreditBalance/renderCheckoutModal/getApiBase/processCheckout/showSuccessMessage` + `_items`/`_isCheckingOut` getters; `renderCartPanel`/`renderDropdown`/`injectCartStyles` are deliberate no-ops (panels render reactively in Vue components) |
| `reservation-cart.client.ts` | `CartManager`, `UserMembership`, `openCartOverlay`, `closeCartOverlay`, `renderCartOverlay`, `goToCartItem`, `removeCartOverlayItem`, `handleReserveClick`, `openReservationModal`, `closeReservationModal`, `confirmReservation`, `showReservationSuccess`, `closeSuccessModal`, `openUpgradeModal`, `closeUpgradeModal` |
| `wishlist.client.ts` | `WishlistManager` (old shape incl. `_wishlistIds`), `updateWishlistIcons` |
| `pages/my-rentals.vue` | `RentalsManager` (`{ renderRentalsPage }`) |
| `analytics.client.ts` (vendor) | `dataLayer`, `hj`, `_hjSettings`, `fbq`, `_fbq` |

## 4. The auth gate, end to end — and the hydration visibility rule

Mechanism (prevents the old site's flash of wrong-state UI):

1. **SSR:** `app.vue` sets `htmlAttrs.class = 'auth-pending'` on `<html>` while `useState('auth-ready')` is false (`app.vue:9`).
2. **CSS:** `assets/css/7-auth-gate.css` — `html.auth-pending [data-auth-gate] { visibility: hidden !important; }` plus the **collapse variant** `html.auth-pending [data-auth-gate="collapse"] { display: none !important; }` for gated elements whose reserved space would show as a blank gap (e.g. the reservations link in the account sidenav). Use `collapse` for layout-participating elements; the default reserves space.
3. **Markup:** auth-dependent elements carry `data-auth-gate` (navbar sign-in/account blocks, join-now button, footer join/my-account links, all of `#mobile-bottom-nav`, account-page buttons…). The *chosen-state* visibility is a separate `v-show` on the same element (e.g. `v-show="!hasActiveMembership"`).
4. **Release — three paths in `auth0.client.ts`, each sets `authReady = true` AND imperatively removes the class** (belt-and-braces with the reactive binding): the dev-mock branch's `finally`, the client-creation error catch, and the main flow's `finally` after session resolution. Elements then appear already in the correct v-show state.

**THE HYDRATION VISIBILITY RULE (non-negotiable):** auth/membership-dependent visibility uses **`v-show` or `v-if` only — never `:class` or `:style`**. Why: SSR always renders the signed-out state (auth is client-only), and during hydration Vue *skips reconciling class/style attribute mismatches* — a `:class`/`:style` bound to auth state keeps its server-rendered (signed-out) form even after client state flips, so the element is permanently wrong until the next full re-render. `v-show`/`v-if` are applied by reactive re-render after hydration and correct themselves. The rule is recorded as a comment in `SiteNavbar.vue` ("v-show (not :class) — class bindings that differ from SSR are not patched during hydration", line ~223) and in migration-map.md's Implementation log. Corollary: content that differs client-side *before* mount (localStorage/sessionStorage-derived) must be gated behind a post-mount `hydrated` ref so SSR and first client render match (the PurchaseCartPanel fix → `demat-failure-archaeology`).

## 5. Storage-key registry

| Key | Store | Owner | Shape | TTL / lifetime |
|-----|-------|-------|-------|----------------|
| `demat_purchase_cart` | localStorage | `usePurchaseCart` (`STORAGE_KEY`, :13) | array of `{clothing_item_id, name, image_url?, purchase_price_cents, retail_price_cents?}` | none (persists across sessions) |
| `dematerialized_wishlist` | localStorage | `useWishlistManager` (`WISHLIST_STORAGE_KEY`, :5) | numeric id array | none |
| Auth0 token cache | localStorage | `@auth0/auth0-spa-js` (`cacheLocation: 'localstorage'` in auth0.client.ts) | SDK-managed keys; no app code reads them directly | SDK-managed (refresh tokens on) |
| `dematerialized_cart` | **sessionStorage** | `useCartManager` (`STORAGE_KEY`, :50) | reservation-cart items `{id, sku, name, brand, size, image, addedAt}`, **MAX_ITEMS = 5** (:51) | tab session |
| `dm_catalog` | sessionStorage | **TWO writers** — `useCatalog` (caches `GET /search` payload) and `useCatalogCache` (caches `GET /clothing_items/catalog/full` payload) | `{data, timestamp}` | 5-min TTL. **Dual-writer hazard:** whichever ran last wins; the PDP may score related items against a `/search`-shaped payload and the catalog may read a payload lacking the server `filters` key |
| `auth_return_path` | sessionStorage | written by `useAuth.login()/signup()`; consumed+removed by `auth0.client.ts` redirect callback | pathname string | one login round-trip |
| `postLoginAction` | sessionStorage | `useMembershipCheckout` | JSON `{type:'membership_signup', membershipName}` | removed on replay after login |
| `onboarding_modal_dismissed` | sessionStorage | `onboarding.client.ts` `skipOnboarding` + `OnboardingModal.vue:496`; read by `auth0.client.ts:95` | `'true'` | tab session |
| `onboarding_completed` | sessionStorage | `OnboardingModal.vue:651` | `'true'` | tab session |
| `demat-consent` | **cookie** | `useConsent` | `{v:1, essentials:true, marketing, personalization, analytics, ts}` | maxAge 180 days, sameSite lax; SSR-readable via `useCookie` |
| `/users/me` cache | in-memory | `useUserMembership` (`CACHE_DURATION: 5*60*1000`, :28) | backend user object | 5 min; `clearCache()` exists |
| `pendingCheckout` | in-memory module var | `useNativeApp` (uncommitted) | `'membership' \| 'purchase'` marker for Stripe returns in the native apps | until consumed |

Adding any new persistent key is new engineering → stop and ask (`demat-change-control`).

## 6. Design decisions and WHY they hold

| Decision | Why |
|----------|-----|
| **Two separate carts** (`usePurchaseCart` = buy flow, localStorage; `useCartManager` = reservation/rental flow, sessionStorage, cap 5) | They port two *distinct* old embeds (`purchase-cart.js` vs the CartManager block in `site-wide-footer.js`) with different storage, limits, endpoints, and badge selectors (`.purchase-cart-badge` vs `[data-cart-count]`). Merging them would be a parity deviation and break the `window.*` surfaces |
| **Client singletons, fresh per SSR request** (`useCartManager`, `useUserMembership`) | Module-level singletons give the old code's one-instance semantics on the client; SSR gets a fresh instance per request to prevent cross-request state leaks |
| **No route middleware, no server-side auth** (`app/middleware/` is empty) | Deliberate parity: the old site was static HTML + client JS; all gating was client-side there too. Auth gating here is client CSS (`html.auth-pending`) + `v-show`. Do not add server auth "for security" without change control — the backend enforces authorization on every private endpoint |
| **Blog: API-first with silent fallback** (`useBlogPosts`) | Backend blog API (demat-backend PR #46) may not be merged/deployed; a 5 s-timeout fetch falls back to bundled `~/data/blog.json`, so the blog works regardless. **Quirk: an empty API array is treated as failure** (`items.length === 0` throws → fallback), so emptying the backend blog cannot empty the site's blog |
| **PDP URL is `/product?sku=…`** (query param, not a dynamic segment) | Exact URL parity with the old site. A `route.query.sku` watcher re-inits the page in place |
| **i18n `prefix_except_default`** (EN at `/`, NL at `/nl/…`, `detectBrowserLanguage: false`) | Matches the live Webflow URL scheme exactly; browser detection would break URL parity |
| **`locale-links` interceptor instead of rewriting hrefs** | Ported markup keeps verbatim EN anchors (parity); the interceptor localizes at click time. The `hreflang` attribute is the escape hatch (locale switcher) |
| **Consent via `onConsentGranted(category, cb)`** | Runs immediately if already granted, else once on the `demat:consent-changed` CustomEvent — handles both "granted at load" and "granted mid-session" without reload |
| **Dev API via `/dev-api` Nitro devProxy** | Backend CORS allowlist has no localhost origins; dev calls must go same-origin through the proxy |

## 7. Invariants — these must stay true

1. **URL parity** for every audited path (the per-page Links fields in migration-map.md's appendices): routes, query formats (repeated `?categories=a&categories=b` params, `?sku=`), and `/nl` prefixes reproduce the old site exactly.
2. **Verbatim SEO**: titles/meta/OG/Twitter match the old export heads verbatim — including oddities like all PDPs being `robots: noindex` with static og:title `'Product'` (intentional port, not a bug).
3. **No Webflow/CDN dependencies**: no `webflow.js`, no jQuery, no IX2, no jsDelivr loads; all assets self-hosted under `app/public/` (the one CloudFront SVG was re-hosted).
4. **Third-party scripts are consent-gated**: GTM + Hotjar behind `analytics`, Meta Pixel behind `marketing`; nothing loads pre-grant. **Accepted exception (do not "fix" without approval):** Google Fonts loads unconditionally from `nuxt.config.ts` head links — known, accepted as of 2026-07-07 (→ `demat-change-control` disposition table).
5. **Hydration visibility rule** (section 4) for anything auth/membership/client-storage-dependent.
6. **CSS sheets stay verbatim and ordered** (section 1); sheet 2's only permitted diff class is `url()` rewrites.
7. **`old/` is read-only source of truth**; never edit it, never content-scan `old/images/`/`old/videos/`.
8. **Change control**: any behavior/copy/URL/layout change beyond cookie-consent + i18n scope needs approval; approved deviations get logged in migration-map.md's "# Implementation log" section in the same turn they land.

## 8. Known weak points — stated plainly

State these when relevant; **fixing any of them goes through `demat-change-control`** (some already have dispositions):

- **No automated quality gates**: no CI in this repo (no `.github/`), no ESLint config, no Prettier, no typecheck script, `vue-tsc` not installed, zero tests. The Netlify build is the only automated check.
- **`SHIPPING_MEMBERSHIPS` membership-name strings duplicated in 7 places**: `useUserMembership.ts:34-37` plus local `SHIPPING_MEMBERSHIP_NAMES` consts in `pages/my-membership.vue`, `profile.vue`, `donations-credits.vue`, `my-rentals.vue`, `reservations.vue`, `purchases.vue`. A backend rename of `'5 items, 1 shipment per month'` / `'5 items per shipment, 2 shipments per month'` breaks all seven silently.
- **`dm_catalog` dual writer** (section 5): `useCatalog` (GET `/search`) and `useCatalogCache` (GET `/clothing_items/catalog/full`) share one sessionStorage slot with different payload shapes.
- **Backend membership double prefix**: `membership_routes.py` declares `prefix="/memberships"` AND `main.py` mounts it with `prefix="/memberships"` again — effective paths are `/memberships/memberships*`. Never wire frontend calls to bare `/memberships`.
- **`GET /private_members/me` never existed**: it appears in old Webflow embed docs but grep of the backend finds nothing; the frontend correctly uses `GET /users/me` everywhere.
- **`locale-links` intercepts ALL qualifying root-relative left-clicks** (not just on `/nl`) and converts them to `router.push`. Any new anchor that must full-reload or escape NL-prefixing needs `target`, `download`, or `hreflang`. This interceptor already caused one regression (broke catalog navbar filter links, fixed by the `useCatalog` route-query watcher → `demat-failure-archaeology`).
- **`processCheckout` clears the purchase cart BEFORE the Stripe redirect** (`usePurchaseCart.ts` — "Clear cart before redirecting", ~:347-348): a cancelled Stripe session returns the user to an empty cart. Verbatim old behavior.
- **No revoke teardown in consent**: `onConsentGranted` fires only on grant; un-checking a category and saving does not unload already-injected GTM/Hotjar/Pixel until a full page reload.
- **PDP cart-full copy says "up to 10 items" but the real cap is `MAX_ITEMS = 5`** (`pages/product.vue:56` vs `useCartManager.ts:51`) — a verbatim-ported copy bug from the old site (pdp.js said 10, site-wide-footer.js capped at 5). **CONFIRMED BUG, APPROVED TO FIX** per Courtney (2026-07-07); when fixed, log it in migration-map.md's Implementation log as a sanctioned deviation.
- **`/account` page's dead local `isAuthenticated` ref** (`pages/account.vue:14`, never set true — sign-out unreachable on the mobile `/account` page): **ACCEPTED/DEFERRED — do not fix without Courtney's approval.**
- **Sitemap emits a 7th blog post the live sitemap lacked**, and blog sitemap entries come from bundled `blog.json`, not the API: **ACCEPTED/DEFERRED.**
- **Shipping-member rentals POST to `/private_clothing_items/reservations`** ("SHIPPING MEMBER WORKAROUND" comment in `reservation-cart.client.ts` ~:108) until a dedicated rentals endpoint exists — documented workaround, not a bug.

## Provenance and maintenance

All facts above verified directly against the repo on **2026-07-07** (working tree on `main`, HEAD `4ef31bf`, plus the uncommitted Capacitor work described inline). File:line anchors are for that state; prefer the named functions/comments when lines drift. migration-map.md is cited by section heading (`# Implementation log`), never by line number.

Re-verification one-liners (run from `/Users/courtneyyocabet/webflow-migration`):

| Claim | Command |
|-------|---------|
| CSS array + order + exclusion comment | `sed -n '30,46p' app/nuxt.config.ts` |
| Sheet provenance (byte-identical) | `diff -q app/assets/css/3-demat-custom.css 'old/demat-webflow-test/styles.css'` (repeat per pair in §1) |
| Sheet 2 = url()-only diff (47 line pairs) | `diff app/assets/css/2-dematerialized.webflow.css 'old/dematerialized-24fc59.webflow (2)/css/dematerialized-24fc59.webflow.css' \| grep '^[<>]' \| grep -vc 'url('` → expect `0` |
| Plugin set / order | `ls app/plugins/` |
| Auth gate CSS | `cat app/assets/css/7-auth-gate.css` |
| Gate release paths | `grep -n "auth-pending" app/plugins/auth0.client.ts app/app.vue` |
| Hydration-rule comment | `grep -n "not patched during hydration" app/components/SiteNavbar.vue` |
| 50×100ms polls | `grep -n "attempts < 50" app/composables/useCartManager.ts app/composables/useWishlistManager.ts` |
| Storage keys | `grep -rn "STORAGE_KEY\|demat-consent\|dm_catalog\|auth_return_path\|postLoginAction\|onboarding_" app/composables app/plugins app/components --include='*.ts' --include='*.vue' \| grep -v node_modules` |
| Window globals | `grep -n "w\.\w* =" app/plugins/*.client.ts` |
| SHIPPING duplication count | `grep -rln "SHIPPING_MEMBERSHIP" app/pages app/composables` → expect 7 files |
| PDP 10-vs-5 bug (until fixed) | `grep -n "up to 10 items" app/pages/product.vue && grep -n "MAX_ITEMS: 5" app/composables/useCartManager.ts` |
| Backend double prefix | `grep -n 'prefix="/memberships"' /Users/courtneyyocabet/demat-backend/app/api/routes/membership_routes.py /Users/courtneyyocabet/demat-backend/app/main.py` |
| `/private_members` absence | `grep -rn "private_members" /Users/courtneyyocabet/demat-backend/app/` → expect no hits |
| Empty middleware dir | `ls app/middleware/` |
| Blog empty-array quirk | `grep -n "empty blog list" app/composables/useBlogPosts.ts` |
| Uncommitted mobile work still uncommitted? | `git status --short \| grep -c native` |
