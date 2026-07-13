# migration-map.md — Webflow → Nuxt migration map (Phase 1 output)

**Status: approved by Courtney on 2026-07-04.** Produced by the Phase 1 audit
(6 parallel batch agents over all 35 HTML pages with the locked 10-field spec; 5 agents over all 15
embed files; plus site-wide head/footer snippets, all 5 stylesheets, and the blog CMS field
definitions). Sections 1–9 are the distilled map and execution plan; Appendices A–J hold the full
per-page and per-file audit records to build from.

**Guiding principle (per Courtney): most Webflow-native functionality was not actually in use.**
The one-to-one port applies to what the site *actually does* — layout, styling, copy, URLs, and the
custom embed-JS behavior. Webflow machinery that existed but wasn't used gets dropped, not
replicated: the IX2 runtime (only reproduce interactions the audit marked FUNCTIONAL), Webflow's
form handler and legacy duplicate forms, the Webflow password page (401), unused CMS collection
templates, Webflow localization plumbing, and dead embed code. When in doubt whether a Webflow
feature was in use, check the custom JS/backend for evidence of use — if none, flag and drop.

Only sanctioned new engineering: **custom cookie consent** (replaces Finsweet ConsentPro) and
**@nuxtjs/i18n EN/NL** (replaces Webflow localization + CSS toggle). The new Nuxt 3 (Vue 3 SFC,
TypeScript) app lives in **`app/`** in this repo, hosted on Netlify, against the FastAPI backend
(test `https://test-api.dematerialized.nl` / live `https://api.dematerialized.nl`, env-switched).

---

## 1. Pages → Nuxt routes/components

URL parity is mandatory; all current paths keep working (extensionless routes replace `.html`).
Every page shares chrome: `NavbarDesktop`, `NavbarMobile`, `MobileBottomNav` (auth-state driven),
`DematFooter` (auth-aware links), `AuthModal`, cart embeds, consent banner → one `default` layout.

| Old page | Nuxt route | Page component & page-specific pieces |
|---|---|---|
| `index.html` | `/` | `pages/index.vue` — hero video, USP section (inline styles ported verbatim), clothing carousel, review slider (autoplay) → Vue carousel, stats banner, FAQ accordion, CTA, offer banner |
| `about-us.html` | `/about-us` | `pages/about-us.vue` — desktop/mobile bg videos, alternating split sections; bg images live in CSS classes |
| `how-it-works.html` | `/how-it-works` | `pages/how-it-works.vue` — hero video, 6-step accordion, review slider, FAQ accordion |
| `contact-us.html` | `/contact-us` | `pages/contact-us.vue` — hours block, 3 responsive Google Maps iframes (as-is), contact form (**endpoint TBD**) |
| `clothing.html` | `/clothing` (+query params `page/categories/colors/...`) | `pages/clothing.vue` + `FilterPanel.vue`, `CatalogGrid.vue`, `useCatalogFilters()` — ports `clothing.js` |
| `product.html` | `/product?sku=…` (**keep query-param URL**, not `[sku]` — parity) | `pages/product.vue` + gallery/zoom, accordion, related-items carousel, wishlist/cart buttons — ports `pdp.js`; per-SKU SEO from API + `product_page_head_code.txt` |
| `missing-pieces.html` | `/missing-pieces` | `pages/missing-pieces.vue` — single textarea form (**endpoint TBD**) |
| `also-this.html` | `/also-this` | `pages/also-this.vue` — blog index (Webflow CMS `w-dyn-list` → API fetch, Phase 6); has old-style footer (port as-is) |
| `search.html` | — | **Drop** (unused Webflow default search stub; nothing links to it — the `/search` *API endpoint* used by the catalog is unrelated) |
| `account.html` | `/account` | `pages/account.vue` — mobile-only hub, desktop redirects to `/profile` (middleware) |
| `profile.html` | `/profile` | `pages/profile.vue` — ports `profile.js` (Vue-in-Webflow forms → native SFC), Geoapify address autocomplete |
| `my-rentals.html` | `/my-rentals` | `pages/my-rentals.vue` — ports `rentals.js` (active/history, 50%-off purchase conversion, modal); JSON-LD verbatim |
| `reservations.html` | `/reservations` | `pages/reservations.vue` — ports `reservations.js` (status cards, pickup deadline, modal; hidden for shipping members) |
| `purchases.html` | `/purchases` | `pages/purchases.vue` — ports `purchases.js` (order cards, detail modal, payment breakdown) |
| `purchase-success.html` | `/purchase-success?order_id=…` | `pages/purchase-success.vue` — order fetch, loading/success/error states |
| `wish-list.html` | `/wish-list` | `pages/wish-list.vue` — Vue-in-Webflow app → native SFC; grid, hover front/back swap, status-aware buttons |
| `donations.html` | `/donations` | `pages/donations.vue` — marketing page, hero video, FAQ |
| `donations-credits.html` | `/donations-credits` | `pages/donations-credits.vue` — ports `donations.js` (credit balance, session history, detail modal) |
| `memberships.html` | `/memberships` | `pages/memberships.vue` — tier cards (`data-membership`/`data-price` → Stripe membership checkout via site-wide-footer flow), embedded translation dict → i18n |
| `my-membership.html` | `/my-membership` | `pages/my-membership.vue` — inline membership embed (plan/price/features, TIER_DETAILS) |
| `mailing-list.html` | `/mailing-list` | `pages/mailing-list.vue` — modern form only (**endpoint: `mailing_list_router.py`, confirm**), Google Map; legacy Webflow form dropped |
| `welcome-to-dematerialized.html` | `/welcome-to-dematerialized` | `pages/welcome-to-dematerialized.vue` — static success page |
| `error-membership-signup.html` | `/error-membership-signup` | `pages/error-membership-signup.vue` — static error page |
| 6 policy pages + `faq.html` | `/cancellation-policy`, `/cookie-policy`, `/donation-store-credit-policy`, `/privacy-policy`, `/return-policy`, `/terms-and-conditions`, `/faq` | One shared `PolicyLayout` (sidebar menu + mobile dropdown) + static content components; FAQ accordion (IX2 → Vue disclosure) |
| `detail_blog.html` | `/blog/[slug]` (**confirm live Webflow URL pattern**) | `pages/blog/[slug].vue` — Phase 6; CMS-bound title/body/image/authors → API; dynamic SEO |
| `detail_author.html` | `/authors/[slug]` (**confirm**) | `pages/authors/[slug].vue` — Phase 6; bare template |
| `detail_items.html` | — | **Drop** (unused Webflow CMS collection template — the real PDP is `/product?sku=` driven by the API) |
| `401.html` | — | **Drop** (Webflow password-page machinery, `/.wf_auth` — not in use) |
| `404.html` | `error.vue` | Nuxt error page matching layout (404 image, heading, home link); noindex |

## 2. Embed code → Vue targets

All jsDelivr `<script>`/`<link>` tags retire; logic bundles into Nuxt. Load-order deps
(components.js → auth.js → site-wide-footer.js → purchase-cart.js → page script) dissolve into
plugin/composable initialization.

| Embed file (ref pin) | Nuxt target |
|---|---|
| `auth.js` (@test) | `plugins/auth0.client.ts` + `composables/useAuth.ts` — Auth0 SPA client (domain `dev-rgs24jdzcvdydd77.eu.auth0.com`), login/logout, `[data-auth*]` bindings → reactive state, post-login return path, onboarding trigger |
| `components.js` (@test) | `CartOverlay.vue`, `ReservationModal.vue`, `UpgradeModal.vue`, `SuccessModal.vue`, `OnboardingModal.vue` (8 steps) + `composables/useWishlist.ts` (optimistic localStorage `dematerialized_wishlist` + API sync) |
| `site-wide-footer.js` (pinned `686173fd`) | `composables/useCartManager.ts` (reservation cart, sessionStorage `dematerialized_cart`, 5-item max), `useMembership.ts` (`UserMembership`, 5-min cache, shipping-vs-local mode), reservation flow, Stripe membership checkout (`POST /stripe/create-checkout-session` + GTM `membership_checkout_click`), navbar scroll-hide, onboarding w/ Geoapify; `DematI18n` → replaced by @nuxtjs/i18n |
| `purchase-cart.js` (@test) | `composables/usePurchaseCart.ts` (localStorage `demat_purchase_cart`), `CartPanel.vue`, `CheckoutModal.vue` — credit balance, order create, Stripe redirect |
| `clothing.js` (pinned `570ca6d1`) | `pages/clothing.vue` + `useCatalogFilters.ts` — /search fetch, client-side filtering, chips, URL sync, pagination (20/page), `dm_catalog` sessionStorage cache (5-min TTL), mobile search |
| `pdp.js` (pinned `3b440d42`) | `pages/product.vue` + `useProductGallery/useRelatedItems/useProductWishlist/useProductCart` — zoom, thumbs, mobile slider, related scoring (cat +10 / color +5, top 12), status-aware cart button |
| `purchases.js` / `rentals.js` (pinned `ea1b25a9`) / `reservations.js` (pinned `a957a4f3`) / `donations.js` / `profile.js` | Respective page components + composables (see §1); per-file EN/NL dicts (`*_T`) → i18n locale files |
| `account-app.js` | **Skip — dead code** (Vue 2 hash-tab app; `account.html` never mounts it; `/profile` + account pages cover the functionality) |
| `styles.css` (@main), `my-account.css`, `sidenav` | Global CSS, loaded after export CSS in fixed order (see §5) |
| `README.md`, `.github/purge-cdn.yml` | Not migrated (jsDelivr delivery mechanism retired) |

## 3. Integrations & site-wide code

| Integration | Today | Nuxt target |
|---|---|---|
| API base switch | Head script sniffs hostname → `window.API_BASE_URL` (+`CDN_BRANCH`) | `runtimeConfig.public.apiBase` env var; `CDN_BRANCH` retired |
| Auth0 | SPA SDK CDN + `auth.js`; hardcoded domain/clientId | `@auth0/auth0-spa-js` npm, plugin; config via runtimeConfig (confirm test/live tenants) |
| Stripe | Backend-created checkout sessions; frontend only redirects | Same flow, `useStripeCheckout` wrapper; no client SDK |
| MyParcel | Backend-side (`returns_router.py`); shipping-member logic in frontend | Same; `useMembership` drives shipping-vs-local UI |
| GTM | Dual containers: PROD `GTM-56PZW3LP`, TEST `GTM-556SMQSF` (+noscript iframes) | `plugins/gtm.client.ts`, env-selected ID, **consent-gated** |
| Hotjar | `hjid 6427900` | `plugins/hotjar.client.ts`, consent-gated |
| Meta Pixel | `1337973184818900` | `plugins/meta-pixel.client.ts`, consent-gated |
| Finsweet ConsentPro | Per-page head script + `fs-consent_component` (essentials always-on; marketing / personalization / analytics) | **REPLACED (Phase 2)**: custom banner + preferences modal reproducing the same 4 categories & UI, consent cookie, script gating |
| Webflow localization + CSS `.lang-en/.lang-nl` toggle + `window.DematI18n` + per-embed dicts | EN default, NL via `html[lang]`; `/nl/`-prefixed paths in `localizePath` | **REPLACED (Phase 2)**: `@nuxtjs/i18n`, `prefix_except_default` (`/` EN, `/nl/…` NL), all dicts consolidated to locale JSON |
| Webflow form handler | contact / missing-pieces / mailing-list ×2 / footer newsletter POST to Webflow | **Webflow machinery, dropped.** One form per purpose survives, wired to the backend (`mailing_list_router.py` for newsletter/mailing list; contact & missing-pieces endpoint TBD, likely `email_*` routers). Legacy duplicates are not ported |
| Geoapify autocomplete | Hardcoded public key client-side (profile, onboarding) | Keep flow; key → runtimeConfig (open question: proxy?) |
| Google Maps | Keyless embed iframes | As-is |
| jQuery + `webflow.js` (IX2) + Finsweet cmsslider | Sliders, accordions, dropdowns | Dropped; reproduced natively (Vue disclosure/carousel/CSS) — each interaction marked FUNCTIONAL vs DECORATIVE in the appendices |
| Fonts | Google Fonts: Urbanist (site-wide) + PT Serif/Montserrat/Playfair (WebFont loader, index) | `app.head` preconnect + css2 links, verbatim families/weights |

**Backend endpoints consumed** (read from FastAPI source when wiring): `GET/PATCH /users/me`,
`GET /search`, `GET /clothing_items/{subcategories,sizes,clothing_item/{sku},catalog/full,pricing_categories}`,
`GET/POST/DELETE /private_clothing_items/{rentals,reservations,wishlist/*,basket/*,orders,orders/{id}/checkout,donation_session/*}`,
`GET /private_members/me`, `POST /stripe/create-checkout-session`, mailing-list router.

## 4. SEO (captured verbatim in the appendices; reproduce exactly)

- Titles/descriptions/OG/Twitter captured verbatim per page in the Appendix blocks → `useHead()`
  per page. No canonicals or robots on public marketing pages today — **match, don't add**.
- `noindex` on: all account pages, product template, 401/404, welcome/error pages.
- JSON-LD: `clothing.html` (CollectionPage + BreadcrumbList + SearchAction) and `my-rentals.html`
  (ProfilePage/WebApplication) — verbatim; also `clothing_page_JSON-LD_code.txt` /
  `my-rentals-page_JSON-LD_code.txt` in `old/fallback_code/` as reference at build time.
- og:image URLs point at Webflow CDN (`cdn.prod.website-files.com/...`) — 9 meta images. Open
  question: re-host in `public/images/meta/` with absolute prod URLs (recommended) vs keep.
- Dynamic SEO (PDP per-SKU, blog/author per-slug) from API at render — read
  `product_page_head_code.txt` etc. when building those pages.
- Known content bug: `donation-store-credit-policy.html` meta description is copy-pasted from T&C —
  port verbatim or fix (open question).

## 5. Styling & assets

- **Stylesheets, global, fixed order:** `normalize.css` → `webflow.css` →
  `dematerialized-24fc59.webflow.css` → embed `styles.css` → `sidenav`. Verbatim, no
  scoping/modularizing. Remove only Webflow-runtime selectors (`.w-webflow-badge`, `html.w-mod-*`,
  `[data-w-cloak]`); keep all `.w-*` utility classes. Keep `[v-cloak]` rule.
  **`my-account.css` is intentionally excluded** (2026-07-05): nothing in the export loads it — it
  styled the dead account-app.js UI, and its generic selectors collide with the live design.
- Per-page inline `<style>` blocks (USP/clothing sections on index, filter panel on clothing, PDP,
  purchases/rentals/wish-list, memberships, mailing-list, footer) port verbatim into their components.
- Brand tokens validated present: plum `#4B073F`, magenta `#A92296`, charcoal `#24282d`, soft pink
  `#fff4fe`, `--nav-*` vars, 50px pills, 20px image radius, lowercase UI, Urbanist.
- Breakpoints preserved verbatim: 479/480/600/767/768/991/1440px.
- **Assets:** copy 248 images + 16 videos verbatim → `public/images/`, `public/videos/`
  (filenames preserved). Rewrite CSS `url('../images/…')` → `/images/…`. Re-host the one external
  CSS asset (`custom-checkbox-checkmark.589d534424.svg` from Webflow's cloudfront). Favicon/webclip
  via app.head.

## 6. Phased execution plan

- **Phase 1 (done):** this document.
- **Phase 2 — scaffold + the two new-work items.** `app/` folder: Nuxt 3 + TypeScript +
  `@nuxtjs/i18n`; global CSS in load order; assets copied; fonts; `runtimeConfig` (apiBase, Auth0,
  GTM env); default layout with shared chrome shells; consent-gated analytics plugins; **custom
  consent system**; **i18n foundation** (locale files seeded from the embed dictionaries); Netlify
  config + deploy preview against test API.
- **Phase 3 — pages & embeds.** Shared chrome fully, then pages in batch order A→F, each verified
  side-by-side vs the old HTML/CSS. FUNCTIONAL interactions reproduced; Webflow-native machinery not
  ported (no IX2 runtime, no webflow.js/jQuery; DECORATIVE animations become CSS or are dropped with
  a note).
- **Phase 4 — integrations wiring & auth flows.** Auth0 end-to-end, both carts, Stripe checkout +
  membership signup, wishlist sync, rentals/reservations/donations flows, forms to backend
  endpoints, Geoapify. Read each backend route file only when wiring its call.
- **Phase 5 — SEO parity + QA.** Verbatim meta + JSON-LD, URL parity for every audited internal
  link, page-by-page regression vs the Webflow site, i18n reconciliation, consent gating checks.
- **Phase 6 — blog to database.** demat-backend: new branch off
  `claude/rental-returns-myparcel-a2v09b`; `BlogPost`/`Author` models (dual-record-per-locale,
  `(slug, locale)` unique, M2M authors — Appendix J) + public blog routes; PR to
  `Edwardvaneechoud/demat-backend` (**confirm base branch + PR target with Edward first**). Then
  `/also-this` + blog/author detail pages consume the API; content migrated from Webflow CMS.
- **Phase 7 — deploy & cutover.** Netlify production (live API, PROD GTM), DNS cutover, analytics +
  consent verification, retire jsDelivr repo + Webflow after soak.

## 7. Dropped Webflow machinery (approved defaults)

- **Dropped, not ported:** `401.html` (Webflow password page), `search.html` (unused stub),
  `detail_items.html` (unused CMS template), `account-app.js` (dead code), legacy duplicate Webflow
  forms (e.g. old mailing-list form next to the modern one), IX2 runtime + decorative animations,
  Webflow localization plumbing, jsDelivr delivery + CDN purge CI, `.w-webflow-badge`/`w-mod-*` CSS.
- **Kept because actually used:** all embed-JS behavior, the interactions the audit marked
  FUNCTIONAL (accordions, dropdowns, sliders, modals), the `.w-*` CSS utility classes (markup
  depends on them), the blog CMS content (moves to the database in Phase 6).

## 8. Open questions

1. **Form endpoints** — newsletter/mailing-list → `mailing_list_router.py` presumably; contact &
   missing-pieces target unclear (email routers? a new endpoint would be a backend change to flag).
2. **Blog live URL patterns** — confirm production URLs for blog posts/authors before Phase 6 routing.
3. **og:image hosting** — re-host the 9 meta images (recommended) vs keep Webflow CDN URLs.
4. **Auth0 env config** — one tenant hardcoded for both test/live? Confirm before runtimeConfig.
5. **Geoapify key** — keep client-side via env var (faithful) or proxy through backend (backend change)?
6. **Meta description bug** on donation-store-credit-policy (copied from T&C) — port verbatim or fix?

## 9. Verification

- Per page: side-by-side vs Webflow static export (`old/…/*.html` in a browser) — layout, copy,
  breakpoints, interactions; SEO meta diffed verbatim (view-source comparison).
- Flows on deploy preview vs test API: auth (login/logout/onboarding), catalog filter/search/paginate,
  PDP gallery/wishlist/cart, checkout to Stripe test, rentals/reservations/donations pages,
  membership signup, forms.
- Consent: scripts blocked until category granted; preference persistence.
- i18n: `/` vs `/nl/` for every route; all embedded dicts' strings present in both locales.
- URL parity: every internal href from the audit's Links fields resolves.

---

# Implementation log

Kept current as work lands. ✅ done · 🔄 in progress · ⏳ pending.

## Phase 1 — audit & map ✅ (2026-07-04)
- ✅ 35-page parallel audit (locked 10-field spec), 15 embed files, site-wide snippets, 5 stylesheets, blog CMS fields → this document.

## Phase 2 — scaffold + consent + i18n ✅ (2026-07-04)
- ✅ Nuxt 3 + TS app in `app/` (hand-scaffolded; `nuxi` no longer offers Nuxt 3 templates). Node installed via Homebrew.
- ✅ 6 stylesheets global in fixed order; `url()` → `/images/`; cloudfront checkbox SVG re-hosted.
- ✅ 248 images + 16 videos → `public/`. Fonts via app.head. `runtimeConfig` (test API + TEST GTM defaults; prod via `NUXT_PUBLIC_*`).
- ✅ Custom consent system (4 Finsweet categories, `demat-consent` cookie) + consent-gated GTM/Hotjar/Meta Pixel plugins (verified: nothing loads pre-consent).
- ✅ @nuxtjs/i18n: `/` EN, `/nl/` NL; `html[lang]` wired in app.vue (the module doesn't set it); verbatim `.lang-en/.lang-nl` CSS bridge.
- ✅ netlify.toml (base=app); error.vue = 404 port.
- ✅ Dev-only CORS proxy `/dev-api` → test API (backend allowlists no localhost origins). ⚠️ Cutover: Netlify preview/prod domains need backend CORS + Auth0 allowlisting.

## Phase 3 — pages & embeds ✅ (2026-07-04/05)
- ✅ All 29 pages ported. Route crawl: 33/33 checks green with verbatim titles (incl. filtered catalog URLs and a 404 check).
- ✅ Shared chrome: desktop/mobile navbars, demat-footer, mobile bottom nav (guest/member configs), offer banner.
- ✅ Catalog `/clothing`: injected filter panel reproduced (7 extra filter sections, size profile/specific modes), URL-synced repeated params (`?categories=Blazers&categories=Pants`), search (debounce, limit=500), 20/page pagination, `dm_catalog` sessionStorage cache — verified against the live test API (594 items).
- ✅ PDP `/product?sku=`: gallery/zoom/thumbs, accordions, color canonicalization, related-items scoring (+10 cat/+5 color, top 12), status-aware cart button.
- ✅ Adversarial fidelity fleet (25 Fable verifiers): 13 findings → 3 real fixes (purchases initial view, mobile-nav dead `/wishlist` href, footer auth-link visibility); the rest were sanctioned deviations or misreads.
- ✅ Blog scraped from the live site (2026-07-05): 7 posts EN (+1 real NL variant; NL falls back to EN like production), 35 images re-hosted → `app/data/blog.json` (doubles as Phase 6 seed data). `/also-this` + new `/blog/[slug]` render it; live URL pattern `/blog/{slug}` confirmed (open question #2 resolved).
- ⏳ Not yet ported: onboarding modal (8-step) and the cart/reservation/upgrade/success modals from components.js (land with Phase 4 cart work).

## Phase 4 — integrations & auth 🔄
- ✅ Auth0 (2026-07-04): `plugins/auth0.client.ts` = 1:1 port of auth.js (same tenant/clientId/audience, localstorage cache + refresh tokens, `auth_return_path`, post-login no-membership → `/memberships`). Exposes `window.auth0Client`/`openAuthModal`, so all account pages fetch with real tokens. `AuthModal.vue` = verbatim code-embed-26. Navbar/footer/mobile-nav are auth-reactive. ⚠️ Auth0 dashboard may need `http://localhost:3000` in Allowed Callback/Logout/Web Origins.
- ✅ Membership Stripe checkout (2026-07-04): `useMembershipCheckout` = verbatim port of the site-wide document-capture handler (GTM `membership_checkout_click`, `postLoginAction` replay on `/memberships`, `POST /stripe/create-checkout-session` → redirect).
- ✅ Purchase cart (2026-07-05): `usePurchaseCart` + slide-in panel + checkout modal + toasts — 1:1 port of purchase-cart.js (localStorage `demat_purchase_cart`, credit application, `POST /private_clothing_items/orders` → `/orders/{id}/checkout` → Stripe). window.PurchaseCart full API parity.
- ✅ Reservation cart + modals (2026-07-05): `useCartManager` (sessionStorage `dematerialized_cart`, 5-item max, basket API sync) + CartOverlay/ReservationModal (shipping-vs-local dual mode)/Upgrade/Success modals + `useUserMembership` (window.UserMembership parity — sidenav shipping-member checks now live).
- ✅ Wishlist sync (2026-07-05): `useWishlistManager` + window.WishlistManager/updateWishlistIcons — optimistic local + API sync; catalog/carousel/PDP/wish-list pages all route through it (PDP guest → auth modal, catalog guest → loginWithPopup, per the respective source files).
- ✅ Onboarding modal (2026-07-05): 8-step wizard + Geoapify + PATCH /users/me; triggered from the auth plugin per auth.js checkUserStatus (members with incomplete profile, 500ms, skip-pages, dismissal respected).
- ✅ Dev tooling (2026-07-05): local-backend runner (scratchpad `run_local_backend.py` — dependency_overrides bypass of `get_token_claims`, impersonates a test-DB user, ZERO backend file changes; test-DB target verified before first run) + `npm run dev:mock` / NUXT_PUBLIC_DEV_MOCK_AUTH mock session + DEV_API_TARGET proxy switch. Signed-in pages now visually verifiable in dev.
- ✅ Mailing-list forms wired (2026-07-05): all three (mailing-list page, also-this newsletter, home
  mail banner) POST to the backend's own `/mailing-list/subscribe` (which self-documents as the
  Webflow-form replacement); 409/already-subscribed handling per the old UX; live-verified against
  the local backend (200 + success message).
- ⏳ Contact + missing-pieces forms: still stubbed-with-success-state — they need a NEW backend
  endpoint (none exists; email_* routers are admin infrastructure). Flagged for Edward; deliberately
  not added to the blog PR.
- ✅ CSS collision fix (2026-07-05): `4-my-account.css` removed from the global bundle — no page in the export references it (dead account-app.js styling) and its generic selectors (`.reservation-card`, `.rental-card`, `.btn-primary`…) overrode the live design (found via a squashed reservations card on mobile; §5 load-order note updated). Reservations/my-rentals/profile visually re-verified after removal.
- ✅ End-to-end authed commerce QA (2026-07-05, vs local backend + test DB): wishlist round-trip (heart → POST → page → remove → DELETE) ✓; full reservation lifecycle (overlay w/ 5-max messaging → local-mode modal w/ €5 policy → confirm → real reservation → renders "pending" on /reservations) ✓; purchase checkout (live credit balance, 50% math, order POST, backend rented-items-only rule surfaced verbatim in the modal error slot) ✓; onboarding wizard opens w/ verbatim copy ✓. Untested-by-design: completing a Stripe payment (needs a human; membership join or rented-item purchase in the browser). Test artifact: one pending reservation (item 617) under Courtney's test account.
- ✅ Member UI fixes (2026-07-05): "join now" hidden for active members in BOTH navbar spots + footer.
  **Hard-won rule: auth-state visibility must use `v-show`/`v-if`, never `:class`/`:style`** — SSR
  renders the signed-out state, and Vue does not patch class/style attribute mismatches during
  hydration, so a binding that's already "correct" client-side before hydration never applies.
- ✅ NL reconciliation (2026-07-05): 17-agent fleet filled missing Dutch copy verbatim from the live
  captures — home sections, the full about-us story, all 6 how-it-works steps + reviews + stats,
  contact page, membership cards/signs/FAQ, and more. Catalog was already complete.
- ❓ Reservations link for shipping members: hidden by the ported `isShippingMember()` rule (the
  OLD site's intended behavior — home-delivery members can't reserve in-store). Courtney flagged it
  missing on her account; her hosted-API membership name pending confirmation. If the rule itself is
  unwanted, it's a one-line change per account page.
- ✅ NL content capture (2026-07-05): all 17 live /nl pages saved to `nl-reference/` — the time-sensitive Phase 5 dependency is now safe regardless of Webflow retirement. Reconciliation fleet applying missing Dutch copy page-by-page.

## Phase 5 — SEO parity + QA 🔄
- ✅ NL content captured (17 live pages → `nl-reference/`) + reconciliation fleet applied Dutch verbatim.
- ✅ State-flash fix (2026-07-05, Courtney's improvement request): auth-sensitive chrome (7 elements)
  gated invisible until the session resolves (`html.auth-pending` + `data-auth-gate`, released by the
  auth plugin); sidenav shipping-member check made synchronous from pre-mount userData (no post-mount
  fetch → no flash). Verified: SSR carries the gate, client releases it, member state correct on first visible paint.
- ✅ robots.txt + sitemap.xml (server route) replicating the live Webflow sitemap structure exactly
  (bilingual pairs w/ en/nl/x-default alternates + blog URLs from blog.json); live sitemap archived
  in `nl-reference/live-sitemap.xml`. hreflang alternate link tags added site-wide via app.vue.
- ✅ og:image re-hosting (2026-07-05): 10 meta images (verified 1200×630) → `public/images/meta/`,
  11 pages rewritten to absolute `https://dematerialized.nl/...` URLs. Zero Webflow-CDN dependencies remain.
- ✅ SEO regression sweep (2026-07-05): 13 verifiers over every page vs the old export heads — **zero findings**.
- ✅ Final crawl (2026-07-05): 64 checks green — every page EN+NL, all blog posts EN+NL, product page, robots; sitemap verified separately.

## Phase 6 — blog to database ✅ (2026-07-05)
- ✅ **PR #46 → `Edwardvaneechoud/demat-backend`** (branch `claude/blog-models` off the working branch,
  which stays untouched): BlogPost/Author models (dual-record-per-locale, `(slug,locale)` unique, M2M),
  public `GET /blogs` + `GET /blogs/{slug}` with NL→EN fallback, Alembic migration (additive),
  idempotent seed from `app/data/blog.json`.
- ✅ Migration + seed applied to the TEST DB (authorized by Courtney): 7 EN + 1 NL posts, 2 authors;
  endpoints live-verified (list order, body+authors, NL variant, EN fallback, 404, 422).
- ✅ Frontend: `useBlogPosts` composable — API-first with silent fallback to the bundled JSON, so the
  blog works identically before and after the PR merges.
- ✅ Blog images in DB+S3 (2026-07-05, Courtney's request): `blog_image_record` table mirroring the
  clothing `ImageRecord` pattern; all 35 images uploaded to S3 (`demat-europe-test/img/blog/`,
  sanitized filenames, per-file content types, 35/35 public-read verified); post hero/thumbnail,
  author pictures, and every body `<img>` rewritten to S3 URLs; `BlogPostDetail` gained an `images`
  list. Commit `dd9c834` pushed — PR #46 updated with an explanatory comment. Bundled frontend
  copies remain as the offline fallback. Prod rollout note: re-run migration + upload script with
  prod env (keys land under `demat-europe/img/blog/`). Note: repo test suite needs Docker + CI-only
  `.env.test` (unavailable locally, pre-existing); lint clean.

## Post-QA fixes (2026-07-06, Courtney's issue list) ✅ — commit `78a1c02`
- ✅ Sign-out button: was invisible everywhere — a port artifact (`display:none` inline that old
  auth.js flipped at runtime) in the navbar menu, plus hydration-unsafe `:style` toggles on /account.
- ✅ NL language persistence: plain `<a>` anchors hard-navigated to EN routes; new global click
  interceptor (`plugins/locale-links.client.ts`, the DematI18n.localizeHrefs equivalent) prefixes
  `/nl` and routes through vue-router (SPA nav); locale switcher exempt via its hreflang attr.
  Verified: /nl/profile → sidenav click → /nl/my-rentals, lang=nl; EN switch still works.
- ✅ Cookie widget: always-present bottom-left button reopening consent preferences (like Finsweet's);
  hides while banner/preferences are open. Banner confirmed still appearing for fresh visitors.
- ✅ Purchase-cart icon disappearing: navbar wrapper only synced on style *mutations*, but pages
  loading with a persisted non-empty cart write the same display value → no mutation → icon hidden.
  Now syncs from current state at mount. Verified: reload with 1 item → icon + badge visible.

## Post-QA fixes round 2 (2026-07-07, Courtney's 8-issue list) — commit `3c600b9`
- ✅ #2 Catalog navbar filter links: SPA-nav regression — useCatalog now watches route.query
  (loop-guarded vs its own router.replace) and re-inits filters; verified Workwear→date-night click.
- ✅ #3 Purchase-cart centering: hydration mismatch (SSR empty-branch element reused while client had
  items) — hydrated-ref fix; items now top-aligned like the reservation overlay.
- ✅ #4 Sidenav blank gap: `data-auth-gate="collapse"` variant (display:none while pending).
- ✅ #6 Size update 422: backend requires string attribute values; height was sent as a number
  (Vue auto-casts type=number models). Note: test profile now has height_cm "151" (original was unset).
- ✅ #7 my-rentals signed-out flash: pending→signin/authed view states (other account pages already
  used the loading-first pattern).
- ✅ #8 Members see "faq" button (→ /faq) instead of join-now in both navbar spots (matches mobile nav).
- ✅ #5 NL: FAQ realigned to current EN (the LIVE NL FAQ was stale — old rental model/hours/credit
  rules + 4 untranslated Q&As; current-EN text left as placeholders for Courtney), contact-page NL
  hours/closure note corrected to EN facts, and a full placeholder-translation sweep over the
  purchase cart, checkout, reservation overlay/modals, auth modal, onboarding (real NL where
  obvious, EN placeholder otherwise — all strings now editable in per-file dicts).
- ℹ️ #1 Credits total: NO frontend divergence — the port matches donations.js verbatim and totals
  come from the backend ledger; the test account's only sessions are unpublished drafts (backend
  hides them). Needs Courtney's specifics (which session, expected vs shown) — may be backend/data.
  A published test donation session (€8.00 balance) was left in the test DB for verification.

## Phase 7 — deploy & cutover 🔄 (code-side done)
- ✅ `netlify.toml`, prod env-var scheme, deploy runbook **`app/DEPLOY.md`** (Netlify setup, env vars,
  Auth0 + backend CORS allowlist entries, DNS cutover, post-soak cancellations).
- ✅ Everything committed locally: `e44b2a5` on main (not pushed).
- ⏳ Human dashboard steps (cannot be automated from here): create the Netlify site, set the 2 env
  vars, add production/preview domains to Auth0 + backend CORS, DNS cutover, post-soak Webflow/Finsweet
  cancellation. All spelled out in `app/DEPLOY.md`.
- ⏳ Also outstanding: contact + missing-pieces form endpoint (new backend work, flagged for Edward);
  reservations-tab visibility for shipping members (product decision, currently faithful old behavior).

## Mobile apps — iOS & Android 🔄 (2026-07-07, Courtney's request)
- ✅ Capacitor 8 shells around the same Nuxt app (full feature parity by construction): `app/ios/` +
  `app/android/` projects, `capacitor.config.ts`, `NUXT_MOBILE=1` static-SPA build, icons/splash
  generated from the brand logo (74 Android + 7 iOS assets). All native behavior is runtime-gated
  (`Capacitor.isNativePlatform()`) — browsers keep the byte-identical Webflow-faithful site (build +
  preview verified).
- ✅ Native integration points: Auth0 via in-app system browser + custom-scheme callback
  (`nl.dematerialized.app://…`, Auth0's Capacitor pattern); Stripe checkout in the in-app browser
  with production-site return URLs + return settlement; safe-area CSS (`8-native-app.css`, scoped
  `body.native-app`); Android back button; deep links (scheme active, universal-link templates in
  `public/.well-known/`); splash/status-bar; Meta Pixel disabled natively (Apple ATT, 5.1.2).
- ✅ Bundle diet: `scripts/prune-mobile-bundle.mjs` ships only CSS-referenced media (212MB → 50MB per
  app); DOM-level `/images/`+`/videos/` refs rewritten to the production site at runtime.
- ⏳ Human steps (all in `app/MOBILE.md`): install Xcode + Android Studio (no CocoaPods needed — SPM),
  Auth0 dashboard callback/logout/origin entries, **backend CORS_ORIGINS += `capacitor://localhost`,
  `https://localhost` (flagged for Edward, env-var change, no backend code touched)**, signing +
  store listings, universal-link IDs (Team ID / signing SHA-256).

## Partner platform MVP 🔄 (2026-07-12/13, Courtney's request — sanctioned new scope)
- Branch `claude/partner-platform-mvp-lmc29w` (based on `capacitor-mobile-apps`). The full spec,
  decision log, and handover manual live in **demat-backend** under `docs/partner-platform/`
  (CONTRACT.md = frozen API contract, MANUAL.md = the handover document, ROLLOUT.md = go-live
  checklist); the matching backend is integrated there on the same branch name (sanctioned by
  Courtney, 2026-07-13 — the "never touch demat-backend" rule was explicitly relaxed).
- ✅ New surfaces (all real-i18n `$t()` new-scope code, `partner.*`/`partnerDashboard.*`/`partnerAdmin.*`
  namespaces, `.pp-` styles in `9-partner.css` + per-page blocks): partner PDP `/partner-item?id=`,
  `/partners` directory + `/partners/[slug]` storefronts, partner reservation cart (third store,
  localStorage `demat_partner_cart`, floating trigger — the two ported carts untouched), 4-step
  checkout (Stripe **setup-mode** hosted redirect for card-on-file with sessionStorage
  snapshot/resume via `?pp_setup=`, per-partner terms gates with version snapshots, per-item
  results), `/partner-activity` account page, partner dashboard `/partner/*` (8 pages), admin
  `/admin/*` (approval queue with photo upload, partner CRUD + logins + Stripe Connect onboarding).
- ✅ Existing files touched (all minimal/additive, hydration-rule compliant, v-show gated on the
  `usePartnerPlatform` availability probe so the site renders **byte-identically until the partner
  backend is deployed**): `nuxt.config.ts` (css append + i18n `files:` per-domain), `layouts/default.vue`
  (+2 components), `SiteNavbar.vue` (+3 account-dropdown links), 6 account pages (+1 sidenav anchor
  each), `sitemap.xml.ts` (+/partners + best-effort slugs), `useCatalog.ts` (optional `extraItems`
  hook) + `clothing.vue` (partner badge/link/meta/filters) for the intermixed catalog.
- ✅ New keys under `demat_partner_cart` (localStorage), `pp_pending_checkout` (sessionStorage),
  `dm_partner_catalog` (sessionStorage, 5-min TTL) — registered here per the storage-key rule.
- ⏳ NL copy across the three partner namespaces was drafted in-session — **flagged for Courtney's
  native review** (list in umbrella MANUAL.md).
- ⏳ Human/deploy steps: backend module must deploy first (probe answers → UI appears); Stripe
  Connect + webhook dashboard setup per MANUAL.md §4; merge order backend → frontend as always.

## Phase 6 — blog to database ⏳
- **Gated on Edward**: confirm base branch (`claude/rental-returns-myparcel-a2v09b`) + PR target. Models sketched in Appendix J; seed data ready in `app/data/blog.json`.

## Phase 7 — deploy & cutover ⏳
- Netlify site + env vars (`NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_GTM_ID`), Auth0 + backend CORS allowlisting for production/preview domains, DNS cutover, retire jsDelivr repo + Webflow after soak.

---

# Appendices — full Phase 1 audit records

Each page block follows the locked 10-field spec: 1 Identity · 2 Layout · 3 Styling · 4 Embeds &
scripts · 5 Forms · 6 Interactions · 7 SEO (verbatim) · 8 Assets · 9 Links · 10 Scope flag.

## Appendix A — Batch A: Home & marketing (index, about-us, how-it-works, contact-us)

## index.html  →  /
TITLE: Dematerialized | Clothing Rentals For Everyday Life

1. **Identity** — file: index.html, route: /, <title>: "Dematerialized | Clothing Rentals For Everyday Life", purpose: Home page with hero video, USP cards section, clothing carousel, review slider, FAQ accordion, and CTA banners, EN/NL variant handling: lang="en" on root; CSS toggle rules inline (.lang-nl {display:none;} html[lang^="nl"] .lang-en {display:none;}); hreflang links in dropdown (hreflang="en"/"nl"); Webflow localization via data-wf-page="687a04de0b2eb2df33405caa"; Finsweet consent system active.

2. **Layout** — navbar-desktop (div-navbar-wrapper.desktop-nav: upper nav with language selector, logo, user account menu, wishlist, purchase cart, join-now button); top-navbar-mobile (mobile w-nav, collapsible); offer-banner (dismissible 50% off banner with x close); hero section (div-section-background-video with video overlays and text); w-embed USP section (usp-section > usp-layout 2-col grid: sticky left image with sticker overlays, right content with USP cards); w-embed clothing carousel (clothing-section > clothing-scroll-container with flex grid); review slider (slider-reviews.w-slider with autoplay, navigation dots); stats banner (div-banner-green with 3-col grid); FAQ section (div-faq-section > accordion with div-faq-wrapper, collapsible questions); call-to-action banner (div-banner.hiw); demat-footer (embedded custom HTML footer); mobile-bottom-nav inject; cookie consent modal (fs-consent_component). Shared chrome: navbar, footer, consent.

3. **Styling** — Primary: css/dematerialized-24fc59.webflow.css; secondary: css/webflow.css, css/normalize.css. Inline <style> blocks: (1) language toggle at line 82-87 (.lang-nl {display:none;}); (2) popup/modal CSS (lines 89-333, .popup-* classes for email capture); (3) custom navbar scroll styles (lines 633-649, .div-nav-links-wrapper hidden scrollbar); (4) embedded USP section styles (lines 755-1006, .usp-*, .usp-layout grid, .usp-card, colors: --blue-dark:#04314d, --gray-dark:#24282d); (5) embedded clothing section styles (lines 1111-1254, .clothing-section, .clothing-grid scrollable flex); (6) footer styles (lines 747-866, .demat-footer background #4b073f, 4-col grid layout, responsive @media 991px). Brand colors in CSS variables: --purple:#4b073f, --purple-dark:#a92296, --gray-dark:#24282d, --radius:20px.

4. **Embeds & scripts** — (a) Inline <script> API config (lines 31-39, window.API_BASE_URL, window.CDN_BRANCH logic per hostname); (b) Google Tag Manager PROD (lines 41-45, GTM-56PZW3LP) and TEST (lines 48-52, GTM-556SMQSF); (c) Hotjar tracking (lines 55-63, hjid:6427900); (d) jsDelivr CSS link (line 65, https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css); (e) Meta Pixel / Facebook (lines 67-78, fbq init 1337973184818900); (f) Finsweet consent API (line 334, https://api.consentpro.com/v1/cdn/runtime/.../78a5ea9e81640d85.js); (g) Code-embed-26 w-script: Auth0 modal HTML inject with login/signup buttons, links to terms and privacy (lines 338-369); (h) Code-embed-37 w-script: purchase-cart-nav div with cart toggle button, MutationObserver to sync display state (lines 494-519); (i) Code-embed-38 w-script: join-now conditional button with membership status check via /private_members/me API endpoint (lines 547-615); (j) Webfont loader (line 22-23, Google fonts: PT Serif, Montserrat, Playfair, Urbanist); (k) Finsweet CMS Slider (line 88, @finsweet/attributes-cmsslider@1). Target Vue components: AuthModal, CartDropdown composable, useMembership composable, ConsentBanner, ClothingCarousel, FAQAccordion, Footer.

5. **Forms** — None on home page. Consent form handled by Finsweet API.

6. **Interactions** — Webflow IX2: (1) data-w-id="2dd4585f-6a7b-d0d4-fa48-7b83ddaf623e" offer banner dismiss (DECORATIVE/CSS); (2) data-w-id="293d2536-f39b-395c-a697-8ddd775be469" navbar date night filter; (3) data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" user account menu dropdown (FUNCTIONAL); (4) w-slider on review section data-autoplay="true" (FUNCTIONAL: autoplay carousel). Marked FUNCTIONAL: user menu dropdown, cart visibility toggle, review carousel autoplay, FAQ accordion expand/collapse.

7. **SEO** — VERBATIM: <title>: "Dematerialized | Clothing Rentals For Everyday Life"; meta description: "Buying is overrated. Rent from over 300 brands and look good any day of the week—no special occasion required. New arrivals every week. Based in Den Bosch."; og:title: "Dematerialized | Clothing Rentals For Everyday Life"; og:description: (same); og:image: "https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/6906063d4406e21a9f3d346e_home-meta-image.png"; og:type: "website"; twitter:title/description/image: (same); twitter:card: "summary_large_image"; No canonical, robots, or JSON-LD.

8. **Assets** — Images: favicon.png, webclip.png, a-c-tGTIbmcjNv0-unsplash.webp, cat-on-back.png, Demat_logo_4000x4000_black-background.webp, demat-sticker.png, pancakes_1.png. Videos: HIW-hero_mood-board_poster.0000000.jpg (poster), HIW-hero_mood-board_mp4.mp4, HIW-hero_mood-board_webm.webm. All relative paths (images/, videos/).

9. **Links** — Internal: index.html (home, w--current), clothing.html, /clothing?page=1&categories=...&colors=..., how-it-works.html, also-this.html, memberships.html, wish-list.html, contact-us.html. External: terms-and-conditions.html, privacy-policy.html, Instagram/TikTok (target=_blank). hreflang: locale dropdown (#).

10. **Scope flag** — Auth0 modal requires composable + store management; Finsweet consent must be replaced Phase 2; cart state sync (MutationObserver) should move to Nuxt store; embedded <style> blocks (USP, clothing sections) may need scoped component refactoring; i18n toggle currently CSS-based must move to @nuxtjs/i18n routing; video autoplay/muted/playsinline needs SSR care; review slider (w-slider) needs Vue carousel library; membership check API pattern clear but auth0Client global must be managed via composable; tracking setup (GTM/Hotjar/Pixel) likely Phase 2 scope.

## about-us.html  →  /about-us
TITLE: Dematerialized | About Us

1. **Identity** — file: about-us.html, route: /about-us, <title>: "Dematerialized | About Us", purpose: Company origin story page with timeline narrative sections, background videos, split-layout storytelling, and CTA to contact page, EN/NL variant handling: lang="en" root; CSS toggle pattern (.lang-nl hidden); hreflang dropdown; data-wf-page="6904a5b7ca8c7f3f67e73da7"; Finsweet consent active.

2. **Layout** — navbar-desktop + top-navbar-mobile (shared chrome); no offer banner; hero section (div-section-background-video.about-us with desktop/mobile video variants, overlaid text); narrative sections (div-section-about-text with alternating split layout: div-section-about-split with left image + right text or reverse); background images: div-background-image.problems, .first-step, .validation, .sign, .realization, .visit-us; centered text sections (div-content-wrapper-about-centered, div-center-content); lists (div-about-list); address/CTA block (link-block-address); spacers (div-about-spacer, top-padding, bottom-padding); mobile footer spacer; consent banner (fs-consent_component); demat-footer; mobile bottom nav inject.

3. **Styling** — Primary: css/dematerialized-24fc59.webflow.css; secondary: css/webflow.css, normalize.css. Inline <style>: (1) language toggle (lines 82-87); (2) footer CSS (lines 747-866, demat-footer #4b073f, 4-col grid, responsive); layout via Webflow classes (div-section-about-text, div-content-wrapper-about-centered, div-split-image-left, div-split-content-right, about-section-header, about-content-paragraph modifiers). Background images loaded via CSS class selectors—no inline URLs visible.

4. **Embeds & scripts** — Same globals as index: (a) API config; (b) GTM PROD & TEST; (c) Hotjar; (d) jsDelivr CSS link; (e) Facebook Pixel; (f) Finsweet consent; (g) Code-embed-26: Auth0 modal; (h) Code-embed-37: purchase-cart-nav; (i) Code-embed-38: join-now button; (j) Webfont loader; (k) Finsweet CMS Slider. No page-specific embeds beyond global header/footer.

5. **Forms** — Consent preferences form (Finsweet fs-consent_component) with email-form (data-wf-page-id, data-wf-element-id) containing checkboxes: essentials (always-active), marketing, personalization, analytics; dropdown toggles for cookie details; submit button; success/error messages (w-form-done, w-form-fail).

6. **Interactions** — Webflow IX2: (1) data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" user account menu (FUNCTIONAL); (2) data-w-id="ec6ce109-1111-e9d8-1e0a-209d80ffc14f" on dropdown-title-cookie-details (cookie details accordion toggle, FUNCTIONAL: show/hide cookie type list); (3) w-form submission (w-form-done/fail states). Marked FUNCTIONAL: cookie consent accordion expand/collapse, form submission, user account menu.

7. **SEO** — VERBATIM: <title>: "Dematerialized | About Us"; meta description: "It all started while standing in line at ZARA. Today, Dematerialized is a shared closet in Den Bosch redefining how women shop, wear, and share clothes."; og:title: "Dematerialized | About Us"; og:description: (same); og:image: "https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/6904d363a4c644149347b1a5_about-us-meta.png"; og:type: "website"; twitter:title/description/image: (same); twitter:card: "summary_large_image"; No canonical, robots, or JSON-LD.

8. **Assets** — Images: favicon.png, webclip.png, demat-sticker.png. Background images referenced via CSS classes (div-background-image.problems, .first-step, .validation, .sign, .realization, .visit-us)—filenames stored in compiled CSS. Videos: About_Us_Background_Video-1-poster-00001.jpg (poster), About_Us_Background_Video-1-transcode.mp4, About_Us_Background_Video-1-transcode.webm (desktop); About_Us_Mobile-poster-00001.jpg, About_Us_Mobile-transcode.mp4, About_Us_Mobile-transcode.webm (mobile). All relative paths (images/, videos/).

9. **Links** — Internal nav: index.html, clothing.html (categories), how-it-works.html, also-this.html, memberships.html, wish-list.html, contact-us.html (visit us CTA), profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html. External: terms-and-conditions.html, privacy-policy.html, cookie-policy.html. hreflang: locale dropdown (#).

10. **Scope flag** — Consent form (Finsweet) must be replaced Phase 2; background images stored in CSS—need to inventory filenames from compiled CSS before migration; video background desktop/mobile variants require careful SSR handling; split layout sections (alternating image/text) are Webflow div hierarchy—one-to-one port feasible with class-based styling.

## how-it-works.html  →  /how-it-works
TITLE: How It Works - Clothing Rental In Den Bosch | Dematerialized

1. **Identity** — file: how-it-works.html, route: /how-it-works, <title>: "How It Works - Clothing Rental In Den Bosch | Dematerialized", purpose: Process flow page with 6-step accordion sections, video hero, testimonial carousel, stats banners, FAQ accordion, and CTA sections, EN/NL variant handling: lang="en" root; CSS toggle pattern (.lang-nl hidden); hreflang dropdown; data-wf-page="68baea34aa64dfc255475ff1"; Finsweet consent active.

2. **Layout** — navbar-desktop + top-navbar-mobile (shared, "How it works" w--current); offer banner (dismissible); div-section-hiw with hero video (div-hiw-video-container, w-background-video) + 6-step accordion (div-hiw-steps-container with 6x div-content-wrapper-hiw.rounded.gray, each: div-hiw-step-title [step number pink, title, chevron icons] + div-hiw-step-content [expandable text + links]); slider-reviews (w-slider autoplay, navigation dots); div-banner-green (3-col stats grid); div-faq-section (FAQ accordion with faq-wrapper, faq-question, faq-answer); div-banner.hiw (CTA section); div-section.gray (spacer); mobile footer spacer; consent banner; demat-footer; mobile bottom nav inject.

3. **Styling** — Primary: css/dematerialized-24fc59.webflow.css; secondary: css/webflow.css, normalize.css. Inline <style>: (1) language toggle (lines 82-87); (2) footer CSS (lines 750-866, demat-footer #4b073f, 4-col grid); layout via Webflow classes (div-hiw-*, div-content-wrapper-hiw, div-faq-wrapper, icon-chevron-up-32px, icon-chevron-down-32px for accordion icons). Brand colors: --purple #4b073f, --pink #a92296, --radius 20px.

4. **Embeds & scripts** — Same globals: (a) API config, GTM, Hotjar, jsDelivr CSS, Facebook Pixel, Finsweet consent, Webfont loader; (b) Code-embed-26: Auth0 modal; (c) Code-embed-37: purchase-cart-nav; (d) Code-embed-38: join-now button; (e) Finsweet CMS Slider. No page-specific embeds beyond global header/footer.

5. **Forms** — Consent preferences form (Finsweet fs-consent_component) identical to about-us.

6. **Interactions** — Webflow IX2: (1) data-w-id="2dd4585f-6a7b-d0d4-fa48-7b83ddaf623e" offer-banner dismiss; (2) data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" user account menu (FUNCTIONAL); (3) data-w-id="15a8f203-373b-edf3-b942-e75d2898663b" on div-faq-question (FAQ accordion toggle, FUNCTIONAL: expand/collapse faq-answer); (4) slider-reviews.w-slider data-autoplay="true" data-duration="500" (FUNCTIONAL: autoplay carousel with navigation). Step accordion sections have no explicit data-w-id visible—likely CSS-based toggle or custom JS. Marked FUNCTIONAL: offer banner dismiss, user menu, FAQ accordion toggle, review carousel autoplay/navigation.

7. **SEO** — VERBATIM: <title>: "How It Works - Clothing Rental In Den Bosch | Dematerialized"; meta description: "Buy less, wear more. Rent what you want, when you want, for as long as you want. Swap out your items anytime at our shared closet in Den Bosch."; og:title: (same); og:description: (same); og:image: "https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/690608b8af29ddebecbe5983_how-it-works-meta.png"; og:type: "website"; twitter:title/description/image: (same); twitter:card: "summary_large_image"; No canonical, robots, or JSON-LD.

8. **Assets** — Images: favicon.png, webclip.png, demat-sticker.png. Videos: HIW-hero_mood-board_poster.0000000.jpg (poster), HIW-hero_mood-board_mp4.mp4, HIW-hero_mood-board_webm.webm. All relative paths (images/, videos/).

9. **Links** — Internal nav: index.html, clothing.html (categories), how-it-works.html (current, w--current), memberships.html (join now multiple CTAs), my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, profile.html, wish-list.html, contact-us.html (visit us), faq.html (learn more). External: terms-and-conditions.html, privacy-policy.html, cookie-policy.html. hreflang: locale dropdown.

10. **Scope flag** — Step accordion sections (6 steps expand/collapse) have no explicit data-w-id visible—verify interaction mechanism in Webflow JS runtime (may be CSS-based or custom JS). FAQ accordion has clear data-w-id pattern (can be ported). Review slider (w-slider) needs Vue carousel library. Consent form replacement Phase 2. No showstoppers for one-to-one port, but step accordion interaction mechanism needs clarification.

## contact-us.html  →  /contact-us
TITLE: Contact Us | Dematerialized

1. **Identity** — file: contact-us.html, route: /contact-us, <title>: "Contact Us | Dematerialized", purpose: Contact/inquiry page with business hours, address, contact form, embedded Google Map, and opening hours schedule, EN/NL variant handling: lang="en" root; CSS toggle pattern (.lang-nl hidden); hreflang dropdown; data-wf-page="68f4ee6cc9d4dd212a23f514"; Finsweet consent active.

2. **Layout** — navbar-desktop + top-navbar-mobile (shared chrome); no offer banner; div-section-mailing-list wrapper: div-content-wrapper-ml > div-heading-contact-us (centered heading + pancakes sticker) + paragraph; div-flex-wrapper-contact 2-col split: left (div-split-content-left.contact-us: contact details, business hours with label/value pairs, phone/clock icons) + right (div-split-content-right.contact-us: 3x google-map-embed iframes—mobile-small/mobile/desktop variants); div-contact-form.new-style ("get in touch" heading + form-mailing-list.contact > wf-form-Contact-Form with inputs [First-Name, Last-Name, email, Message textarea], checkboxes [Consent, Marketing-Consent], submit button, success/error messages); mobile footer spacer; consent banner; demat-footer; mobile bottom nav inject.

3. **Styling** — Primary: css/dematerialized-24fc59.webflow.css; secondary: css/webflow.css, normalize.css. Inline <style>: (1) language toggle (lines 82-87); (2) footer CSS (lines 593-713, demat-footer #4b073f, 4-col grid, responsive); layout via Webflow classes (div-section-mailing-list, div-flex-wrapper-contact, contact-us variants, form-mailing-list, text-area-form, checkbox-consent, button-form-submit, success-message-3, error-message-3). Google Map iframes have inline width/height and border:0.

4. **Embeds & scripts** — Same globals: (a) API config, GTM, Hotjar, jsDelivr CSS, Facebook Pixel, Finsweet consent, Webfont loader; (b) Code-embed-26: Auth0 modal; (c) Code-embed-37: purchase-cart-nav; (d) Code-embed-38: join-now button; (e) Finsweet CMS Slider. Page-specific: (f) google-map-embed w-embed w-iframe (3x iframes src="https://www.google.com/maps/embed?pb=...", responsive variants mobile-small/mobile/desktop, allowfullscreen, loading="lazy", referrerpolicy="no-referrer-when-downgrade"). Form submission via Webflow form API (data-wf-page-id, data-wf-element-id).

5. **Forms** — VERBATIM: id="wf-form-Contact-Form", name="wf-form-Contact-Form", method="get", data-name="Contact Form", data-wf-page-id="68f4ee6cc9d4dd212a23f514", data-wf-element-id="0bd0e368-042f-1542-f9e0-fe8bd424b3d4". Fields: (1) First-Name (text, maxlength=256, required); (2) Last-Name (text, maxlength=256, required); (3) email (email, maxlength=256, required); (4) Message (textarea, maxlength=5000, required); (5) Consent (checkbox, required, text: "I have read and understand the Terms & Conditions and Privacy Policy"); (6) Marketing-Consent (checkbox, optional, text: "I agree to receive marketing communications..."). Submit: type="submit", data-wait="...", class="button-form-submit left-align w-button". Success: w-form-done "Thanks for reaching out! We'll be in touch soon."; Error: w-form-fail "Oops! Something went wrong. Please try again.". Action: POST to Webflow form endpoint (implicit).

6. **Interactions** — Webflow IX2: (1) data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" user account menu (FUNCTIONAL); (2) w-form submission (success/error state toggle, FUNCTIONAL: Webflow form JS handles POST, displays w-form-done or w-form-fail). No explicit accordion/scroll triggers on contact page. Marked FUNCTIONAL: user menu, form submission with state management.

7. **SEO** — VERBATIM: <title>: "Contact Us | Dematerialized"; meta description: "For any questions or comments please contact us. We're available during our normal business hours. Email us at support@dematerialized.nl or send us a message on WhatsApp."; og:title: "Contact Us | Dematerialized"; og:description: (same); og:image: "https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/6906160216d598682cd27167_contact-us-meta.png"; og:type: "website"; twitter:title/description/image: (same); twitter:card: "summary_large_image"; No canonical, robots, or JSON-LD.

8. **Assets** — Images: favicon.png, webclip.png, pancakes_1.png (contact sticker), demat-sticker.png. No videos. Google Map iframes are third-party embeds (not asset files). All image paths relative.

9. **Links** — Internal nav: index.html, clothing.html (categories), how-it-works.html, memberships.html, wish-list.html, contact-us.html (current), profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, about-us.html. External: terms-and-conditions.html, privacy-policy.html, cookie-policy.html. Form action: implicit Webflow form POST. Mailto: support@dematerialized.nl (plain text). WhatsApp: +31 6 246 73835 (plain text). Google Maps: Lange Putstraat 4, 5211 KN Den Bosch. hreflang: locale dropdown.

10. **Scope flag** — Webflow form submission must be ported to Nuxt form library (VeeValidate + fetch to backend API endpoint)—clarify backend endpoint (@demat-backend /api/contact or similar). Google Maps iframes are third-party—confirm if embedded version requires API key or if static URL sufficient. Email/WhatsApp remain verbatim. Consent checkbox links to privacy-policy.html (will work once ported). Business hours table is semantic (div-row-ml label/separator/value)—may benefit from <table> or structured data in Nuxt. No showstoppers, but form backend integration is critical Phase 2.

### OPEN QUESTIONS
- Webflow form submission endpoint for contact-us.html — need backend API route (@demat-backend /api/contact or similar) to replace Webflow's implicit form POST.
- Step accordion interaction on how-it-works.html (6 steps with expand/collapse) — verify interaction mechanism in Webflow JS runtime; no explicit data-w-id visible on step containers, may be CSS-based or custom JS.
- Background image filenames in CSS — about-us.html references .div-background-image.problems, .first-step, .validation, .sign, .realization, .visit-us classes; need to inventory actual image filenames from compiled CSS or Webflow asset manager.
- Google Maps embed on contact-us.html — confirm if static embed URL requires API key in Nuxt or if iframe src is sufficient as-is.
- Auth0 integration — global auth modal (code-embed-26) injects HTML into all pages; requires auth0Client global object and openAuthModal/closeAuthModal functions to be available on window—plan Vue composable + store for auth state management.
- Finsweet Consent API (https://api.consentpro.com) — to be replaced with Phase 2 custom GDPR consent system; current integration on all pages via script tag + fs-consent_component; ensure custom replacement supports same cookie categories (essentials, marketing, personalization, analytics).
- Cart toggle state sync (code-embed-37) — uses MutationObserver to watch purchase-cart-nav visibility; should move to Nuxt store; clarify if cart is reservation cart vs purchase cart (two different icons/carts visible in navbar).
- Membership status check (code-embed-38) — join-now button hides if user has active membership via /private_members/me API; ensure auth0Client is initialized before check runs (current code has 500ms timeout fallback).
- i18n routing — pages currently use CSS toggle (.lang-nl) + Webflow native localization (hreflang in dropdown); @nuxtjs/i18n will manage routing (/ vs /nl, etc.); confirm URL strategy (prefix vs domain).
- Carousel/slider porting — review slider (w-slider) on index.html and how-it-works.html, clothing carousel on index.html, step accordion on how-it-works.html — pick Vue carousel library (swiper, vue-carousel, etc.) and ensure autoplay/navigation parity.
## Appendix B — Batch B: Catalog (clothing, product, missing-pieces, also-this, search)

## clothing.html  →  /clothing
TITLE: Shop The Collection | Dematerialized

1. **Identity** — `/Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/clothing.html`, route `/clothing`, title "Shop The Collection | Dematerialized", purpose: Catalog page displaying a grid of available clothing items with advanced filtering (category, size, color, availability) and search functionality. EN/NL variant: hreflang `en`/`nl` links in language dropdown (data-hover dropdown with locale items); site uses CSS toggle `.lang-nl { display: none; }` and `html[lang^="nl"] .lang-nl { display: inline; }` for bilingual content rendering.

2. **Layout** — Top navbar (`top-navbar-mobile`, `navbar-desktop` with `div-navbar-wrapper`, `div-upper-nav-wrapper`); desktop nav links in `div-nav-links-wrapper`; main content section `full-page-section` containing filter UI (`div-filter-section`, `div-filter-wrapper`, filter trigger button `data-filter-open`) and search bar (`search-container`, `search-wrapper` with icon + input); product grid (`div-clothing-section`, `div-clothing-wrapper` with `data-grid="products"`); product template card `div-clothing-item-wrapper` with image wrapper, wishlist icon, and text; pagination block `div-pagination` with pager controls; footer (`demat-footer`, `demat-footer-inner`, 4-column grid `demat-footer-top` with logo, customer care, company, support sections + bottom section with copyright/socials); mobile bottom nav injected as fixed nav `mobile-bottom-nav`; consent banner (`fs-consent_component`).

3. **Styling** — Primary stylesheet: `css/dematerialized-24fc59.webflow.css`. Custom inline `<style>` block (lines 137–915) contains all filter panel, search, toolbar, and mobile styles: `.filter-panel` (fixed right slide-out 420px), `.filter-panel-header`, `.filter-section-*`, `.filter-row` (checkbox styling), `.search-input` (rounded border, magenta focus), `.clothing-toolbar`, `.filter-trigger-btn`, `.filter-chip`, responsive breakpoints `@media (max-width: 479px)` and `@media (max-width: 767px)`. Footer styles in embedded `<style>` block use CSS variables (plum `#4b073f`, magenta `#a92296`, charcoal `#24282d`). Language toggle CSS `.lang-nl { display: none; }` + `html[lang^="nl"]` selectors. Webflow framework stylesheets: `css/normalize.css`, `css/webflow.css`.

4. **Embeds & scripts** — Inline `<script>` head: Google Tag Manager (PROD GTM-56PZW3LP + TEST GTM-556SMQSF), Hotjar (hjid 6427900), API base URL config (environment detection for production vs test API), Facebook Pixel (fbq init 1337973184818900). Inline style block (language toggle). Auth modal creation `code-embed-26` inlines modal HTML + functions. Cart visibility observer `code-embed-37`, join-now conditional visibility `code-embed-38` with membership check via `/private_members/me` endpoint. Footer link visibility JS `updateFooterLinks()` checks auth + Stripe ID. Mobile nav JS (NAV_CONFIGS with guest/member_inactive/member_active states, dynamic rendering based on auth state). jsDelivr loads: `https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css` (CSS), `@test/components.js` (shared UI), `@test/auth.js` (Auth0 client setup), `@686173fd6d08ad994dac4a03ee47d6a41ae81128/site-wide-footer.js` (footer logic), `@test/purchase-cart.js` (cart), `@570ca6d1ee9d63b50317cf656221c53742761957/clothing.js` (filter/search/grid behavior — CRITICAL: this drives the catalog UX). Webflow runtime: `js/webflow.js`. Auth0 SDK: `https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js`. Finsweet consent: `https://api.consentpro.com/v1/cdn/runtime/.../78a5ea9e81640d85.js` (manages cookie banner + preferences UI).

5. **Forms** — Mailing list form (also-this.html only, not clothing). Consent preferences form `wf-form-email-form` with checkbox inputs for marketing, personalization, analytics + submit button.

6. **Interactions** — Webflow IX2 hooks: `data-w-id` on user account nav toggle `3aa13800-cfef-f5fa-e272-93983f82db83` (dropdown on hover). Filter panel interactions driven by `clothing.js` (load-time JS, not IX2): toggle `data-filter-open` button opens/closes `.filter-panel` via `.is-open` class, backdrop fade. Search clear button toggle visibility. Wishlist heart icon toggle (outline/filled SVG swap). Mobile nav state-based rendering (no IX2 animation). All filter interactions (checkbox toggle, section collapse, apply/reset buttons) are FUNCTIONAL and must be reproduced in Vue component with state management. Pagination prev/next buttons advance `data-page`. Cookie preferences dropdowns are collapsible (chevron rotation on click).

7. **SEO** — Title: "Shop The Collection | Dematerialized". Meta description: "Discover a unique mix of local donations and curated pieces for women. New arrivals every week in all sizes. Visit our showroom in Den Bosch or explore the full collection online.". OG: og:title (same as title), og:description (same as meta description), og:image (https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/6906133b210df5c852b7d19f_clothing-meta.png), og:type (website). Twitter: twitter:title, twitter:description (same as OG), twitter:image (same as OG image), twitter:card (summary_large_image). JSON-LD (application/ld+json): CollectionPage schema with name "All Clothing", url "/clothing", inLanguage "en", description, BreadcrumbList (Home → /; Clothing → /clothing), Store about section (Dematerialized, Den Bosch), SearchAction with urlTemplate "/clothing?page=1&limit=20&categories={category}".

8. **Assets** — Images: `images/favicon.png`, `images/webclip.png` (brand assets), `images/placeholder-pdp.png` (product template, srcset: `-p-500.png` 500w, base 800w), `images/demat-sticker.png` (footer logo). Product grid template uses `data-field="frontImage"` and `data-field="backImage"` bound from CMS (hover swap). SVG icons embedded: language globe, shopping bag, heart (outline/filled), wishlist heart, user round, menu (filter), search, X (clear), chevron (collapse), info, minus/plus (dropdown toggles), hard hat (construction), Instagram/TikTok (footer). No video assets on this page.

9. **Links** — Internal nav: `href="index.html"` (home), `href="clothing.html"` (browse all, new in, everyday, workwear, date night, summer vibes, also-this), `href="how-it-works.html"`, `href="memberships.html"` (join now), `href="profile.html"` (my account), `href="my-rentals.html"` (rentals), `href="reservations.html"`, `href="donations-credits.html", `href="purchases.html"`, `href="my-membership.html"`, `href="wish-list.html"` (wishlist), `href="faq.html"`, `href="return-policy.html"`, `href="cancellation-policy.html"`, `href="contact-us.html"`, `href="terms-and-conditions.html"`, `href="privacy-policy.html"`, `href="cookie-policy.html"`, `href="donations.html"`, `href="about-us.html"`, `href="mailing-list.html". External: `https://www.instagram.com/dematerialized_nl/` (target _blank), `https://www.tiktok.com/@dematerialized_nl` (target _blank), `https://dematerialized.nl/clothing?page=1&categories=...` (parametrized filter links in navbar).

10. **Scope flag** — `clothing.js` (jsDelivr @570ca6d...) is the authoritative source for filter/search/pagination behavior. This must be ported to Vue as a catalog composable + grid component. Filter state management (active categories, sizes, colors, availability toggle) is FUNCTIONAL and non-trivial. Search is live-filtered client-side (clear button, input event binding). Cookie consent (Finsweet) must be replaced with custom consent system (Phase 2). i18n for navbar labels and footer copy is handled by CSS toggle + HTML spans (`.lang-en`/`.lang-nl`), requires i18n plugin integration. Mobile nav is injected via JS (no template in HTML) — must be ported as computed property or watcher based on auth state. Cart badge visibility logic (data-cart-count hidden by default, shown conditionally) needs component state. All other functionality (nav dropdowns, auth modal, membership check) is standard Vue component work. No breaking scope issues; all is porting work.

## product.html  →  /product
TITLE: Product

1. **Identity** — `/Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/product.html`, route `/product` (CMS-driven page, likely `/product/:sku` or similar in Nuxt), title "Product", purpose: Product detail page (PDP) showing single item with gallery, name, size/color, add-to-cart, wishlist, details/fit/info/availability accordion sections, related items carousel. EN/NL variant: hreflang toggle in navbar; CSS lang toggle (`.lang-nl { display: none; }`, `html[lang^="nl"] .lang-nl { display: inline; }`); footer spans with class `lang-en`/`lang-nl` for bilingual footer copy.

2. **Layout** — Top navbar (`top-navbar-mobile`, `navbar-desktop` with `div-navbar-wrapper`); main section `full-page-section product` containing: mobile gallery slider (`slider-mobile-gallery` with w-slider controls); desktop wrapper (`div-pdp-desktop-wrapper`) with desktop thumbnail sidebar (`div-pdp-sub-images-wrapper.desktop`), main image wrapper (`div-pdp-image-wrapper`), tablet thumbnails (`div-pdp-sub-images-wrapper.tablet`), and right column (`div-section.flex-vertical`) with content (`div-pdp-name-wrapper` with donated-by badge + heading, `div-pdp-main-details` with size/color label text, color circle, add-to-cart button `pdp-cart-button`, wishlist button `pdp-wishlist-button`, more details accordion (`div-pdp-more-details`) with collapsible sections (Details and Fit, More Information, Item Availability), each with title + plus/minus icons + hidden content div); related items section (`div-section.product.related`) with heading "you may also like", horizontal scroll viewport (`data-related-viewport`) containing related cards (`data-related-track`, `data-template="related-card"`); footer (`demat-footer`); mobile bottom nav; consent banner.

3. **Styling** — Primary: `css/dematerialized-24fc59.webflow.css`. Custom inline `<style>` block (lines 82–270) with PDP-specific rules: `.pdp-loader`, `.pdp-spinner` (loading animation), `.is-template` (hide), `.div-pdp-image-wrapper` (relative, flex center), image zoom on `.is-zoomed`, thumbnail border on active `.thumb-clone.is-active`, related items viewport (`overflow-x: auto`, smooth scroll), related card sizing (`clamp(140px, 20vw, 220px)`), mobile gallery styles (centering, max-height 60vh), action buttons (`.pdp-button-solid` magenta #a92296 → hover #4b073f, `.pdp-button-outline` soft pink #fff4fe). Footer embedded styles with lang toggle. Media queries for desktop/tablet/mobile gallery visibility, button full-width on mobile.

4. **Embeds & scripts** — Head inline scripts: Google Tag Manager (PROD GTM-56PZW3LP + TEST GTM-556SMQSF), Hotjar (hjid 6427900), API base URL config (environment detection). Auth modal creation `code-embed-26` (inline modal + functions). Cart visibility observers. Membership check for join-now button. Footer JS (`updateFooterLinks()` checks auth + Stripe ID). Mobile nav JS (guest/member_inactive/member_active states). jsDelivr: `@main/styles.css` (CSS), `@test/components.js`, `@test/auth.js`, `@686173fd6d08ad...@site-wide-footer.js`, `@test/purchase-cart.js`, `@3b440d42fa9cc8f9d076aa44b30d043e15bf66d1/pdp.js` (CRITICAL: PDP gallery zoom, image swap, related items carousel, accordion logic). Webflow: `js/webflow.js`, Auth0 SDK, Finsweet consent.

5. **Forms** — None. This is a product display page with buttons (add-to-cart, wishlist) that trigger JS events, not form submission.

6. **Interactions** — Webflow IX2: `data-w-id` on user account nav toggle (same as clothing page). `pdp.js` drives FUNCTIONAL interactions: image zoom (click main image, `.is-zoomed` class toggles cursor zoom-in/out, transform scale 2x), thumbnail click (active border outline, scroll to), mobile slider (Webflow w-slider with arrows + nav), related items carousel (horizontal scroll snap, card sizing), accordion sections (click title toggles `.is-open` on content div, chevron rotation on toggle icon). All are FUNCTIONAL and non-decorative; must be reproduced exactly in Vue components.

7. **SEO** — Title: "Product". Meta description, OG, Twitter: minimal (title only, no description or image — indicates template page likely to be replaced by CMS data). robots: noindex (correct for template page; remove in Nuxt when ported). No JSON-LD. No canonical. This page is a Webflow template; actual SEO will come from CMS/API response or per-SKU meta injection in Nuxt.

8. **Assets** — Images: `images/favicon.png`, `images/webclip.png`, `images/placeholder-pdp.png` (main product, srcset: `-p-500.png` 500w, base 800w), `images/demat-sticker.png` (footer logo). Product data bound via `data-field` attributes: `data-field="name"` (heading), `data-field="size"` (label text), `data-field="color"`, `data-field="description"` (multiple instances — main, accordion sections), `data-field="fabric"`, `data-field="care_instructions"`, `data-field="donated_by"`. SVG icons: same as clothing (language, cart, heart, wishlist, user, menu icons, dropdown plus/minus, info). Related items use `data-related-img` for image binding. No videos on this page.

9. **Links** — Internal nav (same set as clothing: home, profile, my-rentals, reservations, donations-credits, purchases, my-membership, terms, privacy, about, faq, return-policy, cancellation-policy, contact, how-it-works, memberships, also-this). External: Instagram, TikTok (footer). Product URL (cart) and wishlist URL not visible in HTML (JS-driven, API calls).

10. **Scope flag** — `pdp.js` is the authoritative source for all PDP interactivity (zoom, gallery, accordion, related carousel). Must be ported to Vue as dedicated PDP component with image zoom composable, accordion state management, and related items carousel. Image hover swap on related cards (if applicable) uses CSS or light JS. CMS field binding (`data-field="..."`) must map to Nuxt component props from API response. This page is a **template page** (robots: noindex); in Nuxt, it will be replaced by a dynamic route `/product/[sku]` with SSR and per-product SEO meta tags pulled from API. No blocking scope beyond implementation effort.

## missing-pieces.html  →  /missing-pieces
TITLE: missing pieces

1. **Identity** — `/Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/missing-pieces.html`, route `/missing-pieces`, title "missing pieces", purpose: User feedback form inviting customers to suggest items not currently in inventory. EN/NL variant: hreflang toggle in navbar; CSS lang toggle; footer spans with lang-en/lang-nl; form success/error messages (static HTML, no i18n strings visible in form itself).

2. **Layout** — Desktop navbar (`navbar-desktop`, `div-navbar-wrapper`); mobile navbar (`top-navbar-mobile`); main section `div-section-mailing-list` containing: heading section (`div-heading-contact-us.missing-pieces`) with centered text ("wish we had that top?"), sticker images, description paragraph; form section (`div-contact-form.new-style.missing-pieces`) with heading ("tell us what you want"), form wrapper (`form-mailing-list.contact.missing-pieces`), textarea input, submit button, success/error messages; footer (`demat-footer`); mobile bottom nav; consent banner.

3. **Styling** — Primary: `css/dematerialized-24fc59.webflow.css` (no custom inline style block for this page). Uses shared classes: `.heading-centered`, `.paragraph-centered`, `.heading-centered.left-align`, `.form-mailing-list`, `.text-area-form`, `.button-form-submit`, `.success-message-3`, `.error-message-3`. Footer embedded `<style>` block (footer-specific CSS, plum background #4b073f, lang toggle). Webflow framework (normalize, webflow base).

4. **Embeds & scripts** — Head inline scripts: Google Tag Manager (PROD + TEST), Hotjar, API base config, Finsweet consent. Auth modal, cart observers, membership check, footer JS, mobile nav JS (same as other pages). Footer script (`updateFooterLinks()` checks auth + Stripe ID). Mobile nav script (state-based nav). jsDelivr: `@main/styles.css`, `@test/components.js`, `@test/auth.js`, `@...site-wide-footer.js`, `@test/purchase-cart.js` (no page-specific JS like clothing.js or pdp.js). Webflow runtime, Auth0, Finsweet.

5. **Forms** — Form ID: `wf-form-Missing-Pieces`, name: `wf-form-Missing-Pieces`, data-name: "Missing Pieces", method: get, `data-wf-page-id="69f0d18032affc19fdf2f440"`, `data-wf-element-id="0bd0e368-042f-1542-f9e0-fe8bd424b3d4"`. Field: textarea `id="Message"`, `name="Message"`, `data-name="Message"`, required, maxlength 5000, class `text-area-form contact missing-pieces w-input`, placeholder: "describe the pieces you'd like to see in the shared closet (you can include links!)". Submit button: type submit, class `button-form-submit left-align w-button`, value: "Submit". Success message div: class `success-message-3 missing-pieces w-form-done`, text: "Submission received. Thanks for letting us know!". Error message div: class `error-message-3 w-form-fail`, text: "Oops! Something went wrong. Please try again.". No hidden fields. Form action: Webflow form handling (no explicit action attribute; submission managed by Webflow).

6. **Interactions** — None beyond standard form submission. Form is declarative (no custom Webflow IX2 animations). Success/error divs shown/hidden by Webflow form handler (non-interactive).

7. **SEO** — Title: "missing pieces". Meta description: "Can't find what you're looking for in the shared closet? Tell us which specific pieces, styles, trends, or sizes are missing from our collective wardrobe. We want to hear from you!". OG: og:title (same as title), og:description (same as meta), og:image (https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/6906160216d598682cd27167_contact-us-meta.png), og:type (website). Twitter: twitter:title, twitter:description (same as OG), twitter:image (same as OG image), twitter:card (summary_large_image). No JSON-LD, no canonical, no robots noindex.

8. **Assets** — Images: `images/favicon.png`, `images/webclip.png`, `images/sticker-pinstripe-jacket.png` (decorative sticker, srcset: `-p-500.png` 500w, base 800w, appears twice in heading section), `images/demat-sticker.png` (footer logo). SVG icons: language dropdown, user nav, cart, wishlist, shopping bag (same as other pages), footer socials (Instagram, TikTok).

9. **Links** — Internal nav (standard set: home, clothing, how-it-works, workwear, everyday, date-night, summer vibes, also-this, browse all, new in, memberships, profile, my-rentals, reservations, donations-credits, purchases, my-membership, faq, return-policy, cancellation-policy, contact-us, terms-and-conditions, privacy-policy, about-us, donations, mailing-list). External: Instagram, TikTok (footer).

10. **Scope flag** — Straightforward Webflow form port. In Nuxt, becomes a `<form>` with textarea, submit button, and conditional success/error message display via component state. Form submission likely to same backend endpoint as Webflow (or new Nuxt API handler). No custom JS interactivity; standard Vue form binding required. Cookie consent (Finsweet) must be replaced with custom system (Phase 2). All else is standard porting work.

## also-this.html  →  /also-this
TITLE: also this

1. **Identity** — `/Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/also-this.html`, route `/also-this`, title "also this", purpose: Blog/editorial hub listing articles with image, title, date, summary. EN/NL variant: hreflang toggle in navbar; CSS lang toggle; footer with lang-en/lang-nl spans; no form i18n visible.

2. **Layout** — Top navbar (`top-navbar-mobile`, `navbar-desktop` with current page link `w--current` on "also this..." in nav); main section `w-layout-blockcontainer.container-top-padding` containing: page header (`div-header-also-this`) with logo image; blog grid (`div-wrapper-blogs`) with dynamic list (`w-dyn-list`, collection-list-7, `w-dyn-items`) iterating over blog collection (template role=listitem `collection-item-8` with post link `div-post-wrapper`); each post card contains: thumbnail div `div-thumb-wrapper` with image `image-thumb.w-dyn-bind-empty`, date `blog-date.w-dyn-bind-empty`, title `blog-title.w-dyn-bind-empty`, summary `blog-summary.w-dyn-bind-empty`; empty state div (`w-dyn-empty` with text "No items found."); page note section `div-note-blog` with construction icon, message, subtext, subscribe button (link to mailing-list.html); footer (`div-footer-desktop` with old-style layout: logo, footer sections, newsletter form); mobile bottom nav; consent banner.

3. **Styling** — Primary: `css/dematerialized-24fc59.webflow.css` (no custom inline style block). Uses Webflow CMS collection styling. Footer styles embedded (`<style>` block in footer embed) with CSS vars, grid layout, lang toggle. Webflow framework (normalize, webflow base).

4. **Embeds & scripts** — Head inline scripts: Google Tag Manager (PROD + TEST), Hotjar, API base config, Finsweet consent. Auth modal, cart observers, membership check, footer JS (updateFooterLinks), mobile nav JS. jsDelivr: `@test/components.js`, `@test/auth.js`, `@...site-wide-footer.js`, `@test/purchase-cart.js` (no page-specific JS). Webflow runtime, Auth0, Finsweet. Footer form (mailing list) embedded in page footer (`wf-form-Mailing-List-Form`, method get, data-wf-page-id). Mobile nav injected via embedded JS. Newsletter button (link, not form-driven).

5. **Forms** — Mailing list form in footer: ID `wf-form-Mailing-List-Form`, name `wf-form-Mailing-List-Form`, data-name: "Mailing List Form", method get, `data-wf-page-id="69dfb4f04e27dd6bfb0a405e"`, `data-wf-element-id="63b53b3f-c5ca-b29b-6ff5-d4a957caf6f7"`. Fields: email input (type email, name Email, data-name Email, placeholder "Your email address", required, maxlength 256), checkbox input (name Consent, id Consent, data-name Consent, required, class `w-checkbox checkbox-form-policies checbox-policies footer`), label text: "I have read and understand the [Terms & Conditions](terms-and-conditions.html) and [Privacy Policy](privacy-policy.html)." Submit button: type submit, value ">", class `newsletter-button w-button`. Success message: class `success-message-2 w-form-done`, text: "Thanks for subscribing!". Error message: class `error-message-2 w-form-fail`, text: "Oops! Something went wrong. Please try again.". Also has "Subscribe" button (link to mailing-list.html, not form submission).

6. **Interactions** — Blog collection filtered via `w-dyn-list` (CMS binding, not custom JS). Empty state shown conditionally by Webflow CMS. Form success/error divs shown/hidden by Webflow form handler. No custom Webflow IX2 animations visible. Newsletter button is a link (no interaction).

7. **SEO** — Title: "also this". Meta description: "A space where we talk about a lot of things, from what's trending and should you actually care to living in cultural bubbles and the occasional off-topic blah blah. Readers welcome.". OG: og:title, og:description (same as meta), og:type (website). Twitter: twitter:title, twitter:description (same as OG), twitter:card (summary_large_image). No og:image, no twitter:image, no JSON-LD, no canonical, no robots noindex.

8. **Assets** — Images: `images/favicon.png`, `images/webclip.png`, `images/also-this-text-website.png` (header logo, no srcset), `images/Demat_logo_4000x4000_black-background.webp` (footer, srcset multi-resolution: -p-500.webp through -p-3200.webp + base 4000w), blog thumbnail images bound to CMS collection (data-w-dyn-bind-empty, will be populated from Webflow CMS at runtime). SVG icons: language, user, cart, wishlist, shopping bag (navbar), construction hard hat (page note), dropdown chevrons (footer form not visible in structure but footer code suggests accordion-style), Instagram/TikTok (footer).

9. **Links** — Internal nav: home, clothing (browse all, new in, everyday, workwear, date-night, summer vibes, also-this w--current), how-it-works, memberships; account links (profile, my-rentals, reservations, donations-credits, purchases, my-membership); policies (terms-and-conditions, privacy-policy, return-policy, cancellation-policy, contact-us, cookie-policy); info (about-us, faq, how-it-works, donations); mailing-list. External: Instagram, TikTok (footer). Blog post links are dynamic (`href="#"` in template, populated by CMS).

10. **Scope flag** — This page uses Webflow CMS collection (`w-dyn-list`, `-bind-empty`). In Nuxt, becomes a blog index page with API call to fetch articles, then `v-for` loop rendering card component. The CMS collection binding (`w-dyn-bind-empty` for blog-date, blog-title, blog-summary, image-thumb) must map to API response fields (likely fetched from demat-backend or Webflow CMS API). The "No items found" empty state is trivial in Vue (`v-if="articles.length === 0"`). Mailing list form is standard Nuxt form binding (email + consent checkbox required). Footer layout (old-style grid, not demat-footer embed) suggests this page may have been built before the new footer system — verify if footer should be updated to use demat-footer component like other pages (scope decision). Newsletter button links to /mailing-list (separate page). All else is straightforward CMS collection porting + standard Vue form handling.

## search.html  →  /search
TITLE: Search Results

1. **Identity** — `/Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/search.html`, route `/search`, title "Search Results", purpose: Minimal search results page template with search form (single input, no pre-filled results shown in HTML). Page appears to be a fallback/stub. EN/NL variant: No visible language toggle, no hreflang links, no lang-en/lang-nl spans in visible HTML — only the global lang toggle scripts and Finsweet consent present.

2. **Layout** — Basic `w-container` div containing: H1 heading "Search results", form (`action="/search"`, class `w-form`), label "Search", search input (name query, placeholder "Search…", type search, required), submit button (value "Search"). No navbar visible, no footer visible, no complex sections. Entire page is minimal stub template. Scripts loaded at bottom (jQuery, webflow.js, Auth0, jsDelivr embeds, GTM, Finsweet).

3. **Styling** — Primary: `css/dematerialized-24fc59.webflow.css`, `css/webflow.css`, `css/normalize.css`. No custom inline `<style>` block. Form styling likely inherits from `.w-form`, `.w-input`, `.w-button` Webflow classes. Very minimal visual treatment.

4. **Embeds & scripts** — Head inline scripts: Google Tag Manager (PROD + TEST), Hotjar, API base config. Finsweet consent. No auth modal, no footer JS, no mobile nav visible (page template too minimal). jsDelivr: `@test/components.js`, `@test/auth.js`, `@...site-wide-footer.js`, `@test/purchase-cart.js` (loaded but likely not used on this stub page). Webflow runtime, Auth0. No page-specific JS (no search logic visible in HTML).

5. **Forms** — Search form: `action="/search"`, method get (implicit), class `w-form`. Input: `name="query"`, `type="search"`, `placeholder="Search…"`, required. Button: `type="submit"`, value "Search". No hidden fields, no data binding visible. Form submission is server-side (action /search).

6. **Interactions** — None visible. Form is stateless, submission is GET to /search endpoint (backend handles query parameter processing).

7. **SEO** — Title: "Search Results". Meta description: None (empty). OG: og:title (same as title), no og:description, no og:image, og:type (website). Twitter: twitter:title (same as title), no twitter:description, no twitter:image, twitter:card (not specified, defaults to summary). Meta robots: noindex (correct for dynamic search results page). No JSON-LD, no canonical.

8. **Assets** — Images: `images/favicon.png`, `images/webclip.png`. No other assets visible (minimal stub). SVG icons: none visible in page content.

9. **Links** — No internal nav visible (no navbar/footer). No visible links in page content (stub form only).

10. **Scope flag** — This page is a **Webflow stub template** with minimal structure. In Nuxt, it will likely be replaced by a fully functional `/search` route with query parameter handling (`?q=...`), results grid/list (similar to clothing page), filters, and sorting. The current HTML is just a form template; actual search UI/logic must be built in Nuxt. The backend likely handles `/search?query=xyz` as a GET request returning results (or JSON API call from frontend JS). **Decision needed**: Should search be a separate page route or a modal/inline feature on the clothing page? If separate page, build it as a SPA component with live results. If inline, integrate into clothing page. The stub suggests it was intended as a separate page. No blocking scope — straightforward Nuxt build-out required.

### OPEN QUESTIONS
- Does the search page (/search) become a fully functional separate route with results grid + filters in Nuxt, or is search integrated as a modal/overlay on the clothing page?
- For also-this.html blog index: should the old-style footer (div-footer-desktop) be refactored to use the shared demat-footer component like other pages, or kept as-is for Phase 2 review?
- Product page (/product): will the route be /product/:sku with dynamic slug-based routing + API data fetch, or /product with query params? SEO meta tags (title, description, image) must be populated from API response.
## Appendix C — Batch C: Account (account, profile, my-rentals, reservations, purchases, purchase-success, wish-list)

## account.html  →  /account
TITLE: Account

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/account.html, /account, "Account", mobile-only account hub page showing auth state and navigation to account subsections. Lang: EN/NL toggle with hreflang="en"/"nl" links in language dropdown, .lang-en/.lang-nl CSS classes for visibility control.

2. **Layout** — top-navbar-mobile (w-nav): language selector, home link, cart icons (reservation + purchase), auth buttons. div-center-greeting-account: hero with "welcome back!" heading, logo/cat images. div-content-wrapper-account: main-links nav (profile, my-rentals, reservations, donations-credits, purchases, membership), contact block (to contact-us), secondary-links nav (faq, contact, legal), auth buttons (sign in/sign out). Mobile bottom navbar (mobile-bottom-nav): dynamically injected nav based on auth state. Wrapper: container-mobile-account.

3. **Styling** — dematerialized-24fc59.webflow.css (main), webflow.css (framework), normalize.css (reset). Inline <style> blocks: lang-nl/.lang-en toggle CSS (lines 76-81); checking-screen-size opacity hide (lines 82-87); mobile-bottom-nav (lines 298-389 — fixed navbar with blur, flex layout, icon/label pairs). All classes: top-navbar-mobile, div-navbar-links, language-selector-wrapper, locales-wrapper, div-heading-wrapper-account, mobile-heading-account, div-content-wrapper-account, div-wrapper-account, link-text-account-mobile, chevron-right-mobile-account, icon-support-mobile, auth0-btn, mobile-nav-item, mobile-nav-icon, mobile-nav-label, mobile-footer-spacer.

4. **Embeds & scripts** — jQuery 3.5.1 (d3e54v103j8qbb.cloudfront.net). webflow.js (Webflow IX2 runtime). Auth0 SPA JS (cdn.auth0.com/js/auth0-spa-js/2.0). jsDelivr embeds: @test/components.js (auth UI helpers), @test/auth.js (Auth0 integration), @686173... site-wide-footer.js (footer code), @test/purchase-cart.js (purchase cart logic). Finsweet consent (consentpro CDN). WebFont Google fonts loader. API endpoint detection script (lines 25-33). Google Tag Manager (GTM-56PZW3LP prod, GTM-556SMQSF test). Hotjar (hjid 6427900). Facebook Pixel (init 1337973184818900). Mobile nav initialization script (lines 390-580) — detects auth state (auth0Client.isAuthenticated(), UserMembership.fetch()), renders nav items (guest/member_inactive/member_active configs), listens for auth state change via window.updateAuthUI hook. Desktop check script (lines 596-615) — redirects desktop users to /profile. Inline style for mobile-bottom-nav (extensive, duplicated in footer). All marked FUNCTIONAL (auth detection, redirect logic, footer visibility).

5. **Forms** — No traditional form submission; auth buttons inline-styled onclick="openAuthModal()" (sign in when logged-out, onclick data-auth-action="logout" when logged-in). Sign in/out styled as buttons with direct event handlers, not form elements.

6. **Interactions** — data-w-id="dfaacfb6-8366-add9-824d-8b68a1a02fd9" (cart trigger toggle for user account nav). Account nav links (profile, my-rentals, etc.) highlight via CSS w--current class. Mobile nav renders dynamically with data-nav-action="login" buttons. Desktop redirect via window.innerWidth check (FUNCTIONAL). Auth state binding (logged-out display:none / logged-in display:none toggle on buttons). DECORATIVE: hover/mouseout inline color transitions on sign in/out buttons (lines 262-282). FUNCTIONAL: data-auth attributes (logged-out/logged-in) and onclick handlers.

7. **SEO** — VERBATIM: <title>Account</title>, <meta name="robots" content="noindex">, og:title="Account", twitter:title="Account", no meta description, no canonical, no JSON-LD. Robots noindex applied (private account page).

8. **Assets** — images/logo-sticker.webp + srcset (500w–5000w variants), images/logo-sticker-p-*.webp (8 variants). images/cat-on-back_1.png + srcset (500w–2042w variants). images/favicon.png (shortcut icon). images/webclip.png (apple-touch-icon). SVG icons embedded inline (lucide-style) for globe, language, shopping bag, heart, etc. No video assets.

9. **Links** — Internal: index.html (home), profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, contact-us.html, faq.html, terms-and-conditions.html (legal & privacy). External: Google Fonts (fonts.googleapis.com, fonts.gstatic.com), auth0 SPA JS, jsDelivr (gh/cyocabet-dem/demat-webflow), Finsweet consent pro, Google Tag Manager, Hotjar, Facebook Pixel, WebFont Google API, jquery CDN. Mobile nav config includes href to memberships.html (join).

10. **Scope flag** — none. Desktop detection & redirect (lines 596-615) is straightforward JS, not new scope. Mobile nav state detection (guest/member_inactive/member_active) mirrors existing Auth0 & UserMembership logic already in embed code. Lang toggle is CSS-based (EN/NL i18n ready). All patterns replicable in Nuxt with Auth0 composable and i18n module.

## profile.html  →  /profile
TITLE: Profile

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/profile.html, /profile, "Profile", user profile edit page (desktop-first, mobile fallback). Lang: EN/NL hreflang/lang-en/lang-nl pattern. Meta description: "Your privacy is our priority..." (same as all account pages).

2. **Layout** — navbar-desktop: full desktop nav (language, home, account menu with profile/rentals/reservations/donations/purchases/membership/logout, wish list, purchase cart, join now button, category links). top-navbar-mobile: mobile nav replica. w-layout-blockcontainer container-1300: page header (div-heading-content-policies, div-heading-policies rentals). div-section-policies: 2-col: sidenav-account-pages (account sidenav link embed) + div-policy-menu rentals right (main content: vue-profile-app). Footer: demat-footer (desktop-only, display:none on mobile), mobile-bottom-nav (injected). Wrapper classes: div-navbar-wrapper desktop-nav, div-nav-links-wrapper, div-account-nav-wrapper, account-sidenav, account-sidenav-link.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Extensive inline <style> blocks: form styles (lines 91-243 — [v-cloak], .form-label, .form-input-field, .form-checkbox-input, .checkbox-group, .form-row, .form-col-2/3/3-small, .form-group, .step-title, .form-button-primary, @keyframes spin, media @767px breakpoint). Account nav sidenav styles (from embed, not shown in truncated output). Footer styles (lines 900–1000+ — .demat-footer, .demat-footer-inner, .demat-footer-top, .demat-footer-col-title, .demat-footer-links, .demat-footer-bottom, socials, localization toggle). All form inputs use Urbanist font, 14px, border #ccc, focus border #000 with box-shadow. Autofill override to #fbefff. Buttons: 300px max-width, black bg, hover #333. Primary color accents: #4b073f (plum), #a92296 (magenta).

4. **Embeds & scripts** — jQuery 3.5.1, webflow.js, Auth0 SPA JS. jsDelivr @test: components.js, auth.js, @686173... site-wide-footer.js (prod hash), @test purchase-cart.js. Finsweet consent. WebFont. Auth modal script (lines 249-278 — creates .auth-modal-overlay with login/signup buttons). Account sidenav embed (lines 641-740 — HTML nav with profile/rentals/reservations/donations/purchases/membership links, with lang-en/lang-nl spans; JavaScript auto-highlight based on pathname, hide reservations for shipping members). Vue form embed (lines 743-892 — id="vue-profile-app" v-cloak, binds to v-if="loading" spinner, form sections for personal info, address, size profile with v-model inputs, @click handlers for update methods). All FUNCTIONAL.

5. **Forms** — Vue data bindings (no HTML form element): v-model="formData.firstName", v-model="formData.lastName", v-model="formData.email" (readonly), v-model="formData.dateOfBirth" (with autocomplete="bday"), v-model="formData.phoneNumber" (autocomplete="tel"), v-model="formData.addressStreet/HouseNumber/Unit/Zipcode/City", v-model="formData.heightCm", v-model="formData.preferredFit" (select), v-model="formData.shirtSize/pantsSize/shoeSize". Address search autocomplete (v-model="addressSearch", @input="searchAddress", v-if="showAddressResults" div with @click="selectAddress(result)" items). Update buttons: @click="updatePersonalInfo", @click="updateAddress", @click="updateSizeProfile". Success/error messages: v-if="successMessages.personal/address/size", v-if="errorMessages.personal/address/size". Submitting state: :disabled="submitting.personal/address/size", button text shows "saving..." ternary.

6. **Interactions** — data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" (user account dropdown toggle). w--current class on active nav link (profile). Account sidenav auto-highlight script (data-nav attribute, .active class applied). Desktop user account nav dropdown (data-w-id for user account icon). Membership check script (lines 488-525 — joins/hides join-now button based on Stripe ID). Footer visibility toggle script (lines 819-862 — shows/hides join-now and my-account links). All FUNCTIONAL.

7. **SEO** — VERBATIM: <title>Profile</title>, <meta name="description" content="Your privacy is our priority...", og:title="Profile", og:description="Your privacy...", twitter:title="Profile", twitter:description="Your privacy...", og:type="website", twitter:card="summary_large_image", no canonical, robots="noindex".

8. **Assets** — images/favicon.png, images/webclip.png (standard favicons). Images referenced in js/CSS (logo-sticker, cat-on-back variants, demat-sticker.png for footer). No image img tags in form (form dynamically populated). SVG icons embedded inline for nav (lucide-style).

9. **Links** — Internal: index.html (home), profile.html (active), my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, wish-list.html, contact-us.html, about-us.html, terms-and-conditions.html, privacy-policy.html, faq.html, how-it-works.html. External: Google Fonts, Auth0 SPA JS, jsDelivr, Finsweet, GTM, Hotjar, Facebook Pixel, WebFont.

10. **Scope flag** — Address autocomplete search (searchAddress method, v-if="showAddressResults" dropdown with results) — requires API endpoint integration. Current code shows Vue placeholder; backend endpoint (likely Nominatim or PostNL) not specified in HTML. Nuxt port needs: composable for address search API, v-model binding to reactive form state, @change debouncing. Font rendering (Urbanist, PT Serif, Montserrat, Playfair) via Google Fonts — confirmed in build. [v-cloak] hides form until Vue mounts — must port to v-cloak CSS in Nuxt layout or component. No other new scope beyond cookie consent & i18n.

## my-rentals.html  →  /my-rentals
TITLE: My Rentals

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/my-rentals.html, /my-rentals, "My Rentals", user rentals management (active + history). Lang: EN/NL via .lang-en/.lang-nl and html[lang]. JSON-LD included (lines 26-92): ProfilePage, WebApplication rental management, offers clothing rental, breadcrumb (Home > Account > My Rentals). Robots="noindex".

2. **Layout** — navbar-desktop + top-navbar-mobile. w-layout-blockcontainer container-1300 full-screen: div-header-policies res (empty header), div-section-policies rentals (sidenav + main content). Sidenav: account-sidenav-pages embed (profile/my-rentals/reservations/donations/purchases/membership with icons, lang-en/nl spans, .active highlight). Main: div-policy-menu rentals right > div-content-wrapper-policies right rentals > code-embed-36 (rental data embed). Footer: demat-footer (desktop-only) + mobile-bottom-nav. Classes: container-1300, div-section-policies, account-sidenav, account-sidenav-link.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Massive inline <style> block (lines 155-779) defining: :root CSS vars (--purple, --pink, --gray-*, --green). Containers: #rentals-container max 800px. Loading state: .rentals-loading (flex col, spinner, text). Empty states: .rentals-empty, .rentals-empty-icon, .rentals-empty-title/text/btn. No-membership state: .rentals-no-membership. Active rental cards: .rental-card (flex gap 20px, border, hover effects), .rental-card-image (160x200, rounded), .rental-card-content, .rental-card-name/.date. Purchase section within card: .rental-card-purchase-section (bg #fff4fe), label/prices/badge. Card actions: .rental-card-actions/.rental-card-link/.rental-card-btn. History groups: .history-group (date-grouped cards with stacked images, .history-group-images with overlapping .history-group-thumb previews, .history-group-more-badge showing "+N"). Modal: .rental-modal-backdrop/.rental-modal/.rental-modal-header/content (fixed, z-index 999). Footer styles (lines 906–744): demat-footer, grid layout, localization toggle. All responsive @600px, @767px breakpoints. Fonts: Urbanist 16px body, headers 18-28px, weights 400-700.

4. **Embeds & scripts** — jQuery, webflow.js, Auth0, jsDelivr @test: components.js, auth.js, @main site-wide-footer.js, @test purchase-cart.js. Finsweet consent, WebFont, GTM, Hotjar, Pixel, Hotjar. Account sidenav embed (same as profile: HTML nav + JS highlight + UserMembership.isShippingMember() check to hide reservations link). Code-embed-36: div id="rentals-container" with loading spinner, no-membership message, empty state (no rentals yet), active rentals list (dynamically populated, hidden), history section (date-grouped). Footer script (lines 819-862) — updates footer auth links. Mobile bottom nav injected. All FUNCTIONAL.

5. **Forms** — No form element; data driven UI. Rentals loaded from API into container via JS (likely fetch to /private_rentals/me). Click handlers on history group cards to open modal. "Add to cart" button per rental (class .rental-card-btn, onclick handler). Contact footer (text + link to reservations@dematerialized.nl).

6. **Interactions** — Account sidenav .account-sidenav-link auto-highlights to .active based on pathname. Data-w-id on account menu toggle (user icon). Hover effects on cards: border-color change, box-shadow. Modal open/close (backdrop + modal transform/opacity). History group expands (click toggles modal, .rental-modal-open shows). Button states: "add to cart" / "in cart" (.rental-card-btn-in-cart). All FUNCTIONAL.

7. **SEO** — VERBATIM: <title>My Rentals</title>, <meta description="Your privacy is our priority...", og:title="My Rentals", og:description="Your privacy...", twitter:title/description same, og:type="website", twitter:card="summary_large_image", robots="noindex". JSON-LD ProfilePage with breadcrumb, WebApplication rental management with featureList. Canonical: none.

8. **Assets** — images/favicon.png, images/webclip.png. SVG icons (profile, rentals, reservations, donations, purchases, membership) embedded in sidenav. Rental images (front/back variants) populated dynamically via data (item.image_front, item.image_back, etc. — from API response, not static files). Footer logo: images/demat-sticker.png. No srcset for dynamic images.

9. **Links** — Internal: index.html, profile.html, my-rentals.html (active/aria-current), reservations.html, donations-credits.html, purchases.html, my-membership.html, clothing.html ("shop more", "browse collection"), contact-us.html, about-us.html, how-it-works.html, terms-and-conditions.html, faq.html, return-policy.html, cancellation-policy.html. External: mailto: reservations@dematerialized.nl (in contact footer). Social: Instagram, TikTok (footer). Google Fonts, Auth0, jsDelivr, GTM, Hotjar, Pixel.

10. **Scope flag** — Rental data fetched from API endpoint (/private_rentals/me) — endpoint exists in backend. Modal markup is templated in JS (rental-card, item image/name/dates, purchase button markup). Nuxt port needs: composable to fetch rentals with token, reactive state for current rentals vs. history, modal component. UserMembership.isShippingMember() check is existing pattern (available in embed code window.UserMembership). No new scope beyond i18n & consent.

## reservations.html  →  /reservations
TITLE: Reservations

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/reservations.html, /reservations, "Reservations", user reservations management (MyParcel integration). Lang: EN/NL .lang-en/.lang-nl toggle. Robots="noindex", og/twitter meta same as account pages.

2. **Layout** — navbar-desktop + top-navbar-mobile. w-layout-blockcontainer container-1300 full-screen: div-header-policies res, div-section-policies rentals (sidenav + main content). Sidenav: account-sidenav (profile/my-rentals/reservations/donations/purchases/membership with icons, .active highlight, hide reservations link for shipping members). Main: div-policy-menu rentals right > div-content-wrapper-policies > code-embed-36 (reservations-container div). Footer: demat-footer (desktop-only) + mobile-bottom-nav. Same structure as my-rentals.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. No inline <style> block for reservations-specific CSS visible in truncated HTML (would be in head or shared). Classes inferred from HTML structure: #reservations-container, .reservations-loading, .reservations-no-membership, .reservations-empty (all marked display:none by default, shown conditionally). Footer styles (same as other pages). Likely CSS defined in demat-webflow embed (styles.css from jsDelivr @main).

4. **Embeds & scripts** — jQuery, webflow.js, Auth0 SPA JS. jsDelivr @main: styles.css (shared styling), @686173... site-wide-footer.js, @test: components.js, auth.js, purchase-cart.js. Finsweet consent, WebFont, GTM (prod + test), Hotjar, Pixel. Account sidenav embed (HTML nav + JS to highlight active link + UserMembership.isShippingMember() check — if true, hide reservations link). Code-embed-36: HTML structure with divs for loading, no-membership, empty states, and list container (id="reservations-list", display:none). No inline script in reservations.html itself; behavior driven by footer & sidenav embeds. All FUNCTIONAL.

5. **Forms** — No form element; data-driven UI. Reservations list rendered into #reservations-list by JS (fetch from API endpoint, likely /private_rentals_reservations/me or similar).

6. **Interactions** — Account sidenav link auto-highlights .active. Hide reservations link for shipping members (JS in sidenav embed, window.UserMembership.isShippingMember() check). Data-w-id on account menu icon (dropdown toggle). Conditional display of loading/no-membership/empty/content divs. DECORATIVE: footer auth link visibility (join-now / my-account shown/hidden based on auth state). FUNCTIONAL: all state changes and API integration.

7. **SEO** — VERBATIM: <title>Reservations</title>, <meta description="Your privacy is our priority...", og:title="Reservations", og:description/twitter:title/description same, og:type="website", twitter:card="summary_large_image", robots="noindex".

8. **Assets** — images/favicon.png, images/webclip.png, SVG icons (sidenav), images/demat-sticker.png (footer logo). Reservation items images populated from API (no static image refs in HTML).

9. **Links** — Internal: index.html, profile.html, my-rentals.html, reservations.html (active/aria-current), donations-credits.html, purchases.html, my-membership.html, memberships.html, about-us.html, terms-and-conditions.html, faq.html, return-policy.html, cancellation-policy.html, contact-us.html, how-it-works.html, donations.html, clothing.html. External: Google Fonts, Auth0, jsDelivr, GTM, Hotjar, Pixel, social links (Instagram, TikTok).

10. **Scope flag** — Reservations data fetched from backend (endpoint not specified in HTML, inferred /private_rentals/reservations or similar). UserMembership.isShippingMember() is existing pattern — used to conditionally hide/show reservations nav link. Shipping members (MyParcel integration) should not access reservations feature. Nuxt port needs: composable to fetch reservations, membership status check, conditional rendering. No new scope beyond i18n & consent.

## purchases.html  →  /purchases
TITLE: Purchases

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/purchases.html, /purchases, "Purchases", user purchase history & order details (Stripe integration). Lang: EN/NL toggle. Robots="noindex".

2. **Layout** — navbar-desktop (w-nav, language, home, account menu, wish list, purchase cart, join now, category links) + top-navbar-mobile. w-layout-blockcontainer container-1300 full-screen: div-header-policies (empty), div-section-policies rentals (sidenav + main content). Sidenav: account-sidenav (profile/my-rentals/reservations/donations/purchases/membership, .active on purchases). Main: div-policy-menu rentals right > #purchases-container (max 800px). Footer: demat-footer (desktop-only) + mobile-bottom-nav. Same layout as rentals/reservations.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Extensive inline <style> block (lines 87-640) defining: :root vars (--purple, --pink, --gray-*, --navy #04314d). #purchases-container (max 800px, centered). Loading: .purchases-loading (flex col, spinner, text). Empty states: .purchases-empty, .purchases-signin, .purchases-no-membership. Purchase groups: .purchase-group (white, border, rounded, hover effects), .purchase-group-header (flex, images + info + arrow), .purchase-group-images (flex, overlapping thumbs like my-rentals), .purchase-group-info/.purchase-group-summary/.purchase-group-meta. Modal: .purchase-modal-backdrop/.purchase-modal (fixed, centered, z-index 9999), .purchase-modal-header/.purchase-modal-content. Modal details: .purchase-modal-status-banner, .purchase-modal-details-grid (2-col), .purchase-modal-detail-card (label + value). Modal items: .purchase-modal-item-card (flex, image + info), .purchase-modal-item-name/.price/.retail. Payment breakdown: .purchase-modal-payment (bg light gray, grid layout, rows for subtotal/credits/total/method). Contact footer: .purchases-contact (bg light gray, centered text). Responsive @600px (mobile: column layout, smaller modals). All colors brand-aligned (plum #4b073f, magenta #a92296, navy #04314d, grays).

4. **Embeds & scripts** — jQuery, webflow.js, Auth0 SPA JS. jsDelivr @test: components.js, auth.js, @main site-wide-footer.js, @test purchase-cart.js. Finsweet consent, WebFont, GTM, Hotjar, Pixel. Auth modal embed (sign in/signup buttons). Account sidenav embed (profile/rentals/reservations/donations/purchases/membership nav). Membership check (join-now button hidden if active Stripe subscription). Footer update script (auth link visibility). Mobile nav injected. All FUNCTIONAL.

5. **Forms** — No HTML form; data-driven UI. Purchase orders fetched from API into #purchases-container. Modal structure template in CSS (hidden by default, shown on order card click).

6. **Interactions** — Account sidenav .active highlight on purchases link. Order card click opens modal (.purchase-modal-open class, backdrop visible). Modal close button (×) and backdrop click-to-close (onclick). Hover effects on cards (border/shadow). Join-now button visibility toggle (checked on load, hidden if member has active Stripe). Footer auth link visibility. Data-w-id on account menu toggle. DECORATIVE: button hover color transitions. FUNCTIONAL: modal open/close, API data binding, membership check.

7. **SEO** — VERBATIM: <title>Purchases</title>, <meta description="Your privacy is our priority...", og:title="Purchases", og:description/twitter:title/description same, og:type="website", twitter:card="summary_large_image", robots="noindex".

8. **Assets** — images/favicon.png, images/webclip.png. SVG icons (sidenav, modal). Purchase item images from API (item.image), no static image refs. Footer logo: images/demat-sticker.png.

9. **Links** — Internal: index.html, profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html (active), my-membership.html, wish-list.html, memberships.html, clothing.html, about-us.html, how-it-works.html, faq.html, terms-and-conditions.html, privacy-policy.html, contact-us.html. External: Google Fonts, Auth0, jsDelivr, GTM, Hotjar, Pixel, social (Instagram, TikTok).

10. **Scope flag** — none. Purchase order data fetched from backend (/private_clothing_items/orders/{order_id} endpoint, token required). Modal template is HTML/CSS (no complex rendering). Order summary (items, prices, totals, payment method) populated from API. Nuxt port needs: composable for order fetch, reactive state for current purchase & modal visibility. All patterns standard (no new scope beyond i18n & consent).

## purchase-success.html  →  /purchase-success
TITLE: Purchase Success

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/purchase-success.html, /purchase-success, "Purchase Success", success confirmation page after Stripe purchase (Stripe webhook redirect). Lang: EN/NL .lang-en/.lang-nl. Robots meta: not present (no noindex, public page). No og/twitter meta. No meta description.

2. **Layout** — navbar-desktop + top-navbar-mobile. w-layout-blockcontainer container-top-padding purchase-success: w-embed with id="purchase-success-container" (max 600px, centered, text-align center). Content divs: #purchase-loading (spinner + text, display:block initially), #purchase-success-content (hidden, shows on success — success icon + title + order summary + what's next + action buttons), #purchase-error (hidden, shows on error — error icon + message + back link). Footer: demat-footer (desktop-only) + mobile-bottom-nav. Minimal layout — single column, centered.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Inline <style> block (lines 476-651) defining: #purchase-success-container (max 600px, margin auto, padding 60px 20px, text-align center, font-family Urbanist). Loading spinner: 40px, border #ced5da, border-top #4b073f, 1s spin animation. Success icon: 80px gradient bg (#fbefff to #f0d4f8), #a92296 checkmark SVG. Title: 28px, 500 weight, lowercase, color #24282d. Message: 18px, 400 weight, lines 1.6, color #24282d. Order summary box: bg #f6f8f9, padding 24px, rounded 20px. Item cards (inside box): flex, image + name + price, border-bottom between. Totals: flex justify-between, subtotal/credits (conditional display)/total, font weights/colors vary. "What's next" box: bg #fff4fe, border #f0d4f8, rounded 20px, padding 20px. Actions: flex gap 12px, 2 buttons (back to my rentals / browse collection). Button styling: 14px, 600 weight, 50px border-radius, padding 14x28, lowercase, letter-spacing 1px, hover color/bg transitions. Footer styles: demat-footer (display:none @media <767px), grid 4-col, links, socials. @keyframes spin (0-360 rotate). Error state: similar layout, red icon (#dc2626), error message.

4. **Embeds & scripts** — jQuery, webflow.js, Auth0 SPA JS. jsDelivr @main: styles.css. Finsweet consent, WebFont, GTM (prod + test), Hotjar, Pixel. Auth modal embed (sign in/signup). Navbar embeds (account menu, join-now button visibility, membership check). Purchase success embed (lines 473-751): HTML structure with loading/success/error states, plus JavaScript (lines 652-751) to: fetch order ID from URL query param (?order_id=...), wait for auth0Client, get token, fetch order details from /private_clothing_items/orders/{orderId} endpoint, populate order items/totals/credits, render success or error. Localization: t() function checks DematI18n.isNL() or html[lang^="nl"], maps keys (msgSingular/msgPlural, sizeLabel). Price formatting: cents to EUR (/ 100, .toFixed(2), replace . with ,). All FUNCTIONAL.

5. **Forms** — No form element. URL parameter parsing (order_id) drives content. Buttons: links to my-rentals.html, clothing.html (static hrefs), no form submission.

6. **Interactions** — Loading spinner shown initially, replaced by success/error on API response. Conditional display: v-if style (v-if not used, but JS .style.display toggling). Success/error button hovers (inline onmouseover/onmouseout for color/shadow transitions). Social links in footer (external). Data-w-id on navbar account toggle. DECORATIVE: hover transitions. FUNCTIONAL: order fetch, conditional rendering, price/item formatting, localization.

7. **SEO** — VERBATIM: <title>Purchase Success</title>, og:title="Purchase Success", twitter:title="Purchase Success". No meta description, no canonical, no robots meta (public success page, not indexed). No JSON-LD.

8. **Assets** — images/favicon.png, images/webclip.png. SVG icons (checkmark in success, X circle in error, nav icons). images/demat-sticker.png (footer). Purchase item images from API (populated dynamically). No static image refs in main content.

9. **Links** — Internal: index.html, my-rentals.html, clothing.html (action buttons), about-us.html, memberships.html, how-it-works.html, terms-and-conditions.html, privacy-policy.html, faq.html, return-policy.html, cancellation-policy.html, contact-us.html, donations.html. External: Google Fonts, Auth0, jsDelivr, GTM, Hotjar, Pixel, social (Instagram, TikTok).

10. **Scope flag** — API endpoint /private_clothing_items/orders/{orderId} fetch (existing backend endpoint). Localization via DematI18n.isNL() global (existing pattern) or html[lang] fallback. Price formatting (cents to EUR) is straightforward. URL parameter parsing (location.search) is standard. Nuxt port needs: route param capture (order_id from query), composable for order fetch with token, conditional rendering of loading/success/error states, localization via i18n. No new scope beyond standard migration.

## wish-list.html  →  /wish-list
TITLE: Wish List

1. **Identity** — /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/wish-list.html, /wish-list, "Wish List", user wishlist page (heart-icon wishlist, add-to-cart from wishlist). Lang: EN/NL .lang-en/.lang-nl toggle. Robots meta: not present (public if logged in, no noindex). No og/twitter/description meta.

2. **Layout** — top-navbar-mobile (mobile-first). navbar-desktop (full desktop nav with wishlist icon marked w--current aria-current="page"). full-page-section wish-list: div-heading-wish-list > div-content-wrapper-wish-list > w-embed with id="wishlist-app" (Vue app container). Mobile footer spacer, then footer (demat-footer desktop-only), mobile-bottom-nav. Minimal structure — single section, centered content.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Extensive inline <style> blocks (lines 81-433): .wishlist-page-container (padding 24px 56px, responsive @767px/@479px). Loading/error/empty states (text-align center, padding 80px 20px). Wishlist grid: CSS Grid 4 cols @991px→3 cols @767px→2 cols mobile. Item cards: flex col, image wrapper (aspect-ratio 2/3, bg #f6f8f9, rounded 20px), image back/front (absolute, position, opacity transition on hover), heart button (absolute top-right, 32px circle, white bg, click-to-remove), item content (padding 12px 0, name/size/category, 20px/18px fonts, lowercase). Reserve button: full width, 50px border-radius, padding 16px 20px, margin 12px 0, bg #a92296, color #f6f8f9, font-weight 600, text-transform lowercase, letter-spacing 0.5px. Button states: .in-cart (bg #fff4fe, color #24282d, border #a92296), .status-disabled/unavailable (opacity 0.5 / bg #ced5da), .status-rented/reserved/returned (various bg colors). Logged-out state: max 400px, margin auto, .wishlist-logged-out-title/text/buttons (sign in / create account buttons, 280px max-width, flex col gap 12px). Responsive @767px (overflow visible, padding fixes for buttons, 2-col grid, button fixes). Footer styles: demat-footer, localization toggle, grid layout, socials. All colors brand-aligned.

4. **Embeds & scripts** — jQuery, webflow.js, Auth0 SPA JS. jsDelivr @main: styles.css. Finsweet consent, WebFont, GTM, Hotjar, Pixel. Auth modal embed (sign in/signup). Navbar embeds (account menu dropdown, wish list icon as current page, purchase cart, join-now button visibility based on Stripe). Footer scripts (auth link visibility, footer update). Mobile nav injected. Wishlist app embed: id="wishlist-app" div with v-if="loading" (loading spinner), v-if="!isAuthenticated" (logged out state with sign in/create buttons), v-if="error" (error message), v-if empty items (empty state), v-if items present (grid). Vue bindings: v-for="item in items" :key="item.id", @click="goToItem(item.sku)", @click.stop="removeFromWishlist(item.id)", :src="getBackImage/getFrontImage", :class="getButtonClasses", @click.stop="toggleCart(item)". Button text: {{ getButtonText(item) }}, size label: {{ sizeLabel }}, item name: {{ item.name }}, size: {{ item.size.size }}. All FUNCTIONAL.

5. **Forms** — No HTML form. Wishlist driven by Vue state (items array). Buttons: remove (click on heart icon, @click.stop event), add-to-cart (click on button, @click.stop, passes item). Sign in/create buttons call @click="signIn" / @click="createAccount" (invoke Auth0 or modal).

6. **Interactions** — Heart icon (white circle, #4b073f heart fill) toggles on click — removeFromWishlist(item.id). Image hover: front image opacity fades, back image shows (CSS .wishlist-image-wrapper:hover .wishlist-image-front { opacity: 0 }). Button hover: color/bg change based on state (.wishlist-reserve-button:hover { bg #4b073f }). Item click navigates to product detail (goToItem(item.sku)). Button state classes: .in-cart (visual feedback), .status-* (rented/reserved/unavailable = disabled appearance). Auth state determines view: logged-out → sign in prompt, loading → spinner, error → error message, empty → empty state, items → grid. DECORATIVE: color transitions. FUNCTIONAL: cart toggle, wishlist remove, auth check, item navigation.

7. **SEO** — VERBATIM: <title>Wish List</title>, og:title="Wish List", twitter:title="Wish List". No meta description, robots meta, canonical, og:description, twitter:description, og:type, twitter:card, JSON-LD.

8. **Assets** — images/favicon.png, images/webclip.png. SVG icons: heart (filled #4b073f, positioned over circle), nav icons (lucide-style). Item images from API (item.image_front, item.image_back — no static refs). Footer logo: images/demat-sticker.png.

9. **Links** — Internal: index.html (home), wish-list.html (active/aria-current), profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, clothing.html ("shop now"), memberships.html, about-us.html, terms-and-conditions.html, privacy-policy.html, faq.html, how-it-works.html, return-policy.html, cancellation-policy.html, contact-us.html, donations.html. Product detail links injected (href="/product/{sku}" inferred from goToItem(sku) method). External: Google Fonts, Auth0, jsDelivr, GTM, Hotjar, Pixel, social (Instagram, TikTok).

10. **Scope flag** — Wishlist data fetched from API endpoint (likely /private_users/me/wishlist or similar, token required). Item status (rented/reserved/unavailable/sold) requires backend sync with inventory. goToItem(sku) navigation — Nuxt route /product/[sku] needed. SignIn/createAccount methods — rely on Auth0 modal (already in embed, openAuthModal() function). Nuxt port needs: composable for wishlist fetch/add/remove, reactive state for items/loading/error/auth, conditional rendering (v-if pattern), image path resolution (getBackImage/getFrontImage helper, likely CDN prefix + sku). No new scope beyond i18n & consent.

### OPEN QUESTIONS
- Wishlist API endpoint specification — current HTML infers /private_users/me/wishlist or similar; confirm backend route.
- Address autocomplete in profile.html — searchAddress method requires API endpoint (Nominatim, PostNL, or internal); clarify which service & how to replicate.
- Item status enums in wish-list/rentals (rented/reserved/unavailable/sold/returned/purchased) — confirm full list & backend source.
- Purchase order images (purchase-success.html item.image, purchases.html modal items) — CDN path / image storage location (currently inferred from API response).
- UserMembership.isShippingMember() & UserMembership.fetch() methods — confirm these exist in embed code (account-app.js or sidenav embed) before porting.
- Language toggle behavior (hreflang href="#" vs. @click handler) — current HTML has href="#" with no click handler; need JavaScript to update locale & redirect.
## Appendix D — Batch D: Donations & membership (donations, donations-credits, memberships, my-membership, mailing-list, welcome, error-membership-signup)

## donations.html  →  /donations
TITLE: The Easy Way To Donate Your Clothes | Dematerialized

1. **Identity** — donations.html, /donations, purpose: donation program page. EN/NL via lang and .lang-en/.lang-nl toggle classes.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-top-padding | div-section-background-video (hero) | multiple div-section-donations blocks | div-banner.hiw (CTA) | div-faq-section | demat-footer (shared).

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; inline lang toggle style; brand colors #4B073F, #A92296, #24282D, #fff4fe.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); inline: API_BASE_URL detection, GTM prod/test, Hotjar, Meta Pixel, Finsweet ConsentPro, auth modal, checkMembershipStatus (fetch /private_members/me), mobile nav.

5. **Forms** — none.

6. **Interactions** — IX2: data-w-id on user icon toggle, banner close. FAQ icons toggle (DECORATIVE).

7. **SEO** — VERBATIM: title: The Easy Way To Donate Your Clothes | Dematerialized, description: Drop off your pre-loved clothes and shoes..., og:title/description/image (donations-meta.png), twitter:title/description/image/card, og:type: website. No canonical. No JSON-LD.

8. **Assets** — cat-heart-sunglasses.png (srcset -p-500 to -p-2000), lace-up-mini-skirt.png, cabbage-cat.png, dark-wash-straight-jeans.png, striped-quarter-zip.png; videos: donations-hero-transcode.mp4/webm (poster: donations-hero-poster-00001.jpg).

9. **Links** — Internal: clothing.html, memberships.html, faq.html, contact-us.html, how-it-works.html, terms-and-conditions.html, privacy-policy.html, profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, wish-list.html, about-us.html. External: instagram.com/dematerialized_nl, tiktok.com/@dematerialized_nl.

10. **Scope flag** — none

## donations-credits.html  →  /donations-credits
TITLE: Donations & Credits

1. **Identity** — donations-credits.html, /donations-credits, purpose: member account page showing donation history and credit balance (logged-in only, noindex). EN/NL via lang and .lang-en/.lang-nl classes.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-1300.full-screen | div-header-policies | div-section-policies | sidenav-account-pages (HTML embed) | div-policy-menu.rentals.right | code-embed-donations (loading/empty/active states + modal) | div-no-donations-yet (fallback) | div-section-wrap-account.rental-history (hidden) | div-section-wrap-account.faq-account (hidden) | demat-footer (shared).

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; inline styles in sidenav and demat-footer; my-account.css via jsDelivr.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); inline in sidenav: auto-highlight nav, hide reservations for shipping members via UserMembership.isShippingMember(); code-embed-donations: donations.js logic (loading state, no-membership state, donation list render, detail modal, API fetch /private_members/me and /donations endpoints, localization isNL/t/FEAT_NL).

5. **Forms** — none.

6. **Interactions** — IX2: data-w-id on user icon toggles dropdown. Sidenav auto-highlights. Donation modal: closeDonationDetailModal() onclick. List items JavaScript-driven (not IX2).

7. **SEO** — VERBATIM: title: Donations & Credits, no meta description (noindex), og:title: Donations & Credits, twitter:title, og:type: website. No og:description/image. No canonical.

8. **Assets** — BLZ-S-HM-BK-SOL-001_front.png (srcset -p-500), demat-sticker.png, favicon.png, webclip.png.

9. **Links** — Internal account nav: profile.html, my-rentals.html, reservations.html, donations-credits.html (current), purchases.html, my-membership.html, memberships.html, contact-us.html, about-us.html, how-it-works.html, faq.html, return-policy.html, cancellation-policy.html. External: instagram.com/dematerialized_nl, tiktok.com/@dematerialized_nl.

10. **Scope flag** — FUNCTIONAL: donations.js fetches /private_members/me + /donations endpoints, renders donation list with modals, handles localization. Must port to Vue component with API integration. UserMembership global interaction in sidenav requires custom composable.

## memberships.html  →  /memberships
TITLE: Clothing Rental Memberships | Dematerialized

1. **Identity** — memberships.html, /memberships, purpose: membership tiers page with pricing, features, and signup CTAs. EN/NL via lang attribute and data-i18n attributes with embedded translation dictionary.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-top-padding | div-offer-banner (dismissible) | w-embed w-script (self-contained: memberships-header + tier-group shipping + tier-group local + info-card + membership/auth check script) | mobile-footer-spacer | demat-footer.

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; large inline style block in w-embed defining CSS custom properties (--purple: #4b073f, --pink-light: #fff4fe, etc.) and comprehensive tier card/button/responsive styling; demat-footer inline styles.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); large inline script in w-embed: i18n getLocale/dematT/TRANSLATIONS dictionary (nl translations for eyebrow, heading, shipping/local titles, features, prices); membership/auth check script fetching /users/me endpoint, checking userData.membership.active, rendering active/no membership state.

5. **Forms** — none (tier cards contain button elements with data-membership and data-price attributes).

6. **Interactions** — IX2: data-w-id on banner close (onclick). Tier cards: hover box-shadow transition (CSS). Banner visibility toggled by close button. Membership buttons: data-membership/data-price attributes suggest handler to trigger signup flow.

7. **SEO** — VERBATIM: title: Clothing Rental Memberships | Dematerialized, description: Buying is overrated. Join the Dematerialized community..., og:title, og:description, og:image (memberships-meta.png), twitter:title/description/image/card: summary_large_image, og:type: website. No canonical. No JSON-LD.

8. **Assets** — blue-button-down.png, cat-on-back_2.png, pancakes.png (header stickers); demat-sticker.png, favicon.png, webclip.png.

9. **Links** — Internal: terms-and-conditions.html, contact-us.html, profile.html, clothing.html, how-it-works.html, memberships.html (current w--current), wish-list.html, donations.html, about-us.html, privacy-policy.html. External: instagram.com/dematerialized_nl, tiktok.com/@dematerialized_nl.

10. **Scope flag** — FUNCTIONAL: tier card buttons (data-membership/data-price) require click handler triggering Stripe/Auth0 signup. i18n translation system (getLocale/dematT/data-i18n) must port to Nuxt i18n composable. membership/auth check script becomes Vue composable watching auth state and fetching /users/me. Banner close is simple display toggle but needs interaction handler.

## my-membership.html  →  /my-membership
TITLE: My Membership

1. **Identity** — my-membership.html, /my-membership, purpose: member account page displaying active membership tier details (plan name, price, features, member-since date). Marked noindex. EN/NL via lang and .lang-en/.lang-nl classes.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-1300.full-screen | div-header-policies.rentals | div-section-policies.rentals | sidenav-account-pages (HTML embed) | div-policy-menu.rentals.right | membership-content.div-content-wrapper-policies | code-embed-43 w-script (membership redesigned section with loading/active/empty states) | membership-info-card (need to make changes callout).

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; inline styles in sidenav and demat-footer; code-embed-43 embedded CSS for loading spinner, state styling, feature items with icons; my-account.css via jsDelivr.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); inline in sidenav: auto-highlight nav, hide reservations for shipping members; code-embed-43: membership.js logic (loading state UI, active membership display plan/price/member-since/features, empty state, API fetch /users/me endpoint, localization isNL/t/PLAN_NAME_NL/FEAT_NL/TIER_DETAILS lookup, ICONS SVG templates tag/refresh/store).

5. **Forms** — none.

6. **Interactions** — IX2: data-w-id on user icon toggles dropdown. Sidenav auto-highlights. Membership page show/hide states via classList.add('is-hidden').

7. **SEO** — VERBATIM: title: My Membership, description: Your privacy is our priority... (appears mismatched), og:title: My Membership, twitter:title, og:type: website. No og:description/image. No canonical. Marked noindex.

8. **Assets** — Image-25-11-2025-at-15.37.png (hidden payment section); demat-sticker.png, favicon.png, webclip.png.

9. **Links** — Internal account nav: profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html (current w--current), memberships.html, about-us.html, how-it-works.html, contact-us.html, faq.html, return-policy.html, cancellation-policy.html. External: instagram.com/dematerialized_nl, tiktok.com/@dematerialized_nl, mailto:memberships@dematerialized.nl.

10. **Scope flag** — FUNCTIONAL: membership.js fetches /users/me endpoint, displays tier details with localized plan name and features. TIER_DETAILS maps plan names to pricing/features. Must port to Vue component with composable for membership state and API integration. Localization uses custom i18n (isNL/t/translations dict) — replace with Nuxt i18n. Email link (memberships@dematerialized.nl) is static.

## mailing-list.html  →  /mailing-list
TITLE: Join Our Mailing List | Dematerialized

1. **Identity** — mailing-list.html, /mailing-list, purpose: mailing list signup page with form, success/error states, Google Map embed. EN/NL via lang and .lang-en/.lang-nl inline classes.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-top-padding | w-embed (mailing-list-section: mailing-list-header + mailing-list-card-wrapper with stickers + form/success states) | div-section-mailing-list (legacy Webflow form section, possibly hidden) | div-map-location (showroom info + Google Map 3 responsive variants: desktop/mobile/mobile-small) | mobile-footer-spacer | demat-footer.

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; large inline style block (lines 88-364) defining mailing-list styles with CSS custom properties (--purple, --pink-light, etc.), form input styling (#fff4fe background, purple focus), button styling (purple, hover), responsive grid (form-row), success/error messages; demat-footer inline styles.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); inline script in w-embed (lines ~756-818) contains mailing list HTML markup (form, success/error templates); Finsweet ConsentPro runtime async.

5. **Forms** — (1) Modern form in w-embed: id=mailingListForm, fields: firstName, lastName, email, terms checkbox, submit; action/endpoint implicit (likely JavaScript handler or API call, not visible). (2) Legacy Webflow form: id=wf-form-Mailing-List-Full-Form, method=get, fields: First-Name, Last-Name, email, Consent checkbox, submit; data-wf-page-id/data-wf-element-id indicate Webflow binding.

6. **Interactions** — Webflow IX2: w-form on legacy form triggers success/error messages (w-form-done, w-form-fail). Modern form: submit handler (JavaScript, not IX2) calls fetch API (endpoint undefined in HTML). Success state: classList.add('visible'). Error state: classList.add('visible'). Language toggle DECORATIVE (CSS display).

7. **SEO** — VERBATIM: title: Join Our Mailing List | Dematerialized, description: Sign up for the Dematerialized mailing list..., og:title, og:description, og:image (mailing-list-meta.png), twitter:title/description/image/card: summary_large_image, og:type: website. No canonical. No JSON-LD.

8. **Assets** — cat-on-back_2.png, pancakes.png (stickers); Demat_logo_4000x4000_black-background.png (srcset -p-500 to -p-3200); Google Map iframe (3 variants); demat-sticker.png, favicon.png, webclip.png.

9. **Links** — Internal: terms-and-conditions.html, privacy-policy.html, contact-us.html, clothing.html, profile.html, memberships.html, how-it-works.html, about-us.html, faq.html, return-policy.html, cancellation-policy.html. External: Google Maps embed, instagram.com/dematerialized_nl mention.

10. **Scope flag** — FUNCTIONAL: Modern mailing list form (form#mailingListForm) requires JavaScript submit handler with API endpoint definition (currently absent — likely separate script or Webflow fallback). Form submit listener, success/error state management (classList toggle), API call must port to Vue form component with fetch/validation. Legacy Webflow form can be removed if modern form primary. Google Map iframe (no API key visible — uses Maps embed URL); keep as-is or port to Nuxt component. Localization uses inline .lang-en/.lang-nl with CSS toggle — replace with Nuxt i18n.

## welcome-to-dematerialized.html  →  /welcome-to-dematerialized
TITLE: Welcome to Dematerialized

1. **Identity** — welcome-to-dematerialized.html, /welcome-to-dematerialized, purpose: post-membership signup success page confirming active membership and prompting next steps (shop or view profile). Marked noindex. EN/NL via lang and .lang-en/.lang-nl classes.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-1300 | div-container-success | div-content-wrapper-success | div-content-block (logo image, intro text, payment heading, CTA buttons, optional hidden payment method section) | mobile-footer-spacer | demat-footer.

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; inline styles in demat-footer only; brand colors via class references.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); inline scripts: mobile bottom nav (renderNav/detectUserState with auth state detection, nav items rendering), footer link visibility (checkMembershipStatus, updateFooterLinks); Auth0 SPA JS (cdn.auth0.com/js/auth0-spa-js/2.0); custom jsDelivr: components.js, auth.js, site-wide-footer.js (@686173fd6d08ad994dac4a03ee47d6a41ae81128), purchase-cart.js (all @test except site-wide-footer).

5. **Forms** — none.

6. **Interactions** — IX2: data-w-id on user icon toggles dropdown. Mobile nav: renderNav(state) renders items based on guest/member_inactive/member_active state; detectUserState() waits for auth0Client, checks /users/me. Footer: updateFooterLinks() shows join/account links based on auth state and stripe_id presence.

7. **SEO** — VERBATIM: title: Welcome to Dematerialized, no meta description, og:title: Welcome to Dematerialized, twitter:title, og:type: website. No og:description/image. No canonical. Marked noindex.

8. **Assets** — Demat_logo_4000x4000_black-background.png (srcset -p-500 to -p-3200); demat-sticker.png, favicon.png, webclip.png.

9. **Links** — Internal: clothing.html, profile.html, index.html, memberships.html, how-it-works.html, about-us.html, terms-and-conditions.html, privacy-policy.html, faq.html, return-policy.html, cancellation-policy.html, contact-us.html. External: instagram.com/dematerialized_nl, tiktok.com/@dematerialized_nl.

10. **Scope flag** — none; standard static success page with shared nav/footer. updateFooterLinks() script (inline) determines nav link visibility based on auth state; port to computed property in layout component.

## error-membership-signup.html  →  /error-membership-signup
TITLE: Error Membership Signup

1. **Identity** — error-membership-signup.html, /error-membership-signup, purpose: error page shown when membership signup fails, prompting retry or contact support. Marked noindex. EN/NL via lang and .lang-en/.lang-nl classes.

2. **Layout** — navbar-desktop (shared) | top-navbar-mobile (shared) | container-1300 | div-container-success | div-content-wrapper-success | div-content-block (empty logo wrapper, error image 404.png, intro text, error heading, contact text with link, empty div) | mobile-footer-spacer | demat-footer.

3. **Styling** — css/normalize.css, css/webflow.css, css/dematerialized-24fc59.webflow.css; inline styles in demat-footer only; brand colors via class references. Reuses success page styling (.div-container-success) with error image instead of logo.

4. **Embeds & scripts** — jsDelivr: styles.css (@main); same inline scripts as welcome-to-dematerialized: mobile bottom nav, footer link visibility, Auth0 SPA JS, custom jsDelivr scripts (components.js, auth.js, site-wide-footer.js, purchase-cart.js).

5. **Forms** — none.

6. **Interactions** — IX2: data-w-id on user icon toggles dropdown. Mobile nav and footer link visibility logic (same as welcome page).

7. **SEO** — VERBATIM: title: Error Membership Signup, no meta description, og:title: Error Membership Signup, twitter:title, og:type: website. No og:description/image. No canonical. Marked noindex.

8. **Assets** — 404.png (error image); demat-sticker.png, favicon.png, webclip.png.

9. **Links** — Internal: contact-us.html, index.html, clothing.html, profile.html, memberships.html, how-it-works.html, about-us.html, terms-and-conditions.html, privacy-policy.html, faq.html, return-policy.html, cancellation-policy.html. External: instagram.com/dematerialized_nl, tiktok.com/@dematerialized_nl.

10. **Scope flag** — none; standard static error page with shared nav/footer. Contact link is hardcoded; no form or API integration required.

### OPEN QUESTIONS
- Donations.js and membership.js scripts (code-embed-donations, code-embed-43) fetch from /private_members/me and /donations endpoints — confirm backend API endpoints exist and match Nuxt app structure
- Mailing list form submit handler and API endpoint undefined in HTML — confirm endpoint URL and integration method for Nuxt app
- Membership tier card click handlers (data-membership, data-price attributes) lack visible onclick or event listener — confirm how signup flow is triggered and Stripe integration approach for Nuxt
- UserMembership global object used in account sidenav (UserMembership.isShippingMember()) — confirm availability in all contexts and whether to create custom Nuxt composable or import from external script
- i18n translation system uses custom isNL/dematT/TRANSLATIONS approach with embedded dictionaries — confirm migration path to @nuxtjs/i18n and consolidation of all translation strings across pages
## Appendix E — Batch E: Policies & FAQ

## cancellation-policy.html  →  /cancellation-policy
TITLE: Cancellation Policy | Dematerialized

1. **Identity** — /cancellation-policy; "Cancellation Policy | Dematerialized"; Legal policy page explaining membership cancellation, pauses, rental/reservation cancellations, purchase returns, and service cancellations. Supports EN/NL via Webflow lang attribute (lang="en") and custom CSS locale toggle (.lang-en, .lang-nl, html[lang^="nl"]); hreflang links in locale dropdown (hreflang="en", hreflang="nl"); uses i18n span tags throughout with .lang-nl and .lang-en classes.

2. **Layout** — navbar-desktop (shared, with language selector, logo, user auth, nav links, cart); top-navbar-mobile (shared, collapsed nav); main container: w-layout-blockcontainer (class container-1300, legal); div-header-policies (mobile dropdown + heading); div-section-policies (contains left sidebar menu div-policy-menu and right content div-policy-menu); demat-footer (shared, dark background #4b073f, with lang-en/lang-nl toggle spans); mobile-footer-spacer, mobile-bottom-nav (shared bottom nav).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css (all via <link>); inline <style> blocks: language toggle (.lang-nl { display: none; }), footer styling (demat-footer CSS grid, typography, colors #4b073f background, white text, rgba opacity), mobile bottom nav styling (.mobile-bottom-nav fixed position, blur backdrop, border-radius); localization toggle applied via html[lang^="nl"] selector.

4. **Embeds & scripts** — Inline auth modal (code-embed-26) with openAuthModal()/closeAuthModal() functions for Auth0 login/signup; API_BASE_URL detection script (isProduction check, window.API_BASE_URL set to api.dematerialized.nl or test-api); Google Tag Manager (GTM PROD + TEST IDs); Hotjar tracking; Finsweet consent script (https://api.consentpro.com); Meta Pixel (fbq); jsDelivr stylesheet (https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css); join-now-container conditional JS that checks membership status via Auth0 and /private_members/me endpoint; footer updateFooterLinks() function that checks Auth0 auth and /users/me endpoint to show/hide "join now" and "my account" links.

5. **Forms** — None; page is static legal content.

6. **Interactions** — Webflow dropdown toggles: dropdown-policies (w-dropdown with w-dropdown-toggle, w-dropdown-list) on mobile for policy menu selection; data-w-id on nav links (e.g., 293d2536-f39b-395c-a697-8ddd775be469 on "date night" nav link); aria-current="page" on active policy link (cancellation-policy.html). Hover effects on links via CSS transitions. All DECORATIVE.

7. **SEO** — VERBATIM: <title>Cancellation Policy | Dematerialized</title>; <meta name="description" content="We believe in flexibility and transparency. This Cancellation Policy explains how you can cancel your membership, rentals, reservations, or other orders made through our online platform or store.">; og:title/og:description (same as title/description); twitter:title/twitter:description (same); og:type="website"; twitter:card="summary_large_image"; no canonical tag; no JSON-LD; no robots tag. Last revised and effective date: 26 June 2026 (in page text).

8. **Assets** — Images: images/favicon.png (rel shortcut icon), images/webclip.png (apple-touch-icon), images/demat-sticker.png (footer logo src). SVG icons embedded inline: globe, languages, user-round, heart (wishlist), shopping-bag, plus/minus (accordion), chevron-down (dropdown). No srcset.

9. **Links** — Internal nav: index.html (home), profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, clothing.html, how-it-works.html, wish-list.html, memberships.html, also-this.html, terms-and-conditions.html, privacy-policy.html, cookie-policy.html, return-policy.html, donation-store-credit-policy.html, contact-us.html; External: Instagram (https://www.instagram.com/dematerialized_nl/), TikTok (https://www.tiktok.com/@dematerialized_nl); Email links: mailto:memberships@dematerialized.nl, mailto:info@dematerialized.nl.

10. **Scope flag** — Custom membership status check via Auth0 and backend API (/private_members/me) must be ported to Nuxt composable or plugin. Language toggle via html[lang] attribute is compatible with @nuxtjs/i18n but requires reconfiguration. Finsweet consent script will be replaced by custom consent system in Phase 2. Cookie banner and i18n setup are out of scope here (Phase 2).

## cookie-policy.html  →  /cookie-policy
TITLE: Cookie Policy

1. **Identity** — /cookie-policy; "Cookie Policy"; Legal policy explaining cookie types (Essentials, Marketing, Personalization, Analytics), similar technologies (local storage, web beacons, social widgets, UTM codes), user choices, and contact info. EN/NL via lang attribute and .lang-en/.lang-nl CSS toggle; hreflang in locale dropdown.

2. **Layout** — navbar-desktop (shared), top-navbar-mobile (shared), main w-layout-blockcontainer (container-1300, legal); div-header-policies (mobile dropdown, heading); div-section-policies (left menu div-policy-menu, right content div-policy-menu with structured policy text and contact details); demat-footer (shared); mobile nav (shared).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css; inline language toggle CSS; footer styling (demat-footer #4b073f background, grid layout, white text); contact details table styling (div-contact-details-policies with div-row-contact-details, paragraph-text-policies).

4. **Embeds & scripts** — Auth modal (code-embed-26), API_BASE_URL detection, GTM (PROD + TEST), Hotjar, Finsweet consent, Meta Pixel, jsDelivr styles.css, join-now conditional JS, footer updateFooterLinks() function.

5. **Forms** — None; static content.

6. **Interactions** — Webflow dropdown (dropdown-policies) for mobile policy selection; aria-current="page" on active cookie-policy link; CSS hover effects. DECORATIVE.

7. **SEO** — VERBATIM: <title>Cookie Policy</title>; <meta name="description" content="We prioritize your privacy and strive to be transparent about our use of cookies and similar technologies. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.">; og:title/og:description (same); twitter:title/twitter:description (same); og:type="website"; twitter:card="summary_large_image"; no canonical, JSON-LD, robots tag. Last revised: 26 June 2026.

8. **Assets** — favicon.png, webclip.png, demat-sticker.png (footer); inline SVG icons (globe, languages, user, heart, shopping-bag, plus/minus, chevron-down).

9. **Links** — Internal: same policy nav as cancellation-policy + faq.html, contact-us.html; references to Privacy Policy, browser help pages (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge); Email: mailto:info@dematerialized.nl; phone, address (in contact section). External: support.google.com, support.apple.com, support.mozilla.org, support.microsoft.com (browser help links).

10. **Scope flag** — Finsweet consent replacement planned Phase 2. Cookie preference center UI ("open it from the cookie widget") implies existing Finsweet UI; custom consent panel must be built. No functional JS beyond framework integration needed.

## donation-store-credit-policy.html  →  /donation-store-credit-policy
TITLE: Donation & Store Credit Policy

1. **Identity** — /donation-store-credit-policy; "Donation & Store Credit Policy"; Legal policy on donation process, store credit evaluation (non-monetary benefit, €1 per credit redemption value), earning/holding/losing credit, adjustments. EN/NL lang toggle; hreflang locale support.

2. **Layout** — navbar-desktop (shared), top-navbar-mobile (shared), w-layout-blockcontainer (container-1300, legal); div-header-policies (mobile dropdown, heading); div-section-policies (menu sidebar, right content); demat-footer; mobile nav (shared).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css; language toggle CSS; footer #4b073f grid; policy text styling (policy-heading-text, paragraph-text-policies, list-policies).

4. **Embeds & scripts** — Auth modal, API_BASE_URL detection, GTM, Hotjar, Finsweet consent, Meta Pixel, jsDelivr styles.css, join-now JS, footer updateFooterLinks().

5. **Forms** — None; static.

6. **Interactions** — Webflow dropdown (dropdown-policies); aria-current on active policy link; CSS transitions. DECORATIVE.

7. **SEO** — VERBATIM: <title>Donation & Store Credit Policy</title>; <meta name="description" content="By accessing or using our website https://dematerialized.nl (the \"Site\") and our services (\"Services\"), you agree to comply with and be bound by the following terms and conditions (\"Terms\")."> (NOTE: this description is wrongly copied from T&C template); og:title/og:description (same); twitter equiv; og:type="website"; twitter:card="summary_large_image"; no canonical, JSON-LD, robots. Last revised: 26 June 2026.

8. **Assets** — favicon.png, webclip.png, demat-sticker.png; inline SVGs (globe, languages, user, heart, bag, plus/minus, chevron-down).

9. **Links** — Internal: policy nav menu (terms-and-conditions.html, privacy-policy.html, cookie-policy.html, return-policy.html, donation-store-credit-policy.html, cancellation-policy.html); terms-and-conditions.html, return-policy.html, cancellation-policy.html (inline references); mailto:info@dematerialized.nl; Instagram, TikTok.

10. **Scope flag** — Meta description is incorrect (copy-paste error from T&C template); should be fixed. Store Credit evaluation logic and membership status checks must be ported to Nuxt composables. Finsweet consent replacement Phase 2.

## privacy-policy.html  →  /privacy-policy
TITLE: Privacy Policy

1. **Identity** — /privacy-policy; "Privacy Policy"; Comprehensive GDPR/data protection policy covering data collection (contact, account, transaction, technical, user-generated), use cases, legal basis, sharing, retention, user rights (access, correction, erasure, portability, objection, withdraw consent), cookies, international transfers, security, children, changes, contact. EN/NL lang toggle.

2. **Layout** — navbar-desktop (shared), top-navbar-mobile (shared), w-layout-blockcontainer (container-1300, legal); div-header-policies (mobile dropdown, heading); div-section-policies (left menu sidebar, right policy content); demat-footer; mobile nav (shared).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css; language toggle CSS; footer #4b073f; policy text classes (policy-heading-text, paragraph-text-policies, list-policies, in-text-link-policies, div-contact-details-policies).

4. **Embeds & scripts** — Auth modal, API_BASE_URL detection, GTM, Hotjar, Finsweet consent, Meta Pixel, jsDelivr styles.css, join-now conditional JS, footer updateFooterLinks().

5. **Forms** — None; static.

6. **Interactions** — Webflow dropdown (dropdown-policies); aria-current on active policy; CSS transitions. DECORATIVE.

7. **SEO** — VERBATIM: <title>Privacy Policy</title>; <meta name="description" content="Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.">; og:title/og:description (same); twitter equiv; og:type="website"; twitter:card="summary_large_image"; no canonical, JSON-LD, robots. Last revised: 26 June 2026.

8. **Assets** — favicon.png, webclip.png, demat-sticker.png; inline SVGs.

9. **Links** — Internal: policy nav (all 6 policies), terms-and-conditions.html, cookie-policy.html (inline refs); mailto:info@dematerialized.nl; https://dematerialized.nl (in text); link to cookie-policy.html; link to autoriteitpersoonsgegevens.nl (Dutch DPA); Instagram, TikTok.

10. **Scope flag** — Third-party integrations mentioned (Stripe, PostNL, Google Analytics, Meta, Auth0) require API key/credential management in Nuxt config. Data retention logic (12 months post-cancel, 7-year tax retention) must be enforced backend-side. GDPR data subject rights (SAR, deletion) require backend API endpoints—confirm with backend team. Finsweet consent Phase 2.

## return-policy.html  →  /return-policy
TITLE: Return Policy | Dematerialized

1. **Identity** — /return-policy; "Return Policy | Dematerialized"; Legal policy on rental returns (in-store/by post depending on membership), purchase returns (in-store resale within 14 days, distance purchases 14-day right), donation handling, damaged/incorrect item claims. EN/NL lang toggle.

2. **Layout** — navbar-desktop (shared), top-navbar-mobile (shared), w-layout-blockcontainer (container-1300, legal); div-header-policies (mobile dropdown, heading); div-section-policies (left menu, right content); demat-footer; mobile nav (shared).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css; language toggle CSS; footer #4b073f styling; policy text (policy-heading-text, paragraph-text-policies, list-policies, in-text-link-policies).

4. **Embeds & scripts** — Auth modal, API_BASE_URL detection, GTM, Hotjar, Finsweet consent, Meta Pixel, jsDelivr styles.css, join-now JS, footer updateFooterLinks().

5. **Forms** — None; static.

6. **Interactions** — Webflow dropdown (dropdown-policies); aria-current on active return-policy link; CSS transitions. DECORATIVE.

7. **SEO** — VERBATIM: <title>Return Policy | Dematerialized</title>; <meta name="description" content="We want every member and customer to feel confident when using our shared closet. This Return Policy explains how returns work for rentals, purchases, and donations made through our platform or in our store.">; og:title/og:description (same); twitter equiv; og:type="website"; twitter:card="summary_large_image"; no canonical, JSON-LD, robots. Last revised: 26 June 2026.

8. **Assets** — favicon.png, webclip.png, demat-sticker.png; inline SVGs.

9. **Links** — Internal: policy nav menu; terms-and-conditions.html, cancellation-policy.html, donation-store-credit-policy.html (inline refs); mailto:info@dematerialized.nl; Instagram, TikTok.

10. **Scope flag** — PostNL return shipping integration (QR code generation, label handling) requires backend coordination. Return status tracking in user account (my-rentals page) must sync with return API. Finsweet consent Phase 2.

## terms-and-conditions.html  →  /terms-and-conditions
TITLE: Terms and Conditions

1. **Identity** — /terms-and-conditions; "Terms and Conditions"; Comprehensive T&C covering acceptance (age 18+), company info (Dematerialized B.V., KVK 95760717, Lange Putstraat 4, Den Bosch), service description, memberships, billing, cancellations, pauses, rentals, purchases, donations, intellectual property, liability, dispute resolution. EN/NL lang toggle via html[lang] attribute and .lang-en/.lang-nl CSS.

2. **Layout** — navbar-desktop (shared), top-navbar-mobile (shared), w-layout-blockcontainer (container-1300, legal); div-header-policies (mobile dropdown, heading); div-section-policies (left sidebar menu, right policy content); demat-footer; mobile nav (shared).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css; language toggle CSS; footer #4b073f grid, white text, icons; policy content styling (policy-heading-text header/no-caps variants, paragraph-text-policies, list-policies with list-item-policies, div-contact-details-policies, in-text-link-policies, div-row-contact-details with contact-bold).

4. **Embeds & scripts** — Auth modal (code-embed-26) with openAuthModal/closeAuthModal, API_BASE_URL detection script (isProduction check), Google Tag Manager (PROD + TEST), Hotjar tracking, Finsweet consent script (https://api.consentpro.com), Meta Pixel (fbq), jsDelivr stylesheet link (https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css), join-now conditional JS checking Auth0 membership status via /private_members/me endpoint, footer updateFooterLinks() async function checking /users/me for stripe_id.

5. **Forms** — None; static legal document.

6. **Interactions** — Webflow dropdown (dropdown-policies w-dropdown/w-dropdown-toggle/w-dropdown-list) for mobile policy selection; aria-current="page" on active terms-and-conditions.html link (w--current class); data-w-id attributes on nav links (e.g., 293d2536-f39b-395c-a697-8ddd775be469); CSS hover transitions on links. All DECORATIVE.

7. **SEO** — VERBATIM: <title>Terms and Conditions</title>; <meta name="description" content="By accessing or using our website https://dematerialized.nl (the \"Site\") and our services (\"Services\"), you agree to comply with and be bound by the following terms and conditions (\"Terms\").">; og:title="Terms and Conditions", og:description (same as meta description); twitter:title="Terms and Conditions", twitter:description (same); og:type="website"; twitter:card="summary_large_image"; no canonical, no JSON-LD, no robots meta tag. Last revised and effective date: 26 June 2026 (embedded in page text).

8. **Assets** — Image filenames: images/favicon.png (shortcut icon), images/webclip.png (apple-touch-icon), images/demat-sticker.png (footer logo src attribute). No srcset. SVG icons inline: globe, languages, user-round, heart, shopping-bag, chevron-down, plus, minus.

9. **Links** — Internal nav targets: index.html (home), profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, wish-list.html, clothing.html, how-it-works.html, memberships.html, also-this.html, terms-and-conditions.html (self, aria-current), privacy-policy.html, cookie-policy.html, cancellation-policy.html, return-policy.html, donation-store-credit-policy.html, contact-us.html, donations.html, about-us.html. External: Instagram (https://www.instagram.com/dematerialized_nl/), TikTok (https://www.tiktok.com/@dematerialized_nl). Email: mailto:info@dematerialized.nl. Inline link to https://dematerialized.nl (marked as in-text-link-policies).

10. **Scope flag** — Auth0 integration (openAuthModal/closeAuthModal functions, Auth0Client initialization) requires port to Auth0 Vue SDK in Nuxt; window.auth0Client must become a composable. Membership status endpoint checks (/private_members/me, /users/me) need Nuxt API route wrappers or direct fetch calls with token injection. Language toggle via html[lang] compatible with @nuxtjs/i18n but requires wiring locale routing and <NuxtI18n> layout wrapper. Finsweet consent script (https://api.consentpro.com) will be replaced by custom consent system Phase 2—currently present but must be removed from production build. Google Tag Manager, Hotjar, Meta Pixel analytics integrations must be configured as Nuxt plugins with SSR considerations.

## faq.html  →  /faq
TITLE: Dematerialized | Frequently Asked Questions

1. **Identity** — /faq; "Dematerialized | Frequently Asked Questions"; FAQ hub with 3 sections (General, Clothing Rentals, Donations & Store Credit) containing expandable Q&A pairs. Explains membership, rental mechanics, return processes, donations, store credit evaluation, freebies. EN/NL lang toggle; og:image includes faq-meta.png. Purpose: reduce support load, educate on model.

2. **Layout** — navbar-desktop (shared), top-navbar-mobile (shared); full-page-section (class faq with w-layout-blockcontainer container-wrapper-mem); div-mobile-header-mem (heading-centered "frequently asked questions"); div-section-faq (main content wrapper); multiple div-faq-section blocks, each with faq-section-header (id=faq-general/faq-rentals/faq-donations) and content-wrapper-mem (class faq); div-faq-wrapper repeating for each Q&A pair; div-faq-question (with data-w-id for accordion toggle) and div-faq-answer (hidden by default, shown on toggle); demat-footer; mobile-bottom-nav (shared).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css; language toggle CSS; body-4 class on <body> (custom styling for FAQ page); full-page-section (faq variant), container-wrapper-mem, div-faq-wrapper, faq-question, faq-answer, faq-section-header (typography + spacing); mobile nav styling (.mobile-bottom-nav, .mobile-nav-inner blur backdrop); footer #4b073f background.

4. **Embeds & scripts** — Auth modal (code-embed-26), API_BASE_URL detection, GTM (PROD + TEST), Hotjar, Finsweet consent, Meta Pixel, jsDelivr styles.css, join-now conditional membership check JS, footer updateFooterLinks() async function; accordion toggle JS not yet visible in truncated view but implied by data-w-id="15a8f203-373b-edf3-b942-e75d2898663b" repeated on each faq-question div (likely Webflow IX2 interaction) + icon-faq-plus/icon-faq-min SVG toggle visibility. Plus/minus icons swap on toggle: <svg class="lucide lucide-plus-icon"> and <svg class="lucide lucide-minus-icon">.

5. **Forms** — None; static Q&A content.

6. **Interactions** — Webflow accordion (data-w-id on each div-faq-question) toggles visible class on sibling div-faq-answer; plus/minus icon visibility toggled (icon-faq-plus display:none on open, icon-faq-min display:block on open or vice versa); smooth expand/collapse via Webflow IX2 animation (likely height transition). FUNCTIONAL—must be ported as Vue <Transition> or headless-ui Disclosure, or simple v-if toggle with CSS animation.

7. **SEO** — VERBATIM: <title>Dematerialized | Frequently Asked Questions</title>; <meta name="description" content="How does Dematerialized clothing rental in Den Bosch work? Do I have to be a member to rent clothes from Dematerialized? Can I buy clothes from the collection?">; og:title (same), og:description (same); og:image="https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/69060e255dcabbe1b669cb13_faq-meta.png"; twitter:title (same), twitter:description (same), twitter:image (same as og:image); og:type="website"; twitter:card="summary_large_image"; no canonical, JSON-LD, robots. Publication/revision date not visible in snippet.

8. **Assets** — Images: images/favicon.png, images/webclip.png, faq-meta.png (external CDN https://cdn.prod.website-files.com/687a04de0b2eb2df33405ca3/69060e255dcabbe1b669cb13_faq-meta.png for og:image/twitter:image). Inline SVG icons: globe, languages, user-round, heart, shopping-bag, plus, minus, chevron-down.

9. **Links** — Internal nav: all policy pages (terms-and-conditions, privacy-policy, cookie-policy, cancellation-policy, return-policy, donation-store-credit-policy, faq), clothing.html, profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, wish-list.html, memberships.html, how-it-works.html, also-this.html, contact-us.html, index.html (home), donations.html, about-us.html; inline links: memberships.html ("sign up here"), contact-us.html (opening hours). External: Instagram, TikTok. Email: implicit (no mailto links in FAQ content shown).

10. **Scope flag** — Webflow IX2 accordion interaction (data-w-id on .div-faq-question) must be ported to Vue accordion component; Headless UI Disclosure recommended for accessibility (aria-expanded, aria-controls). Icon toggle logic can be CSS (:open selector) or Vue computed. FAQ content is static text in HTML; no CMS integration needed for Phase 1, but Phase 6 blog work may add FAQ as searchable CMS collection. Finsweet consent Phase 2.

### OPEN QUESTIONS
- Custom Auth0 membership status checks (/private_members/me endpoint) in navbar and footer require Nuxt API route proxies or direct fetch with token injection—confirm with backend team
- Meta description on donation-store-credit-policy.html is copy-pasted from T&C template; should be corrected before migration
- FAQ accordion interaction uses Webflow IX2 (data-w-id); Vue Disclosure component (Headless UI) recommended for accessible replacement
- og:image URL for FAQ (cdn.prod.website-files.com) must be migrated to Nuxt public/images/ or similar CDN strategy
- Finsweet consent script removal and custom GDPR consent panel design/implementation is Phase 2 work but blocks full functionality
- PostNL return shipping QR code generation logic (return-policy.html workflow) requires backend coordination with returns API
- Google Tag Manager, Hotjar, Meta Pixel analytics plugins need SSR-safe configuration in Nuxt (avoid client-side-only timing issues)
## Appendix F — Batch F: Blog & errors (detail_blog, detail_author, detail_items, 401, 404)

## detail_blog.html  →  /blog/[slug]
TITLE: Dematerialized

1. **Identity** — file: `detail_blog.html`, route: `/blog/[slug]` (dynamic blog post detail page), `<title>`: "Dematerialized" (placeholder, likely filled by Webflow CMS), purpose: blog post detail page template with Webflow CMS binding for title, content, image, date, and authors section. EN/NL variant: uses `.lang-en` / `.lang-nl` CSS classes in `<head>` with `html[lang^="nl"]` selector; hreflang links on locale selector with `hreflang="en"` and `hreflang="nl"` attributes (href="#" placeholder pending i18n routing).

2. **Layout** — sections top-to-bottom: (1) top-navbar-mobile (mobile nav with language selector, home link, cart icons), (2) navbar-desktop (desktop nav with language selector, home link, auth buttons, nav links, join now button), (3) hero-stack (hero section containing: w-dyn-bind-empty h1 title, empty paragraph, blog-date-text, hero image with shadow, blog-post-body w-richtext), (4) testimonial-slider-small ("authors" heading with w-dyn-list / w-dyn-items showing author cards with testimonial-card class — image, subheading, tagline), (5) fs-consent_component (Finsweet consent banner + preferences form), (6) mobile-footer-spacer, (7) mobile-bottom-nav (IIFE-injected dynamic nav), (8) div-footer-desktop (custom footer with columns, newsletter form, social links, copyright). Wrapper classes: .container (hero-stack), .w-dyn-list (authors section).

3. **Styling** — stylesheets: normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Key classes: .hero-stack (page hero), .hero-wrapper-two, .hero-image, .shadow-two, .blog-post-body, .margin-bottom-24px, .div-wrapper-blog-date, .blog-date-text, .section-heading-blog ("authors"), .testimonial-card, .testimonial-image, .testimonial-info, .subheading-blog, .tagline, .w-dyn-bind-empty (CMS binding placeholder), .w-richtext (Webflow rich text). Finsweet consent classes: .fs-consent_* (banner, prefs, checkboxes, etc.). Custom footer: .div-footer-desktop, .footer-section, .footer-heading, .footer-link, .div-footer-newsletter, .w-form. Inline <style> in head for language toggle (73–78); no other inline <style> blocks.

4. **Embeds & scripts** — inline <script> in navbar-desktop (code-embed-26) defines auth modal HTML (openAuthModal / closeAuthModal functions, .auth-modal-overlay / .auth-modal-container / .auth-modal-title / .auth-modal-close); mobile bottom nav script (code-embed, inline IIFE with NAV_CONFIGS, ICONS, renderNav, detectUserState — listens to window.auth0Client, UserMembership.stripe_id for membership state, updates .mobile-bottom-nav); footer script (code-embed, IIFE checking auth0Client and /private_members/me endpoint, shows/hides #footerJoinNow / #footerMyAccount). jsDelivr <script> tags in body: jquery-3.5.1.min.js, js/webflow.js (Webflow IX2 runtime), auth0-spa-js/2.0 (Auth0), demat-webflow@test/components.js, demat-webflow@test/auth.js, demat-webflow@686173fd.../site-wide-footer.js (commit hash pinned), demat-webflow@test/purchase-cart.js. <link> in head: cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css. <script> in head: API_BASE_URL detection (lines 22–30), GTM PROD + TEST (analytics), Hotjar (analytics), Meta Pixel (analytics), Finsweet consent runtime (consentpro). Vue/Nuxt targets: auth modal → Auth.vue composable, mobile nav → MobileNav.vue or composable, footer logic → Footer.vue composable, components.js → global component registry, auth.js → Auth0 composable, site-wide-footer.js → Footer composable, purchase-cart.js → Cart composable.

5. **Forms** — fs-consent_prefs_form (Finsweet consent form): id="email-form", name="email-form", data-name="Email Form", method="get" (form element), data-wf-page-id="69bd26b40faed77c1440ea50", data-wf-element-id="c481cbc3-3ca3-fed7-d85a-d12471e596e3". Form fields: checkbox inputs for "marketing", "personalization", "analytics" (no "essentials" checkbox, marked "always active"). Submit button: input[type="submit"] with data-wait="Please wait...", value="save preferences". Success/failure messages: .w-form-done, .w-form-fail. Newsletter form in footer (wf-form-Mailing-List-Form, method="get"): email input (required), checkbox for consent (required), submit button value=">". Action/endpoint: method="get" (Webflow form submission).

6. **Interactions** — Webflow IX2 hooks: data-w-id="dfaacfb6-8366-add9-824d-8b68a1a02fd9" (cart trigger on mobile nav), data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" (user account menu toggle, desktop), data-w-id="3aa13800-cfef-f5fa-e272-93983f82db83" (submenu for user account). Consent form interactivity: fs-consent-element="*" attributes (banner, preferences, checkbox-marketing/personalization/analytics, deny, allow, open-preferences, close). Dropdown interactions: w-dropdown, w-dropdown-toggle, w-dropdown-list (language selector). Interactions marked: data-cart-trigger click handlers (inline onclick for cart visibility toggle), auth modal open/close handlers (inline onclick), newsletter form submit (Webflow form handler). All interactions are FUNCTIONAL (auth state checking, cart display toggling, consent preference saving, form submission).

7. **SEO** — <title>: "Dematerialized" (generic, likely replaced by CMS post title in production). Meta tags: charset utf-8, viewport (width=device-width, initial-scale=1, viewport-fit=cover), generator: "Webflow", robots: none explicitly set (no robots meta on this page). OG tags: none. Twitter tags: none. Canonical: none. JSON-LD: none in HTML; if present in Webflow CMS injected head, would be in fallback_code/. No description meta. **Scope flag needed**: CMS title/description/OG tags must come from blog post data model; currently placeholder.

8. **Assets** — images: `https://uploads-ssl.webflow.com/62434fa732124a0fb112aab4/62434fa732124af1aa12aadf_placeholder%201.svg` (hero placeholder, w-dyn-bind-empty), `https://uploads-ssl.webflow.com/62434fa732124a0fb112aab4/62434fa732124a28a812aad9_placeholder%202.svg` (author placeholder, w-dyn-bind-empty). Local images: `images/favicon.png`, `images/webclip.png`, `images/Demat_logo_4000x4000_black-background.webp` (footer, with srcset for p-500/800/1080/1600/2000/2600/3200 variants), `images/demat-sticker.png` (footer logo). 404 error image: `images/404.png`. **All hero/author images will be replaced by CMS content at runtime**.

9. **Links** — internal nav targets: href="index.html" (home), href="profile.html", href="my-rentals.html", href="reservations.html", href="donations-credits.html", href="purchases.html", href="my-membership.html", href="wish-list.html", href="clothing.html" (browse all, new in), href="/clothing?page=1&categories=..." (filtered views), href="how-it-works.html", href="memberships.html" (join now), href="also-this.html", href="mailing-list.html", href="about-us.html", href="terms-and-conditions.html", href="privacy-policy.html", href="faq.html", href="return-policy.html", href="cancellation-policy.html", href="contact-us.html", href="cookie-policy.html", href="donations.html", href="reservations.html". External links: https://www.instagram.com/dematerialized_nl/, https://www.tiktok.com/@dematerialized_nl, https://www.googletagmanager.com/*, https://static.hotjar.com/*, https://connect.facebook.net/*, https://api.consentpro.com/* (Finsweet), https://cdn.auth0.com/*, https://cdn.jsdelivr.net/* (jsDelivr for embeds).

10. **Scope flag** — Blog post detail page uses Webflow CMS dynamic binding (w-dyn-*) for title, body, image, and author list. On port to Nuxt: (a) CMS data must be fetched from backend API (likely /blogs/{id} endpoint) and injected into template; (b) SEO meta tags (title, description, OG) must be dynamically set from post data — currently missing from HTML; (c) Author section grid uses Webflow CMS author collection, will need API fetch for related authors; (d) Consent form (Finsweet) will be replaced with custom Vue consent component (Phase 2); (e) Auth modal and footer state-checking logic must be ported to Vue composables. **No blocking issues beyond scope (consent/i18n).**

## detail_author.html  →  /authors/[slug]
TITLE: Dematerialized

1. **Identity** — file: `detail_author.html`, route: `/authors/[slug]` (dynamic author detail page), `<title>`: "Dematerialized" (placeholder), purpose: author profile/detail page template with Webflow CMS binding for author name, bio, and related blog posts grid. EN/NL variant: uses `.lang-en` / `.lang-nl` CSS classes in `<head>` with `html[lang^="nl"]` selector; hreflang links on locale selector (href="#" placeholder).

2. **Layout** — minimal content structure: (1) top-navbar-mobile, (2) navbar-desktop (same as detail_blog), (3) single <body> script tag block loading all embeds (no page-specific content visible in HTML — page likely blank template), (4) mobile bottom nav, (5) desktop footer. **Content section appears to be entirely populated by Webflow CMS dynamic binding or JavaScript injection** — no visible hero or author card structure in provided HTML. This is a bare-minimum template file.

3. **Styling** — stylesheets: normalize.css, webflow.css, dematerialized-24fc59.webflow.css (same 3 as detail_blog). No page-specific classes visible in body. Language toggle and navbar styling via shared classes.

4. **Embeds & scripts** — identical to detail_blog: auth modal IIFE in navbar-desktop, mobile nav IIFE, footer IIFE, jsDelivr scripts (jquery, webflow.js, auth0, demat-webflow embeds). No page-specific embeds.

5. **Forms** — same as detail_blog: Finsweet consent form (fs-consent_prefs_form) with marketing/personalization/analytics checkboxes. Footer newsletter form (wf-form-Mailing-List-Form).

6. **Interactions** — identical to detail_blog: data-w-id for cart trigger and user account menu, fs-consent-element interactions, language dropdown. All FUNCTIONAL.

7. **SEO** — <title>: "Dematerialized" (generic placeholder). Meta tags: no description, robots, OG, Twitter, canonical, JSON-LD. **Scope flag needed**: Author page must have dynamic SEO (title = author name, description from author bio).

8. **Assets** — favicon.png, webclip.png, Demat_logo_4000x4000_black-background.webp (footer, with srcset), demat-sticker.png (footer). No author-specific images in HTML (bound via CMS at runtime).

9. **Links** — same internal/external nav links as detail_blog.

10. **Scope flag** — Author page is a bare template relying entirely on Webflow CMS dynamic binding for content display. On port: (a) author detail content structure unclear from HTML — needs CMS schema clarification (author fields: name, bio, image, post list?); (b) SEO meta tags must be dynamic; (c) related blog posts grid will need API fetch. **Recommend reviewing Webflow CMS author fields** (fallback_code/webflow-authors-fields.txt) to determine page structure before porting.

## detail_items.html  →  /items/[slug]
TITLE: Dematerialized

1. **Identity** — file: `detail_items.html`, route: `/items/[slug]` (dynamic product/item detail page, likely for rentals or catalog items), `<title>`: "Dematerialized" (placeholder), purpose: product/item detail template with Webflow CMS binding. EN/NL variant: uses `.lang-en` / `.lang-nl` CSS classes; hreflang links on locale selector (href="#" placeholder).

2. **Layout** — minimal visible structure: (1) top-navbar-mobile, (2) navbar-desktop (shared), (3) single <body> script block (no page content visible), (4) mobile bottom nav, (5) desktop footer. **Like detail_author, this is a bare template file** relying on Webflow CMS and/or JavaScript injection for content rendering.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css (same 3).

4. **Embeds & scripts** — identical to detail_blog and detail_author: auth modal IIFE, mobile nav IIFE, footer IIFE, same jsDelivr scripts.

5. **Forms** — Finsweet consent form, footer newsletter form (same as previous pages).

6. **Interactions** — data-w-id for cart and user account, fs-consent-element interactions, language dropdown. All FUNCTIONAL.

7. **SEO** — <title>: "Dematerialized" (generic). No description, robots, OG, Twitter, canonical, JSON-LD. **Dynamic SEO needed** (title = item name, description from item details).

8. **Assets** — favicon.png, webclip.png, Demat_logo_4000x4000_black-background.webp (footer), demat-sticker.png (footer). No item-specific images in HTML.

9. **Links** — same nav links as detail_blog and detail_author.

10. **Scope flag** — Bare template page, unclear purpose (product detail vs. rental detail vs. general item detail). Needs clarification on: (a) what "items" route represents (product catalog, rentals, or both?); (b) CMS data model for this detail page (fields, relationships, API endpoint); (c) dynamic SEO requirements. **Recommend confirming route mapping and CMS schema before porting.**

## 401.html  →  /401
TITLE: Protected page

1. **Identity** — file: `401.html`, route: `/401` (HTTP 401 Unauthorized error page), `<title>`: "Protected page", purpose: error page displayed for password-protected content (Webflow password page form), shown when access is denied or incorrect password entered. EN/NL variant: uses `.lang-en` / `.lang-nl` CSS classes in `<head>`; hreflang links on locale selector (href="#" placeholder).

2. **Layout** — sections top-to-bottom: (1) navbar-desktop (shared with other pages, includes language selector, auth buttons, nav links), (2) top-navbar-mobile (shared), (3) utility-page-wrap containing utility-page-content with w-password-page form, (4) mobile-footer-spacer, (5) mobile-bottom-nav (IIFE-injected), (6) custom demat-footer embedded as <style> + <script> in w-embed w-script blocks, (7) script tags for embeds. Wrapper: .utility-page-wrap, .utility-page-content, .w-password-page (Webflow password page class).

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Password form classes: .w-password-page (multiple elements: h2, label, input, submit button, error message), .utility-page-wrap, .utility-page-content. Inline <style> in head: language toggle (73–78), no others. Custom footer has embedded <style> block (lines 775–894) defining .demat-footer, .demat-footer-* classes (grid layout, colors: var(--purple, #4b073f), hover states, responsive grid at 991px / 767px breakpoints). Finsweet consent: .fs-consent_* classes (banner, form, checkboxes, etc.).

4. **Embeds & scripts** — inline <script> in navbar-desktop (code-embed-26) defines auth modal (openAuthModal, closeAuthModal functions, modal HTML structure). Mobile nav IIFE script in body (line 479–772) — same as detail_blog. Custom footer <style> + <script> blocks (lines 774–1012): footer HTML grid layout (embedded directly in <script> tag), footer link visibility logic checking window.auth0Client and /users/me endpoint, shows/hides #footerJoinNow / #footerMyAccount based on stripe_id. jsDelivr <script> tags in body: jquery-3.5.1.min.js, js/webflow.js, auth0-spa-js/2.0, demat-webflow@test/components.js, demat-webflow@test/auth.js, demat-webflow@686173fd.../site-wide-footer.js, demat-webflow@test/purchase-cart.js. <link> in head: cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css. Vue/Nuxt targets: password form → PasswordProtected.vue component, auth modal → Auth composable, mobile nav → MobileNav composable, footer → Footer.vue (with state logic for join/account visibility).

5. **Forms** — Webflow password page form: action="/.wf_auth", method="post", id="email-form", name="email-form", data-name="Email Form", class="utility-page-form w-password-page", data-wf-page-id="69061c4b16d598682cd30ee3", data-wf-element-id="69061c4b16d598682cd30ee700000000000c". Fields: input[name="pass"] (password, type="password", placeholder="Enter your password", required, autofocus), hidden inputs for path (<%WF_FORM_VALUE_PATH%>) and page (<%WF_FORM_VALUE_PAGE%>) — Webflow placeholder template tokens. Submit button: input[type="submit"] with data-wait="Please wait...", value="Submit". Error message: .w-password-page.w-form-fail ("Incorrect password. Please try again."). Client-side password validation script (lines 94–98) checks URL param e=1 and shows error if present. Also Finsweet consent form (same as other pages) and footer newsletter form.

6. **Interactions** — Webflow IX2: data-w-id="dfaacfb6-8366-add9-824d-8b68a1a02fd9" (mobile cart trigger), data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" (desktop user account menu), data-w-id="3aa13800-cfef-f5fa-e272-93983f82db83" (user account submenu). Consent interactions: fs-consent-element=* (banner, form, checkboxes, deny/allow buttons, open-preferences, close). Language dropdown: w-dropdown interactions. Form validation: password form submits to /.wf_auth (Webflow backend), error shown via .w-form-fail. Footer link visibility: checked via async fetch to /users/me endpoint in IIFE (lines 970–1012). All interactions are FUNCTIONAL (password protection, consent prefs, auth state UI updates).

7. **SEO** — <title>: "Protected page", OG title: "Protected page", Twitter title: "Protected page", robots: "noindex" (set explicitly, line 10). No description, canonical, OG image/type, Twitter card, JSON-LD. **Correct for error page**: noindex prevents crawling.

8. **Assets** — favicon.png, webclip.png, Demat_logo_4000x4000_black-background.webp (footer srcset: p-500/800/1080/1600/2000/2600/3200 variants), demat-sticker.png (footer).

9. **Links** — internal nav: index.html (home), clothing.html (browse all, new in), /clothing?page=... (filtered), how-it-works.html, memberships.html (join now), also-this.html, profile.html, my-rentals.html, reservations.html, donations-credits.html, purchases.html, my-membership.html, wish-list.html, about-us.html, terms-and-conditions.html, privacy-policy.html, faq.html, return-policy.html, cancellation-policy.html, contact-us.html, donations.html, mailing-list.html. External: https://www.instagram.com/dematerialized_nl/, https://www.tiktok.com/@dematerialized_nl.

10. **Scope flag** — Password-protected page form submits to Webflow backend (/.wf_auth). On port to Nuxt: (a) password form must be replaced with Nuxt route guard or middleware (check for page password/auth token); (b) .wf_auth endpoint needs to be replaced with Nuxt server or backend API call; (c) footer auth state checking must be integrated into Nuxt auth composable; (d) Finsweet consent must be replaced with custom consent component (Phase 2). **Possible issue**: password page logic is Webflow-specific — determine if Nuxt should use route guards, server middleware, or redirect to login instead.

## 404.html  →  /404
TITLE: Not Found

1. **Identity** — file: `404.html`, route: `/404` (HTTP 404 Not Found error page), `<title>`: "Not Found", purpose: error page displayed when a requested page does not exist, with link to return to homepage. EN/NL variant: uses `.lang-en` / `.lang-nl` CSS classes in `<head>`; hreflang links on locale selector (href="#" placeholder).

2. **Layout** — sections top-to-bottom: (1) navbar-desktop (shared, full desktop nav with language selector, auth buttons, nav links, join now button), (2) top-navbar-mobile (mobile nav, shared), (3) utility-page-wrap containing utility-page-content with 404 image, h2 heading ("Whoops, the page you're looking for doesn't exist"), link-404 link back to homepage, (4) mobile-footer-spacer, (5) mobile-bottom-nav (IIFE-injected), (6) custom demat-footer embedded <style> + <script>, (7) script tags for embeds. Wrapper: .utility-page-wrap, .utility-page-content, .image-30, .heading-2, .link-404.

3. **Styling** — normalize.css, webflow.css, dematerialized-24fc59.webflow.css. Page-specific classes: .utility-page-wrap, .utility-page-content, .image-30 (404 error image), .heading-2 (error heading), .link-404 (return link). Custom footer <style> block (lines 775–894): .demat-footer, .demat-footer-* classes (grid layout, color: var(--purple, #4b073f) background, responsive breakpoints at 991px/767px, footer is hidden on mobile via display: none !important at 767px). Finsweet consent: .fs-consent_* classes.

4. **Embeds & scripts** — identical to 401.html: inline <script> in navbar-desktop defining auth modal (openAuthModal, closeAuthModal), mobile nav IIFE (lines 479–772), custom footer <style> + <script> blocks (lines 774–1012 containing footer HTML grid and auth state checking logic fetching /users/me). jsDelivr <script> tags: jquery-3.5.1.min.js, js/webflow.js, auth0-spa-js/2.0, demat-webflow@test/components.js, demat-webflow@test/auth.js, demat-webflow@686173fd.../site-wide-footer.js, demat-webflow@test/purchase-cart.js. <link> in head: cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css. Vue/Nuxt targets: 404 page → Error404.vue component or Nuxt error page, auth modal → Auth composable, mobile nav → MobileNav composable, footer → Footer.vue.

5. **Forms** — Finsweet consent form (fs-consent_prefs_form) with marketing/personalization/analytics checkboxes. Footer newsletter form (wf-form-Mailing-List-Form, method="get", email input + consent checkbox + submit).

6. **Interactions** — Webflow IX2: data-w-id="dfaacfb6-8366-add9-824d-8b68a1a02fd9" (mobile cart trigger), data-w-id="3aa13800-cfef-f5fa-e272-93983f82db80" (desktop user account menu toggle), data-w-id="3aa13800-cfef-f5fa-e272-93983f82db83" (user account submenu). Consent: fs-consent-element=* interactions (banner, form, checkboxes, buttons, preferences, close). Language dropdown: w-dropdown interactions. Footer link visibility: IIFE checks window.auth0Client and /users/me endpoint (lines 970–1012), adds .is-visible class to #footerJoinNow if not authenticated or no stripe_id, shows #footerMyAccount if authenticated. All interactions are FUNCTIONAL (consent, auth state UI, footer link toggling).

7. **SEO** — <title>: "Not Found", OG title: "Not Found", Twitter title: "Not Found", robots: "noindex" (line 10, correct for error page). No description, canonical, OG image, Twitter card, JSON-LD. **Correct**: noindex prevents indexing error page.

8. **Assets** — favicon.png, webclip.png, images/404.png (error image), Demat_logo_4000x4000_black-background.webp (footer srcset: p-500/800/1080/1600/2000/2600/3200), demat-sticker.png (footer).

9. **Links** — internal nav: index.html (return to homepage via .link-404), plus standard nav links (clothing.html, how-it-works.html, memberships.html, profile.html, etc.). External: https://www.instagram.com/dematerialized_nl/, https://www.tiktok.com/@dematerialized_nl.

10. **Scope flag** — Standard 404 error page with Finsweet consent + shared navbar/footer. On port to Nuxt: (a) replace with Nuxt error.vue or custom 404 page; (b) auth modal and footer state logic ported to Vue composables; (c) Finsweet consent replaced with custom component (Phase 2); (d) footer link visibility logic integrated into Footer.vue. **No blocking issues** — straightforward error page template matching site chrome.

### OPEN QUESTIONS
- detail_blog.html: Blog post detail page uses w-dyn-bind-empty for title, body, image, and author list — CMS data binding will need API fetch to /blogs/{id} endpoint and dynamic SEO meta tags (title, description, og:*). Confirm backend blog API schema.
- detail_author.html: Bare template file with no visible content structure — needs clarification on author detail page layout and CMS author fields. Confirm expected fields (name, bio, image, related posts grid) and corresponding API endpoint.
- detail_items.html: Bare template page, purpose unclear (product detail? rental detail?). Confirm route meaning, CMS data model, and API endpoint before porting.
- 401.html and 404.html: Both use Webflow password page form (action=/.wf_auth) and custom footer state-checking logic. Clarify how Nuxt should handle password-protected pages — use route guards, middleware, or redirect to auth? Also confirm footer auth logic should be extracted to Footer composable.
- All 5 pages: Finsweet consent (consentpro) must be replaced with custom GDPR/ePrivacy consent system (Phase 2). Confirm consent scope and requirements before porting.
- All 5 pages: Language toggle uses w-locales-list with hreflang="en" / "nl" and href="#" placeholders. Confirm i18n routing strategy and how locale switching should work in Nuxt (@nuxtjs/i18n setup).
- All error pages (401, 404): Footer HTML is embedded inside <script> tag (lines 895–1012 of footer embed), not in DOM. Confirm footer should be a separate component or included as shared layout across error pages.
## Appendix G — Embed behavior audit (demat-webflow production code)

### G.1 auth / account

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/auth.js
PURPOSE: Auth0 authentication initialization and lifecycle management. Handles login/logout flows, post-login onboarding modal triggering, user status checking on page load, Auth0 configuration, and UI updates based on auth state. Stores return-path in sessionStorage for post-login redirects.
VUE TARGET: composable: useAuth() + plugin: auth.client.ts
PAGES: All pages (site-wide head code; loaded via jsDelivr)
ENDPOINTS:
  - GET /users/me (Bearer token auth)
  - POST /auth0/login (implicit via Auth0 SPA SDK)
  - POST /auth0/logout (implicit via Auth0 SPA SDK)
GLOBALS:
  - window.API_BASE_URL
  - window.auth0Client
  - window.currentUserData
  - window.checkUserStatus
  - window.debugAuth
  - window.openOnboardingModal
  - sessionStorage.auth_return_path
  - sessionStorage.onboarding_modal_dismissed
NOTES: DOM selectors: [data-auth='logged-in'], [data-auth='logged-out'], [data-auth='user-name'], [data-auth='user-email'], [data-auth='user-picture'], [data-auth-action='login'], [data-auth-action='logout'], #btn-login, #btn-logout, #btn-call-api. Auth0 domain: dev-rgs24jdzcvdydd77.eu.auth0.com, clientId: o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV. Onboarding modal only shows if user has membership AND incomplete profile; skips pages (/onboarding, /complete-your-profile, /profile, /memberships, /error-membership-signup). First name extracted from userData.attributes via 'first_name' key. No explicit i18n handling. Relies on window.openOnboardingModal (defined elsewhere).

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/account-app.js
PURPOSE: Vue 2 app (CDN-loaded) for unified /account page shell. Manages hash-based tab routing (profile, rentals, reservations, donations, purchases, membership). Loads and displays user data for each section, handles form submissions with validation, address autocomplete via Geoapify, and modal dialogs for rental/reservation details.
VUE TARGET: page component: pages/account.vue or pages/account/index.vue (Nuxt 3 SFC with child components per tab)
PAGES: /account (mounted to #account-app DOM container)
ENDPOINTS:
  - GET /users/me (Bearer token)
  - PATCH /users/me (Bearer token, JSON: phone_number, date_of_birth, attributes[])
  - GET /private_clothing_items/rentals (Bearer token)
  - GET /private_clothing_items/rentals?include_history=true (Bearer token)
  - GET /private_clothing_items/reservations (Bearer token)
  - GET https://api.geoapify.com/v1/geocode/autocomplete (public, apiKey=ce61be62b3c344838d731909f625cfd1, countrycode:nl filter)
GLOBALS:
  - window.API_BASE_URL
  - window.auth0Client
  - Vue
NOTES: Hash-based routing: #profile, #rentals, #reservations, #donations, #purchases, #membership (no page reload). Data: profile (personal/address/size forms with custom attributes), rentals (active & history split by status='Returned'), reservations (filtered items.length > 0, sorted by request_date desc), membership (parsed from userData.membership.active). Geoapify API key hardcoded. Error parsing handles FastAPI format (detail.loc[]). Success messages dismiss after 3s. Image selection: prefer type='front' or name.includes('front'), fallback to first. Rental card links: /product?sku=X. Modals: set body.overflow='hidden' on open, restore on close. No i18n.

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/profile.js
PURPOSE: Standalone Vue app for /profile page. Auth-protected. Same form structure as account-app profile section. Loads user data, updates personal/address/size via API with validation, address autocomplete, error/success messaging with auto-dismiss (3s).
VUE TARGET: page component: pages/profile.vue (Nuxt 3 SFC) or merge into account tab logic
PAGES: /profile (mounted to #vue-profile-app DOM container)
ENDPOINTS:
  - GET /users/me (Bearer token)
  - PATCH /users/me (Bearer token, JSON: phone_number, date_of_birth, address_* fields, attributes[])
  - GET https://api.geoapify.com/v1/geocode/autocomplete (same Geoapify key)
GLOBALS:
  - window.auth0Client
  - window.API_BASE_URL
  - Vue
NOTES: Auth protection via IIFE: checks window.auth0Client.isAuthenticated(), redirects to / if false. Polls for auth0Client every 100ms before init. Address search debounced 300ms. Click-outside listener closes address dropdown. Same API field mapping and FastAPI error parsing as account-app. Geoapify key same as account-app. Form validation errors parsed from API detail.loc[]. No i18n. OPEN QUESTION: Why both standalone profile.js AND profile section in account-app.js? Should they be merged?

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/my-account.css
PURPOSE: Styling for account UI: layout (flex sidebar + content), tab navigation, form inputs/labels/buttons, rental/reservation cards, modals (detail dialogs), status badges, address autocomplete dropdown, loading/empty states, responsive breakpoints (768px mobile, 480px small).
VUE TARGET: scoped styles in components (AccountPage.vue, ProfilePage.vue, RentalCard.vue, ReservationCard.vue, AccountModal.vue, etc.)
PAGES: /account, /profile (loaded via jsDelivr <link> tag)
ENDPOINTS:

GLOBALS:

NOTES: Key classes: .account-wrapper (max-width 1300px, padding 0 40px), .account-layout (flex, gap 80px), .account-tabs (flex column, 200px, gap 4px), .account-tab.active, .form-input (44px, border #ccc, focus #000), .form-group, .form-label, .form-row (flex gap 16px), .btn-primary (black bg), .btn-secondary (white, black border), .rental-card/.reservation-card (flex gap 20px), .card-image (100x133px or 80x107px), .modal (fixed, max-width 420px, max-height 90vh), .status-badge, .address-results (absolute, max-height 200px), .membership-info (grid 2 cols), .empty-state, .loading-state. Colors: #000 (text/active), #666 (secondary), #ccc (border), #f5f5f5 (hover), #fafafa (light bg), #e5e5e5 (card border). Mobile (768px+): tabs become horizontal scrolling, layout stacks. Fonts: Urbanist 14px, 13px buttons. [v-cloak] { display: none !important; }.

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/sidenav
PURPOSE: CSS for sticky account sidebar navigation: 240px wide, colorful gradient links (purple active, pink accent), icons, member badge, responsive mobile (converts to horizontal scrolling bar). Defines brand color variables and applies gradients to navigation items.
VUE TARGET: scoped styles in components (AccountSidenav.vue or similar) + CSS variables exposed at :root
PAGES: /account (injected via page head <style> per CLAUDE.md)
ENDPOINTS:

GLOBALS:
  - --nav-purple: #4b073f
  - --nav-purple-light: #6b1a5e
  - --nav-pink: #e84dd8
  - --nav-pink-soft: #f5c6ef
  - --nav-pink-glow: rgba(232, 77, 216, 0.08)
  - --nav-cyan: #2cc4ff
  - --nav-teal: #008ad4
  - --nav-white: #ffffff
  - --nav-gray-light: #f8f5f7
  - --nav-gray-text: #6b6b6b
  - --nav-gray-dark: #2a2a2a
NOTES: Container: .account-sidenav (sticky top 100px, width 240px, flex-shrink 0). Inner: .account-sidenav-inner (white bg, border-radius 24px, padding 8px, subtle border/shadow). Links: .account-sidenav-link (flex, gap 12px, padding 14px 18px, border-radius 18px, font 15px 500, color var(--nav-gray-text) by default, transition 0.2s). Hover: --nav-pink-glow bg, --nav-purple text. Active: linear-gradient(135deg, purple, purple-light), white text, 600 weight, shadow 0 4px 16px, ::after pink dot (6px, glow). Icons: .account-sidenav-icon (20x20px, flex center, stroke currentColor). Badge: .account-sidenav-badge (inline-flex, cyan-teal gradient, 10px 700 weight, padding 2px 8px, border-radius 20px, margin-left auto). Separator: .account-sidenav-sep (1px, gradient transparent-pink-transparent). Mobile (768px): position relative, width 100%, inner display flex row, overflow-x auto, scrollable, links white-space nowrap, active ::after hidden. Brand alignment: Plum #4b073f (primary), magenta #e84dd8 (accent pink), cyan #2cc4ff (tertiary).

### OPEN QUESTIONS
- Why are both profile.js (standalone /profile page) AND account-app.js profile section maintained? Should they be consolidated into a single profile component/tab?
- Geoapify API key (ce61be62b3c344838d731909f625cfd1) is hardcoded in client-side code (both account-app.js and profile.js). Should this be moved to backend proxy or environment variable for security?
- Auth0 domain and clientId (dev-rgs24jdzcvdydd77.eu.auth0.com / o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV) are hardcoded. Are these test or live credentials? Must verify environment switching (test vs. live API_BASE_URL vs. Auth0 config).
- onboarding_modal_dismissed is stored in sessionStorage (cleared on logout). Should this persist longer (localStorage) or reset per session intentionally?
- window.openOnboardingModal() is called but defined elsewhere (likely in components.js or another file). Verify it exists and is loaded before auth.js executes.
- Account-app.js uses Vue 2 CDN (createApp, no Vue 3 composition API). Must upgrade to Nuxt 3 with <script setup>. Verify all dependencies (Vue, auth0 SDK, etc.) are available at runtime.
### G.2 catalog (clothing.js, pdp.js)

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/clothing.js
PURPOSE: Client-side catalog with slide-out filter panel. Fetches catalog from /search endpoint, populates filter panel dynamically, performs client-side filtering with live counts, supports status/availability filter, filter chips, URL sync, and pagination (20 items per page). Injects filter panel HTML if not present; handles search via debounce; manages mobile search expand/collapse.
VUE TARGET: components/CatalogPage.vue (main) + composable useCatalogFilters.ts + CatalogGrid.vue (sub-component)
PAGES: /clothing.html
ENDPOINTS:
  - GET {BASE}/search
  - GET {BASE}/search?q={query}&limit=500
  - GET {BASE}/clothing_items/subcategories
  - GET {BASE}/clothing_items/sizes
GLOBALS:
  - window.API_BASE_URL
  - window.DematI18n.isNL()
  - window.openFilterPanel
  - window.closeFilterPanel
  - window.updateWishlistIcons
  - window.Webflow.require('ix2').init()
  - sessionStorage: 'dm_catalog' (5-min TTL)
  - localStorage: (none used)
  - cookies: (none directly managed)
  - custom events: (none fired)
NOTES: DOM selectors: [data-grid='products'], [data-template='product-card'], [data-page='prev'|'next'|'label'], [data-search='input'|'clear'], [data-reset-all], [data-filter-open], .filter-trigger-btn, [data-filter], .filter-section-header[data-toggle], .filter-chips-bar, .search-container, .search-icon, .search-input, .full-page-section, [data-filter-badge], .clothing-result-count, .clothing-reset-all, .clothing-toolbar, .color-circle-pdp (also defined here for PDP), [data-filter-reset], [data-filter-apply]. Status display maps EN/NL. Extra filters: sleeve_length, rise, length, material, fit, pattern, neckline. Size filtering has profile mode (XXS–XXL) vs specific mode with translation on category change. Mobile search DOM rearrangement moves .search-container to .full-page-section on resize. Filter panel injected into DOM via components.js. Webflow IX2 triggers Webflow.require('ix2').init() on grid renders. i18n via window.DematI18n.isNL() for locale routing (/product vs /nl/product). Product links use encodeURIComponent(sku) in query params.

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/pdp.js
PURPOSE: Product detail page logic. Single optimized fetch for product item (sku from URL). Renders gallery with main image, thumbnails, and mobile slider (Webflow slider integration). Hydrates text fields (name, brand, fabric, care, donated_by, color, size, condition, status, price, category, subcategory). Handles color circles (hex painting, multicolor gradient). Fetches/caches full catalog for related items (client-side scoring by category + color match, top 12 shown). Wishlist toggle (Auth0 token + API). Status-aware cart button (disabled for rented/reserved/returned/purchased/sold/damaged/retired; enabled only for 'available'). Exports CartButtonUtils for use on other pages.
VUE TARGET: pages/product/[sku].vue (main PDP) + useProductGallery.ts (composable for gallery/mobile slider) + useRelatedItems.ts (composable for fetching/filtering catalog) + useProductWishlist.ts (composable for wishlist) + useProductCart.ts (composable for cart with status config)
PAGES: /product.html (detail page); /product?sku={sku} (URL pattern)
ENDPOINTS:
  - GET {BASE}/clothing_items/clothing_item/{sku}
  - GET {BASE}/clothing_items/catalog/full
  - GET {BASE}/private_clothing_items/wishlist/exists/{itemId}
  - POST {BASE}/private_clothing_items/wishlist/{itemId}
  - DELETE {BASE}/private_clothing_items/wishlist/{itemId}
GLOBALS:
  - window.API_BASE_URL
  - window.DematI18n.isNL()
  - window.auth0Client.isAuthenticated()
  - window.auth0Client.getTokenSilently()
  - window.CartManager (if available)
  - window.CartButtonUtils (exported; used on related items)
  - window.Webflow.require('slider').redraw()
  - sessionStorage: 'dm_catalog' (5-min TTL for catalog cache)
  - localStorage: (none used)
  - cookies: (none directly managed)
  - custom events: (none fired)
NOTES: DOM selectors: [data-main-img], [data-thumbs], [data-template='thumb'], .div-pdp-image-wrapper, .w-slider-mask, .mobile-slide-img, [data-related='wrapper'], [data-related-viewport], [data-related-track], [data-template='related-card'], [data-field='{field}'], [data-pdp='{field}'], .color-circle-pdp, [data-related-img], [data-related-name], #pdp-wishlist-button, #pdp-cart-button. Image gallery supports multiple [data-thumbs] containers; all thumbnails coordinated. Mobile slider integrates with Webflow slider.redraw(). Wishlist hidden if no auth0Client or user not authenticated. Cart button status-aware: disabled visual + accessibility for non-available items. Related items: catalog-based (not API-paginated), scored by category ID match (+10) and color name match (+5), lazy-loaded via IntersectionObserver. SKU param validation happens on page load (redirect to /clothing if missing/empty). Donated_by field formatted to 'curated by demat' or 'FirstName L.' format. Color normalization via canonicalization (olive green → green, etc.) with hex lookup. i18n button text for cart (add/remove/full/updating), wishlist, and status messages.

### OPEN QUESTIONS
- Does the Nuxt router use dynamic routes like pages/product/[sku].vue or route params (e.g., useRoute().query.sku)? Confirm pattern matching /product?sku=X vs /product/{sku}.
- Will window.API_BASE_URL be set by the Nuxt app init or injected via plugin? Need pattern for test vs live API base.
- Does Nuxt i18n auto-detect .isNL() via locale or does window.DematI18n need to be ported as composable?
- Will CartManager (from purchase-cart.js) be loaded as global plugin or composable before PDP init? Timing dependency exists.
- Webflow.require('ix2').init() and slider.redraw() — are Webflow interactions retained in Nuxt or replaced with Vue transitions?
- sessionStorage key 'dm_catalog' — store in Nuxt pinia or keep as sessionStorage? 5-min TTL logic needs porting.
- Related items API: is /clothing_items/catalog/full the correct prod endpoint, or should it use /search with limit=500 like catalog page?
- ProductCard component template: is product.front_image always present, or does fallback to back_image logic need client-side detection?
### G.3 commerce (purchase-cart.js, purchases.js, donations.js)

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/purchase-cart.js
PURPOSE: Manages shopping cart state (localStorage), renders cart panel (slide-in sidebar) and checkout modal, handles credit balance fetching, processes Stripe checkout via backend, applies store credits, and shows toast notifications and success states. Loaded site-wide via jsDelivr; drives the entire purchase flow from 'add to cart' through payment redirect.
VUE TARGET: components/PurchaseCart.vue (composable: usePurchaseCart) + components/CheckoutModal.vue + components/CartPanel.vue; plugin for localStorage persistence and toast notifications
PAGES: Site-wide (every page via site footer code); specifically cart page and checkout flows
ENDPOINTS:
  - GET {apiBase}/private_clothing_items/donation_session/ (fetch credit balance)
  - POST {apiBase}/private_clothing_items/orders (create order)
  - POST {apiBase}/private_clothing_items/orders/{id}/checkout (create Stripe session)
GLOBALS:
  - window.PurchaseCart (main object, auto-inits on DOMContentLoaded)
  - window.API_BASE_URL (read for base URL; fallback logic checks hostname)
  - window.auth0Client (reads isAuthenticated, getTokenSilently)
  - localStorage.demat_purchase_cart (persists items as JSON)
  - document.getElementById: purchase-cart-panel, purchase-cart-backdrop, checkout-modal, checkout-modal-backdrop, purchase-cart-badge, purchase-cart-nav, checkout-submit-btn, checkout-error-msg
NOTES: DOM selectors: .purchase-cart-badge, .purchase-cart-nav, .cart-panel (role-based), .checkout-modal (role-based). Injects all CSS via injectCartStyles() at init (brand colors, layout, animations). Cart item structure: {clothing_item_id, name, image_url, purchase_price_cents, retail_price_cents}. Price formatting: EUR cents→€X,XX (comma decimal). Checkout flow: (1) fetch credit balance, (2) create order POST, (3) if balance remains, POST to checkout endpoint for Stripe redirect. Handles credit application logic client-side (Math.min). Error handling for FastAPI validation responses (detail as string or array). Toast uses setTimeouts for animation. Modal rendered dynamically with inline SVG icons. RentalsManager cross-ref at line 206 (removeItem callback). i18n: checks window.DematI18n.isNL() or falls back to document.documentElement.lang.

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/purchases.js
PURPOSE: Fetches and renders the purchases page: authenticates user, fetches orders from backend, displays order history as clickable cards with thumbnails and totals, opens detail modal on click, and shows payment method breakdown (credits vs card). Handles membership status check (requires stripe_id). Loaded on purchases page via jsDelivr.
VUE TARGET: pages/purchases.vue (primary page component) + composable: usePurchasesManager (fetching/rendering) + components/PurchaseOrderCard.vue + components/PurchaseDetailModal.vue
PAGES: purchases.html (/purchases, /nl/purchases)
ENDPOINTS:
  - GET {apiBase}/private_clothing_items/orders (fetch all orders)
  - GET {apiBase}/users/me (check membership status via stripe_id)
GLOBALS:
  - window.PurchasesManager (main object, initialized on page load via initPurchasesPage)
  - window.API_BASE_URL (read for base; fallback checks hostname)
  - window.auth0Client (isAuthenticated, getTokenSilently)
  - document.getElementById: purchases-container, purchases-loading, purchases-signin, purchases-empty, purchases-content, purchases-list, purchases-no-membership, purchase-detail-modal, purchase-detail-backdrop, purchase-modal-content
NOTES: Localization: PURCHASES_T object with en/nl keys for ~15 strings (purchaseDetails, purchasedOn, payment, subtotal, creditsApplied, etc.). isNL() checks window.DematI18n.isNL() first, then document.documentElement.lang. Order card renders overlapping thumbnails (up to 3 items with +N badge). Detail modal shows: status banner (paid/refunded/pending/failed), order summary grid (date, item count), payment breakdown (subtotal, credits applied, total), payment method icon + label (credits only / credits + card / card only), and items list with retail price strikethrough. Item structure: {clothing_item: {name, sku, image_url, retail_price_cents, images[]}, price_in_cents, retail_price_cents}. Date formatting locale-aware (nl-NL or en-GB, lowercase). CSS classes: purchase-group, purchase-group-thumb, purchase-modal-header, purchase-modal-item-card, purchase-modal-payment, etc. Modal backdrop/Escape key handlers for close. Page waits up to 5s for auth0Client initialization (50 attempts × 100ms). Membership check redirects unauthenticated users or non-members.

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/donations.js
PURPOSE: Renders the donations/store-credit page: authenticates, fetches donation sessions and pricing categories, displays credit balance card, lists donation history with status badges and cards, opens detail modal on card click, shows breakdown of donated items with per-item credit values. Checks membership status (stripe_id). Loaded on donations page via jsDelivr.
VUE TARGET: pages/donations-credits.vue (primary page component) + composable: useDonationsManager (fetching, rendering, credit calculations) + components/DonationCard.vue + components/DonationDetailModal.vue
PAGES: donations-credits.html (/donations-credits, /nl/donations-credits)
ENDPOINTS:
  - GET {apiBase}/clothing_items/pricing_categories (fetch pricing tiers for credit calculation)
  - GET {apiBase}/private_clothing_items/donation_session/ (fetch user's sessions and credit balance)
  - GET {apiBase}/private_clothing_items/donation_session/{sessionId} (fetch detail for single session)
  - GET {apiBase}/users/me (check membership status)
GLOBALS:
  - window.DonationsManager (main object, auto-inits on DOMContentLoaded via IIFE)
  - window.API_BASE_URL (read from window, fallback not implemented in this file)
  - window.auth0Client (isAuthenticated, getTokenSilently)
  - window.closeDonationDetailModal (exported function for modal close button)
  - document.getElementById: donations-container, donations-loading, donations-empty, donations-content, donations-no-membership, donation-detail-modal, donation-detail-backdrop, donation-modal-id, donation-modal-content
NOTES: Localization: DONATIONS_T with ~20 en/nl strings (availableStoreCredit, creditsEarned, badgeComplete, badgeProcessing, etc.). isNL() checks window.DematI18n.isNL() first. Credit calculation: matches session item.category.pricing_group and item.brand.is_fast_fashion to pricing_categories to look up store_credits_cents. Credit balance card shows available balance + desc. Donation card: header (donation ID #hash_id[0:8], status badge), stats grid (date, items, credits earned), notes section (if notes exist), view-details button. Detail modal: status banner (complete/processing + message), donation summary grid (date, location, items accepted, total credits), donated items list (item image/placeholder, name, +credits, view-item link), how-credits-work info section. Item structure: {name, sku, category: {pricing_group}, brand: {is_fast_fashion}, images: [{image_type, image_key, image_name, object_url}]}. Image lookup prioritizes front-type by image_type or key/name substring. Date locale-aware. CSS classes: donation-card, donation-badge, donation-badge-complete, donation-modal-summary-item, etc. Modal state via display:block/flex. Escape key + backdrop click handlers. Page waits for auth0Client (50 attempts × 100ms) before init. Membership check (stripe_id) prevents access. escapeHtml() prevents XSS on user notes.

### OPEN QUESTIONS
- Does checkout order_type=purchase get hardcoded, or does it vary by flow? Should we standardize Stripe redirect field name (checkout_url vs url vs session_url) in API responses?
- Why does credit balance fetch from /donation_session/ endpoint in purchase-cart.js, and is this consistent across all flows?
- Should pricing_categories be cached globally in donations.js since it's fetched twice (page init + detail modal open)?
- Does pricing_group match on display_name exactly, or should matching be case-insensitive or keyed differently?
- Why is API_BASE fallback missing in DonationsManager (unlike purchase-cart.js and purchases.js with hostname checks)?
- Should the detail modal in purchases.js fetch fresh retail prices on demand, or rely on cached order data?
### G.4 rentals & reservations

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/rentals.js
PURPOSE: Manages rental items for authenticated users on the My Rentals page. Fetches active and historical rentals from the backend, renders them as cards with purchase conversion functionality (50% off retail). Supports cart integration for buying rented items, modal detail views, and i18n (EN/NL). Handles membership-gated access.
VUE TARGET: composable useRentalsManager() + component RentalsPage.vue (wraps container, loading, empty, active/history sections, modals)
PAGES: my-rentals.html (loaded via jsDelivr @ea1b25a926b5a13ca59f11dcbd453ddc1f222d23)
ENDPOINTS:
  - GET /clothing_items/pricing_categories
  - GET /private_clothing_items/rentals
  - GET /private_clothing_items/rentals?include_history=true
  - GET /users/me
GLOBALS:
  - window.RentalsManager
  - window.API_BASE_URL
  - window.auth0Client
  - window.PurchaseCart
  - window.DematI18n
  - window.closeRentalModal
  - document.documentElement.lang
NOTES: DOM bindings: #rentals-container, #rentals-loading, #rentals-empty, #rentals-active, #rentals-history, #active-rentals-list, #history-rentals-list, #rentals-no-active, #rental-detail-modal, #rental-detail-backdrop, #rental-modal-content, .rental-modal-title, #rentals-no-membership, #rentals-contact. Inline onclick callbacks (RentalsManager.addToCart, removeFromCart, openGroupModal). All HTML rendered as template strings. i18n: window.DematI18n.isNL() fallback to document.documentElement.lang; RENTALS_T holds copy (EN/NL). Waits 5s (50x100ms) for window.auth0Client. Product links language-aware (/product vs /nl/product). Cart buttons conditional on PurchaseCart.hasItem(). Spinner SVGs embedded. Pricing logic: retail price from category + brand fast_fashion flag, purchase = 50% off. Groups history by return_date, shows up to 3 thumbnails with +N badge.

## /Users/courtneyyocabet/webflow-migration/old/demat-webflow-test/reservations.js
PURPOSE: Manages reservation state on Reservations page. Fetches user reservations with status (pending, ready, completed, cancelled, expired), renders as cards with item thumbnails, detail modals. Handles pickup deadlines (ready_date + 7 days), item pickup tracking, displays static pickup location. i18n (EN/NL), membership-gated access.
VUE TARGET: composable useReservationsManager() + component ReservationsPage.vue (wraps container, loading, empty, list sections, modals)
PAGES: reservations.html (loaded via jsDelivr @a957a4f343199d1bff2b115b7328392d4f6d0c7c)
ENDPOINTS:
  - GET /private_clothing_items/reservations
  - GET /users/me
GLOBALS:
  - window.ReservationsManager
  - window.API_BASE_URL
  - window.auth0Client
  - window.closeReservationDetailModal
  - window.DematI18n
  - document.documentElement.lang
NOTES: DOM bindings: #reservations-container, #reservations-loading, #reservations-empty, #reservations-list, #reservation-detail-modal, #reservation-detail-backdrop, .modal-title, .modal-body, #detail-modal-content, #reservation-modal-content, .modal-footer, .modal-label, #reservations-no-membership. Inline onclick callbacks (ReservationsManager.viewReservation, openAuthModal). All HTML rendered as template strings. i18n: window.DematI18n.isNL() fallback to document.documentElement.lang; RESERVATIONS_T holds copy (EN/NL, some lowercased: behandeling, geannuleerd). Waits 5s (50x100ms) for window.auth0Client. Escape key closes modal. Pickup deadline: tbd until status=ready, then ready_for_pickup_date + 7 days. Hardcoded location: lange putstraat 4, 5211 kn s-hertogenbosch. Filters by items.length > 0, sorts by request_date desc. Adds .reservation-modal-redesigned class for CSS overrides. Status-specific badge classes: reservation-badge-{pending,ready,completed,cancelled,expired}.

### OPEN QUESTIONS
- In Vue, how should async auth0Client initialization polling be handled? Should it be in a composable setup or page lifecycle hook?
- Should the hardcoded pickup location (lange putstraat 4) be externalized to a config/constant or remain inline for now?
- How to port inline onclick callbacks (RentalsManager.addToCart, etc) to Vue event handlers while preserving the global namespace access?
- Should PurchaseCart integration be a separate composable or part of useRentalsManager?
### G.5 shared (components.js, site-wide-footer.js, styles.css, README)

## old/demat-webflow-test/components.js
PURPOSE: Injects shared modal HTML at DOM runtime: cart overlay, reservation modals, upgrade modal, success modal, and 8-step onboarding. Provides WishlistManager singleton (localStorage + API sync, optimistic updates). Exports updateWishlistIcons for clothing.js to bind heart toggle handlers.
VUE TARGET: components/CartOverlay.vue, components/ReservationModal.vue, components/UpgradeModal.vue, components/SuccessModal.vue, components/OnboardingModal.vue, composables/useWishlist.ts
PAGES: All pages with product cards; catalog, homepage
ENDPOINTS:
  - GET /private_clothing_items/wishlist/clothing_items
  - POST /private_clothing_items/wishlist/{id}
  - DELETE /private_clothing_items/wishlist/{id}
GLOBALS:
  - window.WishlistManager
  - window.updateWishlistIcons
  - localStorage.dematerialized_wishlist
  - window.API_BASE_URL
NOTES: WishlistManager: optimistic local updates, syncs API on auth, fallback to localStorage. DOM selectors: [data-item-id] + .heart-icon-outline-20px/.heart-icon-filled-20px (Webflow cards), [data-wishlist-id] (custom). Geoapify key hardcoded (ce61be62b3c344838d731909f625cfd1). Modal and onboarding functions exposed globally. Onboarding form data collected per-step, sent as PATCH /users/me with attributes array. i18n: window.DematI18n.localizePath() for links.

## old/demat-webflow-test/site-wide-footer.js
PURPOSE: Loads site-wide on all pages. Provides i18n locale detection, auth modal wiring, CartManager (sessionStorage + API sync, 5-item max), membership-aware reservation/rental dual-mode, Stripe membership checkout, navbar scroll-hide, and 8-step onboarding with Geoapify address autocomplete and profile persistence.
VUE TARGET: composables/useI18n.ts, composables/useCartManager.ts, composables/useAuthModals.ts, composables/useMembership.ts, composables/useReservationFlow.ts, components/NavbarScrollHide.vue, plugins/initSiteWideHandlers.ts
PAGES: All pages (Footer Code before page-specific scripts)
ENDPOINTS:
  - GET /users/me
  - POST /private_clothing_items/basket/clothing_items
  - POST /private_clothing_items/basket/{id}
  - DELETE /private_clothing_items/basket/{id}
  - POST /private_clothing_items/reservations
  - POST /stripe/create-checkout-session
  - GET /api.geoapify.com/v1/geocode/autocomplete (third-party)
GLOBALS:
  - window.API_BASE_URL
  - window.DematI18n (isNL, localizePath, localizeHrefs)
  - window.CartManager
  - window.UserMembership
  - window.auth0Client
  - window.openAuthModal, closeAuthModal, updateAuthUI
  - window.openCartOverlay, closeCartOverlay, renderCartOverlay, handleReserveClick
  - window.openReservationModal, closeReservationModal, confirmReservation, showReservationSuccess
  - window.openUpgradeModal, closeUpgradeModal
  - window.openOnboardingModal, closeOnboardingModal, nextOnboardingStep, prevOnboardingStep, skipOnboarding, submitOnboarding, completeOnboarding
  - sessionStorage.dematerialized_cart, postLoginAction, onboarding_modal_dismissed, onboarding_completed
  - window.dataLayer (GTM membership_checkout_click)
NOTES: API_BASE_URL set in HEAD per hostname (prod/test). i18n: document.documentElement.lang detection. CartManager: sessionStorage, 5-item max, syncs if Auth0 available. UserMembership: 5min cache, membership.name check. Reservation dual-mode: local vs shipping (Premium) with text/button/policy swaps. Navbar scroll: .div-nav-links-wrapper hide above 50px via opacity/maxHeight. Modal IDs: authModal, onboardingModal, cart-overlay, reservation-modal, upgrade-modal, success-modal. Form POST /users/me: provided_information, attributes array, phone_number, date_of_birth, address_*. Filter open/close: [data-filter-open/close] toggle .filter-open on body. Escape key closes modals. Click outside (backdrop) dismisses. Post-login action replay for membership checkout. Onboarding sections: 1=welcome, 2-4=your info, 5-8=your profile.

## old/demat-webflow-test/styles.css
PURPOSE: Custom CSS: modals (auth, onboarding, cart, reservation, upgrade, success), buttons (pills, brand colors), account sidenav (sticky, gradient active, custom vars), donations page (balance card, card grid, detail modal), form resets (underline inputs, checkboxes, selects).
VUE TARGET: assets/styles/modals.css, assets/styles/cart.css, assets/styles/account-sidenav.css, assets/styles/donations.css, assets/styles/forms.css
PAGES: All pages (via HEAD link); account/donations pages use account-sidenav and donations styles
ENDPOINTS:

GLOBALS:
  - CSS vars: --nav-purple (#4b073f), --nav-purple-light (#6b1a5e), --nav-pink (#e84dd8), --nav-pink-soft (#f5c6ef), --nav-pink-glow, --nav-cyan, --nav-teal (#008ad4), --nav-white, --nav-gray-light, --nav-gray-text, --nav-gray-dark
NOTES: Brand colors: plum #4b073f, magenta #a92296, soft pink #fff4fe, charcoal #24282d. Typography: Urbanist, lowercase UI. Modal border-radius: 20-24px. Buttons: 50px pill, magenta primary, plum on hover. Form inputs: border-bottom underline, plum focus. Auth/upgrade modal z-index: 999999/10001. Onboarding: 10000. Cart: 9999. Donations: 9998-9999. Sidenav sticky top: 100px. Breakpoints: 768px (tablet), 480px (mobile). Checkboxes: 26px square, plum bg when checked. Address dropdown: 220px max-height. Animations: spin (360deg 0.8s), opacity/maxHeight 0.3s. Responsive: reduced padding/font on mobile, single-column layout.

## old/demat-webflow-test/README.md
PURPOSE: Documentation: lists JS files and purposes, provides Webflow HEAD/Footer setup (API_BASE_URL, styles.css, Auth0 SDK, dynamic script injection), explains branch strategy (main=prod, test=staging), documents [data-*] selectors and debug commands.
VUE TARGET: docs/MIGRATION.md, docs/API_SETUP.md, docs/COMPONENT_SELECTORS.md
PAGES: Reference documentation
ENDPOINTS:
  - https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js
  - https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@{branch}/{file}.js
  - https://fonts.googleapis.com/css2 (Urbanist font)
GLOBALS:
  - window.API_BASE_URL (set in HEAD)
  - window.CDN_BRANCH (main/test)
  - window.auth0Client
NOTES: jsDelivr cache auto-purged on push. Footer Code dynamically loads components.js, auth.js, site-wide-footer.js per branch. Page-specific: clothing.js, reservations.js. Data attrs: [data-auth], [data-auth-action], [data-cart-trigger], [data-cart-count], [data-membership], [data-filter-open/close], [data-item-id], [data-wishlist-id]. Debug: testAuthModal(), testCart(), testOnboardingModal(), CartManager.getCart(), debugAuth(). Prod: dematerialized.nl (main branch, api.dematerialized.nl). Test: dematerialized-24fc59.webflow.io (test branch, test-api.dematerialized.nl).

### OPEN QUESTIONS
- Can onboarding Geoapify API key be moved to secure backend config (currently hardcoded)?
- Should session cart (sessionStorage) be migrated to Pinia store or Nuxt composable state?
- How to replicate cart overflow behavior from Webflow IX2 (scroll-to-focus) in Vue?
- Membership type detection relies on membership.name string match - is this stable or should it use membership.id?
- Multi-language onboarding form labels: how should i18n translations be keyed (steps, fields, validation)?
- Should WishlistManager and CartManager be separate composables or a single useShoppingState composable?
- Profile PATCH /users/me attributes array format - is this a stable contract or should it use direct field names?
- Address autocomplete currently closes on outside click within modal - should onboarding modal trap focus/prevent dismissal?
- How should post-login membership checkout action replay be handled in Nuxt Router?
- Is there a need to preserve cart/wishlist state across session reload, or should sessionStorage approach suffice?
## Appendix H — Site-wide head/footer code audit

SUMMARY: The Dematerialized site injects 8 site-wide pieces across HEAD and FOOTER sections: (1) viewport meta, (2) Google Fonts preconnect + Urbanist font load, (3) environment/API branching logic, (4) dual GTM containers (PROD GTM-56PZW3LP + TEST GTM-556SMQSF), (5) Hotjar tracking (hjid 6427900), (6) demat-webflow custom styles from jsDelivr, (7) Meta/Facebook Pixel (pixel 1337973184818900), (8) language toggle CSS rule set (lang-en/lang-nl display). Footer loads Auth0 SPA JS from CDN, then dynamically branches and injects 3 shared demat-webflow modules (components.js, auth.js, site-wide-footer.js) from jsDelivr @test or @main, plus purchase-cart.js. GTM (noscript) fallbacks in footer. These load order: head → styles render-blocking, fonts preconnect; footer → Auth0 then demat scripts execute. The i18n system uses CSS classes + html[lang] attribute selector; window.DematI18n API lives in the demat-webflow modules. Finsweet consent is NOT present in this snippet dump (likely page-level only) — being replaced by custom Phase 2 system.

## Viewport meta tag
WHAT: Sets device viewport: width=device-width, initial-scale=1, viewport-fit=cover (iPhone notch). No target equivalent needed; Nuxt includes this by default in app.head.
NUXT TARGET: app.head (default, no action needed)

## Google Fonts preconnect + load
WHAT: Preconnect to fonts.googleapis.com and fonts.gstatic.com (crossorigin), then load Urbanist font family @300,400,500,600 weights via googleapis.com/css2. Verbatim: href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600&display=swap".
NUXT TARGET: nuxt.config app.head link array — two preconnect link entries + one font stylesheet link entry

## Environment & API branching
WHAT: JavaScript block that detects hostname (dematerialized.nl or www.dematerialized.nl = PROD; else DEV). Sets window.API_BASE_URL to https://api.dematerialized.nl (PROD) or https://test-api.dematerialized.nl (DEV). Sets window.CDN_BRANCH to 'main' (PROD) or 'test' (DEV). Logs [PROD] or [DEV] with API + CDN. This logic is critical — demat-webflow scripts check window.CDN_BRANCH to fetch jsDelivr modules from the right branch.
NUXT TARGET: plugins/env-config.ts (client plugin, runs first, populates window.API_BASE_URL and window.CDN_BRANCH)

## GTM container — PROD
WHAT: Google Tag Manager production container ID: GTM-56PZW3LP. Inline script that pushes {'gtm.start': Date.now(), event: 'gtm.js'} to window.dataLayer, creates <script> src=https://www.googletagmanager.com/gtm.js?id=GTM-56PZW3LP, appends to head. Must remain PROD ID for live site.
NUXT TARGET: plugins/gtm.ts (client plugin) or nuxt.config app.head script with inline code to conditionally load PROD ID on dematerialized.nl

## GTM container — TEST
WHAT: Google Tag Manager test container ID: GTM-556SMQSF. Inline script (same pattern as PROD) pushes to dataLayer, loads https://www.googletagmanager.com/gtm.js?id=GTM-556SMQSF. Used on Webflow staging (dematerialized-24fc59.webflow.io). Must remain TEST ID for staging.
NUXT TARGET: plugins/gtm.ts (client plugin) or nuxt.config app.head script with inline code to conditionally load TEST ID on non-prod hostnames

## Hotjar tracking
WHAT: Hotjar session recording + heatmap. Site ID (hjid): 6427900. Inline script initializes h.hj function, sets h._hjSettings={hjid:6427900, hjsv:6}, dynamically loads https://static.hotjar.com/c/hotjar-6427900.js?sv=6. No conditional branching (same ID for prod and test).
NUXT TARGET: plugins/hotjar.ts (client plugin) — inline or lazy-load the Hotjar init script

## demat-webflow custom styles
WHAT: External stylesheet: https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@main/styles.css. Loaded from @main branch (not dynamic) because CSS must load before page render. Contains all custom CSS for modals, cart, filters, etc. Supplements Webflow export CSS.
NUXT TARGET: nuxt.config app.head link — link rel="stylesheet" href pointing to the same jsDelivr @main URL, OR REPLACED-BY-NEW-WORK (if styles.css is bundled into Nuxt CSS during component port)

## Meta Pixel (Facebook / Threads tracking)
WHAT: Facebook Pixel ID: 1337973184818900. Inline script loads https://connect.facebook.net/en_US/fbevents.js, calls fbq('init', '1337973184818900'), then fbq('track', 'PageView'). Includes noscript img fallback (src=https://www.facebook.com/tr?id=1337973184818900&ev=PageView&noscript=1).
NUXT TARGET: plugins/facebook-pixel.ts (client plugin) — load the fbevents.js script and init the pixel ID

## Language toggle CSS rules
WHAT: Inline <style> block that hides/shows content based on html[lang] attribute: .lang-nl { display: none; } by default; html[lang^="nl"] .lang-en { display: none; } html[lang^="nl"] .lang-nl { display: inline; } and html[lang^="nl"] a.lang-nl { display: inline-flex; }. This CSS-based i18n approach works with the @nuxtjs/i18n module which sets html[lang] dynamically.
NUXT TARGET: REPLACED-BY-NEW-WORK (Phase 2 i18n design) — i18n module will handle html[lang] attribute; component-level en/nl visibility will use v-show/:lang conditionals or i18n $t() instead of CSS classes

## Auth0 SPA JS SDK
WHAT: External script: https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js. Loads the Auth0 Single-Page Application JavaScript SDK v2.0. No inline initialization here; auth.js (loaded after this) calls Auth0 SDK to create the client. This script must load before auth.js.
NUXT TARGET: plugins/auth0.ts (client plugin, load before demat-webflow modules) — import @auth0/auth0-spa-js and initialize the Auth0 client, OR use @nuxtjs/auth0 if available

## demat-webflow components.js
WHAT: jsDelivr dynamic load: https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<BRANCH>/components.js where BRANCH = window.CDN_BRANCH ('main' or 'test'). Injects shared HTML for modals (cart, reservation, upgrade, etc.). Runs after Auth0 SDK. Must execute before auth.js and site-wide-footer.js so they can reference the injected elements.
NUXT TARGET: REPLACED-BY-NEW-WORK — components.js logic + HTML injections become Vue modal components (CartModal.vue, ReservationModal.vue, UpgradeModal.vue, etc.) in pages/components/

## demat-webflow auth.js
WHAT: jsDelivr dynamic load: https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<BRANCH>/auth.js. Auth0 authentication + onboarding logic. Runs after components.js. Sets up Auth0 client initialization, login/logout/signup flows, onboarding modal show/hide. Attaches event listeners to [data-auth-action] elements (login, logout, signup).
NUXT TARGET: REPLACED-BY-NEW-WORK — auth.js becomes composable + pages/account/login.vue, signup.vue, onboarding modal components. Auth0 init logic moves to plugins/auth0.ts

## demat-webflow site-wide-footer.js
WHAT: jsDelivr fixed commit hash load: https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@686173fd6d08ad994dac4a03ee47d6a41ae81128/site-wide-footer.js. Cart, reservations, membership handlers loaded site-wide. Note: this uses a pinned commit, not @main or @test branch. Must run after auth.js. Contains window.CartManager API + membership flow logic.
NUXT TARGET: REPLACED-BY-NEW-WORK — site-wide-footer.js logic becomes composables (useCart, useMembership, useReservations) + layout components. CartManager becomes a Pinia store

## demat-webflow purchase-cart.js
WHAT: jsDelivr dynamic load: https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<BRANCH>/purchase-cart.js. Cart + Stripe checkout logic. Runs after site-wide-footer.js. Handles cart item add/remove, Stripe integration, checkout flow.
NUXT TARGET: REPLACED-BY-NEW-WORK — purchase-cart.js becomes composable + pages/checkout.vue. Stripe integration logic moves to composables/useStripe.ts

## GTM (noscript) — PROD
WHAT: Fallback for users with JavaScript disabled. noscript iframe src="https://www.googletagmanager.com/ns.html?id=GTM-56PZW3LP" height="0" width="0" style="display:none;visibility:hidden". Preserves PROD analytics for no-JS users.
NUXT TARGET: nuxt.config app.head noscript entry or app.vue template — keep the noscript iframe for GTM-56PZW3LP

## GTM (noscript) — TEST
WHAT: Fallback for users with JavaScript disabled on test/staging. noscript iframe src="https://www.googletagmanager.com/ns.html?id=GTM-556SMQSF" height="0" width="0" style="display:none;visibility:hidden". Preserves TEST analytics for no-JS users on non-prod hostnames.
NUXT TARGET: nuxt.config app.head noscript entry or app.vue template — keep the noscript iframe for GTM-556SMQSF (conditional on non-prod hostname)

### OPEN QUESTIONS
- Finsweet cookie consent: NOT found in site_head_code_webflow_test.txt or site_footer_code_webflow_test.txt. Is Finsweet Consent being used at all on the live site, or is it already page-level only? The rules state it is being REPLACED by a custom Phase 2 system, so clarify the current state.
- Auth0 configuration: The auth.js file loads the Auth0 SPA SDK but the nuxt.config needs Auth0 domain + clientId to initialize. Where is that config stored today (Auth0 app settings, Webflow custom code, environment variable)?
- Site-wide-footer.js commit hash: Why is site-wide-footer.js pinned to a specific commit (686173fd6d08ad994dac4a03ee47d6a41ae81128) instead of @main or @test? Is this intentional versioning or a deployment artifact? Should this be branches or commits in Nuxt?
- Stripe and MyParcel: These integrations are touched by purchase-cart.js and site-wide-footer.js. What are the API keys/config sources for Stripe and MyParcel integration?
- Window.DematI18n: The custom i18n logic lives in components.js and other demat-webflow files. What does the window.DematI18n API expose, and how does it coordinate with the html[lang] attribute switching?
## Appendix I — Stylesheet audit (5 sheets, fonts, tokens, url() assets, breakpoints)

STRATEGY: Load all five stylesheets verbatim into Nuxt global CSS with sequential load order: (1) normalize.css (reset), (2) webflow.css (Webflow framework + w-* utilities), (3) dematerialized-24fc59.webflow.css (main project styles), (4) styles.css (custom embed styling), (5) my-account.css + sidenav (account-area styling). Do NOT scope or modularize—replicate the Webflow export one-to-one. Load fonts (Urbanist, PT Serif, Montserrat, Playfair Display via Google Fonts CDN) in Nuxt's app.vue or global layout; font injection via WebFont loader and direct CSS link tags from index.html. Remove Webflow-specific selectors that target Webflow runtime ([data-w-cloak], html.w-mod-*, .w-webflow-badge, [data-w-dynpage])—they have no target in Nuxt and can be safely omitted. Retain all .w-* utility classes (they are CSS-only, no JS dependency). Serve all image assets (248 files) from public/images/ with paths rewritten from ../images/ to /images/. Account for two asset sources: (a) relative ../images/ references in CSS, (b) external data: URL in webflow-icons @font-face (base64-encoded icon font; safe to keep inline). Include CSS variables (--nav-* in sidenav) as-is. All five stylesheets are safe for a faithful port with no modifications except Webflow-specific selector removal.

TOKENS: Validated brand tokens found: plum (#4B073F) appears in dematerialized-24fc59.webflow.css (line 7858, 7985, 8001+) and extensively in styles.css (lines 82, 205, 251, 253, 277, 381, 394, 461, 487, 506, 517, 568, 647, 707-712, 1060, 1184, 1403, 1449, 1528, 1587, 1628 as --nav-purple, 1828, 1941, 1982, 1998, 2043, 2132, 2160, 2316, 2406, 2501, 2627, 2685, 2694, 2745, 2843). Magenta (#A92296) in dematerialized-24fc59.webflow.css (lines 2039, 2379, 2537, 2764, 3649, 3917, 4275, 5157, 8001-8085+) and styles.css (lines 82, 499, 517, 1433, 1594, 2012, 2054, 2172, 2414, 2708, 2756, 2855, 3063, 3627). Charcoal (#24282d) used extensively in both files for text color and borders. Soft pink (#fff4fe) appears as background in dematerialized-24fc59.webflow.css (lines 1129, 2638, 2871, 3965, 4237, 4320). CSS variables: --nav-purple (#4b073f), --nav-purple-light (#6b1a5e), --nav-pink (#e84dd8), --nav-pink-soft (#f5c6ef), --nav-pink-glow (rgba(232, 77, 216, 0.08)), --nav-cyan (#2cc4ff), --nav-teal (#008ad4), --nav-white (#ffffff), --nav-gray-light (#f8f5f7), --nav-gray-text (#6b6b6b), --nav-gray-dark (#2a2a2a) defined in styles.css line 1627–1638 and sidenav line 8–20. Border radius: 20px used for images throughout (lines 453, 1130, 1196, 1422, 1546, 1837, 2092, 2562, 2627, 2771, etc.); 50px used for pills/buttons (lines 533, 2032, 3918). Text transform: lowercase applied to UI copy in paragraph-primary classes (line 144). All tokens validated and present.

BREAKPOINTS: Mobile-first cascade: 479px (max-width, mobile/small phone), 480px (max-width, alternate small phone), 600px (max-width, mobile variant in styles.css), 767px (max-width, tablet edge), 768px (max-width, tablet/small laptop in my-account.css and sidenav), 991px (max-width, desktop edge), 1440px (min-width, large desktop). Primary Webflow breakpoints: 1440px (desktop+), 992px–1439px (desktop), 768px–991px (tablet), 480px–767px (mobile), <480px (small mobile). Nuxt should preserve all @media queries verbatim for responsive CSS fidelity.

FONTS:
- Urbanist: Google Fonts (https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500)
- PT Serif: Google Fonts (via WebFont.load in index.html: family=[PT Serif:400,400italic,700,700italic])
- Montserrat: Google Fonts (via WebFont.load in index.html: family=[Montserrat:100-900 weights])
- Playfair Display: Google Fonts (via WebFont.load in index.html: family=[Playfair Display:300,400,500,600,700])
- webflow-icons: Inline @font-face in webflow.css using base64-encoded TTF (data: URI; no external file needed)

URL ASSETS:
- /images/IMG_8832.jpeg
- /images/_DSF5127-1.png
- /images/a-f-ZmoQ3w2uW6I-unsplash-_1_.webp
- /images/about-us-scrapbook.png
- /images/about-us-the-problems.webp
- /images/about-us-the-realization.webp
- /images/british_flag.png
- /images/come-visit-us-1.webp
- /images/donate-clothes.webp
- /images/donations-how-it-works.png
- /images/hiw-buyers-remorse-1.png
- /images/home-sweater-weather.webp
- /images/ig-story_large_2.png
- /images/lange-putstraat-4.webp
- /images/layers-on-layers-home.webp
- /images/mathilde-langevin-VGwcXqe31Jg-unsplash.jpg
- /images/nl_flag.png
- /images/not-member-donations.png
- /images/np_circle_2713168_FFFFFF.svg
- /images/ramses-cervantes-K_aJJO9HDbQ-unsplash.webp
- /images/search-3.png
- /images/seasonal_menu.png
- /images/shop_bags.png
- /images/shop_by.png
- /images/shop_clothing.png
- /images/shop_new_in.png
- /images/shop_shoes.png
- /images/statement-coat-home.webp
- /images/summerjackets.png
- /images/what-we-do-with-rest.png
- /images/what-you-earn.png
- /images/why-we-do-it-donations.webp
- Note: Complete list of 248 image assets in /Users/courtneyyocabet/webflow-migration/old/dematerialized-24fc59.webflow (2)/images/; all referenced via ../images/ relative paths in CSS (must rewrite to /images/ in Nuxt). External CDN asset: https://d3e54v103j8qbb.cloudfront.net/static/custom-checkbox-checkmark.589d534424.svg (Webflow hosting; required for custom checkbox checked state in dematerialized-24fc59.webflow.css line 42). Base64 data: URI for webflow-icons font in webflow.css line 3 (no external file).

### OPEN QUESTIONS
- Webflow-specific selectors: Confirm that .w-webflow-badge, html.w-mod-*, html.w-mod-js, [data-w-cloak], [data-w-dynpage] can be safely removed from webflow.css (lines 116-190, 101-102). These target Webflow runtime or marketing badge; no Nuxt equivalent needed.
- Custom checkbox external asset: The checked-state SVG at https://d3e54v103j8qbb.cloudfront.net/static/custom-checkbox-checkmark.589d534424.svg (dematerialized-24fc59.webflow.css line 42) is hosted on Webflow's CDN. Should this be re-hosted locally in public/, or is a CDN request acceptable in production?
- Font injection mechanism: Webflow index.html loads fonts via (1) WebFont.load() script, (2) direct <link> tags to fonts.googleapis.com/css2. Confirm Nuxt strategy: load fonts via nuxt.config.ts/app.vue <link> tags, or use @nuxtjs/google-fonts plugin?
- Image path rewriting: CSS url('../images/...') paths must rewrite to url('/images/...') for Nuxt public/ dir. Confirm this is done at build time (e.g., Vite CSS processing) or via manual stylesheet updates.
- Webflow .w-* utilities (non-Webflow-badge): Classes like .w-block, .w-inline-block, .w-clearfix, .w-button, .w-checkbox, .w-video are CSS-only framework helpers (webflow.css lines 65–303+). Confirm these are retained as-is—they have no JS dependency and no Nuxt equivalent.
- Load-order dependency: styles.css and my-account.css depend on webflow.css and dematerialized-24fc59.webflow.css for :root variables (--nav-*) and base component classes. Confirm five-stylesheet load sequence is fixed: normalize → webflow → dematerialized-24fc59 → styles → my-account/sidenav.
- Browser support for CSS variables: --nav-* variables in sidenav/styles.css target modern browsers (CSS Variables = IE 11+). Confirm Nuxt target browsers match (likely excludes IE 11).
- [v-cloak] directive: my-account.css line 6 uses [v-cloak] { display: none } for Vue 2 templating. Confirm this still works in Nuxt 3 / Vue 3 SFC setup, or if it needs conversion to :cloak or similar.
## Appendix J — Blog & authors CMS fields + Phase 6 model proposal

## BLOG FIELDS
- title (String(500)): Required. Post headline; displayed in blog lists and detail page.
- slug (String(255)): Required. URL-safe identifier; unique per locale (EN and NL each get their own slug). Example: 'sustainable-fashion-2024' (EN), 'duurzame-mode-2024' (NL).
- post_body (Text): Required. Full post content in HTML. Localized per record (EN post_body differs from NL post_body).
- post_summary (String(500)): Required. Short excerpt for blog lists and meta description. Localized per record.
- main_image (String(255)): Optional. URL or filename of hero image for the blog post detail page.
- thumbnail_image (String(255)): Optional. URL or filename of thumbnail for blog list cards.
- date (DateTime): Required. Publication/creation date. Shared across locales (same date for EN and NL versions).
- authors (Relationship (M2M with Author)): Many-to-many. A post can have multiple authors. Foreign key references author.id (locale-aware: query filters both locale and author locale together).
- locale (Enum('en', 'nl')): Required. Language marker. Webflow stores EN and NL posts as separate records; this field indicates which variant it is.
- sitemap_indexing (Boolean): Optional, default True. Controls whether this post appears in XML sitemap (SEO).
- blog_id (String(100)): Webflow's internal CMS ID for the collection item. Useful for migration tracking and external references.
- blog_created (DateTime): Timestamp when the post was first created in Webflow.
- last_edited (DateTime): Timestamp of last modification.
- last_published (DateTime): Timestamp when the post was last published (used to distinguish drafts from live posts).

## AUTHOR FIELDS
- name (String(255)): Required. Author's display name. Localized per record if authors are translated (e.g., different bios per language).
- slug (String(255)): Required. URL-safe identifier; unique per locale (EN and NL each have their own slug, e.g., 'jane-doe' vs 'jane-doe'—same name, separate records if bios differ by locale).
- bio (Text): Required. Full biography. Localized per record (EN bio differs from NL bio for the same author).
- bio_summary (String(500)): Required. Short excerpt of bio for author cards and lists. Localized per record.
- picture (String(255)): Optional. URL or filename of author's profile picture. Shared across locales (same image).
- email (String(255)): Optional. Author's contact email. Shared across locales (same email).
- locale (Enum('en', 'nl')): Required (implicit in Webflow, explicit in DB). Marks which language variant this author record is. Allows different bio translations per locale.

## MODEL PROPOSAL
## SQLAlchemy Blog + Author Models (FastAPI Backend)

**Architecture**: Dual-record-per-locale (content duplication), NOT a translation table. Each `BlogPost` and `Author` record explicitly stores a `locale` field ('en' or 'nl'). This mirrors Webflow's structure and avoids translation-table lookup overhead for a small, stable locale set.

### Models

```python
# app/db/models.py (additions to existing file)

from enum import Enum as PyEnum
from sqlalchemy import Enum as SqlEnum

class LocaleEnum(PyEnum):
    """Supported locales."""
    EN = 'en'
    NL = 'nl'


# Association table for blog_post <-> author M2M relationship
blog_post_authors = Table(
    "blog_post_authors",
    Base.metadata,
    Column("blog_post_id", Integer, ForeignKey("demat_schema.blog_post.id"), primary_key=True),
    Column("author_id", Integer, ForeignKey("demat_schema.author.id"), primary_key=True),
    Column("started_at", DateTime, default=datetime.now, nullable=False),
    Column("updated_at", DateTime, default=datetime.now, onupdate=datetime.now, nullable=False),
    extend_existing=True,
)


class Author(Base, DbMixin):
    """Blog post authors. One record per locale (EN and NL separate)."""
    __tablename__ = "author"
    
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)  # URL-safe; unique per locale
    bio = Column(Text, nullable=False)  # Localized content
    bio_summary = Column(String(500), nullable=False)  # Localized excerpt
    picture = Column(String(255), nullable=True)  # Shared across locales
    email = Column(String(255), nullable=True)
    
    locale = Column(SqlEnum(LocaleEnum), nullable=False, default=LocaleEnum.EN, index=True)  # 'en' or 'nl'
    webflow_author_id = Column(String(100), nullable=True)  # Webflow collection item ID
    
    # Relationships
    blog_posts = relationship("BlogPost", secondary=blog_post_authors, back_populates="authors")
    
    __table_args__ = (
        UniqueConstraint("slug", "locale", name="uq_author_slug_locale"),
    )


class BlogPost(Base, DbMixin):
    """Blog posts. One record per locale (EN and NL separate)."""
    __tablename__ = "blog_post"
    
    title = Column(String(500), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)  # URL-safe; unique per locale
    post_body = Column(Text, nullable=False)  # Localized HTML content
    post_summary = Column(String(500), nullable=False)  # Localized excerpt
    
    main_image = Column(String(255), nullable=True)  # URL/filename; shared across locales
    thumbnail_image = Column(String(255), nullable=True)  # URL/filename; shared across locales
    
    date = Column(DateTime, nullable=False, index=True)  # Publication date; shared across locales
    locale = Column(SqlEnum(LocaleEnum), nullable=False, default=LocaleEnum.EN, index=True)  # 'en' or 'nl'
    
    # SEO & metadata
    sitemap_indexing = Column(Boolean, default=True, nullable=False)
    webflow_blog_id = Column(String(100), nullable=True)  # Webflow collection item ID
    webflow_created = Column(DateTime, nullable=True)  # When created in Webflow
    last_published = Column(DateTime, nullable=True)  # When last published in Webflow
    
    # Relationships
    authors = relationship("Author", secondary=blog_post_authors, back_populates="blog_posts")
    
    __table_args__ = (
        UniqueConstraint("slug", "locale", name="uq_blog_post_slug_locale"),
    )
```

### Key Design Decisions

1. **Locale-aware queries**: Every fetch of a `BlogPost` or `Author` must filter by locale in the route/service layer:
   ```python
   # Example query in a route
   post = session.query(BlogPost).filter(
       BlogPost.slug == slug,
       BlogPost.locale == LocaleEnum.EN
   ).first()
   ```

2. **M2M relationship**: `BlogPost.authors` is a many-to-many via `blog_post_authors` table. When fetching a post, authors are eagerly or lazily loaded.

3. **Shared vs. localized fields**:
   - **Shared across locales** (same for EN and NL): `main_image`, `thumbnail_image`, `date`, `picture`, `email`
   - **Localized** (different per locale): `title`, `slug`, `post_body`, `post_summary`, `bio`, `bio_summary`, `name`

4. **Unique constraints**: `(slug, locale)` composite unique index ensures no duplicate slugs within a locale, but allows the same slug translated across locales.

5. **Timestamps**: Inherits `started_at`, `updated_at`, `ended_at`, `active`, `id`, `hash_id` from `DbMixin` (consistent with existing models).

6. **Webflow tracking**: `webflow_blog_id`, `webflow_created`, `last_published`, `webflow_author_id` preserve Webflow metadata for migration auditing and sync workflows.

### Why not a translation table?

A translation table (storing translations separately) would require JOINs on every query and add complexity for a small, stable locale set (EN + NL only, room to add more). The dual-record model is simpler: each record is self-contained, locale filtering is explicit, and the schema mirrors Webflow's native structure.

### OPEN QUESTIONS
- Should author names also be localized, or kept identical across EN/NL? The Webflow field list does not indicate a 'name_en'/'name_nl' split, suggesting names are shared. Confirm whether author bios alone are localized, or if names too should vary by language.
- Does the FastAPI backend need a separate 'published' boolean flag, or is 'last_published' datetime sufficient to determine draft vs. live state? (Webflow CMS tracks last_published; should the DB also track publish state explicitly?)
- Should blog posts support soft-delete (like ClothingItem.active flag in DbMixin), or hard-delete only? CMS soft-delete is useful for unpublishing without losing history.
- Do you plan to implement a search/filtering API for blog posts? If so, should we add a 'featured' boolean or 'category' enum to support future filtering by featured posts or categories?
- For the M2M blog_post_authors relationship: should author order matter (e.g., primary author vs. co-authors)? If so, consider adding an 'author_order' column to the association table.
- Are there image asset management needs beyond storing filename/URL? (e.g., alt text, image sizing, CDN URLs) — if so, should blog images be modeled as a separate entity like ImageRecord (used for ClothingItem) or kept simple as URL strings?