---
name: demat-validation-and-qa
description: Load when deciding whether work on the Dematerialized Nuxt app (app/) is DONE — what counts as evidence, how to verify a ported page against old/, what acceptance bar a change must meet, how to run an adversarial verification fleet, or how to QA authed commerce flows (wishlist, reservations, purchase checkout, onboarding). Also load when someone asks "how do I test this?", "is there a test suite?", "how was X verified?", or proposes adding tests/CI/typecheck to the frontend.
---

# Validation & QA: what counts as evidence in this repo

**What this covers:** the evidence bar for the Dematerialized Webflow→Nuxt migration repo — the four validation methods actually used here, the exact acceptance bars with historical precedent, the adversarial-fleet recipe, the authed-flow QA checklist, and the (gated) path to adding automated checks.
**When to use:** before declaring any page port, fix, or feature "done"; when planning verification for a new batch of work; when a reviewer asks what proof exists.
**When NOT to use:** for the measurement scripts themselves (crawler, SEO differ, NL-placeholder scanner, sitemap comparator) → **demat-diagnostics-toolkit**. When validation FAILS and you need to triage a symptom → **demat-debugging-playbook**. For what "parity" means and how the old site worked → **webflow-parity-reference**. For whether a fix is even allowed → **demat-change-control**.

---

## 1. The reality: there is no automated safety net

As of 2026-07-07, the frontend (`app/`) has:

| Gate | Status |
|---|---|
| Test suite | **None** — no test script in `app/package.json`, no test files |
| CI | **None** — no `.github/` directory in this repo (Netlify's build on deploy is the only automated check) |
| Lint | **None** — no ESLint/Prettier config anywhere |
| Typecheck | **None** — no `vue-tsc` installed, no `typecheck` script, no `typescript.typeCheck` in `nuxt.config.ts` |

All validation is manual and evidence-based. The four methods, in the order they're typically applied:

1. **Side-by-side comparison** vs the old Webflow export (§2) — for visual/copy/behavior parity.
2. **Route crawls** — scripted HTTP checks of every route (status, title, key content) → scripts live in **demat-diagnostics-toolkit**.
3. **Adversarial verification fleets** (§4) — independent verifier agents prompted to *refute* fidelity claims.
4. **Live flow QA** against the test API / local backend (§5) — for authed commerce behavior.

**"Looks right to me" is never evidence.** Every "done" claim needs one of the four above, named explicitly (which method, what was checked, what the result was). Precedent: the implementation log in `migration-map.md` records the method next to every landed item.

**Jargon:** *parity* = the ported page is indistinguishable from the old Webflow site in layout, styling, copy, URLs, and behavior (the project's prime directive — see webflow-parity-reference). *Hydration* = Vue attaching to server-rendered HTML on the client; mismatches between SSR output and first client render are a recurring bug class here. *Adversarial fleet* = a batch of independent verifier sessions each assigned one page/claim and instructed to try to disprove it. *Soak* = the post-cutover period where Webflow stays paid/live as a fallback before subscriptions are cancelled (see demat-cutover-campaign).

## 2. The side-by-side method (per page)

The source of truth is the read-only Webflow static export. Never edit anything under `old/`.

1. **Open the old page** directly in a browser (note the directory name contains a space and `(2)`):
   ```bash
   open "old/dematerialized-24fc59.webflow (2)/faq.html"   # substitute the page
   ```
2. **Open the new page** on the dev server (`cd app && npm run dev`, then `http://localhost:3000/faq`). For signed-in pages use the mock-session or full-local mode → **demat-build-and-env**.
3. **Compare, in this order:** layout (section by section), copy (verbatim — lowercase styling included), interactions (accordions, modals, hovers, carousels), then **every breakpoint**. The site's breakpoints, preserved verbatim from Webflow (migration-map.md Appendix I):

   | Breakpoint | Kind |
   |---|---|
   | 479px | max-width (small mobile) |
   | 480px | max-width (alternate small mobile) |
   | 600px | max-width (mobile variant, styles.css) |
   | 767px | max-width (tablet edge) |
   | 768px | max-width (tablet, my-account/sidenav sheets) |
   | 991px | max-width (desktop edge) |
   | 1440px | min-width (large desktop) |

   Resize through each boundary on both old and new; layout shifts must match.
4. **SEO: view-source meta diff.** Open view-source on both (or `curl -s http://localhost:3000/faq | grep -iE '<title|<meta|application/ld'` vs the same grep over the old HTML file) and compare `<title>`, description, og:*, twitter:*, robots, and JSON-LD **verbatim**. The bar is exact text equality unless a deviation is logged as sanctioned (see webflow-parity-reference).
5. **NL pages:** compare `/nl/<route>` against the live-Dutch captures in `nl-reference/` (17 `*.nl.html` files + `live-sitemap.xml`, captured from production Webflow 2026-07-05). **Stale-FAQ caveat:** the live NL FAQ was found stale (old rental model, wrong hours, outdated credit rules, 4 untranslated Q&As), so `nl-reference/faq.nl.html` must **not** be treated as truth for FAQ copy — the repo's FAQ was realigned to current EN with EN placeholders awaiting Courtney's Dutch (migration-map.md "Post-QA fixes round 2", item #5). Do not report EN-under-`.lang-nl` as a bug; do not paste the stale NL back.

Where the old export can't show behavior (it's static HTML), the behavior source of truth is the production embed JS in `old/demat-webflow-test/` — read the relevant `.js` file rather than guessing.

## 3. Acceptance bars (with precedent)

New work meets the same bars that closed each phase. These numbers are logged in `migration-map.md` → `# Implementation log`:

| Bar | Precedent (all verifiable in the Implementation log) |
|---|---|
| **Route crawl: 100% green, verbatim titles** | Phase 3: "Route crawl: 33/33 checks green with verbatim titles (incl. filtered catalog URLs and a 404 check)" |
| **Final crawl: every page, both locales** | Phase 5: "Final crawl (2026-07-05): 64 checks green — every page EN+NL, all blog posts EN+NL, product page, robots; sitemap verified separately" |
| **SEO sweep: ZERO findings** | Phase 5: "SEO regression sweep (2026-07-05): 13 verifiers over every page vs the old export heads — zero findings" |
| **Consent: nothing loads pre-grant** | §9 Verification: "scripts blocked until category granted; preference persistence". Concretely: with no `demat-consent` cookie, the Network tab must show zero requests to googletagmanager.com, static.hotjar.com, or connect.facebook.net; they load only after the matching category is granted (`onConsentGranted` in `app/plugins/analytics.client.ts`) |
| **i18n: both locales, no missing strings** | §9 Verification: "`/` vs `/nl/` for every route; all embedded dicts' strings present in both locales" |
| **Adversarial fleet run after every substantive batch** | Phase 3: 25-verifier fleet (§4) |

A change that touches many pages (CSS, navbar, plugins, i18n) re-runs the crawl + a fleet, not just a spot check on the page you edited — the 4-my-account.css incident (a global stylesheet squashing an unrelated page's card on mobile) is the canonical reason.

## 4. The adversarial-fleet recipe

Standing policy (Courtney): **after every substantive batch of work, run an adversarial verification fleet.** This is not optional polish; it is how three real bugs were caught in Phase 3.

Recipe:

1. **Scope one verifier per page or per claim.** Give each an independent session/agent with no access to the author's reasoning.
2. **Prompt them to REFUTE, not confirm.** The instruction is "find where this page deviates from `old/…/<page>.html` and the embed JS", not "check that it matches". Confirmation-framed verifiers rubber-stamp.
3. **Expect false positives.** Historical rate: **25 verifiers → 13 findings → 3 real fixes** (purchases initial view, mobile-nav dead `/wishlist` href, footer auth-link visibility). The other 10 were sanctioned deviations or misreads.
4. **Re-verify every finding against `old/` yourself before acting.** A finding is only real if the old export/embed JS actually behaves differently AND the deviation isn't sanctioned. Check the disposition table in **demat-change-control** and the sanctioned-deviation list in **webflow-parity-reference** first.
5. **Fixes from findings go through the normal loop:** fix → log in `migration-map.md` Implementation log in the same turn → re-verify.

**Known accepted/deferred findings — verifiers will rediscover these; do NOT "fix" them without Courtney's approval** (dispositions ruled 2026-07-07, see demat-change-control):
- `/account` page's dead local `isAuthenticated` ref (sign-out unreachable on mobile /account) — accepted/deferred.
- Google Fonts loading unconditionally (not consent-gated) — accepted/deferred.
- Sitemap emitting a 7th blog post the live sitemap lacked — accepted/deferred.
- PDP cart-full copy "up to 10 items" (`app/pages/product.vue`, real cap is `MAX_ITEMS: 5` in `app/composables/useCartManager.ts`) — **confirmed bug, approved to fix** (a sanctioned deviation from verbatim copy; log it in the Implementation log when fixed). As of 2026-07-07 the copy still says 10.
- Escape key not closing the cart overlay, PDP `robots: noindex` + static og:title "Product", `4-my-account.css` on disk but unloaded — all **intentional parity/design**, not bugs.

## 5. Flow-QA checklist for authed commerce

Precedent: the Phase 4 "End-to-end authed commerce QA (2026-07-05, vs local backend + test DB)" log entry. Run against the **local backend + test DB** (setup → **demat-build-and-env**, which ships the auth-bypass runner) or the hosted test API with a real test login. The checklist:

- [ ] **Wishlist round-trip:** heart an item → POST fires → item appears on `/wish-list` → remove → DELETE fires.
- [ ] **Reservation lifecycle:** cart overlay shows the **5-max messaging** (reservation cart caps at `MAX_ITEMS: 5`) → local-mode reservation modal shows the **€5 no-show/cancellation policy copy** → confirm → a real reservation is created → renders as "pending" on `/reservations`.
- [ ] **Purchase checkout:** live credit balance fetched, **credit math correct** (credits applied = min(balance, total); historical check verified the 50% discount math), order POST succeeds, backend validation errors (e.g. the rented-items-only rule) surface verbatim in the modal error slot.
- [ ] **Onboarding wizard:** opens for a member with incomplete profile, all 8 steps show verbatim copy.

**Hard stops (non-negotiable discipline rules — see demat-change-control):**
- **STOP at Stripe.** Completing a Stripe payment (membership join, item purchase) is **human-only, never automated** — QA drives the flow up to the Stripe redirect and stops. The Phase 4 log records this as "untested-by-design: completing a Stripe payment (needs a human)".
- **Any write to the hosted TEST database (migrations, seeds, data mutations) requires Courtney's explicit OK, each time.** Flow QA creates rows (reservations, orders); get the OK first, and log leftover artifacts. Known artifacts already in the test DB: a pending reservation (item 617), a published €8.00 donation session, and the test profile's `height_cm: "151"` (all logged in the Implementation log). Inventory → **demat-run-and-operate**.

Hydration-sensitive checks belong in flow QA too: reload each authed page and confirm no wrong-state flash (auth-gated chrome stays hidden until the session resolves) and no mis-nested content from SSR/client branch mismatches — both bug classes have occurred twice (see demat-failure-archaeology).

## 6. i18n validation

- **Every route, both locales:** visit `/x` and `/nl/x` for each of the ~30 pages; the NL page must render Dutch (or a known placeholder) with `html[lang]` = `nl` and working locale switcher.
- **NL placeholder scan:** placeholders have **no marker convention** — they are detectable only as `nl == en` string equality in the per-file `T` dicts and in `.lang-en`/`.lang-nl` span pairs. The scanner script and its interpretation guide (including the list of intentionally-identical pairs like "items", social-channel names, fit options) → **demat-diagnostics-toolkit**.
- **T-dict completeness:** every per-file dict entry must carry both `en` and `nl` keys (an EN placeholder in the `nl` slot is acceptable and flagged; a missing key is a bug). The global locale files `app/i18n/locales/en.json` / `nl.json` (consent namespace) must stay key-identical.
- Adding strings correctly → **demat-i18n-and-consent**.

## 7. Adding automated validation (gated — do not just do it)

Adding tests/CI/lint/typecheck is **new scope**, and this project's doctrine is that anything beyond the sanctioned scope is a change-control event: **propose to Courtney first** (→ demat-change-control). Courtney has named "platform quality (tests/CI/typecheck added without violating parity)" as a legitimate post-migration frontier (→ demat-research-frontier), so proposals are welcome — but they are proposals.

Candidate shapes (open/candidate status, none approved as of 2026-07-07):
- **Route-crawl script as a smoke test** — the diagnostics-toolkit crawler codifies the exact bar already used (Phase 3's 33/33, Phase 5's 64 checks); running it before/after changes is the lowest-friction win and touches no app code.
- **`vue-tsc` typecheck** (`npx nuxi typecheck`) — `vue-tsc` is not currently installed; adding it is a dependency change and its findings on ported verbatim code may be noisy. Scope any proposal to "report, don't gate" first.
- CI would require deciding where it runs (this repo has no `.github/`; Netlify deploy previews are the current pipeline).

None of these may alter rendered output — parity constraints bind tooling too.

## 8. When NOT to use this skill

| You need | Go to |
|---|---|
| The crawler / SEO differ / placeholder scanner / sitemap comparator scripts | **demat-diagnostics-toolkit** |
| To debug a failure the validation found | **demat-debugging-playbook** |
| To know if a deviation is sanctioned / who approves what | **demat-change-control** |
| How the old site behaved, reading `old/` | **webflow-parity-reference** |
| Dev environment, mock auth, local backend | **demat-build-and-env** |
| Cutover-specific verification (DNS, prod env, soak checks) | **demat-cutover-campaign** |

## Provenance and maintenance

Facts verified against the repo on **2026-07-07** (HEAD `4ef31bf`; note: uncommitted Capacitor mobile work was in the working tree at verification time — `app/package.json` now carries Capacitor deps/scripts but still no test/lint/typecheck tooling; a "Mobile apps" section exists in the Implementation log and mobile work meets the same bars).

Re-verification one-liners for anything that may drift:

| Claim | Command |
|---|---|
| Still no test/lint/typecheck scripts | `cat app/package.json` (inspect `scripts`) |
| Still no CI | `ls .github app/.github 2>/dev/null` (expect nothing) |
| Still no lint config | `ls app/.eslintrc* app/eslint.config.* 2>/dev/null` |
| Acceptance-bar precedent lines intact | `grep -n "33/33\|64 checks\|zero findings\|25 Fable" migration-map.md` |
| Phase 4 flow-QA record intact | `grep -n "End-to-end authed commerce QA" migration-map.md` |
| "up to 10" copy bug fixed yet? | `grep -n "up to 10" app/pages/product.vue` (empty = fixed; then update §4) |
| Reservation cap still 5 | `grep -n "MAX_ITEMS" app/composables/useCartManager.ts` |
| Consent gating still wired | `grep -n "onConsentGranted" app/plugins/analytics.client.ts` |
| nl-reference captures present | `ls nl-reference/` (17 `*.nl.html` + `live-sitemap.xml`) |
| Old export path unchanged | `ls "old/dematerialized-24fc59.webflow (2)/" \| head` |
| Stale-NL-FAQ / placeholder record | `grep -n "stale" migration-map.md` (Post-QA round 2, item #5) |
| Locale files still key-identical | `python3 -c "import json;a=json.load(open('app/i18n/locales/en.json'));b=json.load(open('app/i18n/locales/nl.json'));print(sorted(a['consent'])==sorted(b['consent']))"` |
