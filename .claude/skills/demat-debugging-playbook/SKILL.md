---
name: demat-debugging-playbook
description: Symptom-to-triage playbook for the Dematerialized Nuxt app (app/). Load when something is visibly broken or behaving oddly — elements invisible for signed-in/out users, wrong content flashing on first paint, blank gaps while auth loads, cart icon/badge missing, stale catalog filters after navigation, NL locale lost on click, 422s on profile writes, CORS failures in dev, 401s in dev:mock, sudden styling breakage on account pages, cart/wishlist items vanishing across login, stale blog content, mismatched item-status labels, or analytics scripts not loading. Also load before ANY debugging session in this repo to run the "before you debug" checklist.
---

# Dematerialized debugging playbook

**What this covers:** symptom → first check → likely cause → fix pattern for every failure mode this project has actually hit, plus discriminating experiments to tell the failure classes apart.
**When to use:** a page/component/flow in `app/` is misbehaving and you need to triage it.
**When NOT to use →** the full incident chronicle with root-cause evidence lives in **demat-failure-archaeology**; setting up the dev environment / local backend is **demat-build-and-env**; understanding how a system is *supposed* to work is **demat-architecture-contract** (invariants, storage keys, window bridges) or **demat-commerce-and-auth** (Auth0/carts/Stripe); what the old Webflow site did is **webflow-parity-reference**; measurement scripts (crawler, SEO differ) are **demat-diagnostics-toolkit**; deciding whether a fix is *allowed* is **demat-change-control**.

Jargon used below, defined once:
- **SSR** — server-side rendering: Nuxt renders HTML on the server first; the browser then attaches Vue to it.
- **Hydration** — the client-side step where Vue adopts the SSR HTML. Critical quirk: **Vue does not patch `class`/`style` attribute mismatches during hydration** — if the server rendered one class/style and the client would render another, the server's wins silently.
- **Parity** — the project's prime directive: reproduce the old Webflow site exactly, including some of its bugs. Several "bugs" below are deliberate.
- **Auth gate** — CSS mechanism in `app/assets/css/7-auth-gate.css`: `<html>` carries class `auth-pending` until the Auth0 plugin resolves the session; anything marked `data-auth-gate` is `visibility:hidden` until then (`data-auth-gate="collapse"` = `display:none` instead).
- **IX2** — Webflow's interactions runtime (animation engine). It was dropped in the port; a few handlers (e.g. wishlist hearts) still use capture-phase listeners that originally existed to beat IX2 to the click.

---

## Before you debug — answer these four questions first

Misdiagnosis in this repo almost always comes from not knowing which mode/user/surface you're in.

| Question | How to check |
|---|---|
| **Which dev mode?** | `npm run dev` = hosted test API via `/dev-api` proxy + real Auth0 login. `DEV_API_TARGET=http://localhost:8000 npm run dev` = local backend, real login. `npm run dev:mock` = fake session + local backend (sets `NUXT_PUBLIC_DEV_MOCK_AUTH=1` and `DEV_API_TARGET=http://localhost:8000`, see `app/package.json`). Console shows `[auth] DEV MOCK AUTH active…` in mock mode. |
| **Which API?** | In dev, every call should go to `/dev-api/...` (Nitro devProxy, `app/nuxt.config.ts` `$development` block). A request hitting `https://test-api.dematerialized.nl` directly from a dev browser is itself the bug (row 8). Prod/staging call the API directly via `NUXT_PUBLIC_API_BASE`. |
| **Which user?** | Run `window.currentUserData` in the console — set by `useAuth().refreshUserData()`. `stripe_id` present = member (`hasActiveMembership`). Membership name drives shipping-vs-local cart flows. |
| **Which surface & locale?** | Web vs native app: as of 2026-07-07 a Capacitor iOS/Android stream is in flight (uncommitted in the working tree; `app/MOBILE.md`, `isNativeApp()` gates — e.g. the Meta Pixel deliberately never loads in the native apps). Locale: `document.documentElement.lang` (`en` vs `nl`); NL routes are `/nl/...`. |

**Change-control reminder (non-negotiable):** finding a bug does not license fixing it. Verbatim-ported oddities are often intentional parity. Known dispositions as of 2026-07-07: the PDP "up to 10 items" copy is a **confirmed bug approved to fix**; the `/account` dead `isAuthenticated` ref, unconditional Google Fonts, and the sitemap's 7th blog post are **accepted/deferred — do not fix without Courtney's approval**. Never complete a real Stripe payment while debugging (real-money flows are human-only); never write to the hosted test DB without Courtney's per-instance OK; never push or open PRs without asking. See **demat-change-control**.

---

## Triage table

| # | Symptom | First check | Likely cause | Fix pattern | Story (→ demat-failure-archaeology) |
|---|---|---|---|---|---|
| 1 | Element invisible only for signed-in (or signed-out) users; or renders wrong auth state on first paint and never corrects | View-source (raw SSR HTML): is visibility bound via `:class`/`:style` to auth state? Also check the old export for an inline `display: none` on the same element | Hydration doesn't patch class/style mismatches (SSR always renders signed-out); or a ported inline `display:none` that old `auth.js` used to flip at runtime | `v-show`/`v-if` on auth state + `data-auth-gate`; flip ported inline base style to visible (`display: block`) so v-show controls it | Sign-out button invisible everywhere (commit `78a1c02`); rule recorded in migration-map.md "Post-QA fixes (2026-07-06…)" |
| 2 | Blank gap in layout while page loads, filled ~1s later; or element stuck hidden forever | Does the element carry `data-auth-gate`? Is `document.documentElement.classList.contains('auth-pending')` stuck `true`? | Default gate is `visibility:hidden` — space stays reserved. Stuck = Auth0 plugin never reached one of its three `auth-pending`-removal exit paths (`app/plugins/auth0.client.ts`) | Use `data-auth-gate="collapse"` for layout-participating elements; if stuck, debug auth0 plugin init | Sidenav blank gap, QA round 2 #4 (commit `3c600b9`) |
| 3 | Wrong content branch after reload when localStorage/sessionStorage already has data (e.g. cart items rendered flex-centered inside the empty-state container) | Dev console for Vue hydration-mismatch warnings; does the template branch on storage-derived state? | SSR renders the empty branch; client has storage before hydration → Vue reuses the empty-state DOM node for the items list | Post-mount `hydrated` ref: `const hydrated = ref(false)` flipped in `onMounted`; branch on `hydrated.value && items.length > 0` (`app/components/cart/PurchaseCartPanel.vue`) | Purchase-cart centering, QA round 2 #3 |
| 4 | Navbar purchase-cart icon missing on page load despite non-empty cart | In console: `document.getElementById('purchase-cart-nav').style.display` vs its parent `.code-embed-37` wrapper's display | MutationObserver on the nav's `style` attribute fires **no mutation for same-value writes**, and the cart (hydrated from localStorage) may set display *before* the observer registers | Sync-from-current-state-at-mount: `syncWrapper()` called once in `onMounted` AND registered as the observer callback (`app/components/SiteNavbar.vue`) | Cart-icon-on-load, post-QA round 1 (commit `78a1c02`) |
| 5 | Catalog filters/grid stale after clicking a navbar category link or using back/forward — URL query updates but items don't | Confirm it was SPA navigation (no full reload). Check `useCatalog`'s `route.query` watcher is intact | SPA nav doesn't re-run init; `useCatalog` originally read the query only at init. The locale-links interceptor (row 6's fix) *caused* this regression | `route.query` watcher with `lastWrittenQuery` loop guard — mechanics below | QA round 2 #2 "catalog URL watching" (commit `3c600b9`) — a fix-regressed-a-fix story |
| 6 | On `/nl`, clicking a link lands on the EN page (locale lost) | Does the anchor carry `target` (≠`_self`), `download`, or `hreflang`? Is the navigation programmatic (not a click)? | Ported markup keeps verbatim EN hrefs; `app/plugins/locale-links.client.ts` prefixes `/nl` at click time but exempts `hreflang` (the locale switcher), `download`, and non-`_self` targets; it only sees real left-clicks | Let the interceptor handle it (don't hand-prefix `/nl` in markup). A new anchor that must escape interception needs `hreflang`/`download`/`target`; programmatic navs must localize explicitly | NL locale persistence, round 1 (commit `78a1c02`) |
| 7 | `422 Unprocessable Entity` on profile/attribute PATCH | Request payload: is a custom-attribute `value` a JSON number? | Backend requires attribute values as **strings**; Vue `type=number` v-model auto-casts to number | Explicit cast: `{ key: 'height_cm', value: String(formData.heightCm) }` (`app/pages/profile.vue`) — any new attribute write needs `String()` | Size-update 422, QA round 2 #6 |
| 8 | API calls fail in the dev browser with CORS errors | Network tab: is the request going straight to `https://test-api.dematerialized.nl` instead of `/dev-api/...`? | Backend CORS allowlist has **no localhost origins**; dev must go same-origin through the Nitro `/dev-api` proxy (`nuxt.config.ts` `$development`) | Always build URLs from `useRuntimeConfig().public.apiBase`; never hardcode the API host. Local backend: `DEV_API_TARGET=http://localhost:8000` | Designed-in constraint, not an incident |
| 9 | Every authenticated call returns 401 in `dev:mock` | Bearer token in the failing request = literal `dev-mock-token`? What's the proxy target? | `'dev-mock-token'` is not a JWT — only a locally-run backend with its token check bypassed accepts it. Hitting the hosted test API in mock mode fails by construction | Run the local auth-bypass backend (→ **demat-build-and-env** for the runner and setup) | Designed-in constraint |
| 10 | Styling suddenly wrong on account-ish pages (squashed cards, wrong button styles) | Is `4-my-account.css` in the `nuxt.config.ts` `css` array? Was the array reordered? DevTools Styles pane: which sheet wins the collision? | `app/assets/css/4-my-account.css` exists on disk but is **intentionally not loaded** — its generic selectors (`.reservation-card`, `.rental-card`, `.btn-primary`) collide with the live design. CSS load order 0→1→2→3→5→6→7 is a hard constraint | Remove the sheet from the array / restore the order; never "fix" by re-adding 4-my-account.css | Squashed reservations card on mobile, fixed 2026-07-05 (migration-map.md Implementation log, "CSS collision fix") |
| 11 | Wishlist or reservation-cart items vanish/duplicate around login | Which manager is involved? They sync differently **by design** | Wishlist `syncWithAPI()` is **server-wins** — guest-added local ids are overwritten on login (`useWishlistManager.ts`). Reservation cart `syncWithAPI()` **merges**: API wins, local-only items uploaded up to `MAX_ITEMS: 5` (`useCartManager.ts`) | Usually not a bug — parity with old `components.js` vs `site-wide-footer.js`. Confirm which semantics apply before "fixing" | Designed-in asymmetry |
| 12 | Blog shows stale posts / a backend edit doesn't appear | Console for `[Blog] API unavailable, using bundled content` | `useBlogPosts.ts` silently falls back to bundled `app/data/blog.json` on any API throw, a 5 s timeout (`API_TIMEOUT_MS`), **or an empty array** (`items.length === 0` throws `'empty blog list'`) | Determine which source served (the `console.info` line is the only signal). Empty-list-counts-as-failure is deliberate — deleting all backend posts cannot empty the site | Phase 6 design decision |
| 13 | Catalog and PDP show different status labels for the same item (e.g. "Being Cleaned" vs "Unavailable") | Is the item's status `in cleaning`? | Two independent maps: `useCatalog.ts` `STATUS_DISPLAY` maps `'in cleaning' → 'Being Cleaned'/'Wordt gereinigd'`; `product.vue` `ITEM_STATUS_CONFIG` has **no** `in cleaning` entry so it falls to `DEFAULT_STATUS_CONFIG` "Unavailable" | Parity with old `clothing.js` vs `pdp.js` — a change needs approval (→ **demat-change-control**) | Ported divergence, known |
| 14 | GTM/Hotjar/Meta Pixel not loading — or still running after the user revoked consent | Cookie `demat-consent` (JSON: `{v, essentials, marketing, personalization, analytics, ts}`); which category gates the script | Mapping in `app/plugins/analytics.client.ts`: GTM + Hotjar = `analytics`; Meta Pixel = `marketing` (and Pixel is skipped entirely in the native apps). **No revoke teardown**: `onConsentGranted` only fires on grant — revoking a category leaves already-injected scripts running until full reload | Grant the right category to test; revoke-still-running is by design (→ **demat-i18n-and-consent** for operating the system) | Designed-in; `personalization` currently gates nothing |
| 15 | PDP cart-full alert says "up to 10 items" but the cart refuses at 5 | `pages/product.vue` `cartFullAlert` copy vs `useCartManager.ts` `MAX_ITEMS: 5` | Verbatim-ported copy bug — old `pdp.js` said 10 while `site-wide-footer.js` capped at 5. Real cap is **5** | **CONFIRMED BUG, APPROVED TO FIX** (Courtney, 2026-07-07) — a sanctioned deviation from verbatim copy. When fixed, log it in migration-map.md's "# Implementation log" | Inherited from the old site |
| 16 | Signed-out "sign in" view flashes on an account page before switching to the real content | Does the page default a boolean `isAuthenticated`-style ref to `false` and render on it immediately? | Rendering a two-state view before the async auth check resolves | Three-state pattern: `authView: 'pending' | 'signin' | 'authed'` defaulting to a loading view (`app/pages/my-rentals.vue`); other account pages use an equivalent `view: 'loading' | 'signin' | …` | my-rentals signed-out flash, QA round 2 #7 |

**Known accepted defect adjacent to rows 1/16:** `app/pages/account.vue` declares a local `const isAuthenticated = ref(false)` that nothing ever sets — so on the mobile-only `/account` page sign-out can never appear (desktop redirects to `/profile`). This is **accepted/deferred as of 2026-07-07 — do not fix without Courtney's approval.** Don't burn time "rediscovering" it.

---

## Pattern deep-dives

### The hydration visibility rule (rows 1, 3, 16)
SSR always renders the signed-out, empty-storage state. Vue's hydration **skips patching `class` and `style` attribute mismatches**, so a `:class`/`:style` binding that is already "correct" client-side before hydration never gets applied. This bit the project twice (account.vue round 1, PurchaseCartPanel round 2) and is now doctrine (migration-map.md, "Post-QA fixes (2026-07-06…)"):

- **Auth/membership-dependent visibility: `v-show`/`v-if` only. Never `:class`/`:style`.** (Comment enforcing this lives in `SiteNavbar.vue` next to the join-now container: "v-show (not :class) — class bindings that differ from SSR are not patched during hydration".)
- **Content that differs client-side pre-hydration (storage-derived) must be gated behind a post-mount `hydrated` ref** so the first client render matches SSR, then switches after mount.
- **Ported inline `display:none` artifacts**: the Webflow export carries inline `display: none` on elements the old runtime JS flipped (e.g. the sign-out button in `old/dematerialized-24fc59.webflow (2)/index.html`). Ported verbatim with no flipper, they stay invisible forever. Fix = set the inline base to visible and add `v-show`.

### Auth-gate variants (row 2)
`app/assets/css/7-auth-gate.css`, complete mechanism:
```css
html.auth-pending [data-auth-gate] { visibility: hidden !important; }      /* default: reserves space */
html.auth-pending [data-auth-gate="collapse"] { display: none !important; } /* removes from layout */
```
`app.vue` puts `auth-pending` on `<html>` until `authReady` (useState key `auth-ready`); `plugins/auth0.client.ts` removes the class imperatively in its `finally`, its init-error path, and the dev-mock path. Choose **default** when the space genuinely belongs to the element in every auth state; choose **collapse** when a pending-state gap would look broken (account sidenav reservations link; the navbar hidden pink join/faq pair). Collapse-gated elements exist in `pages/{my-membership,profile,donations-credits,my-rentals,reservations,purchases}.vue` and `components/SiteNavbar.vue`.

### The catalog query-watcher loop guard, precisely (row 5)
In `app/composables/useCatalog.ts` (anchors: `serializeQuery`, `syncURL`, `applyRouteQuery`, the `import.meta.client` watch):
1. `serializeQuery(query)` produces a canonical string: keys **sorted**, array params expanded to repeated `key=value` pairs, values URL-encoded — so two orderings of the same query compare equal.
2. `syncURL()` sets `lastWrittenQuery = serializeQuery(query)` **before** calling `router.replace({ query })`. The order is load-bearing: the watcher may fire synchronously-ish after replace, and must already see the guard value.
3. The client-only `watch(() => route.query)`: bails unless `route.path` (trailing slashes stripped) is `/clothing` or `/nl/clothing` (the watcher outlives navigation); bails while `!loaded.value`; serializes the incoming query and **skips when it equals `lastWrittenQuery`** (its own echo); otherwise adopts the incoming value as `lastWrittenQuery` and runs `applyRouteQuery` (re-fetch on `q` change, re-apply selections, `syncURL()` again — whose echo the guard again suppresses).

**Do not** reorder the `lastWrittenQuery` assignment after `router.replace`, and **do not** write the catalog URL by any path other than `syncURL()` — either reintroduces the feedback loop this guard exists to prevent.

### Sync-at-mount for MutationObservers (row 4)
General lesson: `MutationObserver` reports *changes*, and writing the same value to a style property fires **no** mutation. Any observer of DOM state that other code may have set **before mount** (localStorage-hydrated carts run in plugins, before components mount) must read and apply the current state once at mount, then observe. See `syncWrapper()` in `SiteNavbar.vue`'s `onMounted`.

### Which cart is it? (rows 3, 4, 11, 15)
Two unrelated carts with confusable names — misidentifying them wastes hours:

| | Purchase cart (`usePurchaseCart` / `window.PurchaseCart`) | Reservation cart (`useCartManager` / `window.CartManager`) |
|---|---|---|
| Purpose | buy your rented items (Stripe order) | membership reserve/rental flow |
| Storage | **localStorage** `demat_purchase_cart` (persists) | **sessionStorage** `dematerialized_cart` (per-tab) |
| Limit | none | `MAX_ITEMS: 5` |
| Badge | `.purchase-cart-badge` / `.purchase-cart-nav` inline display | `[data-cart-count]` elements |
| Login sync | none (local until checkout) | merge: API wins, local uploaded up to 5 |

Related parity quirks that are NOT bugs: Escape deliberately does not close the reservation cart overlay (old code's broken branch, kept as-is — comment in `plugins/reservation-cart.client.ts`); shipping-member rentals POST to `/private_clothing_items/reservations` ("SHIPPING MEMBER WORKAROUND" comment, dedicated rentals endpoint TODO); `processCheckout` clears the purchase cart **before** the Stripe redirect, so a cancelled payment loses the cart.

---

## Discriminating experiments

How to tell the failure classes apart when the symptom is just "it looks wrong":

1. **Hydration mismatch vs CSS vs auth-gate** — three probes:
   - **View-source vs Elements panel.** Browser view-source shows raw SSR HTML (always signed-out, empty carts). If the element is visible in view-source markup but hidden live (or has different class/style attributes), suspect hydration (row 1/3). If identical, suspect CSS.
   - **Dev-mode hydration warnings.** `npm run dev`, hard-reload, watch the console for `Hydration … mismatch` warnings — they name the node. (Warnings are dev-only; production hydrates silently wrong.)
   - **Auth-gate probe.** `document.documentElement.classList.contains('auth-pending')` — if `true` long after load, the gate is stuck (row 2), not a CSS or hydration issue. If the element carries `data-auth-gate` and the class is gone, the residual invisibility is v-show state or CSS.
2. **CSS collision vs component bug** — DevTools Styles pane on the broken element: if the winning rule comes from a sheet that shouldn't be loaded (`4-my-account.css`) or the cascade order looks inverted vs `nuxt.config.ts`'s numbered array, it's row 10. `getComputedStyle(el).display` distinguishes CSS `display:none` from `v-show`'s inline `display: none`(inline = Vue controls it).
3. **Init-only logic vs missing watcher** — reproduce twice: once by hard reload on the target URL, once by SPA-navigating to it. Works on reload but not SPA nav ⇒ init-time-only logic that needs a route/query watcher (row 5 was exactly this).
4. **Which data source served** — blog: look for `[Blog] API unavailable, using bundled content` in the console (row 12). Catalog: `sessionStorage.getItem('dm_catalog')` holds a 5-min cache written by **two different endpoints** (`/search` from useCatalog vs `/clothing_items/catalog/full` from useCatalogCache) — whichever page ran last wins; when catalog and PDP disagree, clear that key and re-test.
5. **Frontend vs backend/data** — before blaming the port, check the same call against the API directly (Network tab → copy as cURL). QA round 2 #1 (credits total "mismatch") turned out to be backend data (unpublished draft sessions), zero frontend change.

---

## Provenance and maintenance

Facts verified against the repo on **2026-07-07** at frontend HEAD `4ef31bf` (working tree additionally carried uncommitted Capacitor mobile-app work: `app/MOBILE.md`, `useNativeApp.ts`, `isNativeApp()` gates in `analytics.client.ts`/`auth0.client.ts` — line numbers in those files will shift when it lands). Commit hashes cited (`78a1c02`, `3c600b9`, `4ef31bf`) are stable; migration-map.md is cited by section heading because its line numbers drift.

Re-verification one-liners (run from repo root):

| Claim | Command |
|---|---|
| Auth-gate CSS variants | `grep -n 'auth-pending' app/assets/css/7-auth-gate.css` |
| Hydration-rule comment in navbar | `grep -n 'not patched during hydration' app/components/SiteNavbar.vue` |
| Hydration rule in doc of record | `grep -n 'never .:class' migration-map.md` |
| syncWrapper mount-sync pattern | `grep -n 'syncWrapper' app/components/SiteNavbar.vue` |
| Catalog loop guard order | `grep -n 'lastWrittenQuery' app/composables/useCatalog.ts` |
| locale-links exemptions | `grep -n 'hreflang' app/plugins/locale-links.client.ts` |
| PurchaseCartPanel hydrated ref | `grep -n 'hydrated' app/components/cart/PurchaseCartPanel.vue` |
| 422 String() cast | `grep -n "String(formData.heightCm)" app/pages/profile.vue` |
| /dev-api proxy + CORS rationale | `grep -n 'dev-api\|CORS' app/nuxt.config.ts` |
| dev:mock script + mock token | `grep -n 'dev:mock' app/package.json && grep -n 'dev-mock-token' app/plugins/auth0.client.ts` |
| 4-my-account.css still excluded | `grep -n 'my-account' app/nuxt.config.ts` |
| Wishlist server-wins vs cart merge | `grep -n 'syncWithAPI' app/composables/useWishlistManager.ts app/composables/useCartManager.ts` |
| Blog fallback + empty-array rule | `grep -n "empty blog list\|API unavailable" app/composables/useBlogPosts.ts` |
| Status-map divergence | `grep -n "in cleaning" app/composables/useCatalog.ts app/pages/product.vue` (product.vue hit count should be 0) |
| Consent category mapping | `head -2 app/plugins/analytics.client.ts` |
| No revoke teardown | `grep -n 'demat:consent-changed' app/composables/useConsent.ts` |
| PDP "10 items" bug (row 15) — still unfixed? | `grep -n 'up to 10' app/pages/product.vue` (a hit = still open) |
| /account dead ref still deferred | `grep -n 'isAuthenticated' app/pages/account.vue` (ref(false) at top, only v-show consumers = unchanged) |
| Storage keys unchanged | `grep -rn "demat_purchase_cart\|dematerialized_cart\|dematerialized_wishlist\|dm_catalog" app/composables/ \| grep STORAGE` |
| Escape/cart-overlay parity + shipping workaround | `grep -n 'Escape never closed\|SHIPPING MEMBER WORKAROUND' app/plugins/reservation-cart.client.ts` |
| Defect dispositions still current | check migration-map.md "# Implementation log" for entries after 2026-07-07, and ask Courtney if a disposition matters |
