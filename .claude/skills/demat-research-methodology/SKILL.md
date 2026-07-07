---
name: demat-research-methodology
description: Load this when you have a hunch, an unexplained symptom, a proposed improvement, or a "should we change X?" question in the Dematerialized webflow-migration repo — anything where the right change (or whether to change anything at all) is not yet known. Covers the evidence bar for conclusions, writing predictions before experiments, designing discriminating experiments, adversarial refutation of your own findings, and the observation→decision→log→(revert) idea lifecycle, each grounded in a worked example from this repo's actual history. Also load it before declaring any bug "fixed" or any investigation "concluded".
---

# demat-research-methodology — turning a hunch into an accepted change

**What this covers:** the discipline this project uses when the answer is UNKNOWN — investigating symptoms, evaluating proposed changes, and deciding whether to change code at all. Every method is grounded in a worked example from this repo's real history.
**When to use:** unexplained behavior, a defect report you haven't root-caused, a "we could improve X" idea, a finding from a review/verifier you're tempted to trust, or a conclusion you're about to ship.
**When NOT to use:** executing a known procedure → the runbook skills (`demat-cutover-campaign` for the production cutover, `demat-build-and-env` for environment setup, `demat-run-and-operate` for deploy/operate, `demat-i18n-and-consent` for adding strings/gated scripts). Symptom triage with a known trap table → `demat-debugging-playbook`. What happened historically → `demat-failure-archaeology`. What's allowed and who approves → `demat-change-control`. What to work on next → `demat-research-frontier`.

## Definitions (used throughout)

| Term | Meaning here |
|---|---|
| **Parity / verbatim port** | The governing doctrine: the Nuxt app reproduces the old Webflow site's layout, copy, URLs, and behavior exactly — including its bugs — unless a deviation is explicitly sanctioned. See `migration-scanning-rules.md`: "When in doubt, match the old site rather than 'improve' it." |
| **Hydration** | Nuxt renders HTML on the server (SSR); the client then "hydrates" it — attaches Vue to the existing DOM. Vue does **not** patch `class`/`style` attribute mismatches during hydration, which is why auth-dependent visibility must use `v-show`/`v-if` (project rule). |
| **Adversarial verification / refutation** | Spawning independent verifiers whose job is to DISPROVE a claim or find divergence, not to confirm it. Standard practice here after every substantive batch. |
| **Fixture / planted artifact** | A known piece of test data deliberately left in the hosted TEST database so a future observation can falsify or confirm a hypothesis (e.g. the €8.00 donation session, the pending reservation on item 617). Any new fixture is a test-DB write → requires Courtney's explicit OK (see `demat-change-control`). |
| **Implementation log** | The `# Implementation log` section of `migration-map.md` — the doc of record. Updated in the same turn work lands. |
| **old/** | Read-only Webflow export + production embed JS. The definitive answer to "what was the intended behavior?" Never edit it. |

## 1. The evidence bar

A conclusion is shippable only when **one mechanism explains ALL observations — including the negative ones** — and has survived adversarial refutation. "Consistent with the symptom" is not the bar; "nothing observed contradicts it, and someone tried to contradict it" is.

Checklist before you accept a conclusion:

- [ ] The mechanism explains the primary symptom.
- [ ] It explains every secondary observation you collected.
- [ ] It explains the **negatives** — the things that did NOT happen, the cases that work.
- [ ] A refuter (a fresh agent or a deliberate second pass) tried to break it and failed.
- [ ] You know what future observation would falsify it (and, where possible, planted a fixture for that).

### Worked example A — the credits investigation (QA round 2, issue #1): the correct outcome was NO code change

Courtney reported a wrong credits total on donations-credits. The obvious hypothesis — "the frontend miscomputes the total" — was killed by three converging observations:

1. **Verbatim-port comparison:** the Nuxt code was diffed against `old/demat-webflow-test/donations.js` — the port matches the old logic verbatim, so any frontend miscomputation would also exist on the live Webflow site.
2. **The backend-ledger observation:** totals come from the backend ledger (`GET /private_clothing_items/donation_session/`), not from frontend arithmetic — there is nothing on the frontend TO miscompute.
3. **The negative:** the test account's only donation sessions were *unpublished drafts*, which the backend hides — so the frontend had never even displayed a wrong number that could be reproduced.

Conclusion routed to backend/data, recorded in the Implementation log ("Post-QA fixes round 2", item #1: "NO frontend divergence… may be backend/data. Needs Courtney's specifics"), and a **falsification fixture was planted**: a published €8.00 test donation session left in the TEST DB so that, once Courtney says which session and what she expected, the hypothesis can be tested against a known-good row. **No code was changed — and that was the correct, logged outcome.** Resist the pressure to "fix something" to close an issue.

## 2. Hypothesis-predicts-before-running

Write down what you expect to observe **before** running the experiment. If you only interpret after the fact, every result "confirms" whatever you already believed. A prediction that names a concrete observable is also your verification note when the fix lands.

### Worked example B — the disappearing cart icon (post-QA round 1, commit `78a1c02`)

Symptom: reload a page with a persisted non-empty purchase cart → navbar cart icon hidden.

- **Hypothesis:** the navbar wrapper's visibility was synced only by a `MutationObserver` on `#purchase-cart-nav`'s `style` attribute; the cart code (hydrating from localStorage before the navbar mounted) writes the *same* display value the element already has, so no mutation event fires and the wrapper never shows.
- **Prediction the hypothesis makes:** reload with 1 item in the cart → *no mutation callback fires* (directly observable in devtools with a breakpoint in the observer callback). If a mutation did fire, the hypothesis is wrong — look elsewhere.
- **Prediction the fix makes:** after adding a `syncWrapper()` call that reads current state once at mount (in addition to observing), reload with 1 item → icon + badge visible.
- **Recorded verification:** the Implementation log entry ("Post-QA fixes", 2026-07-06) reads exactly: "Verified: reload with 1 item → icon + badge visible." The fix lives in `app/components/SiteNavbar.vue` (`onMounted` → `syncWrapper`, with the explanatory comment "The cart may have set the nav's display before this component mounted… so sync now — not only on mutations").

Template for your log entries: *symptom → mechanism → what the fix predicts → the observation that matched the prediction.*

## 3. Discriminating experiments over shotgun fixes

When several mechanisms could produce the symptom, design the ONE observation that separates them before touching code. For rendering/state bugs in this app, the workhorse discriminator is:

**Compare view-source (the SSR markup, pre-hydration) against the post-hydration DOM (devtools Elements).**

| View-source says | Post-hydration DOM says | Mechanism |
|---|---|---|
| Wrong markup | Wrong markup | SSR/data bug — fix the server-rendered state |
| Correct markup | Correct markup, wrong appearance | CSS bug (load order, collision, gate class) |
| One state | A *different* state that never visually updates | **Hydration mismatch** — a binding whose client value differed from SSR at hydration time |

### Worked example C — the hydration-bug class, and how the rule then predicted the next bug

Round 1: the sign-out button was invisible on /account. View-source showed the signed-out state (SSR always renders signed-out); the client's `:style="{ display: … }"` binding was already "correct" pre-hydration — and Vue never patched it, because **Vue does not patch class/style attribute mismatches during hydration**. The discriminator (SSR markup vs live DOM) pinned the mechanism, and a general rule was extracted, recorded in the Implementation log ("Member UI fixes", 2026-07-05): **auth-state visibility must use `v-show`/`v-if`, never `:class`/`:style`.**

The proof the rule captured a real mechanism: it **predicted the next incident's shape**. Round 2 #3 (commit `3c600b9`): purchase-cart items rendered flex-centered — same mechanism, branch-structure variant. SSR rendered the empty-cart branch; the client had localStorage items before hydration, so Vue reused the empty-state's centering `<div>` for the items list. Fix: a post-mount `hydrated` ref (`app/components/cart/PurchaseCartPanel.vue`: `hasItems = computed(() => hydrated.value && items.value.length > 0)`) so SSR and first client render match, with the real branch switching in after mount. A good mechanism generalizes; a symptom-patch doesn't.

Other discriminators used here: toggling `NUXT_PUBLIC_DEV_MOCK_AUTH` to separate auth-state bugs from data bugs; pointing `DEV_API_TARGET` at a local backend to separate frontend from backend behavior (see `demat-build-and-env`); and diffing against `old/` to separate "regression we introduced" from "faithful port of an old bug".

## 4. Adversarial refutation is standard practice

Findings — yours or a verifier's — are **claims to refute, not facts**. The precedent (Implementation log, Phase 3): an adversarial fidelity fleet of **25 verifiers produced 13 findings, of which 3 were real** (purchases initial view, mobile-nav dead `/wishlist` href, footer auth-link visibility); the other 10 were sanctioned deviations or misreads. A ~77% false-positive rate is **normal** for this kind of sweep — the fleet was still worth running (3 real bugs), but shipping all 13 "fixes" would have vandalized sanctioned behavior.

Practice, per project model policy (adversarial verification after every substantive batch):

1. After any substantive batch, assign fresh verifiers (or run a deliberately hostile second pass yourself) whose brief is to find divergence/breakage — not to confirm success.
2. Verify each finding against **ground truth** before acting: `old/` for intended behavior, the running app for actual behavior, `migration-map.md` for whether the "divergence" is a recorded sanctioned deviation.
3. Apply the same refutation to your own conclusions before shipping — the credits investigation (example A) survived exactly this and correctly ended in no change.
4. Counter-example of a sweep that legitimately found nothing: the SEO regression sweep, 13 verifiers over every page vs the old export heads — **zero findings** (Implementation log, Phase 5). Zero is an acceptable, reportable result; do not manufacture findings.

**The definitive oracle for "intended behavior" questions is the old embed code in `old/demat-webflow-test/`.** Worked example: the PDP cart-full alert says "up to 10 items" while the real cap is `MAX_ITEMS: 5` — reading `old/demat-webflow-test/pdp.js:145` (says 10) against `old/demat-webflow-test/site-wide-footer.js:301` (`MAX_ITEMS: 5`) proves the mismatch is a *verbatim-ported copy bug in the old site itself*, not a porting error. (Disposition as of 2026-07-07: Courtney confirmed it as a bug and approved fixing the copy in `app/pages/product.vue` — a sanctioned deviation; log it in the Implementation log when fixed.) Same method behind the Escape-key note in `app/plugins/reservation-cart.client.ts` ("Escape never closed the cart — kept as-is"): the old code was read, the bug was understood, and parity was chosen deliberately.

## 5. The idea lifecycle

Every idea — bug fix, improvement, product question — moves through the same stations. Nothing skips the decision station; nothing lands without a log entry.

```
observation
   → open question (migration-map.md §8 "Open questions" / appendix OPEN QUESTIONS blocks)
     and/or flagged to Courtney (backend-touching ideas: flagged to Edward BEFORE starting)
   → decision recorded: approved / accepted-as-is / deferred
   → implementation (within change-control scope — see demat-change-control)
   → Implementation-log entry, same turn, WITH a verification observation
   → (if wrong later) correction commit — and its own log entry
```

Station-by-station, with the repo's real instances:

| Station | Template instance (verify in the repo) |
|---|---|
| Open question recorded | `migration-map.md` §8 lists 6 numbered questions (form endpoints, blog URLs, og:image hosting, Auth0 env, Geoapify key, a meta-description bug: "port verbatim or fix?"); each audit appendix batch has its own OPEN QUESTIONS block |
| Decision: approved | PDP "up to 10 items" copy → confirmed bug, approved to fix (2026-07-07) |
| Decision: pending, don't act | The `❓` bullet in Phase 4: reservations link hidden for shipping members — "faithful old behavior… If the rule itself is unwanted, it's a one-line change." Sat unfixed awaiting the product decision. Same for round 2 #1 ("Needs Courtney's specifics") |
| Decision: accepted-as-is / deferred (do NOT fix without approval, as of 2026-07-07) | /account's dead local `isAuthenticated` ref (`app/pages/account.vue:14` — never set true, so mobile /account never shows sign-out); Google Fonts loading unconditionally (not consent-gated); sitemap emitting the 7th blog post that the live sitemap lacked |
| Ideas that die get documented | §7 "Dropped Webflow machinery (approved defaults)" — the table of everything deliberately not ported (IX2 runtime, `401.html`, jsDelivr CI, …) with the "kept because actually used" counterpart list |
| Correction of a shipped fix | Commit `4ef31bf`: round 2 #8's member "faq" button placement (added in `3c600b9` in both navbar join-now spots) was reverted and replaced with a swap of the hidden nav-links join link. The correction is its own focused commit with a message naming what it corrects |

**Honest caveat on the template:** as of 2026-07-07 the Implementation log's round-2 #8 line still describes the *superseded* `3c600b9` placement — `4ef31bf` never got its own log entry. That is a small standing debt, not the standard: the standard (per project rule and Courtney's ruling) is **every landing, including corrections and reverts, gets a same-turn Implementation-log entry with a verification note**. If you touch that area, fix the stale log line.

## 6. Where good ideas historically came from

Ranked by hit rate in this repo's history:

1. **Courtney's QA rounds** — the two issue lists (2026-07-06 four issues → `78a1c02`; 2026-07-07 eight issues → `3c600b9`) drove nearly all post-migration fixes. Human use of the real app beats speculative review.
2. **Side-by-side fidelity diffs** — old export page open in one browser tab, Nuxt page in another; SEO meta diffed by view-source (§9 Verification in `migration-map.md`). Found the layout/copy divergences.
3. **Adversarial fleets** — 3 real bugs out of 25 verifiers (§4 above); expensive but found things nobody else did.
4. **Reading the OLD code when a behavior question arises** — `old/demat-webflow-test/*.js` answers "intended behavior?" definitively (the 10-vs-5 copy bug, the Escape-key non-close, the credits verbatim comparison).

When you need a new idea source, prefer instrumented measurement over intuition — see `demat-diagnostics-toolkit` for the crawler/differ/scanner scripts and `demat-validation-and-qa` for what counts as evidence.

## 7. Anti-patterns — observed here and banned

| Anti-pattern | The incident that banned it |
|---|---|
| **Fixing symptoms without a mechanism** | The hydration-bug class recurred (round 1 /account `:style`, round 2 PurchaseCartPanel branch reuse) until the general RULE was extracted and recorded. A symptom-patch on the first instance would have left the second undiagnosed. If you can't state the mechanism, you haven't fixed it. |
| **Trusting a fix without a written verification observation** | Every ✅ in the Implementation log carries one ("Verified: reload with 1 item → icon + badge visible"; "verified Workwear→date-night click"). A fix without a recorded observation is a hypothesis, not a fix. Corollary: `78a1c02`'s message claims the /account sign-out was fixed, yet the page's local `isAuthenticated` ref is never set true — the claim outran the verification. |
| **"Improving" while porting** | Doctrine: "match the old site rather than 'improve' it" (`migration-scanning-rules.md`). The Escape-key bug and (until explicitly approved) the 10-vs-5 copy bug were kept deliberately. Unsanctioned improvements are fidelity regressions by definition — route them through the lifecycle in §5 instead. |
| **Fixes that regress each other, unexamined** | Round 1's locale-links SPA interceptor broke the catalog navbar filter links (round 2 #2) because query-driven pages no longer got full reloads — fixed with the loop-guarded `route.query` watcher (`lastWrittenQuery` in `app/composables/useCatalog.ts`). Any global-behavior fix needs a "what does this interact with?" pass before shipping. |
| **Closing an issue by changing *something*** | Example A: the pressure to "fix" the credits total was resisted; the logged outcome was no change + a fixture + a request for specifics. |

## 8. Hard constraints that bound all research (non-negotiable — details in `demat-change-control`)

- Any write to the hosted TEST database (migrations, seeds, data mutations, planted fixtures) requires Courtney's explicit OK **each time**.
- Never `git push` or open a PR without asking — main's commits after origin are deliberately unpushed.
- Real-money flows are human-only: completing a Stripe payment (membership join, purchase) is never automated — the Phase 4 E2E QA entry records "Untested-by-design: completing a Stripe payment (needs a human)".
- Backend changes: never commit to `demat-backend` directly — new branch off the working branch, PR to `Edwardvaneechoud/demat-backend`, flagged to Edward before starting.
- `old/` is read-only; never content-scan `images/`/`videos/`.
- Nothing in this skill routes around change control: an investigation may conclude anything, but *changing code* still requires the disposition in §5.

## Provenance and maintenance

Facts verified against the repo on **2026-07-07** (HEAD `4ef31bf`, branch `main`, clean tree). Courtney's dispositions (PDP copy approved-to-fix; /account ref, Google Fonts, sitemap 7th post accepted/deferred) are as ruled on 2026-07-07 — re-confirm before relying on them later.

Re-verification one-liners (run from `/Users/courtneyyocabet/webflow-migration`):

| Claim | Command |
|---|---|
| Credits investigation outcome + €8 fixture | `grep -n "Credits total" migration-map.md` |
| Cart-icon prediction/verification note | `grep -n "reload with 1 item" migration-map.md` |
| Hydration rule text | `grep -n "never \`:class\`" migration-map.md` |
| PurchaseCartPanel hydrated-ref fix | `grep -n "hydrated" app/components/cart/PurchaseCartPanel.vue` |
| SiteNavbar syncWrapper fix | `grep -n "syncWrapper" app/components/SiteNavbar.vue` |
| 25-verifier fleet, 13→3 findings | `grep -n "25 Fable verifiers" migration-map.md` |
| SEO sweep zero findings | `grep -n "zero findings" migration-map.md` |
| 10-vs-5 copy bug (new + old) | `grep -n "up to 10 items" app/pages/product.vue old/demat-webflow-test/pdp.js && grep -n "MAX_ITEMS" app/composables/useCartManager.ts old/demat-webflow-test/site-wide-footer.js` |
| PDP copy bug still unfixed? | `grep -n "up to 10 items" app/pages/product.vue` (a hit = still unfixed; no hit = fixed, check the log entry) |
| /account dead ref still present? | `grep -n "isAuthenticated" app/pages/account.vue` (line 14 `ref(false)`, no assignment = still present) |
| 4ef31bf correction diff | `git show 4ef31bf --stat` |
| 4ef31bf still missing its log entry? | `grep -n "4ef31bf" migration-map.md` (no hit = log debt still open) |
| §7/§8 sections exist | `grep -n "^## 7. Dropped\|^## 8. Open questions" migration-map.md` |
| Escape-key parity comment | `grep -n "Escape never closed" app/plugins/reservation-cart.client.ts` |
| Loop-guarded query watcher | `grep -n "lastWrittenQuery" app/composables/useCatalog.ts` |
| Doctrine phrasing | `grep -n "improve" migration-scanning-rules.md` |
