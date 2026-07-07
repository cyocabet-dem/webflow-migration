---
name: webflow-parity-reference
description: Domain reference for how the OLD Webflow site worked and what "parity" means in this migration. Load when you need to answer "what did the old site do?", when reading anything under old/ (the Webflow export, demat-webflow-test embed JS, fallback_code .txt snippets, nl-reference NL captures), when someone mentions Webflow, IX2, data-w-id, jsDelivr, Finsweet, w-dyn-list, .w-* classes, or lang-en/lang-nl spans, when judging whether a difference from the old site is a bug or a sanctioned deviation, or when deciding which old file is the source of truth for a page's layout vs behavior vs head code.
---

# Webflow parity reference — how the old site worked, and what "parity" means here

**What this covers:** the anatomy of `old/` (read-only source of truth), Webflow concepts a Nuxt engineer won't know (IX2, jsDelivr embeds, CMS collections, Finsweet), the embed-file → Nuxt-target map, the operational definition of parity including deliberately-kept old bugs, the sanctioned-deviations list, and the step-by-step method for answering "what did the old site do?".
**When to use:** any task that touches `old/` or `nl-reference/`, any fidelity question ("is this a regression or was it always like that?"), any port-review or copy dispute.
**When NOT to use:** how the *new* Nuxt app is wired (→ `demat-architecture-contract`); whether a deviation may be *changed* (→ `demat-change-control` — nothing here authorizes edits); operating consent/i18n (→ `demat-i18n-and-consent`); triaging a live symptom (→ `demat-debugging-playbook`).

---

## 1. What Webflow was for this site

Webflow is a hosted visual site builder: it stores pages as a visual design, publishes them as static HTML/CSS plus a JS runtime, and hosts them. Dematerialized's live site (dematerialized.nl) was built there, with three layers stacked on top:

| Layer | What it did | Fate in the migration |
|---|---|---|
| **Webflow-generated HTML/CSS** | Layout, styling, copy for every page | Source of truth for layout/design; ported verbatim into Nuxt pages + global CSS |
| **Webflow runtime** (`js/webflow.js` + jQuery, **IX2**) | Animations, dropdowns, sliders, badge injection | **Dropped entirely** — functional interactions reproduced natively in Vue; decorative ones dropped |
| **Custom embed code** loaded at runtime via **jsDelivr** from the GitHub repo `cyocabet-dem/demat-webflow` | ALL real behavior: Auth0, carts, wishlist, catalog, PDP, Stripe | Source of truth for behavior; every file ported to a Nuxt plugin/composable/page (§3) |

Plus paid third-party tooling the migration was explicitly allowed to *replace* (the only sanctioned new engineering):
- **Finsweet ConsentPro** (paid cookie-consent widget, `api.consentpro.com` script, 4 categories: essentials/marketing/personalization/analytics) → replaced by the custom consent system (`app/composables/useConsent.ts` + `app/components/consent/`).
- **Webflow localization** (paid EN/NL feature) + a CSS toggle hack (`.lang-en`/`.lang-nl` spans) + `window.DematI18n` → replaced by `@nuxtjs/i18n` (`/` = EN, `/nl/…` = NL).

**Jargon:**
- **IX2** = "Interactions 2.0", Webflow's animation/interaction engine inside `webflow.js`. It binds to elements via `data-w-id="<guid>"` attributes in the HTML (e.g. 12 occurrences in the old `index.html`). The runtime was NOT ported — when you see `data-w-id` in old HTML, the attribute is an IX2 hook, and the Phase 1 audit classified each such interaction **FUNCTIONAL** (reproduced in Vue: accordions, dropdowns, sliders, modals) or **DECORATIVE** (dropped, possibly replaced with CSS).
- **jsDelivr pin** = a CDN URL of the form `cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<ref>/<file>` where `<ref>` is a branch (`@main`, `@test`) or a full commit SHA. SHA pins froze a file at an exact commit; branch refs tracked the branch (with jsDelivr caching, purged by a `.github/purge-cdn.yml` CI job — also retired).
- **w-dyn-list** = Webflow CMS collection list markup. Webflow's CMS held the blog; see §6.
- **Parity** = the governing doctrine: same layout, styling, copy, URLs, and behavior as the old site — *including its bugs* unless a deviation is explicitly sanctioned (§7).

## 2. Anatomy of `old/` (READ-ONLY — never edit anything in it)

```
old/
├── CLAUDE.md                              # folder map + reading rules
├── dematerialized-24fc59.webflow (2)/     # the Webflow STATIC EXPORT — layout & design truth
│   ├── *.html                             # 35 page files (see §8 for the page→route map)
│   ├── css/                               # 3 sheets: normalize.css, webflow.css,
│   │                                      #   dematerialized-24fc59.webflow.css
│   ├── js/webflow.js                      # the IX2 runtime (minified) — DROPPED, read only to
│   │                                      #   understand a specific old interaction
│   ├── images/                            # 248 files — NEVER content-scan; copied as-is
│   └── videos/                            # 16 files  — NEVER content-scan; copied as-is
├── demat-webflow-test/                    # local copy of cyocabet-dem/demat-webflow — BEHAVIOR truth
│   │                                      # (production embed code, despite "test" in the name)
│   ├── auth.js  components.js  site-wide-footer.js  purchase-cart.js
│   ├── clothing.js  pdp.js  purchases.js  rentals.js  reservations.js
│   ├── donations.js  profile.js  account-app.js (dead code)
│   ├── styles.css  my-account.css  sidenav   # "sidenav" has no extension but IS plain CSS
│   └── README.md  CLAUDE.md
├── fallback_code/                         # Webflow-injected head/body code + CMS field defs (§4)
└── (sibling at repo root) nl-reference/   # 17 live NL page captures + live-sitemap.xml (§9)
```

Notes that trip people up:
- The export folder name literally contains ` (2)` and a space — quote the path in shell commands.
- `demat-webflow-test/` is **production** code. The `@test` in jsDelivr refs is a *branch name*, not an environment.
- `old/demat-webflow-test/sidenav` is CSS despite having no extension (`file` misidentifies it); it became `app/assets/css/5-sidenav.css` byte-identical.
- The export CSS became `app/assets/css/0-normalize.css` / `1-webflow.css` (both byte-identical to the export) and `2-dematerialized.webflow.css` (identical except ~47 `url()` rewrite lines: `../images/…` → `/images/…` plus one cloudfront checkbox SVG re-hosted at `/images/custom-checkbox-checkmark.svg`). `styles.css` → `3-demat-custom.css` byte-identical.

## 3. The jsDelivr embed system — file-by-file map to Nuxt

The Webflow pages loaded behavior at runtime with `<script src="https://cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<ref>/<file>">` tags (plus one `<link>` for `styles.css`). Load order on the old pages was components.js → auth.js → site-wide-footer.js → purchase-cart.js → page-specific script; in Nuxt this dissolves into plugin/composable init order. All jsDelivr tags are retired.

Pins below are read directly from the old export HTML (verified 2026-07-07):

| Embed file (jsDelivr ref in the export HTML) | Loaded on | Nuxt target (actual file names) |
|---|---|---|
| `styles.css` (`@main`) | every page | `app/assets/css/3-demat-custom.css` |
| `auth.js` (`@test`) | every page | `app/plugins/auth0.client.ts` + `app/composables/useAuth.ts` |
| `components.js` (`@test`) | every page | cart/onboarding modal components (`app/components/cart/*`, `OnboardingModal.vue`) + `app/composables/useWishlistManager.ts` |
| `site-wide-footer.js` (`@686173fd6d08ad994dac4a03ee47d6a41ae81128`) | every page | `app/composables/useCartManager.ts` (reservation cart), `useUserMembership.ts`, `useMembershipCheckout.ts`, `app/plugins/reservation-cart.client.ts`; its `DematI18n` → `@nuxtjs/i18n` |
| `purchase-cart.js` (`@test`) | every page | `app/composables/usePurchaseCart.ts` + `app/plugins/purchase-cart.client.ts` + `cart/PurchaseCartPanel.vue`/`CheckoutModal.vue` |
| `clothing.js` (`@570ca6d1ee9d63b50317cf656221c53742761957`) | clothing.html | `app/pages/clothing.vue` + `app/composables/useCatalog.ts` |
| `pdp.js` (`@3b440d42fa9cc8f9d076aa44b30d043e15bf66d1`) | product.html | `app/pages/product.vue` (+ `useCatalogCache.ts` for related items) |
| `rentals.js` (`@a957a4f343199d1bff2b115b7328392d4f6d0c7c`) | my-rentals.html | `app/pages/my-rentals.vue` |
| `reservations.js` (`@ea1b25a926b5a13ca59f11dcbd453ddc1f222d23`) | reservations.html | `app/pages/reservations.vue` |
| `purchases.js` (`@a407690671b560cd015e26dc5b1e4b5591e710b0`) | purchases.html | `app/pages/purchases.vue` |
| `donations.js` (`@08e28495d3a65cb05efa15d0bf0b45632e2b03b8`) | donations-credits.html | `app/pages/donations-credits.vue` |
| `profile.js` (`@test`) | profile.html | `app/pages/profile.vue` |
| `account-app.js` | never mounted | **skipped — dead code** (Vue 2 hash-tab app; account.html never mounts it) |
| `my-account.css` | nothing references it | copied to `app/assets/css/4-my-account.css` but **deliberately NOT loaded** (its generic selectors — `.reservation-card`, `.btn-primary`… — collided with the live design; caused a real squashed-card incident) |
| `sidenav` | account pages (head `<style>`) | `app/assets/css/5-sidenav.css` |
| `README.md`, `.github/purge-cdn.yml` | — | not migrated (jsDelivr delivery retired) |

⚠️ **Known erratum in migration-map.md §2**: its table lists `rentals.js (pinned ea1b25a9)` and `reservations.js (pinned a957a4f3)` — those two pins are **swapped** relative to the actual export HTML (verified above). Trust the HTML.

Note: `migration-map.md` §2 also names planned composables that got different final names (`useWishlist` → actual `useWishlistManager.ts`, `useCatalogFilters` → actual `useCatalog.ts`, `useMembership` → actual `useUserMembership.ts`). The table above uses the names that exist on disk.

## 4. `fallback_code/` — the Webflow-injected `.txt` snippets

Webflow lets you paste custom code into "Site Settings → Head/Footer Code" and per-page "Page Settings → Head/Body Code". That injected code is NOT in the static export HTML in editable form, so it was captured as `.txt` files:

- **Site-wide:** `site_head_code_webflow_test.txt`, `site_footer_code_webflow_test.txt` — GTM/Hotjar/Meta Pixel bootstraps, API-base hostname sniffing, jsDelivr `styles.css` link, Finsweet consent, auth-modal/cart/join-now code embeds.
- **Per-page head/body/JSON-LD** for: homepage, clothing (incl. `clothing_page_JSON-LD_code.txt`), product, how-it-works, mailing-list, account, profile, my-rentals (incl. JSON-LD), purchases, reservations, donations-credits, wish-list.
- **CMS field definitions** (used to design the Phase 6 blog model): `webflow-blog-fields.txt`, `webflow-authors-fields.txt`.

**When to open one:** only when the task needs that exact snippet — e.g. verifying a page's verbatim JSON-LD, checking what the old head really injected, or re-deriving the blog field list. Never bulk-read the folder. The page HTML already inlines most of what matters (the exported pages contain the injected code baked in), so a `.txt` is your check when the HTML is ambiguous or you need the canonical Webflow-side version.

## 5. Scanning-rules digest (from `migration-scanning-rules.md` — binding)

1. **`old/` is read-only.** Source of truth; never edit it.
2. **Never content-scan `images/` or `videos/`.** `ls` for filenames only; assets were copied as-is to `app/public/images/` and `app/public/videos/` with filenames preserved.
3. **HTML and CSS are the layout/design source of truth; `demat-webflow-test/` is the behavior source of truth.** Read those first, in full, when porting or verifying.
4. **`.txt` files on demand only** — the specific snippet the current task needs.
5. **Read `js/webflow.js` only to reproduce a specific interaction** — it's a minified runtime, not documentation.
6. **Migrate, don't rebuild.** Anything beyond a faithful reproduction (plus consent + i18n) is out of scope — stop and ask (→ `demat-change-control`).

## 6. Webflow CMS (`w-dyn-list`) → what happened to it

Webflow's CMS held the **blog** (collections "Blog Posts" and "Authors"). In export HTML, CMS-driven lists appear as `w-dyn-list` / `w-dyn-items` markup (e.g. one `w-dyn-list` in `also-this.html`) and the collection *templates* as `detail_blog.html` / `detail_author.html` / `detail_items.html`.

- **Phase 6 moved the blog to the database/API**: `BlogPost`/`Author` models in demat-backend (PR #46, branch `claude/blog-models`), public `GET /blogs` + `GET /blogs/{slug}`, content scraped from live Webflow into `app/data/blog.json` (7 posts EN, 1 with a real NL variant) which doubles as seed data and the frontend's silent offline fallback (`app/composables/useBlogPosts.ts`).
- `detail_blog.html` → `app/pages/blog/[slug].vue` (live URL pattern `/blog/{slug}` confirmed against production).
- `detail_author.html` → an `/authors/[slug]` page was *planned* in the Phase 1 map but **was not built** — no author page exists in `app/pages/`, and neither the live Webflow sitemap nor the app sitemap contains any author URL. Treat as intentionally dropped-by-outcome; building it would be new scope.
- `detail_items.html` (CMS product template), `search.html` (unused Webflow search stub), `401.html` (Webflow password-page machinery) → **dropped as unused**; the real PDP is `/product?sku=` driven by the API.

## 7. What "parity" means operationally

Parity = a user or crawler cannot tell the Nuxt site from the Webflow site: same layout, copy (verbatim, including casing), URLs (extensionless paths replacing `.html`, `/product?sku=` kept as a query param, catalog's repeated query params `?categories=a&categories=b` kept), SEO heads (diffed verbatim), and behavior — **including old bugs, kept deliberately**:

### Old bugs kept on purpose (do NOT "fix" without approval — see `demat-change-control`)
| Kept bug | Where | Old-site origin |
|---|---|---|
| **Escape does not close the cart overlay** (it does close the upgrade/reservation modals) | `app/plugins/reservation-cart.client.ts` keydown handler (comment at ~line 246) | old code's cart-overlay branch checked an inline transform that was never set, so Escape never fired |
| **PDP "cart full" copy says "up to 10 items" while the real cap is 5** | `app/pages/product.vue:56` (`cartFullAlert`, EN+NL) vs `MAX_ITEMS: 5` in `app/composables/useCartManager.ts:51` | verbatim port: `old/demat-webflow-test/pdp.js:145` says 10, `site-wide-footer.js:301` has `MAX_ITEMS: 5` — the mismatch existed on the live site. **Status change (Courtney, 2026-07-07): CONFIRMED BUG, APPROVED TO FIX** — a sanctioned deviation from verbatim copy. When fixed, log it in migration-map.md's "# Implementation log" section. |
| **PDPs are `robots: noindex` with static og:title "Product"** | `app/pages/product.vue` head | faithful port of the old product template head — looks like a bug, isn't |
| **donation-store-credit-policy meta description copy-pasted from T&C** | ported verbatim | old-site content bug, flagged as open question in migration-map §8 |

### Sanctioned deviations (approved, already in place — the *only* allowed differences)
Per migration-map §7 ("Dropped Webflow machinery") plus Phase 2/5 log entries:
1. **Dropped runtime machinery**: `webflow.js`/jQuery/IX2 + decorative animations, Webflow localization plumbing, jsDelivr delivery + CDN purge CI, Finsweet cmsslider, the Webflow form handler (one form per purpose survives, wired to the backend), `401.html`, `search.html`, `detail_items.html`, `account-app.js`, legacy duplicate Webflow forms.
2. **Consent**: custom system replacing Finsweet ConsentPro (same 4 categories, same gating intent).
3. **i18n**: `@nuxtjs/i18n` replacing Webflow localization; the verbatim `.lang-en`/`.lang-nl` span+CSS bridge is kept transitionally (`app/assets/css/6-lang-toggle.css`).
4. **og:image re-hosting**: 10 meta images moved off Webflow's CDN to `app/public/images/meta/` with absolute `https://dematerialized.nl/...` URLs (zero Webflow-CDN dependencies remain).
5. **`4-my-account.css` excluded from the CSS bundle** (dead `account-app.js` styling whose generic selectors broke live pages; file kept on disk, never loaded).
6. **New auth-gate CSS** (`7-auth-gate.css`, `html.auth-pending [data-auth-gate]`) — fixes the old site's flash of wrong-state UI; an approved improvement, not a parity break.
7. (Post-migration, 2026-07-07) `8-native-app.css` + Capacitor shells — scoped to `body.native-app`, inert in browsers, so browser parity is preserved by construction.

### Accepted/deferred divergences (known, do NOT change without Courtney's approval)
As of 2026-07-07: the `/account` page's dead local `isAuthenticated` ref (sign-out unreachable on mobile `/account`); Google Fonts loading unconditionally (not consent-gated); the app sitemap emitting a 7th blog post (`you-own-way-more-clothes-than-you-wear-…`) that the live Webflow sitemap (6 blog URLs, archived at `nl-reference/live-sitemap.xml`) lacked.

### The `.w-*` CSS nuance
`.w-*` utility classes (`w-container`, `w-form`, `w-dyn-list`, …) were **kept** — all ported markup depends on them. The plan said to *strip* `.w-webflow-badge`/`html.w-mod-*`/`[data-w-cloak]` selectors, but in practice `1-webflow.css` is byte-identical to the old `webflow.css` and still contains them (e.g. `.w-webflow-badge` at lines 116-117, 165, 191; one `w-mod-` selector). They are **inert, not deleted**: the runtime that injected the badge element and set `w-mod-*` classes on `<html>` was dropped (no `webflow.js`, no jQuery anywhere in `app/`). When migration-map says the badge CSS was "dropped", read "made inert by dropping the runtime".

## 8. `nl-reference/` — the live-NL insurance captures

17 live Dutch pages (`*.nl.html`, captured from production Webflow 2026-07-05, e.g. `index.nl.html` with `data-wf-domain="dematerialized.nl"`) plus `live-sitemap.xml`. **Why they exist:** Webflow (and its paid localization) gets retired after cutover soak; once that happens the live NL content is unrecoverable, so it was captured while still up. An agent fleet applied the Dutch copy verbatim page-by-page.

⚠️ **Caveat — the live NL FAQ was STALE.** It described an old rental model, wrong opening hours, outdated credit rules, and had 4 untranslated Q&As. During QA round 2 (commit `3c600b9`, 2026-07-07) the NL FAQ in `app/pages/faq.vue` was realigned to the *current EN content*, with EN text left in `.lang-nl` spans as visible placeholders awaiting Courtney's Dutch. **Never paste `nl-reference/faq.nl.html` text back** — it would reintroduce wrong facts. EN-under-`.lang-nl` in faq.vue and several component T-dicts is intentional placeholder state, not a bug (→ `demat-i18n-and-consent` for the NL placeholder protocol).

`live-sitemap.xml` is also the parity baseline for the sitemap route (`app/server/routes/sitemap.xml.ts`) — bilingual URL pairs with en/nl/x-default alternates, 6 blog URLs (vs the app's 7; see accepted divergences above).

## 9. How to answer "what did the old site do?" — step by step

1. **Identify the page.** Map the Nuxt route back to the export file: `/clothing` → `clothing.html`, `/` → `index.html`, `/blog/[slug]` → `detail_blog.html`, error page → `404.html`. (30 page components in `app/pages/` + `blog/[slug].vue` + `error.vue` cover the 35 export files; `401/search/detail_items` were dropped, `detail_author` never built, `404` → `error.vue`.)
2. **Check the audit record first**: `migration-map.md` "# Appendices" holds a locked **10-field spec per page** — 1 Identity, 2 Layout (section-by-section class map), 3 Styling (sheets + inline `<style>` line ranges), 4 Embeds & scripts (every inline script and jsDelivr load), 5 Forms, 6 Interactions (`data-w-id`, FUNCTIONAL vs DECORATIVE), 7 SEO (verbatim title/meta/OG/Twitter/JSON-LD), 8 Assets, 9 Links, 10 Scope flag. Batches: **A** Home & marketing, **B** Catalog, **C** Account, **D** Donations & membership, **E** Policies & FAQ, **F** Blog & errors, **G** Embed behavior audit (per embed-JS file), **H** Site-wide head/footer code, **I** Stylesheet audit (sheets, fonts, tokens, url() assets, breakpoints), **J** Blog/authors CMS fields + Phase 6 model. Cite appendices by heading, not line number — the file grows.
3. **For layout/copy/markup questions:** open `old/dematerialized-24fc59.webflow (2)/<page>.html` (ideally in a browser for side-by-side). CSS questions: the 3 export sheets + `demat-webflow-test/styles.css`; brand tokens (plum `#4b073f`, magenta `#a92296`, charcoal `#24282d`, soft pink `#fff4fe`, 50px pills, breakpoints 479/480/600/767/768/991/1440) are catalogued in Appendix I.
4. **For behavior questions:** open the matching `old/demat-webflow-test/*.js` file from the §3 table (e.g. "how did the old cart cap work?" → `site-wide-footer.js`; "old PDP zoom?" → `pdp.js`). Appendix G summarizes each file if you need orientation before reading source.
5. **For head-code/analytics/JSON-LD questions:** the page's own HTML head first, then the exact `fallback_code/*.txt` snippet for the canonical Webflow-injected version.
6. **For interaction questions ("did that accordion animate?"):** find the element's `data-w-id` in the old HTML, then check the page's Appendix field 6 for its FUNCTIONAL/DECORATIVE ruling. Only dig into `js/webflow.js` as a last resort.
7. **For Dutch-copy questions:** `nl-reference/<page>.nl.html` — remembering the FAQ staleness caveat (§8).
8. **For "was this difference approved?":** check §7 above, then migration-map "# Implementation log"; if it's in neither, treat it as a potential parity regression and raise it — do not silently fix or silently keep (→ `demat-change-control`).

## Provenance and maintenance

All facts verified against the repo on **2026-07-07** (frontend HEAD `4ef31bf` on `main`). jsDelivr pins read directly from the export HTML; CSS identity claims via `diff`. Volatile items are date-stamped inline. Re-verification one-liners (run from `/Users/courtneyyocabet/webflow-migration`):

| Claim | Re-verify with |
|---|---|
| 35 export pages / 3 CSS sheets / webflow.js | `ls "old/dematerialized-24fc59.webflow (2)/" \| grep -c '\.html$'` and `ls "old/dematerialized-24fc59.webflow (2)/css" "old/dematerialized-24fc59.webflow (2)/js"` |
| jsDelivr pins per page | `grep -ho 'demat-webflow@[^"'\'']*' "old/dematerialized-24fc59.webflow (2)/"*.html \| sort -u` |
| §2 pin swap erratum still present in the map | `grep -n 'pinned .ea1b25a9\|pinned .a957a4f3' migration-map.md` |
| Sheets 0/1/3/5 byte-identical to old | `diff -q "old/dematerialized-24fc59.webflow (2)/css/webflow.css" app/assets/css/1-webflow.css` (etc.) |
| Sheet 2 = url()-rewrites only | `diff "old/dematerialized-24fc59.webflow (2)/css/dematerialized-24fc59.webflow.css" app/assets/css/2-dematerialized.webflow.css \| grep '^[<>]' \| grep -vc 'url('` (expect 0) |
| 4-my-account.css still excluded / CSS order intact | `grep -n 'my-account' app/nuxt.config.ts` |
| max-10-vs-5 copy bug fixed yet? | `grep -n 'up to 10' app/pages/product.vue` (hit = still unfixed; approved to fix as of 2026-07-07) and `grep -n 'MAX_ITEMS' app/composables/useCartManager.ts` |
| Escape-parity comment intact | `grep -n 'Escape never closed the cart' app/plugins/reservation-cart.client.ts` |
| Badge selectors still inert-not-deleted | `grep -c 'w-webflow-badge' app/assets/css/1-webflow.css` (expect >0) and `ls app/public/js` (expect: no such directory) |
| nl-reference contents (17 pages + sitemap) | `ls nl-reference/ \| wc -l` (expect 18) |
| Live sitemap blog count vs app's | `grep -o '<loc>[^<]*blog[^<]*</loc>' nl-reference/live-sitemap.xml \| wc -l` (expect 6) vs blog entries in `app/server/routes/sitemap.xml.ts` + `app/data/blog.json` |
| No author page appeared | `ls app/pages/blog/ && ls app/pages \| grep -i author` (expect no author hit) |
| FAQ NL placeholders still pending | `grep -c 'lang-nl' app/pages/faq.vue` then spot-check for English text in `.lang-nl` spans; cross-check migration-map "Post-QA fixes round 2" §, item #5 |
| Dropped-machinery list unchanged | read migration-map §7 "Dropped Webflow machinery (approved defaults)" |
