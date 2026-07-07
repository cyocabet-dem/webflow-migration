---
name: demat-failure-archaeology
description: Load when a symptom in the Dematerialized Nuxt app looks familiar or you are about to "fix" something — sign-out/auth buttons invisible, cart icon or items misrendering after reload, catalog navbar filter links not applying, NL text showing English, 422 on profile size updates, signed-out flash on account pages, blank sidenav gaps, credits totals looking wrong, the "up to 10 items" cart copy, 4-my-account.css, or anything touching SiteNavbar join-now/faq buttons. Also load before reverting/reintroducing old markup, before trusting a verifier finding, or when asked "was this already tried/fixed/decided?" — this is the incident chronicle that stops re-fighting settled battles.
---

# Dematerialized failure archaeology

**What this covers:** every known incident, dead end, revert, and defect disposition in the Webflow→Nuxt migration (repo `/Users/courtneyyocabet/webflow-migration`, app in `app/`), each as Symptom → Root cause → Evidence → Fix → Status. Plus the dead-code decisions, the bug ledger with Courtney's rulings, and the test-database artifacts QA left behind.

**When to use:** a bug report matches a symptom below; you're tempted to change SiteNavbar join/faq markup, re-add a CSS file, "translate" English text under `.lang-nl`, or wire up `/account`'s auth state; you need to know whether a defect is approved-to-fix or accepted-as-is.

**When NOT to use:** to learn how a subsystem works today (→ `demat-architecture-contract`, `demat-commerce-and-auth`, `demat-i18n-and-consent`); to triage a brand-new symptom with no history match (→ `demat-debugging-playbook`); to decide whether a change is in scope at all (→ `demat-change-control`); to run the cutover (→ `demat-cutover-campaign`).

Terms used below: **hydration** = Vue attaching client behavior to server-rendered HTML; Vue does **not** patch `class`/`style` attribute mismatches during hydration, so SSR-vs-client visual differences silently persist. **Parity** = the project's governing rule that the Nuxt app reproduces the old Webflow site one-to-one (layout, copy, URLs, behavior — even old bugs). **The squash** = commit `e44b2a5`, which contains the entire app build in one commit.

## Where the history lives

```
git log --oneline main
# 4ef31bf  Correct #8: hide join-now buttons for members; swap the nav-links join link for faq
# c862d9b  Log QA round 2 in implementation log                        (docs only)
# 3c600b9  QA round 2 (8-issue list, 19 files, +527/-200)
# 8e55a3e  Log post-QA fixes in implementation log                     (docs only)
# 78a1c02  Fix sign-out visibility, NL locale persistence, cookie widget, cart-icon-on-load
# e6ca710  Log blog image DB+S3 storage; deploy runbook addition        (docs only)
# e44b2a5  THE SQUASH — the whole app build; no diffs exist for anything earlier
```

Everything before `e44b2a5` (including the 4-my-account.css incident) exists **only as narrative** in `migration-map.md` under `# Implementation log` — there are no diffs to bisect. Incidents 1–4 = "Post-QA fixes (2026-07-06…)" / commit `78a1c02`; incidents 5–12 = "Post-QA fixes round 2 (2026-07-07…)" / commits `3c600b9` + `4ef31bf`.

As of 2026-07-07, main is at `4ef31bf` and is **deliberately unpushed** — never `git push` or open a PR without asking Courtney (see `demat-change-control`).

---

## Incident 1 — Sign-out button invisible everywhere (round 1)

- **Symptom:** the sign-out button never appeared — not in the navbar account dropdown, not on `/account` — even for authenticated users.
- **Root cause (two-part):** (a) *Port artifact*: the Webflow export ships the sign-in/sign-out buttons with inline `display: none` that the old `auth.js` flipped at runtime (see the sign-out button in `old/dematerialized-24fc59.webflow (2)/index.html` around line 483, with inline `display: none` in its style block); the markup was ported verbatim with no runtime flipper. (b) *Hydration-unsafe binding*: `/account` toggled the buttons with `:style="{ display: isAuthenticated ? … }"` — SSR renders signed-out, and Vue never patches the mismatched style at hydration.
- **Evidence:** `git show 78a1c02 -- app/pages/account.vue app/components/SiteNavbar.vue` — the diff swaps inline `display: none` → `display: block` and `:style` → `v-show` + `data-auth-gate`.
- **Fix:** navbar sign-out inline base set to `display: block` (visibility now via `v-show` from `useAuth()`); account.vue both buttons converted to `v-show` + `data-auth-gate` (`app/pages/account.vue:179,197`).
- **Status: FIXED in navbar; RESIDUAL DEFECT on /account, ACCEPTED/DEFERRED.** `app/pages/account.vue:14` declares a **local** `const isAuthenticated = ref(false)` that nothing ever sets (the page does not import `useAuth`; the only other occurrences are the `v-show`s at :179/:197). So on `/account` — a mobile-only page; desktop redirects to `/profile` in `onMounted` — sign-in always shows and sign-out is still unreachable. Stale `TODO Phase 4` comments sit at account.vue:17,23. **Courtney ruled this accepted/deferred on 2026-07-07 — do not fix without her approval.**

## Incident 2 — NL locale not sticking on link clicks (round 1)

- **Symptom:** on `/nl/...` pages, clicking any ported `<a href="/…">` anchor hard-navigated to the English route.
- **Root cause:** parity — ported markup keeps verbatim EN paths in anchors; the old site's `DematI18n.localizeHrefs()` rewrote them at runtime, and that runtime wasn't ported.
- **Fix:** new plugin `app/plugins/locale-links.client.ts` (added in `78a1c02`): a document-level click interceptor that prefixes `/nl` when the current route is on `/nl` and routes through vue-router (SPA navigation). Anchors with a `hreflang` attribute (the locale switcher) or `download`/`target≠_self`/modified clicks are exempt (locale-links.client.ts:13).
- **Status: FIXED — but this fix caused Incident 5.** Any future global link interception must be checked against query-driven pages.

## Incident 3 — Cookie widget added (round 1, feature not bug)

- **Symptom/gap:** the old site's Finsweet ConsentPro showed a persistent bottom-left reopen button; the custom consent system had none, so a decided user couldn't change their mind.
- **Fix:** new `app/components/consent/CookieWidget.vue` (in `78a1c02`), mounted in `app/layouts/default.vue`; `v-show="!bannerOpen && !preferencesOpen"` (v-show per the hydration rule), opens the preferences panel. Consent is one of the two sanctioned new-engineering areas, so this was in scope.
- **Status: SHIPPED.** Operating details → `demat-i18n-and-consent`.

## Incident 4 — Purchase-cart icon disappearing on page load (round 1)

- **Symptom:** reload a page with a persisted non-empty purchase cart → the navbar cart icon stayed hidden until the cart changed.
- **Root cause:** the classic **MutationObserver same-value miss**. SiteNavbar's `onMounted` hid the icon wrapper and relied solely on a MutationObserver of `#purchase-cart-nav`'s `style` attribute. But the cart hydrates from localStorage *before* mount and had already written the same `display` value — writing an identical value fires no mutation, so the wrapper was never shown.
- **Fix:** `app/components/SiteNavbar.vue:39-46` — extracted `syncWrapper()` that reads the nav's current `style.display`; called once at mount AND registered as the observer callback.
- **Evidence:** `git show 78a1c02 -- app/components/SiteNavbar.vue`.
- **Status: FIXED.** General lesson: localStorage/sessionStorage state exists before hydration/mount — never rely on observing a *change* to catch state that was set earlier.

## Incident 5 — Catalog navbar filter links broken (round 2 #2) — regression caused by Incident 2's fix

- **Symptom:** navbar catalog links (e.g. Workwear → `/clothing?categories=…`) stopped applying filters; clicking a different category from within `/clothing` did nothing.
- **Root cause:** the locale-links interceptor converted those links to SPA `router.push`es. `useCatalog` only read the URL query at init (which a full page load re-ran); with SPA navigation, init never re-fires, so the new query was ignored.
- **Fix (`3c600b9`):** a **loop-guarded `route.query` watcher** in `app/composables/useCatalog.ts`. `syncURL()` records `lastWrittenQuery` via an order-insensitive `serializeQuery()` *before* its `router.replace` (useCatalog.ts:735); the client-only watcher (useCatalog.ts:779-794) bails off `/clothing`//`/nl/clothing`, bails until `loaded`, and skips incoming queries equal to `lastWrittenQuery` — so its own replace echo can't feed back into a loop. External changes run `applyRouteQuery` (re-fetch on `q` change, re-apply selections).
- **Status: FIXED.** **Lesson (load-bearing): global link interception must consider query-driven pages** — anything that turns full reloads into SPA navigations must audit every page whose init reads the URL. Do not reorder the `lastWrittenQuery` write vs `router.replace`, and do not write the catalog URL outside `syncURL` — either reintroduces the loop.

## Incident 6 — Purchase-cart items rendered flex-centered (round 2 #3)

- **Symptom:** cart panel items appeared centered in the middle of the panel instead of top-aligned.
- **Root cause:** **hydration branch reuse.** SSR always renders the empty-state branch (`.cart-panel-empty`, a flex-centering container). The client had localStorage items before hydration, so Vue reused the SSR empty-state element as the container for the items list — items rendered inside the centering div.
- **Fix:** `app/components/cart/PurchaseCartPanel.vue:33-34,49` — a `hydrated` ref flipped in `onMounted`; `hasItems = computed(() => hydrated.value && items.value.length > 0)`; the template branches on that, so SSR and first client render match, and items switch in post-mount.
- **Status: FIXED.** This is the branch-structure corollary of the hydration rule: content that differs client-side pre-hydration must be gated behind a post-mount `hydrated` ref.

## Incident 7 — Sidenav blank gap while auth pending (round 2 #4)

- **Symptom:** account-page sidenavs showed a blank gap where the reservations link belonged while Auth0 was still resolving.
- **Root cause:** the default auth gate `html.auth-pending [data-auth-gate] { visibility: hidden !important }` hides but **reserves layout space**.
- **Fix (`3c600b9`):** collapse variant in `app/assets/css/7-auth-gate.css` — `html.auth-pending [data-auth-gate="collapse"] { display: none !important }` — applied to the reservations sidenav link across the account pages (and later reused by Incident 10's fix).
- **Status: FIXED.** Rule of thumb: gated elements that participate in layout flow need `data-auth-gate="collapse"`; overlay/absolute elements can use the default.

## Incident 8 — Profile size update returned 422 (round 2 #6)

- **Symptom:** saving height/size on `/profile` failed with HTTP 422 from the backend.
- **Root cause:** the backend requires custom-attribute **values as strings**; Vue auto-casts `type=number` v-models to numbers, so `height_cm` went out as a number.
- **Fix:** explicit cast at `app/pages/profile.vue:315`: `customAttributes.push({ key: 'height_cm', value: String(formData.heightCm) })`.
- **Status: FIXED.** Any new attribute write needs the explicit `String()`. **Side effect left in the hosted test DB:** Courtney's test profile now has `height_cm` = `"151"` (was unset) — recorded in the round-2 log; do not "clean it up" without her OK (test-DB writes require explicit approval each time).

## Incident 9 — my-rentals signed-out flash (round 2 #7)

- **Symptom:** authenticated users briefly saw the "sign in" view on `/my-rentals` before their rentals loaded.
- **Root cause:** the page defaulted `isAuthenticated = ref(false)`, so the sign-in view rendered before the auth check resolved.
- **Fix:** three-state view pattern in `app/pages/my-rentals.vue` — `authView: 'pending' | 'signin' | 'authed'` (my-rentals.vue:139), default `pending` shows a loading state; the init routine sets `signin` on every signed-out exit and `authed` otherwise (my-rentals.vue:443-457). Other account pages already used the loading-first pattern (e.g. purchases.vue's `View` union starting at `'loading'`).
- **Status: FIXED.** New auth-dependent pages must start in a pending/loading state, never in a chosen state.

## Incident 10 — Member "faq" button (round 2 #8) — THE ONE REVERT in history

- **Symptom/request:** active members should see a "faq" button instead of "join now" in the navbar.
- **First attempt (`3c600b9`):** added a member-visible `faq` button in **both** join-now navbar spots — a `join-now-btn` div inside `code-embed-38` and a `button-navbar` FAQ anchor.
- **Revert (`4ef31bf`):** that placement was wrong and was removed. Final behavior: both join-now spots are simply **hidden** for members (`v-show="!hasActiveMembership"` + `data-auth-gate`), and the faq swap happens only in the hidden pink nav-links row — a `v-show` pair (`join now` ↔ `faq`) with `data-auth-gate="collapse"` (`app/components/SiteNavbar.vue`, nav-links wrapper).
- **Evidence:** `git show 4ef31bf` — the diff deletes the two faq replacements and adds the nav-links pair.
- **Status: FIXED at 4ef31bf. DO NOT resurrect the `3c600b9` markup** (faq buttons in the join-now spots). If you're editing SiteNavbar's membership-dependent buttons, `4ef31bf`'s shape is the approved one.

## Incident 11 — Stale live NL FAQ + placeholder sweep (round 2 #5)

- **Symptom:** the Dutch FAQ content didn't match reality (old rental model, wrong hours, obsolete credit rules, 4 untranslated Q&As) — because the **live Webflow NL FAQ itself was stale**; the port had faithfully reproduced outdated content.
- **Fix (`3c600b9`):** NL FAQ realigned to the current EN content, with the EN text left **as visible placeholders** under `.lang-nl` spans "for Courtney" to translate; contact-us NL hours corrected to EN facts; plus a full placeholder-translation sweep over the purchase cart, checkout, reservation overlay/modals, auth modal, and onboarding (real Dutch where obvious, EN placeholder otherwise, all in per-file `T` dicts).
- **Status: SHIPPED; translations pending from Courtney as of 2026-07-07.** Two traps: (a) English text under `.lang-nl` spans / in `nl` dict slots is **deliberate placeholder, not a bug** — don't "fix" it, and don't paste `nl-reference/` FAQ text back verbatim (that's the stale source); (b) there is no marker convention — placeholders are only detectable as nl==en equality. Full placeholder protocol → `demat-i18n-and-consent`.

## Incident 12 — Credits total mismatch (round 2 #1) — UNRESOLVED-EXTERNAL, the model investigation

- **Symptom (reported):** the donations-credits total looked wrong to Courtney.
- **Investigation result: no frontend divergence proven.** The port matches `old/demat-webflow-test/donations.js` verbatim; totals come from the backend ledger, not frontend math; and the test account's only donation sessions were **unpublished drafts, which the backend hides** — one mechanism that explains every observation *including the negative* (nothing visibly wrong to reproduce).
- **Action taken:** a published **€8.00 test donation session was left in the hosted test DB** so the total can be verified against a known value.
- **Status: OPEN — awaiting Courtney's specifics** (which session, expected vs shown). No code change was made and none should be until she supplies them. This entry is also the exemplar of the local evidence bar: chase the mechanism until it explains all observations, prefer "backend/data" over reflexively patching the port (→ `demat-research-methodology`).

## Incident 13 — 4-my-account.css collision (pre-squash; narrative-only evidence)

- **Symptom:** the reservations card rendered squashed on mobile.
- **Root cause:** `4-my-account.css` (styling for the dead `account-app.js` UI; no export page references it) was loaded in the global bundle, and its **generic selectors** (`.reservation-card`, `.rental-card`, `.btn-primary`, …) overrode the live design in `3-demat-custom.css`.
- **Fix (2026-07-05, inside the squash — no diff exists):** removed from the css array. `app/nuxt.config.ts` loads sheets 0,1,2,3,5,6,7 with an explanatory comment; the file **still exists** at `app/assets/css/4-my-account.css`.
- **Evidence:** `migration-map.md` → `# Implementation log` → Phase 4 bullet "CSS collision fix (2026-07-05)"; the comment in `app/nuxt.config.ts` above the css array.
- **Status: FIXED. DO NOT re-add `4-my-account.css` to the css array** — a numbered-but-absent sheet is not an oversight. The CSS load order itself is a hard constraint ("Do not reorder").

## Incident 14 — Dead-code decisions (settled; don't re-litigate)

All decided in Phase 1 with evidence, recorded in `migration-map.md` §1/§2/§7:

| Old artifact | Decision | Evidence |
|---|---|---|
| `account-app.js` | Skipped — dead Vue 2 hash-tab app; `account.html` never mounts it; `/profile` + account pages cover it | migration-map.md §2 table |
| `search.html` | Dropped — unused Webflow search stub; nothing links to it. The `/search` **API endpoint** the catalog uses is unrelated | migration-map.md §1 + §7 |
| `401.html` | Dropped — Webflow password-page machinery (`/.wf_auth`), not in use | migration-map.md §1 |
| `detail_items.html` | Dropped — unused Webflow CMS template; the real PDP is `/product?sku=` | migration-map.md §1 |
| `GET /private_members/me` | The old `code-embed-38` referenced it, but it **never existed in the backend** (grep `private_members` in `demat-backend/app/` = zero hits). The Nuxt app correctly uses `GET /users/me` | verified 2026-07-07 |

## Incident 15 — The defect ledger (Courtney's dispositions, 2026-07-07)

**CONFIRMED BUG, APPROVED TO FIX** (the only one):

- **PDP "up to 10 items" cart-full copy.** `app/pages/product.vue:56` alerts "You can reserve up to 10 items at a time" (EN+NL) when `CartManager.addToCart` returns reason `max_items` (product.vue:618-619) — but the real cap is `MAX_ITEMS: 5` (`app/composables/useCartManager.ts:51`). This is a **verbatim-ported copy bug**: the identical mismatch exists in the old sources (`old/demat-webflow-test/pdp.js:145` says 10; `old/demat-webflow-test/site-wide-footer.js:301` has `MAX_ITEMS: 5`). Fixing it is a **sanctioned deviation from verbatim copy** — when fixed, log it in `migration-map.md`'s `# Implementation log` in the same turn.

**ACCEPTED / DEFERRED — do NOT fix without Courtney's explicit approval:**

| Defect | Detail |
|---|---|
| `/account` dead auth ref | `app/pages/account.vue:14` local `isAuthenticated = ref(false)` never set → sign-out unreachable on mobile `/account` (Incident 1 residual) |
| Google Fonts ungated | Urbanist/PT Serif/Montserrat/Playfair load unconditionally from fonts.googleapis.com (`app/nuxt.config.ts` head links) — not gated by the consent system |
| Sitemap 7th blog post | `app/server/routes/sitemap.xml.ts` emits all 7 `app/data/blog.json` slugs; the live Webflow sitemap (`nl-reference/live-sitemap.xml`) had only 6 — the extra is `you-own-way-more-clothes-than-you-wear-a-monthly-clothing-rental-explainer` |

**OPEN QUESTION (no ruling):** OfferBanner dismissal doesn't persist (plain ref, zero storage in `app/components/home/OfferBanner.vue`; banner returns every page load) — whether the old site persisted dismissal was never checked. Not a defect ruling; ask before changing.

---

## Meta-lessons (recurring failure families)

1. **Hydration mismatches struck twice** (Incidents 1b and 6) in two forms: `:class`/`:style` bindings (never patched at hydration → use `v-show`/`v-if`) and branch reuse (SSR branch ≠ client pre-hydration branch → gate behind a post-mount `hydrated` ref). The rule is recorded in the Implementation log ("Hard-won rule: auth-state visibility must use v-show/v-if, never :class/:style") and in a comment inside `app/components/SiteNavbar.vue`.
2. **Pre-mount storage state struck twice** (Incidents 4 and 6): localStorage/sessionStorage is populated before hydration completes, so both change-observers (MutationObserver) and SSR-matching assumptions miss it.
3. **Fixes regress each other** (Incident 2 → Incident 5): the locale-links SPA interceptor broke query-driven catalog init. Audit URL-reading pages whenever navigation semantics change.
4. **Verifier findings need verification.** The Phase 3 adversarial fidelity fleet ran **25 verifiers → 13 findings → only 3 real** (purchases initial view, mobile-nav dead `/wishlist` href, footer auth-link visibility); the other 10 were sanctioned deviations or misreads (Implementation log, Phase 3). The misread rate matters: confirm a finding against `old/` and the sanctioned-deviation list before treating it as a defect (→ `demat-validation-and-qa`).
5. **"Verbatim" ports carry the old site's bugs by design** — the Escape-doesn't-close-cart-overlay behavior, the 10-vs-5 copy, PDP noindex. Before fixing anything odd, check whether `old/` behaves the same; if it does, it's parity until Courtney sanctions a deviation (→ `demat-change-control`).

## Test-DB artifacts left by QA (hosted TEST database)

Any further write to the hosted test DB requires Courtney's explicit OK, each time. Known artifacts as of 2026-07-07:

| Artifact | Origin | Recorded where |
|---|---|---|
| Pending reservation on **item 617** (Courtney's test account) | End-to-end authed commerce QA, 2026-07-05 | Implementation log, Phase 4 E2E-QA bullet |
| Published **€8.00 donation session** | Left deliberately for Incident 12 verification | Implementation log, round-2 #1 bullet |
| Test profile `height_cm` = `"151"` (was unset) | Incident 8 fix verification | Implementation log, round-2 #6 bullet |
| Mailing-list subscriber `migration-test@dematerialized.nl` | Mailing-list form wiring QA, 2026-07-05 | **Unverified in repo** — from QA session records only; the Implementation log confirms a live-verified subscribe (200 + success message) but does not name the address |

Note also: Stripe payments were **never completed** in QA ("untested-by-design: completing a Stripe payment — needs a human") — real-money flows are human-only, always.

## Provenance and maintenance

Facts verified 2026-07-07 against repo HEAD `4ef31bf` (main, clean tree) and `/Users/courtneyyocabet/demat-backend`. `migration-map.md` line numbers deliberately omitted (the log is append-updated; cite section headings). Re-verification one-liners:

| Claim | Command |
|---|---|
| Commit chain / no new history | `git log --oneline -8` (expect 4ef31bf … e44b2a5 on top) |
| Round-1 fixes diff | `git show --stat 78a1c02` |
| Round-2 fixes diff | `git show --stat 3c600b9` |
| The revert | `git show 4ef31bf` (SiteNavbar only, 3+/6−) |
| /account dead ref still dead | `grep -n "isAuthenticated" app/pages/account.vue` (expect only lines 14/179/197, no assignment, no useAuth import) |
| 10-vs-5 copy bug still present (fix approved) | `grep -n "up to 10 items" app/pages/product.vue && grep -n "MAX_ITEMS: 5" app/composables/useCartManager.ts` |
| Old-source origin of the copy bug | `grep -n "up to 10 items" old/demat-webflow-test/pdp.js; grep -n "MAX_ITEMS" old/demat-webflow-test/site-wide-footer.js` |
| Catalog loop guard intact | `grep -n "lastWrittenQuery" app/composables/useCatalog.ts` (expect record-before-replace at ~:735 and watcher skip at ~:787) |
| Hydrated-ref fix intact | `grep -n "hydrated" app/components/cart/PurchaseCartPanel.vue` |
| Collapse gate variant | `grep -n "collapse" app/assets/css/7-auth-gate.css` |
| String cast for attributes | `grep -n "String(formData.heightCm)" app/pages/profile.vue` |
| my-rentals three-state | `grep -n "authView" app/pages/my-rentals.vue` |
| 4-my-account.css still excluded | `grep -n "4-my-account" app/nuxt.config.ts` (comment only, not in the css array) |
| /private_members/me still absent | `grep -rn "private_members" /Users/courtneyyocabet/demat-backend/app/ \| wc -l` (expect 0) |
| Sitemap 7-vs-6 delta | `python3 -c "import json; print(len(json.load(open('app/data/blog.json'))['posts']))"` vs `grep -c "/blog/" nl-reference/live-sitemap.xml` |
| NL placeholders still pending | `sed -n '69p' app/pages/faq.vue` (lang-en text == lang-nl text ⇒ still placeholder) |
| Fleet stats / QA narrative | `grep -n "Adversarial fidelity fleet\|item 617\|€8.00\|height_cm" migration-map.md` |
