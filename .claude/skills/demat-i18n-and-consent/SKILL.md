---
name: demat-i18n-and-consent
description: Operating manual for the two sanctioned new-engineering systems in the Dematerialized Nuxt app — multi-language (EN/NL i18n) and cookie consent. Load this when adding or fixing a translated string, hunting English-under-Dutch text, working on anything in app/i18n/, 6-lang-toggle.css, locale-links.client.ts, useConsent.ts, analytics.client.ts, or components/consent/; when asked "why is the Dutch page showing English", "why isn't GTM/Hotjar/Meta Pixel loading", "how do I gate a new script behind consent", "how do I add a locale", or anything about the demat-consent cookie, html[lang], /nl URLs, lang-en/lang-nl spans, or NL placeholder translations.
---

# demat-i18n-and-consent — operating the two sanctioned new systems

**What this covers**: the i18n system (three coexisting translation mechanisms, the locale-link interceptor, the NL-placeholder protocol, adding strings/locales) and the consent system (the `demat-consent` cookie, category→script gating, banner/preferences/widget UI, adding a gated script) in `app/`.
**When to use**: any change or investigation touching translations, locales, `/nl` URLs, `html[lang]`, the cookie banner, or third-party script loading (GTM, Hotjar, Meta Pixel).
**When NOT to use**: what the old Webflow site did and what "parity" means → `webflow-parity-reference`. Auth0/cart/Stripe wiring → `demat-commerce-and-auth`. Whether a change is allowed at all → `demat-change-control`. Verifying no-request-before-consent with tooling → `demat-diagnostics-toolkit`. Production GTM/env cutover steps → `demat-cutover-campaign`.
**Ground rule that overrides instinct**: English text sitting in a Dutch slot is usually a **deliberate placeholder awaiting Courtney's Dutch** — not a bug. Never delete it, never machine-translate it into the repo without approval, and never backfill from the stale live NL capture (details below).

All facts verified against the repo on 2026-07-07 (HEAD `4ef31bf` plus uncommitted mobile-app working-tree changes — see Provenance).

---

## Part 1 — I18N

### 1.1 Jargon, once

| Term | Meaning here |
|---|---|
| **i18n** | Internationalization — the `@nuxtjs/i18n` module (`^9.5.0`) driving EN/NL routing and locale state. |
| **locale prefix** | EN pages live at `/` (no prefix), NL pages at `/nl/...` — strategy `prefix_except_default`. |
| **T dict** | A per-file constant `const T = { key: { en: '…', nl: '…' } }` read via an `isNL` ternary — the dominant translation pattern in this app. |
| **lang spans** | Adjacent `<span class="lang-en">…</span><span class="lang-nl">…</span>` pairs in ported markup; CSS shows exactly one based on `html[lang]`. |
| **NL placeholder** | English text intentionally stored in an `nl` slot because real Dutch doesn't exist yet. No marker; detectable only as `nl === en`. |
| **hydration** | Vue attaching to server-rendered HTML. Project rule: state-dependent visibility uses `v-show`/`v-if`, never `:class`/`:style` (mismatches aren't patched at hydration). |

### 1.2 Configuration (app/nuxt.config.ts, `i18n:` block)

```ts
i18n: {
  locales: [
    { code: 'en', language: 'en',    file: 'en.json', name: 'English' },
    { code: 'nl', language: 'nl-NL', file: 'nl.json', name: 'Nederlands' },
  ],
  defaultLocale: 'en',
  strategy: 'prefix_except_default',   // EN at /, NL at /nl/...
  detectBrowserLanguage: false,        // deliberate: never auto-redirect by Accept-Language
  bundle: { optimizeTranslationDirective: false },
}
```

- Locale JSON files live at the module default path **`app/i18n/locales/`**.
- **`html[lang]` is set by `app/app.vue`, not by the module**: `useHead({ htmlAttrs: { lang: locale, ... } })`. The value is the locale *code* (`en`/`nl`, not `nl-NL`); the toggle CSS matches `[lang^='nl']` so either would work. app.vue also emits `rel=alternate hreflang` links for `en`, `nl`, and `x-default` (= EN) against `https://dematerialized.nl` via `useSwitchLocalePath()`.

### 1.3 The THREE coexisting translation mechanisms

They coexist on purpose (the port was verbatim; i18n was layered on). Pick by context — do not "unify" them without change control.

| # | Mechanism | Where | Use for | How it renders |
|---|---|---|---|---|
| 1 | **Global locale JSON** | `app/i18n/locales/en.json` + `nl.json` | New shared/system UI (currently ONLY consent copy) | `$t('consent.key')` in templates |
| 2 | **Per-file T dict** *(dominant)* | `const T = { key: { en, nl } }` + `isNL` ternary inside the .vue/.ts file | Dynamic strings rendered by script (labels, toasts, modal copy) | `isNL ? T.k.nl : T.k.en` or a local `t()` helper |
| 3 | **Verbatim lang spans** *(transitional)* | `<span class="lang-en">` / `<span class="lang-nl">` pairs in templates | Ported static Webflow markup, faithfulness only | Pure CSS: `app/assets/css/6-lang-toggle.css` keyed on `html[lang]` |

**Mechanism 1 — global JSON.** As of 2026-07-07 both files contain exactly one namespace, `consent`, with **16 keys** (bannerText, policyLink, accept, deny, preferences, prefsTitle, savePreferences, alwaysActive, essentials, essentialsDesc, marketing, marketingDesc, personalization, personalizationDesc, analytics, analyticsDesc). nl.json is fully, genuinely translated — no placeholders there.
*Add a string*: add the key under a namespace in **both** en.json and nl.json, render with `$t('ns.key')`. For locale-aware links use `$localePath('/path')` (as `ConsentBanner.vue` does for `/cookie-policy`).

**Mechanism 2 — per-file T dicts.** Shape is flat `key: { en, nl }` in every file except `pages/memberships.vue`, which nests `MEMBERSHIPS_T = { en: {...}, nl: {...} }` (read via `computed(() => isNL.value ? MEMBERSHIPS_T.nl : MEMBERSHIPS_T.en)`). Verified list of files containing `{ en: '…', nl: '…' }` dicts (2026-07-07):
- components: `AuthModal.vue`, `OnboardingModal.vue`, `cart/CartOverlay.vue`, `cart/CheckoutModal.vue`, `cart/PurchaseCartPanel.vue`, `cart/ReservationModal.vue`, `cart/ReservationSuccessModal.vue`, `cart/UpgradeModal.vue`
- pages: `contact-us.vue`, `donations-credits.vue`, `mailing-list.vue`, `memberships.vue` (nested), `missing-pieces.vue`, `my-membership.vue`, `my-rentals.vue` (`RENTALS_T`), `product.vue`, `purchase-success.vue`, `purchases.vue`, `reservations.vue`, `wish-list.vue`
- `composables/useCatalog.ts` and `plugins/reservation-cart.client.ts` also branch on NL (status-display maps / copy), and `pages/also-this.vue`, `pages/blog/[slug].vue`, `pages/clothing.vue`, `components/home/ClothingCarousel.vue`, `components/home/MailBanner.vue` use `isNL` for locale-dependent logic without a full dict.

*Add a string*: add `key: { en: '…', nl: '…' }` to that file's dict and render via the file's existing helper. If real Dutch is unknown, **put the EN text in the `nl` slot** — that is the established placeholder convention (findable later by equality scan).

**Mechanism 3 — lang spans.** `app/assets/css/6-lang-toggle.css` (loaded 7th in the strict CSS order — never reorder):

```css
.lang-nl { display: none; }
html[lang^='nl'] .lang-en { display: none; }
html[lang^='nl'] .lang-nl { display: inline; }
html[lang^='nl'] a.lang-nl { display: inline-flex; }
```

Its header comment marks it transitional: "Retired once all copy moves into locale files." Used across ~28 pages/components (home sections, faq, how-it-works, policies, navbar, footer, ...).
*Add a string*: duplicate the element — `<span class="lang-en">English</span><span class="lang-nl">Nederlands</span>`. Only do this inside already-ported verbatim markup; new UI should use mechanism 1 or 2.

### 1.4 The locale-links interceptor (app/plugins/locale-links.client.ts)

Ported markup keeps verbatim EN `<a href="/...">` anchors. This 25-line plugin (the equivalent of the old `DematI18n.localizeHrefs()`) installs a **document-level click listener** that:

1. Bails on: `defaultPrevented`, non-left button, any modifier key; no enclosing `<a>`; `target` set and ≠ `_self`; the anchor has a **`download`** or **`hreflang`** attribute; href missing, not starting `/`, or protocol-relative `//`.
2. If the current route is `/nl` or `/nl/...` and the href isn't already NL-prefixed → rewrites to `/nl${href}` (`/` → `/nl`).
3. Then **always** `e.preventDefault(); router.push(target)` — SPA navigation.

**The trap**: it intercepts **ALL qualifying root-relative left clicks, on EN pages too**, turning full-page navigations into `router.push`. Consequences:
- Any anchor that must full-reload or must escape NL-prefixing needs `target`, `download`, or `hreflang` set. `hreflang` is the locale-switcher exemption — the only anchors carrying it are the switcher links in `SiteNavbar.vue` (`<a hreflang="en|nl" :href="switchLocalePath(...)">`, lines ~87/90/274/277), which intentionally full-navigate.
- Query-driven pages must watch `route.query`: this interceptor once broke navbar catalog-filter links (e.g. Workwear → `/clothing?categories=…`) because `useCatalog` read the query only at init; the fix was a `route.query` watcher in `useCatalog.ts` (guarded to `/clothing` and `/nl/clothing`, self-write-skip via `lastWrittenQuery`). Any new query-driven page needs the same treatment. (History: fix commits `78a1c02` then `3c600b9`; see `demat-failure-archaeology`.)
- Never hand-prefix `/nl` in markup hrefs — the interceptor does it at click time.

### 1.5 THE NL PLACEHOLDER PROTOCOL (read before touching any Dutch text)

**Background** (recorded in migration-map.md, section "Post-QA fixes round 2 (2026-07-07, Courtney's 8-issue list)"): the live Webflow NL FAQ was **stale** — old rental model, wrong opening hours, outdated credit rules, 4 untranslated Q&As. So the NL FAQ was realigned to current EN with the EN text left in the `.lang-nl` spans as visible placeholders "for Courtney", and a placeholder-translation sweep converted the modal/cart strings into per-file T dicts (real NL where obvious, EN placeholder otherwise).

**The rules**:
1. EN-under-`lang-nl` / EN-in-`nl:`-slot is **NOT a bug**. Do not delete, do not "fix", do not machine-translate into the repo. Real Dutch comes from Courtney; landing her text is the fix.
2. The live-site NL capture in `nl-reference/` (17 pages, saved 2026-07-05) is the general reference for Dutch copy, **but `nl-reference/faq.nl.html` is STALE — never paste it back**. Cross-check any nl-reference text against current EN facts before using it.
3. There is **no marker convention** — placeholders are detectable only as `nl === en` equality. Any placeholder that was reworded rather than copied verbatim evades the scan, so the counts below are lower bounds.

**Verified inventory (my own equality scan, 2026-07-07)**:

- **`pages/faq.vue` — 22 of 68 lang-span pairs identical** (template lines ~69, 99, 114, 129, 164, 169, 179, 289, 297, 300–315, 391, 416, 426, 446, 456, 461, 471): opening-hours, how-renting-works, return-rental Q&A, brand-evaluation + the store-credit price-tier block, membership cost/billing/payment-methods Q&As. These are inline spans, NOT a dict — fixing means editing the `.lang-nl` span text in place. The FAQ has 26 accordion items (`openFaqs` ref).
- **T-dict entries with `nl === en`** (key names are the stable anchors):
  - `cart/ReservationModal.vue` (6): `creatingRental`, `confirmRentalBtn`, `rentalPolicy1`, `pickupPolicy1`, `rentalPolicy2`, `pickupPolicy2`
  - `cart/ReservationSuccessModal.vue` (3): `rentalMessage`, `pickupMessage`, `viewMyRentals`
  - `cart/UpgradeModal.vue` (2): `modalText`, `benefitsTitle`
  - `cart/CheckoutModal.vue` (1): `redirectInfo`
  - `OnboardingModal.vue` (5 clear): `welcomeSubtitle`, `aptUnit`, `sizesSubtitle`, `bodyTypeSubtitle`, `referralSubtitle`
  - → **17 clear T-dict placeholders** across the five modals.
- **Probably-intentional identical pairs (UNCONFIRMED — ask Courtney before treating as placeholders)**: `item`/`items` (CheckoutModal, PurchaseCartPanel, donations-credits, purchases, reservations — likely deliberate; `my-rentals.vue`'s pluralizer also returns "items" for NL); OnboardingModal fit options `fitSlim`/`fitRegular`/`fitOversized` ("slim/regular/oversized"), social-channel names `refInstagram`/`refTiktok`/`refFacebook`/`refPinterest`, and `refGoogle` ("google search") / `refInfluencer` ("influencer"); `SiteNavbar.vue` span "faq"; `contact-us.vue` span "12:00 - 16:00" (opening hours).

**The scan** (run from the repo root; covers span pairs and flat dicts — NOT the nested `memberships.vue` shape, which had 0 identical values when checked manually on 2026-07-07):

```bash
cat > /tmp/nl-placeholder-scan.mjs <<'EOF'
// NL-placeholder scanner: prints every lang-en/lang-nl span pair and every
// { en: '...', nl: '...' } dict entry whose EN and NL text are identical.
import fs from 'fs'; import path from 'path';
function walk(d, o = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, o) : /\.(vue|ts)$/.test(p) && o.push(p);
  }
  return o;
}
for (const f of walk('app')) {
  const s = fs.readFileSync(f, 'utf8'); let m;
  const spans = /<span class="lang-en">([\s\S]*?)<\/span>\s*<span class="lang-nl">([\s\S]*?)<\/span>/g;
  while ((m = spans.exec(s))) {
    const en = m[1].replace(/\s+/g, ' ').trim(), nl = m[2].replace(/\s+/g, ' ').trim();
    if (en === nl) console.log(`SPAN ${f}:${s.slice(0, m.index).split('\n').length} "${en.slice(0, 60)}"`);
  }
  const dict = /\{\s*en:\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,\s*nl:\s*(['"`])((?:\\.|(?!\3).)*)\3/g;
  while ((m = dict.exec(s))) {
    if (m[2] === m[4]) console.log(`DICT ${f}:${s.slice(0, m.index).split('\n').length} "${m[2].slice(0, 60)}"`);
  }
}
EOF
node /tmp/nl-placeholder-scan.mjs
```

Expected output on 2026-07-07: **56 lines** — 24 SPAN (22 in faq.vue + the 2 intentional navbar/contact-us ones) + 32 DICT (the 17 placeholders + the 15 probably-intentional entries listed above). When Courtney supplies Dutch: edit the `nl` values in place (dict entries) or the `.lang-nl` span text (faq.vue), re-run the scan to confirm the count dropped, and log the change in migration-map.md's `# Implementation log` in the same turn (see `demat-change-control`).

### 1.6 Adding a new locale (say, `de`)

The i18n foundation was built for more locales, but today's code is EN/NL-**binary** in two of the three mechanisms. Adding a locale is a **strategy decision → change control first** (`demat-change-control`), not a config tweak. The full surface:

1. **nuxt.config.ts**: add `{ code: 'de', language: 'de-DE', file: 'de.json', name: 'Deutsch' }` to `i18n.locales`. With `prefix_except_default` it gets `/de/...` automatically.
2. **`app/i18n/locales/de.json`**: translate the `consent` namespace (16 keys).
3. **The three-mechanism problem** — the real cost:
   - T dicts are `{ en, nl }` pairs plus `isNL` ternaries in ~20 files — a third language doesn't fit the shape. You must pick a strategy (extend dicts to `{ en, nl, de }` with a locale-keyed lookup, or migrate dicts into the global JSON) — either is a repo-wide refactor.
   - lang spans are a CSS toggle keyed off `html[lang^='nl']` — a third language shows EN by default. You'd need `lang-de` spans + CSS rules, or to first retire mechanism 3 into 1/2 (the direction 6-lang-toggle.css's own header points).
   - `locale-links.client.ts` hardcodes `/nl` prefixing — needs generalizing to any non-default locale prefix.
4. **SEO surface**: `app/app.vue` hardcodes `hreflang` alternates for en/nl/x-default; `app/server/routes/sitemap.xml.ts` hand-builds nl+en URL entries with en/nl/x-default alternates per page — both need the new locale added, and blog posts need a `de` variant story (`useBlogPosts.pickVariant` currently falls back NL→EN).
5. **Content**: every placeholder problem above, times one more language — plan who supplies the copy before writing any code.

---

## Part 2 — CONSENT

The custom consent system replaces the old site's paid **Finsweet ConsentPro** widget (same four categories the old `fs-consent_component` exposed). It is one of only two sanctioned pieces of new engineering.

### 2.1 The cookie (app/composables/useConsent.ts)

| Property | Value |
|---|---|
| Name | `demat-consent` |
| Shape | `{ v: 1, essentials: true, marketing: bool, personalization: bool, analytics: bool, ts: "<ISO>" }` |
| maxAge | `60*60*24*180` = **180 days** |
| sameSite | `lax` |
| Managed via | Nuxt `useCookie` → **SSR-readable**; `bannerOpen = useState('consent-banner-open', () => cookie.value === null)` is consistent server/client |

`essentials` is typed as literal `true` (always-on, not toggleable). `v: 1` is a schema version with **no migration logic today** — only the category booleans are read. `save()` writes the full state with a fresh `ts`, closes banner+preferences, and dispatches `window.dispatchEvent(new CustomEvent('demat:consent-changed', { detail: cookie.value }))`. `acceptAll()`/`denyAll()` set all three categories true/false. `granted(cat)` is `cookie.value?.[cat] === true`.

### 2.2 Category → script mapping (app/plugins/analytics.client.ts)

| Category | Gates | Loaded how |
|---|---|---|
| `essentials` | Nothing to load — sign-in, carts, and the consent cookie itself are always-on | — |
| `analytics` | **GTM** + **Hotjar** | dataLayer push `{'gtm.start', event:'gtm.js'}` + inject `gtm.js?id=${gtmId}`; set `window._hjSettings`/`hj` stub + inject `hotjar-${hotjarId}.js?sv=6` |
| `marketing` | **Meta Pixel** | `fbq` queue stub + inject `fbevents.js` + `fbq('init', metaPixelId)` + `fbq('track','PageView')`. **Skipped entirely in the native Capacitor apps** (`if (isNativeApp()) return` — Apple ATT guideline 5.1.2; part of the 2026-07-07 mobile-apps work) |
| `personalization` | **NOTHING currently** — no consumer anywhere; the toggle exists for future use | — |

IDs come from `runtimeConfig.public` (nuxt.config.ts): `gtmId: 'GTM-556SMQSF'` (**TEST container default**; production sets `NUXT_PUBLIC_GTM_ID=GTM-56PZW3LP` — per app/DEPLOY.md env table), `hotjarId: '6427900'`, `metaPixelId: '1337973184818900'`. These are public IDs, fine in client code.

**Deliberately NOT consent-gated** (accepted posture — do not change without Courtney's approval; see `demat-change-control`): **Google Fonts** (Urbanist, PT Serif, Montserrat, Playfair Display) load unconditionally via `<link>`s in nuxt.config.ts `app.head` — an external request to fonts.googleapis.com/fonts.gstatic.com on every page view regardless of consent.

### 2.3 UI flow (app/components/consent/, all mounted globally)

`layouts/default.vue` mounts `<ConsentBanner />` and `<ConsentCookieWidget />`; `ConsentPreferences` is rendered from inside ConsentBanner's template (`<ConsentPreferences v-if="preferencesOpen" />` sits OUTSIDE the banner's own `v-if="bannerOpen && !preferencesOpen"`, so preferences are reachable both on first visit and later via the widget).

| Component | Behavior |
|---|---|
| **ConsentBanner.vue** | Shows when `bannerOpen && !preferencesOpen` (i.e. no cookie yet). Fixed bottom card, z-index 999998. Buttons: preferences → `openPreferences()`, deny → `denyAll()`, accept all → `acceptAll()`. Text via `$t('consent.*')`, policy link via `$localePath('/cookie-policy')`. |
| **ConsentPreferences.vue** | Full-screen backdrop, z-index 999999. Local checkbox refs seeded from the existing cookie (or false). One "save preferences" button → `save({...})`. **Backdrop click (`@click.self`) closes WITHOUT saving** — for a first-time visitor the cookie is still null so the banner reappears. This is by design; don't "fix" it as a bug. |
| **CookieWidget.vue** | Always-present 44px round reopen button, fixed bottom-left, z-index 999990 (mirrors Finsweet's widget on the old site). `v-show="!bannerOpen && !preferencesOpen"` — **v-show, not `:class`, per the hydration-visibility rule; keep that pattern in any consent-UI change**. On mobile (≤767px) it lifts to `bottom: calc(96px + env(safe-area-inset-bottom))` to clear the bottom nav. Click → `openPreferences()`. |

### 2.4 Recipe: add a new consent-gated script

`onConsentGranted(category, cb)` (exported from `useConsent.ts`) runs `cb` immediately if the category is already granted, otherwise listens for `demat:consent-changed` and runs `cb` once when the event detail has that category true — covering both "granted before load" and "granted mid-session, no reload".

1. Get change-control approval (a new third-party script is new scope — `demat-change-control`).
2. Put any public ID in `runtimeConfig.public` in nuxt.config.ts (overridable via `NUXT_PUBLIC_*` env var; TEST value as default, prod via Netlify env, matching the GTM pattern).
3. In `app/plugins/analytics.client.ts` (or a new `*.client.ts` plugin), add:

```ts
onConsentGranted('personalization', () => {   // or 'analytics' / 'marketing'
  if (isNativeApp()) return                    // decide the native-app posture explicitly
  injectScript(`https://vendor.example/sdk.js?id=${id}`)
})
```

4. If the script fires cross-app tracking, mirror the Meta Pixel's `isNativeApp()` skip (Apple ATT).
5. Verify per §2.5, then log in migration-map.md's `# Implementation log`.

**Known limitation — no revoke teardown**: the mechanism only fires on **grant** (`if (detail?.[category])`). Un-checking a category and saving does not unload GTM/Hotjar/Pixel; already-injected scripts keep running until the next full page load. Accepted behavior as of 2026-07-07 — changing it is new scope.

### 2.5 Verification recipe

The acceptance bar for any consent change: **no third-party request before grant**.

1. Fresh browser profile (or clear the `demat-consent` cookie + hard reload).
2. DevTools → Network. Before touching the banner: **zero** requests to googletagmanager.com, hotjar.com, connect.facebook.net. (fonts.googleapis.com/gstatic.com WILL appear — that's the accepted ungated posture, not a regression.)
3. Accept all → the gated requests appear immediately without reload (the `demat:consent-changed` path).
4. Reload → they load straight away (cookie-granted path). Deny-all fresh profile → they never load.
5. Check `document.cookie` contains `demat-consent` with the expected JSON shape.

For scripted/repeatable versions of this check, use `demat-diagnostics-toolkit`.

---

## Provenance and maintenance

All claims verified directly against the repo on **2026-07-07**, at HEAD `4ef31bf` **plus uncommitted working-tree changes** (the in-progress Capacitor mobile-apps work, logged in migration-map.md under "Mobile apps — iOS & Android"): the `isNativeApp()` Meta Pixel skip in analytics.client.ts and `composables/useNativeApp.ts` exist in the working tree but are not yet committed — re-verify their presence before relying on them.

Volatile facts and how to re-check them:

| Claim | Re-verify with (from repo root) |
|---|---|
| Placeholder inventory (22 faq spans, 17 dict entries, 56 scan lines) | Run the scanner in §1.5; counts drop as Courtney's Dutch lands |
| Locale JSON = one `consent` namespace, 16 keys | `python3 -c "import json;d=json.load(open('app/i18n/locales/en.json'));print(list(d), len(d['consent']))"` |
| i18n config (strategy, detectBrowserLanguage, locales) | `grep -A 10 'i18n:' app/nuxt.config.ts` |
| GTM/Hotjar/Pixel IDs + test-default GTM | `grep -n 'gtmId\|hotjarId\|metaPixelId' app/nuxt.config.ts` and `grep -n 'GTM' app/DEPLOY.md` |
| Cookie name/maxAge/event name | `grep -n "COOKIE_NAME\|COOKIE_MAX_AGE\|demat:consent-changed" app/composables/useConsent.ts` |
| `personalization` still gates nothing | `grep -rn "onConsentGranted" app/ --include='*.ts' --include='*.vue'` (expect hits only in useConsent.ts + analytics.client.ts, categories analytics/marketing) |
| Meta Pixel native-app skip present | `grep -n "isNativeApp" app/plugins/analytics.client.ts` |
| Google Fonts still ungated | `grep -n 'fonts.googleapis' app/nuxt.config.ts` (links in `app.head`, not in any consent-gated code) |
| locale-links exemptions unchanged | `grep -n "download\|hreflang\|target" app/plugins/locale-links.client.ts` |
| Locale-switcher anchors still the only `hreflang` anchors | `grep -rn 'hreflang' app/components/ app/pages/` |
| 6-lang-toggle.css still loaded 7th / unchanged | `grep -n 'lang-toggle' app/nuxt.config.ts && cat app/assets/css/6-lang-toggle.css` |
| ConsentPreferences backdrop-no-save behavior | `grep -n 'click.self' app/components/consent/ConsentPreferences.vue` |
| nl-reference FAQ still stale / untouched | `git log --oneline -3 -- nl-reference/` and the "Post-QA fixes round 2" section of migration-map.md |
| T-dict file list | `grep -rln "en: '" app/pages app/components --include='*.vue'` |
