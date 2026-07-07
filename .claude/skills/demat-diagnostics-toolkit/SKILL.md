---
name: demat-diagnostics-toolkit
description: Executable measurement tools for the Dematerialized Nuxt app — run these instead of eyeballing. Load when you need to verify routes/titles across all pages ("crawl the site", "are all pages green"), diff SEO heads against the Webflow original, find untranslated NL placeholder strings (nl==en), verify cookie-consent gating of GTM/Hotjar/Meta Pixel, compare the sitemap against the archived live one, or check which blog source (API vs bundled) is serving. Also load for quick one-liners: storage-key inspection, blog-fallback console check, sitemap curl, backend PR #46 state.
---

# demat-diagnostics-toolkit — measure, don't eyeball

**What this covers:** five ready-to-run diagnostics that live in this skill's `scripts/` dir (route crawler, SEO head differ, NL-placeholder scanner, consent-gate checklist, sitemap comparator) plus zero-install one-liners. They produce evidence; they never change anything.
**When to use:** any time you're about to claim "the pages work", "SEO matches", "translations are done", "consent gating works", or "the sitemap is right" — run the matching tool and cite its output instead.
**When NOT to use →** deciding whether a measured deviation may be *fixed* → `demat-change-control` (dispositions live there). Understanding *why* something fails → `demat-debugging-playbook`. Standing up the dev server these tools point at → `demat-build-and-env`. What counts as sufficient evidence / QA method → `demat-validation-and-qa`. What parity even means → `webflow-parity-reference`. Executing the production cutover (these tools are used *during* it, but the campaign is) → `demat-cutover-campaign`.

## Ground rules

- All tools are **read-only** (HTTP GETs and static file reads). None writes to any database, none touches Stripe, none pushes git — so they don't collide with the discipline rules. Keep it that way when extending them.
- A tool's red output is a **finding, not a work order**. Several deviations these tools surface are ACCEPTED/DEFERRED by Courtney (annotated inline by the tools). Nothing here authorizes a fix — route through `demat-change-control`.
- Requirements: Node ≥ 18 (global `fetch`), bash + curl. **Zero npm installs.** Scripts resolve repo paths from their own location, so run them from anywhere.
- Server-dependent tools default to `http://localhost:3000` (`npm run dev` in `app/`; the mock-auth server is port 3001 per `.claude/launch.json`). Crawling is unauthenticated — account pages still return 200 with their signed-out SSR shell, which is correct behavior (auth gating is client-side only; there is no route middleware).

## Execution status (2026-07-07)

| Script | Static-tested against repo | Needs running server | Runtime-tested |
|---|---|---|---|
| `route-crawl.mjs` | yes (`--list` plan: 73 checks) | yes | **no — runtime-untested as of 2026-07-07** |
| `seo-diff.mjs` | yes (`--dump-ref` on /about-us, /faq nl, /product) | yes (except `--dump-ref`) | **no — runtime-untested as of 2026-07-07** |
| `nl-placeholder-scan.mjs` | **fully executed** (39 placeholders + 17 allowlisted found) | no | n/a (fully static) |
| `consent-check.md` | n/a (checklist doc) | yes (browser) | manual by design |
| `sitemap-compare.mjs` | **fully executed** in `--static` mode (42 vs 44, accepted deviation only) | only for fetch mode | fetch mode **runtime-untested as of 2026-07-07** |

Runtime-untested scripts are written defensively (timeouts, preflight reachability check, exit 2 with a start-the-server hint) — but expect to debug them on first live run.

---

## 1. `scripts/route-crawl.mjs` — full-site route + title crawl

**Purpose:** reproduce the project's historical acceptance bar ("Final crawl: 64 checks green — every page EN+NL, all blog posts EN+NL, product page, robots" — migration-map.md Implementation log, Phase 5). Checks HTTP status and the exact SSR `<title>` of every route against a map extracted verbatim from each page's `useHead()`. 73 checks: 28 pages × EN+NL, 7 blog posts × EN+NL (NL falls back to EN content by design), `/product` no-sku→`/clothing` redirect, robots.txt sitemap line, and a 404 probe.

**Invocation:**
```bash
node .claude/skills/demat-diagnostics-toolkit/scripts/route-crawl.mjs                # vs :3000
node .claude/skills/demat-diagnostics-toolkit/scripts/route-crawl.mjs --base http://localhost:3001
node .claude/skills/demat-diagnostics-toolkit/scripts/route-crawl.mjs --sku <SKU>    # + /product?sku= checks
node .claude/skills/demat-diagnostics-toolkit/scripts/route-crawl.mjs --list         # print plan, no network
```

**Expected-clean output:** every line `PASS`, ending `73/73 checks green against http://localhost:3000` (75/75 with `--sku`), exit 0.

**Interpretation:**

| Failure | Meaning | Next |
|---|---|---|
| exit 2 "Cannot reach" | dev server not running | `demat-build-and-env` |
| `HTTP 500` on a page | SSR exception in that page/composable | `demat-debugging-playbook` |
| title mismatch on a static page | someone changed a `useHead` title — a parity deviation unless sanctioned | `demat-change-control`; expected values are verbatim from `app/pages/*.vue` |
| title mismatch on `/blog/*` only | API-served blog content diverged from bundled `app/data/blog.json` (or vice versa) | run the blog-source one-liner below; `demat-run-and-operate` for data rollout |
| `/product` redirect check fails | `product.vue` no-sku `navigateTo('/clothing')` behavior changed | `demat-debugging-playbook` |
| 404 probe returns 200 | catch-all/error page regression | `demat-debugging-playbook` |
| NL route fails but EN passes | locale routing (`prefix_except_default`) or i18n regression | `demat-i18n-and-consent` |

Note: titles are the **same English strings on `/nl` routes** — every page head is a static string (verified 2026-07-07). If titles are ever localized, that's a deliberate change: update the embedded map.

---

## 2. `scripts/seo-diff.mjs` — per-page head diff vs the Webflow original

**Purpose:** field-by-field diff of `title` / `meta description` / `og:*` / `twitter:*` / `canonical` / `robots` between the running app and the Webflow reference. Default reference is the static export (`old/dematerialized-24fc59.webflow (2)/<page>.html` — source of truth); `--ref nl` diffs against the captured live Dutch pages (`nl-reference/<page>.nl.html`, 17 pages, captured 2026-07-05).

**Invocation:**
```bash
node .claude/skills/demat-diagnostics-toolkit/scripts/seo-diff.mjs /about-us
node .claude/skills/demat-diagnostics-toolkit/scripts/seo-diff.mjs /faq --ref nl        # informational
node .claude/skills/demat-diagnostics-toolkit/scripts/seo-diff.mjs /about-us --dump-ref # no server needed
```
Run it over all pages: `for p in / /about-us /clothing ...; do node .../seo-diff.mjs $p; done` (the script prints the full known-path list on a bad path).

**Expected-clean output (EN mode):** all fields `OK`, with `og:image`/`twitter:image` showing `OK*  sanctioned re-host` (the migration re-hosted meta images from the Webflow CDN to `https://dematerialized.nl/images/meta/…` — filename compared after stripping the Webflow asset-hash prefix). Exit 0.

**Interpretation:**

| Failure | Meaning | Next |
|---|---|---|
| any `MISMATCH` in EN mode | head parity regression — the SEO sweep bar was **zero findings** | `webflow-parity-reference`, then `demat-change-control` before touching anything |
| image mismatch that isn't `OK*` | meta image renamed/missing from `app/public/images/meta/` | check that dir; `demat-debugging-playbook` |
| mismatches in `--ref nl` mode | **expected**: live NL pages had Dutch heads; the app serves EN heads on `/nl` routes. Current shipped behavior; localizing heads is an OPEN change-control question, not a bug | `demat-change-control` |
| `/product` diff | old head is `title/og:title/twitter:title = "Product"` + `robots: noindex` — the app matches this on purpose (PDPs noindex is an intentional port; changing it is a product decision) | `demat-change-control` |

Blog detail pages are excluded (the export's `detail_blog.html` is a CMS template with placeholder head values).

---

## 3. `scripts/nl-placeholder-scan.mjs` — find English text in Dutch slots

**Purpose:** static scan of `app/` for the two bilingual-copy mechanisms where the NL side equals the EN side: (a) adjacent `<span class="lang-en">/<span class="lang-nl">` pairs, (b) per-file `T`-dict entries `{ en, nl }`. There is **no marker convention** — nl==en equality is the only detection signal (QA round 2, commit 3c600b9, left EN placeholders "for Courtney"). Known probably-intentional identical pairs (item/items, social-network names, fit options, "faq", opening hours) are annotated `[allowlisted]` instead of counted; fit options / "google search" / "influencer" are annotated `uncertain` because intent was never confirmed.

**Invocation:**
```bash
node .claude/skills/demat-diagnostics-toolkit/scripts/nl-placeholder-scan.mjs            # informational, exit 0
node .claude/skills/demat-diagnostics-toolkit/scripts/nl-placeholder-scan.mjs --strict   # exit 1 if placeholders remain
```

**Expected output as of 2026-07-07 (this is the current known-state, not a failure):** `39 placeholder, 17 allowlisted` — 22 lang-span pairs in `app/pages/faq.vue` plus 17 T-dict entries across CheckoutModal, ReservationModal, ReservationSuccessModal, UpgradeModal, OnboardingModal. After Courtney supplies Dutch, expect the placeholder count to drop toward 0; the allowlisted 17 should persist.

**Interpretation:**

| Result | Meaning | Next |
|---|---|---|
| placeholder count **rose** | new EN-in-NL strings were added — fine if following the placeholder protocol, but they must be tracked | `demat-i18n-and-consent` (NL placeholder protocol) |
| placeholder count **fell** without Courtney's input | someone machine-translated — that violates the protocol (real Dutch comes from Courtney; fills are logged in migration-map.md's Implementation log) | `demat-change-control` |
| a pair evades the scan | rewording (not verbatim copy) defeats the equality heuristic — known limitation; the scan is a floor, not a ceiling | `demat-validation-and-qa` |

Do NOT paste `nl-reference/faq.nl.html` text back over the FAQ placeholders — the live NL FAQ was **stale** (old rental model/hours/credit rules); that's exactly why the placeholders exist.

---

## 4. `scripts/consent-check.md` — manual consent-gate verification recipe

**Purpose:** a checklist (not code — script injection is browser-runtime behavior) proving GTM + Hotjar load only on `analytics` grant, Meta Pixel only on `marketing` grant, nothing pre-grant, and the `demat-consent` cookie (`{v:1, essentials:true, marketing, personalization, analytics, ts}`, 180 days, sameSite lax) is written correctly. Includes the grant-without-reload event path (`demat:consent-changed`), the documented no-teardown-on-revoke behavior, the preferences-backdrop close-without-save edge case, and the ACCEPTED (not gated) Google Fonts loads.

**Invocation:** open the file, follow it top to bottom in a fresh browser profile with DevTools Network + Application tabs. Expected-clean result: every checkbox holds. Failure interpretation table is inside the doc; consent-system internals → `demat-i18n-and-consent`.

---

## 5. `scripts/sitemap-compare.mjs` — sitemap URL-set diff vs the archived live sitemap

**Purpose:** diff `/sitemap.xml`'s `<loc>` set against `nl-reference/live-sitemap.xml` (the production Webflow sitemap archived 2026-07-05; 42 URLs).

**Invocation:**
```bash
node .claude/skills/demat-diagnostics-toolkit/scripts/sitemap-compare.mjs                     # fetch :3000/sitemap.xml
node .claude/skills/demat-diagnostics-toolkit/scripts/sitemap-compare.mjs --base https://dematerialized.nl   # post-cutover
node .claude/skills/demat-diagnostics-toolkit/scripts/sitemap-compare.mjs --static            # no server: rebuild expected set from repo
```

**Expected-clean output:** `MISSING: none`, `EXTRA` shows exactly 2 URLs annotated as the known accepted deviation — the 7th blog post (`/blog/you-own-way-more-clothes-...` + its `/nl/blog/` twin, the only post with an NL variant). `Result: PARITY (accepted deviations only)`, exit 0. Verified in `--static` mode on 2026-07-07: 42 live vs 44 expected.

**Interpretation:**

| Failure | Meaning | Next |
|---|---|---|
| MISSING URLs | `app/server/routes/sitemap.xml.ts` regression (PAGES list or blog emission) | `demat-debugging-playbook` |
| unexplained EXTRA | a page/post was added to the sitemap — was it change-controlled? | `demat-change-control` |
| removing the 7th-post EXTRA "to fix parity" | **forbidden without Courtney** — it is ACCEPTED/DEFERRED (2026-07-07) | `demat-change-control` |
| post published via blog API doesn't appear | expected: the sitemap reads bundled `app/data/blog.json`, NOT the API — API-only posts never enter the sitemap until blog.json is updated | `demat-run-and-operate` |

---

## Zero-install measurement one-liners

**Quick nl==en greps** (approximations — single-line, single-quoted only; the scanner script is authoritative and found 39 vs the ~29 these catch):
```bash
git grep -n "en: '\(.*\)', nl: '\1'" -- 'app/*.vue'                                  # T-dict pairs (20 hits, 2026-07-07)
git grep -n 'lang-en">\([^<]*\)</span><span class="lang-nl">\1<' -- app             # span pairs (line-level)
```

**Which blog source served?** Load `/also-this` (or any `/blog/*`) with the browser console open:
- `[Blog] API unavailable, using bundled content` (console.info, from `app/composables/useBlogPosts.ts`) → bundled `app/data/blog.json` fallback served. Note the fallback also fires on an **empty** API list, not just errors.
- No such line + posts render → the API (`GET ${apiBase}/blogs?locale=…`) served.
- Direct API probe: `curl -s "https://test-api.dematerialized.nl/blogs?locale=en" | head -c 300`

**Storage keys in DevTools** (Application tab; full registry + ownership → `demat-architecture-contract`):
| Where | Key | Owner |
|---|---|---|
| localStorage | `demat_purchase_cart` | purchase cart (no TTL) |
| localStorage | `dematerialized_wishlist` | wishlist id array |
| localStorage | `@@auth0spajs@@…` entries | Auth0 SPA token cache |
| sessionStorage | `dematerialized_cart` | reservation cart (max 5) |
| sessionStorage | `dm_catalog` | catalog cache, 5-min TTL — written by TWO different endpoints (`/search` and `/clothing_items/catalog/full`), a known trap |
| sessionStorage | `auth_return_path`, `postLoginAction`, `onboarding_modal_dismissed`, `onboarding_completed` | auth/onboarding flows |
| cookie | `demat-consent` | consent state |

**Sitemap quick count** (44 expected as of 2026-07-07):
```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"
```

**Backend blog PR state** (OPEN as of 2026-07-07; while unmerged, production blog = bundled fallback):
```bash
gh pr view 46 --repo Edwardvaneechoud/demat-backend --json state,title,mergedAt
```

## Provenance and maintenance

Facts verified against the repo on **2026-07-07** (HEAD `4ef31bf`, plus an in-flight **uncommitted** Capacitor native-app change touching `app/plugins/analytics.client.ts`, `auth0.client.ts`, `nuxt.config.ts`, `package.json` — inert in browsers but expect line numbers and analytics facts to drift when it lands). Scripts embed data (titles, slugs, PAGES, allowlist) that will drift with the app; re-verify before trusting a red result on embedded data.

| What may drift | Re-verification command |
|---|---|
| Page titles vs embedded map | `cd app/pages && for f in *.vue; do grep -m1 "title:" "$f"; done` — compare to `PAGE_TITLES` in `route-crawl.mjs` |
| Blog slugs/titles | `node -e "const d=require('./app/data/blog.json'); d.posts.forEach(p=>console.log(p.slug, '|', p.en?.title, '|', p.nl?.title))"` (from repo root) |
| Sitemap PAGES list | `sed -n '/const PAGES/,/^]/p' app/server/routes/sitemap.xml.ts` — compare to the mirror in `sitemap-compare.mjs` |
| Placeholder counts | `node .claude/skills/demat-diagnostics-toolkit/scripts/nl-placeholder-scan.mjs` (self-verifying) |
| Consent cookie shape / event name | `grep -n "demat-consent\|demat:consent-changed\|maxAge" app/composables/useConsent.ts` |
| Analytics IDs + script hosts | `grep -n "gtmId\|hotjarId\|metaPixelId" app/nuxt.config.ts && grep -n "googletagmanager\|hotjar\|fbevents" app/plugins/analytics.client.ts` |
| PR #46 state | `gh pr view 46 --repo Edwardvaneechoud/demat-backend --json state,mergedAt` |
| Accepted-deviation dispositions (7th blog post, Google Fonts, /account ref, PDP "10 items" copy) | migration-map.md "# Implementation log" section + `demat-change-control` — dispositions dated 2026-07-07 |
| Storage keys | `grep -rn "STORAGE_KEY\|COOKIE_NAME" app/composables/ \| grep -v node_modules` |
| Route inventory | `ls app/pages/` (28 crawlable + product + blog/[slug]) |
