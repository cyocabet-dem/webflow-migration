---
name: demat-research-frontier
description: Load when asked "what should we work on next", "can we improve X", or any post-migration advancement task on the Dematerialized site — regression monitoring, the credits mystery, contact/missing-pieces form wiring, a dedicated rentals endpoint, blog authoring / API-driven sitemap, PDP indexing/SEO, adding typecheck/CI/eslint, or adding a third language. Also load when someone proposes a new feature or platform change and you need to know whether it is already a mapped frontier item, what its first steps are, and what blocks it.
---

# Dematerialized research frontier — where the project advances next

**What this covers**: the four sanctioned directions for post-migration work (Courtney selected ALL four on 2026-07-07): operate flawlessly, evolve the product, platform quality, more locales. For each open problem: why the current state falls short, the repo's specific asset, the first three concrete steps, a falsifiable done-milestone, and known blockers.
**When to use**: planning or starting any advancement work; evaluating whether a proposed change is already a known frontier item; answering "what's next after cutover".
**When NOT to use** (→ sibling skill): executing the production cutover itself → `demat-cutover-campaign`. Getting approval / checking scope rules → `demat-change-control`. Running the measurement scripts → `demat-diagnostics-toolkit`. Day-to-day string/locale mechanics → `demat-i18n-and-consent`. Debugging a live symptom → `demat-debugging-playbook`. Turning one of these items into an accepted change (evidence bar, idea lifecycle) → `demat-research-methodology`.

## Ground rules — read before starting anything below

Everything in this file is **candidate/open. Nothing is pre-approved.** Every item routes through `demat-change-control` before code changes land. The migration doctrine (faithful one-to-one port; only cookie consent + i18n were sanctioned new engineering) still governs: post-migration changes are scope additions and need explicit approval.

Four non-negotiable discipline rules apply to all frontier work (Courtney, 2026-07-07):

| # | Rule |
|---|------|
| 1 | Any **write to the hosted TEST database** (migrations, seeds, data mutations) requires Courtney's explicit OK **each time** |
| 2 | Never `git push` or open a PR without asking — main's commits after origin are **deliberately unpushed** |
| 3 | **Real-money flows are human-only** — completing a Stripe payment (membership join, purchase) is never automated |
| 4 | The backend repo is never committed to directly — every backend change is a **new branch off the working branch + PR to `Edwardvaneechoud/demat-backend`, flagged to Edward before starting** |

Terms used below: **parity** = the Nuxt site reproduces the old Webflow site's layout, copy, URLs, and behavior exactly. **Soak** = the observation window after DNS cutover during which Webflow/Finsweet subscriptions stay cancellable and regressions are watched for. **Cutover** = the `app/DEPLOY.md` dashboard steps + DNS switch (the hardest live problem; owned by `demat-cutover-campaign`). **T dict** = the per-file `const T = { key: { en, nl } }` translation-dictionary pattern. **Lang-spans** = duplicated `<span class="lang-en">…</span><span class="lang-nl">…</span>` markup toggled by CSS on `html[lang]`. **noindex** = the `robots: noindex` meta that tells search engines not to index a page.

---

## Direction 1 — Operate flawlessly

### 1a. Post-cutover regression detection

**Why the current state falls short.** All verification so far is point-in-time: manual side-by-side QA and adversarial verifier fleets. The frontend repo has **zero automated checks** — no `.github/` directory, no CI, no monitoring (verified 2026-07-07). After cutover, a regression (bad deploy, backend drift, expired asset) would be discovered by users, not by us.

**This repo's asset.** The final pre-freeze crawl precedent: migration-map.md `# Implementation log` records "Final crawl (2026-07-05): 64 checks green — every page EN+NL, all blog posts EN+NL, product page, robots; sitemap verified separately." The route list is machine-enumerable from `app/server/routes/sitemap.xml.ts` (18 static paths × en/nl + blog slugs), and every page's `<title>`/meta is a stable string in its `useHead`. The `demat-diagnostics-toolkit` skill ships the crawler/SEO-differ tooling to build on.

**First three steps (in this repo):**
1. Scriptify the crawl against a configurable base URL (deploy-preview URL now, `https://dematerialized.nl` post-cutover): for every sitemap route + `/product?sku=<known>` + `/nl` twins, record HTTP status, `<title>`, meta description, robots meta, and hreflang links into a committed baseline file. Start from the `demat-diagnostics-toolkit` scripts rather than writing fresh.
2. Schedule it. Options (each is a scope addition — propose to Courtney first): a GitHub Actions cron (requires pushing the repo — rule 2), a Netlify scheduled function, or a local cron on Courtney's machine. Pick the one Courtney approves; do not silently add CI.
3. Define the alert bar in writing: alert on any non-200, any title/meta/robots diff vs baseline, any sitemap URL set change; **do not** alert on content that legitimately varies (catalog item counts, blog dates). Tune against a week of runs.

**You have a result when:** a deliberately introduced copy change (e.g. edit one page title on a preview deploy) is caught by the harness, **and** the harness runs a full soak week against production with **zero false alarms**.

**Blockers:** cutover must land first for the prod target to exist (→ `demat-cutover-campaign`); scheduling-infrastructure choice is Courtney's; any repo push for CI needs explicit OK.

### 1b. The credits-mystery closure

**Why it falls short.** QA round 2 item #1 (migration-map.md `# Implementation log`, "Post-QA fixes round 2"): Courtney saw a wrong donations-credits total. Investigation concluded **no frontend divergence** — the port matches `donations.js` verbatim; totals come from the backend ledger; the test account's only sessions were unpublished drafts (which the backend hides). The mystery is open, parked "awaiting Courtney's specifics (which session, expected vs shown)".

**This repo's asset.** A published test donation session with **€8.00 balance was deliberately left in the test DB as the verification fixture** (same log entry). The frontend read path is fully mapped: `GET /private_clothing_items/donation_session/` (credit balance, `usePurchaseCart.ts` + `pages/donations-credits.vue`) and `GET /private_clothing_items/donation_session/{sessionId}` (detail). The local-backend + auth-bypass runner (→ `demat-build-and-env`) lets you read the test DB through real backend code.

**First three steps:**
1. Get Courtney's specifics — which session, expected total vs shown total. This is a hard prerequisite; without it you are pattern-matching in the dark.
2. Reproduce **read-only**: load `/donations-credits` on the test API as the test account and diff the raw `GET /private_clothing_items/donation_session/` JSON against what the page renders (should be identical — the frontend was cleared). Then compare the JSON against the €8.00 fixture's expected value.
3. If the JSON itself is wrong, trace the backend ledger computation in `demat-backend/app/api/routes/private_clothing_items/donation_sessions.py` and its services against the underlying rows. Any proposed data correction = test-DB write = Courtney's explicit OK (rule 1); any code fix = branch + PR flagged to Edward (rule 4).

**You have a result when:** you have a written root cause that **predicts the exact wrong number Courtney saw** from the data, plus a disposition (data fix awaiting OK, backend PR proposal, or "expected behavior, misread").

**Blockers:** Courtney's specifics (unavailable in the repo); possible Edward involvement if it's backend logic.

---

## Direction 2 — Evolve the product

### 2a. Contact + missing-pieces endpoint (submissions currently discarded)

**Why it falls short.** Both forms are stubs that fake success and **discard the data**. Verified 2026-07-07:
- `app/pages/contact-us.vue` — `handleContactFormSubmit()` just sets `formSubmitted=true`; comment: "TODO(wire): the old form posted to Webflow's form handler — replacement endpoint is an open question."
- `app/pages/missing-pieces.vue` — `submitMissingPieces()` just sets `formSuccess=true`; the `message` ref holds the text "for future wiring".
No backend endpoint exists (the `email_*` routers are admin infrastructure; grep for a public contact route in `demat-backend/app/api/routes/` returns nothing).

**This repo's asset.** The exact field inventory is already in the markup (verified against the templates):

| Form | Fields (name attrs) | Notes |
|---|---|---|
| Contact (`contact-us.vue`, form `wf-form-Contact-Form`) | `First-Name`, `Last-Name`, `email`, `Message` (textarea, maxlength 5000), `Consent` (required checkbox), `Marketing-Consent` (optional checkbox) | all text inputs maxlength 256 except Message |
| Missing pieces (`missing-pieces.vue`, form `wf-form-Missing-Pieces`) | `Message` (textarea, required, maxlength 5000) | single field |

Also: `POST /mailing-list/subscribe` already exists backend-side (public, no auth) — a candidate hook for `Marketing-Consent`.

**First three steps:**
1. Draft the endpoint spec for Edward (this is the deliverable — do NOT build backend code first): proposed routes (e.g. `POST /contact` and `POST /missing-pieces`, naming Edward's call), request bodies from the field table above, destination (email to whom? stored rows + notification?), and spam posture (the old Webflow handler did its own spam filtering; propose at minimum a honeypot field + rate limit since the endpoints are public/unauthenticated).
2. Get Courtney's decisions: where submissions land (which inbox a human reads), and whether `Marketing-Consent=true` should also call `POST /mailing-list/subscribe`.
3. After Edward ships it (his branch/PR per rule 4): un-stub the two handlers — replace the fake-success bodies with a `$fetch` POST, keep the existing success/error markup and copy byte-identical (visible behavior stays parity), and log the change in migration-map.md's `# Implementation log`.

**You have a result when:** a test submission from the deployed site **lands somewhere a human actually reads** (confirmed receipt by Courtney), and the on-page success state is unchanged.

**Blockers:** Edward capacity (new backend endpoint); Courtney's destination decision. Launching with discard-on-submit through the soak period is itself a Courtney decision — flag it.

### 2b. Dedicated rentals endpoint (retire the reservations workaround)

**Why it falls short.** Shipping-member rentals POST to the **reservations** endpoint. `app/plugins/reservation-cart.client.ts` (in `confirmReservation`): "SHIPPING MEMBER WORKAROUND: uses the reservations endpoint for now. TODO: Switch to dedicated rental endpoint once POST /private_clothing_items/rentals exists." Verified backend-side 2026-07-07: `demat-backend/app/api/routes/private_clothing_items/rentals.py` has **no create route** — only `GET ""`, `GET /{rental_id}`, and three `POST .../buy...` purchase routes. So shipping rentals are stored as reservations, conflating two domain concepts (and whatever shipment/MyParcel logic rentals should trigger).

**This repo's asset.** The frontend already distinguishes the flows: `useReservationCartUi()` carries `reservationFlowType: 'reservation' | 'rental'` (set from `isShippingMember()`), and the single TODO comment marks the one call site to change. Copy and modals are already dual-mode.

**First three steps:**
1. Spec `POST /private_clothing_items/rentals` with Edward: payload (presumably `{ clothing_item_ids }` like reservations), what differs semantically (rental record creation, shipment/MyParcel hookup — this overlaps PR #45's returns/shipments domain), and how existing workaround-created reservations should be treated.
2. Backend implementation on a new branch off the working branch `claude/rental-returns-myparcel-a2v09b`, PR to Edward (rule 4).
3. Frontend: in `confirmReservation`, branch on flow type — rentals POST the new endpoint, local reservations keep `/private_clothing_items/reservations`. Verify against the test API (any test-data creation = rule 1, Courtney's OK).

**You have a result when:** a shipping-member confirm in the test env creates a **rental** record (visible on `/my-rentals` via `GET /private_clothing_items/rentals`) and **no** reservation record, while a local-member reservation still creates a reservation. Note: confirming a rental is not a Stripe payment, so this is automatable; anything that reaches a Stripe checkout stays human-only (rule 3).

**Blockers:** Edward capacity; PR #45 (rental-returns-MyParcel, OPEN as of 2026-07-07) owns the adjacent domain and should merge first or be coordinated; test verification needs test-DB write OKs.

### 2c. Blog authoring workflow (API-published posts + the sitemap gap)

**Why it falls short.** Phase 6 gave the blog an API (`GET /blogs?locale=en|nl`, `GET /blogs/{slug}?locale=…` — backend PR #46, OPEN as of 2026-07-07), and `app/composables/useBlogPosts.ts` is API-first with a 5 s timeout and silent fallback to the bundled `~/data/blog.json`. But **the sitemap is bundled-json-driven**: `app/server/routes/sitemap.xml.ts` does `import blogData from '~/data/blog.json'` and emits blog URLs from it. So a post published via the API appears on `/also-this` and `/blog/{slug}` — but **never in the sitemap** without a frontend redeploy. The backend `BlogPost.sitemap_indexing` column (`demat-backend/app/db/models.py:684`) also has no frontend consumer.

**This repo's asset.** The gap is one file: `sitemap.xml.ts` is the only server route. `useBlogPosts` already proves the API-with-fallback pattern. Seed tooling exists (`demat-backend/scripts/seed_blog.py`, `scripts/upload_blog_images.py`), and `app/DEPLOY.md` §5b documents the prod data rollout.

**First three steps:**
1. Sequencing prerequisite: PR #45 must merge before PR #46's migration can apply to main — verified: blog migration `b8c2d4e6f0a1`'s `down_revision` is `f0a1b2c3d4e5` (the rental-returns migration that exists only on the working branch). Confirm merge order with Edward; don't build on unmerged assumptions.
2. Propose to Courtney: make `sitemap.xml.ts` fetch `GET /blogs?locale=en` and `?locale=nl` server-side, honoring `sitemap_indexing`, with fallback to the bundled `blog.json` on API failure (preserves today's behavior when the API is down). Decide explicitly what an **empty** API list means — `useBlogPosts` currently treats empty as failure and falls back; the sitemap should document its own choice.
3. Define and document the authoring path end-to-end (today: seed scripts run by Edward/Courtney; candidate future: admin UI or direct API writes) so "publish a post" has an owner and a runbook.

**You have a result when:** a post published via the API (no frontend deploy) appears on the site **and** in `/sitemap.xml`; setting `sitemap_indexing=false` (or deactivating it) removes it from the sitemap.

**Parity guard:** the current sitemap emits a 7th blog post the live Webflow sitemap lacked — that is an **accepted/deferred** disposition (see `demat-change-control`); do not "fix" it as part of this work without approval.

**Blockers:** PR #45 → #46 merge sequencing (Edward); prod migration+seed runs are prod-data operations (Edward's call per DEPLOY.md §5b).

### 2d. PDP indexing (an SEO product decision, not a bug)

**Why it falls short (from an SEO lens).** Every product detail page ships `robots: noindex` with static `og:title`/`twitter:title` = `'Product'`, and the real title only appears **post-hydration** (client-side, after JS runs) — `app/pages/product.vue`, useHead block near the comment `// SEO (source head: title/og:title/twitter:title "Product", robots noindex…)`. Products are invisible to search.

**What parity says vs what SEO wants.** Parity says keep it: this is a **verbatim port of the old site's head** — not a migration bug. SEO wants indexed PDPs with real titles/descriptions/OG images served in the initial HTML. This is therefore a **product decision for Courtney**, and the parity doctrine means the default answer is "keep noindex" until she rules otherwise.

**This repo's asset.** `product.vue` already computes the real `"<name> – Dematerialized"` title (just too late for crawlers); the item fetch (`GET /clothing_items/clothing_item/{sku}`) could move server-side; `sitemap.xml.ts` is the obvious place to enumerate product URLs if indexing is approved.

**First three steps:**
1. Put the decision to Courtney with the trade-offs: indexing PDPs is a deliberate parity deviation; the `?sku=` query-param URL shape is weak for SEO but **changing URLs violates URL parity** — so scope any proposal as "index without changing URLs".
2. If approved: move the item fetch to SSR (`useAsyncData`) so title/meta/OG are in the initial HTML, drop `noindex`, set real og:title/description, and decide sitemap inclusion (all products? available only?). SSR-ifying the fetch is a behavior change — hydration care required (see the hydration rule in `demat-architecture-contract`).
3. Verify like a crawler: `curl` the raw SSR HTML of a PDP and confirm the real title and absence of noindex **without executing JS**.

**You have a result when:** `curl -s 'https://<host>/product?sku=<known>' | grep -i '<title>\|robots'` shows the item's real title and no noindex, and one test PDP gets indexed (Search Console or crawler simulation).

**Blockers:** Courtney's product decision (hard gate); SSR fetch adds backend load per PDP view — worth flagging to Edward.

### In-flight observation (as of 2026-07-07)

The working tree contains a substantial **uncommitted Capacitor mobile-app workstream**: `app/MOBILE.md`, `app/ios/`, `app/android/`, `app/capacitor.config.ts`, `app/plugins/native.client.ts`, `app/composables/useNativeApp.ts`, `app/assets/css/8-native-app.css`, and `build:mobile`/`mobile:*` npm scripts — "Capacitor 8 shells around this same Nuxt app", gated on `Capacitor.isNativePlatform()` so browsers keep the Webflow-faithful site. Its approval/landing status is **not recorded in this skill** — check `git status`, `app/MOBILE.md`, and the migration-map Implementation log before touching or duplicating it, and treat it under change control like everything else.

---

## Direction 3 — Platform quality (typecheck, CI, lint)

**Why the current state falls short.** Verified 2026-07-07: the frontend repo has **no `.github/` directory** (zero CI), **no ESLint config** anywhere, **no Prettier**, `vue-tsc` is **not installed**, and there is no `typecheck` script. The Netlify build is the only automated check. Every QA pass so far was manual/fleet-driven.

**Why this doesn't violate parity — but still needs approval.** Typecheck, lint, and CI **don't touch runtime output** — the shipped site is byte-identical. But they are scope additions (new devDependencies, new workflow files) and adding GitHub Actions implies **pushing the repo**, which is rule 2 territory. Each piece is a separate proposal through `demat-change-control`.

**This repo's asset.** TypeScript strict mode is already on (`app/tsconfig.json` extends the generated `.nuxt/tsconfig.json`, which sets `"strict": true`), so the codebase was written under strict checking even without a gate. The route-crawl tooling (Direction 1a / `demat-diagnostics-toolkit`) doubles as the smoke test. The dependency surface is tiny (5 runtime deps).

**First three steps:**
1. **Local pilot before proposing anything**: run `npx nuxi typecheck` in `app/` (it fetches `vue-tsc` on demand) and triage the error baseline. If it's zero or small, gating is cheap; if large, the proposal must include the burn-down. (Running this locally changes nothing and needs no approval; adding it as a gate does.)
2. Propose the CI shape to Courtney: a GitHub Actions workflow that runs `npm ci`, `npx nuxi typecheck`, `npm run build`, then the route-crawl smoke test against `npx nuxi preview` (or a Netlify deploy preview URL) asserting status/title/robots on every sitemap route. Get explicit OK for the push (rule 2).
3. ESLint last: `@nuxt/eslint` flat config, tuned so it never forces rewrites of verbatim-ported markup — e.g. `vue/no-v-html` must be off (blog bodies render via `v-html`), and formatting rules must not touch the ported inline styles/templates. Lint is advisory until the baseline is clean.

**You have a result when:** CI goes **red on a deliberately-broken page title** (or injected type error) and **green on main**, with the production build output unchanged (no runtime diff).

**Blockers:** pushing requires Courtney's OK; unknown typecheck baseline size; Netlify-preview-URL plumbing for the smoke test.

---

## Direction 4 — More locales (the honest blocker analysis)

**Why the current state falls short.** The site has **three coexisting translation mechanisms**, and two of them are EN/NL-binary — a third locale cannot render today:

| Mechanism | Where | Third-locale ready? |
|---|---|---|
| Locale JSON + `$t()` | `app/i18n/locales/en.json` / `nl.json` — currently **consent copy only** (one `consent` namespace, 17 keys) | ✅ yes — add a JSON file + config entry |
| Per-file T dicts | `const T = { key: { en, nl } }` in 16+ files (grep `const T` hits `AuthModal`, `OnboardingModal`, 5 cart modals, `contact-us`, `missing-pieces`, `memberships`, `product`, `wish-list`, `mailing-list`, `my-membership`, `purchase-success`, `CartOverlay`; plus named dicts like `RENTALS_T` in `my-rentals.vue` and `DONATIONS_T` in `donations-credits.vue`) | ❌ typed `{ en, nl }` only |
| Lang-spans + CSS | duplicated `.lang-en`/`.lang-nl` spans toggled by `app/assets/css/6-lang-toggle.css` on `html[lang^='nl']` — **466 `lang-nl` occurrences across 26 .vue files** (as of 2026-07-07) | ❌ CSS only knows en/nl |

The exit plan is already written into the code: `6-lang-toggle.css`'s header comment says the bridge is "**Retired once all copy moves into locale files.**" Consolidation into locale JSON is the prerequisite for any third locale — and it is copy-touching work, so it goes through change control batch by batch.

**This repo's asset.** `@nuxtjs/i18n` is already multi-locale-capable (`strategy: 'prefix_except_default'` — a third locale is a config entry + JSON file + URL prefix). The NL-placeholder protocol (EN text in the `nl` slot, detectable as `nl == en` equality — see `demat-i18n-and-consent`) proves strings are already being managed as editable data.

**First three steps:**
1. **Inventory the string surface** (measurement, no approval needed): per-file counts of lang-span pairs (`grep -rc 'lang-nl' app/pages app/components --include='*.vue'`) and T-dict entries; produce a table of pages ranked by consolidation cost. Flag which NL strings are still EN placeholders (they must get real Dutch before or during consolidation — Courtney supplies translations).
2. **Propose a consolidation batch to Courtney**: pick one low-risk page; the proposal's core guarantee is that consolidation is **copy-identical** — the EN string moves byte-for-byte from markup/dict into `en.json`, NL likewise into `nl.json`, and the rendered EN and NL HTML diff clean before/after.
3. **Pilot one page**: move its strings to a page namespace in the locale files, replace lang-spans with `$t()`, verify EN+NL renders unchanged (diff rendered HTML — see `demat-validation-and-qa` for the evidence bar), then add a third-locale JSON (e.g. `de.json`) for that page's namespace and render it.

**You have a result when:** a third locale renders **one full page with zero lang-span leakage** (no `.lang-en`/`.lang-nl` content bleeding through from the binary mechanisms) **and** the EN/NL renders of that page are provably unchanged versus pre-consolidation.

**Blockers:** Courtney approval per batch (copy-touching); pending real-Dutch translations for the flagged placeholders; translation sourcing for the new locale is a human/agency task; the locale-links click interceptor (`plugins/locale-links.client.ts`) currently hardcodes `/nl` prefixing and would need generalizing — a behavior change requiring its own review.

---

## Cross-cutting blockers and dependencies

| Dependency | Blocks | Status as of 2026-07-07 |
|---|---|---|
| Production cutover (`app/DEPLOY.md` steps) | 1a prod monitoring target; realistically everything else's priority | Not executed; the hardest live problem → `demat-cutover-campaign` |
| Backend PR #45 (`claude/rental-returns-myparcel-a2v09b`) | PR #46 migration chain (blog `down_revision` points at #45's migration); 2b domain overlap | OPEN |
| Backend PR #46 (blog models + API, `claude/blog-models`) | 2c API-driven sitemap; prod blog data rollout (DEPLOY.md §5b) | OPEN, no reviewers assigned |
| Edward capacity | 2a endpoint, 2b endpoint, backend CORS additions, prod data runs | Confirm before starting any backend spec |
| Courtney decisions | 1b specifics; 2a destination; 2d index-or-not; 3 CI push; 4 batch approvals + translations; scheduling infra for 1a | Ask, don't assume |
| Unpushed main | Anything requiring remote CI or collaboration | Commits after origin are deliberately unpushed (rule 2) |

## Anti-goals — what this frontier is NOT

- **Nothing that breaks URL or SEO parity.** URL structure (including `/product?sku=`) stays unless Courtney explicitly rules otherwise; the sitemap/head baseline is the contract.
- **No redesigns.** "Improving" the UI, restyling, restructuring markup, or modernizing ported patterns stays out of scope — visual/behavioral parity is doctrine, and even bug-looking things have recorded dispositions.
- **Don't fix accepted/deferred items without approval**: the `/account` page's dead local `isAuthenticated` ref, Google Fonts loading unconditionally (not consent-gated), and the sitemap's 7th blog post are all ACCEPTED/DEFERRED. The one **approved** copy fix is the PDP cart-full alert saying "up to 10 items" (`app/pages/product.vue`, `cartFullAlert`) while the real cap is `MAX_ITEMS: 5` (`useCartManager.ts`) — a ported bug, sanctioned to fix; log it in the Implementation log when done. Details → `demat-change-control`.
- **No routing around the discipline rules**: no automated Stripe payments, no unsanctioned pushes/PRs, no direct backend commits, no test-DB writes without a per-instance OK.
- **No silent scope creep inside approved items** — an approved endpoint wiring does not license copy edits, style tweaks, or refactors along the way.

## Provenance and maintenance

Facts verified against the repos on **2026-07-07** (frontend HEAD `4ef31bf` on `main` plus an uncommitted mobile workstream in the working tree; backend on branch `claude/blog-models`). PR states, working-tree contents, and counts are volatile — re-verify before acting:

| Claim | Re-verification command (run from `/Users/courtneyyocabet/webflow-migration` unless noted) |
|---|---|
| Contact/missing-pieces still stubbed | `grep -n "TODO(wire)" app/pages/contact-us.vue app/pages/missing-pieces.vue` |
| Rentals workaround still present | `grep -n "SHIPPING MEMBER WORKAROUND" app/plugins/reservation-cart.client.ts` |
| No backend create-rental route | `grep -n "@router.post" /Users/courtneyyocabet/demat-backend/app/api/routes/private_clothing_items/rentals.py` |
| Sitemap still bundled-json-driven | `grep -n "blog.json" app/server/routes/sitemap.xml.ts` |
| PDP still noindex / 'Product' | `grep -n "noindex\|og:title" app/pages/product.vue` |
| Cart-full copy bug (10 vs 5) still unfixed | `grep -n "up to 10" app/pages/product.vue && grep -n "MAX_ITEMS: 5" app/composables/useCartManager.ts` |
| Locale JSON still consent-only | `python3 -c "import json;print(list(json.load(open('app/i18n/locales/en.json')).keys()))"` |
| Lang-span surface size | `grep -rno 'lang-nl' app/pages app/components --include='*.vue' \| wc -l` (466 on 2026-07-07) |
| 6-lang-toggle retirement note | `head -2 app/assets/css/6-lang-toggle.css` |
| Still no CI / lint / typecheck | `ls .github 2>&1; ls app/eslint.config.* 2>&1; ls app/node_modules/.bin/vue-tsc 2>&1` |
| Backend PR #45/#46 state | `gh pr list --repo Edwardvaneechoud/demat-backend --state open` |
| Blog migration chain (#46 needs #45) | `grep -n down_revision /Users/courtneyyocabet/demat-backend/alembic/versions/b8c2d4e6f0a1_add_blog_tables.py` |
| €8 fixture + credits item still open | `grep -n "8.00\|Credits total" migration-map.md` |
| Mobile workstream commit status | `git status --short \| grep -E "ios/|android/|MOBILE"` |
| 64-check crawl precedent | `grep -n "64 checks" migration-map.md` |

When any frontier item lands, record it in migration-map.md's `# Implementation log` in the same turn (project rule), and update or strike the corresponding section here.
