---
name: demat-change-control
description: Load BEFORE changing anything in the Dematerialized repos — code, copy, styling, data, docs, git state, or backend. Triggers include "can I fix/change/add/refactor X", any bug you are tempted to fix, anything touching the hosted TEST database, git push / PR / commit questions, Stripe or payment testing, backend (demat-backend) changes, "who approves this / who do I ask", "where do I log this", and any request that adds behavior the old Webflow site did not have. Also the home for docs-of-record discipline (migration-map.md Implementation log, DEPLOY.md, MOBILE.md).
---

# Dematerialized change control — how changes are classified, gated, and recorded

**What this covers**: the rules that decide whether a change is allowed, who must approve it,
and how it gets recorded. Includes the four non-negotiable discipline rules, the current
approved/deferred defect dispositions, the open ask-Courtney decisions, doc-of-record house
style, the stakeholder map, and a pre-flight checklist.

**When to use**: before ANY mutation — code edit, data write, git operation, backend work,
or when unsure whether something is a bug fix or a scope expansion.

**When NOT to use**: for *how* the system works technically → `demat-architecture-contract`;
for executing the production cutover → `demat-cutover-campaign`; for what the old site did
and what "parity" means in detail → `webflow-parity-reference`; for debugging a symptom →
`demat-debugging-playbook`; for running/deploying mechanics → `demat-run-and-operate`.

---

## 1. Governing principle: migrate, don't rebuild — parity IS the product

From `migration-scanning-rules.md` ("Governing principle: migrate, don't rebuild"), verbatim
doctrine, still in force:

> This is a **faithful port of the current site into Nuxt**, not a redesign or a feature
> release. Default to reproducing what exists — same layout, same styling, same behavior,
> same copy, same URLs. When in doubt, match the old site rather than "improve" it.

**Definitions** (used across the whole skill library):

- **Parity** — the Nuxt app reproduces the old Webflow site one-to-one: layout, styling,
  copy, URLs, behavior — *including known bugs* (e.g. Escape deliberately does not close the
  cart overlay, matching an old-site bug). "Better" is a deviation unless approved.
- **Sanctioned new engineering** — exactly two systems were allowed to be new work during
  the migration: **cookie consent** (replacing paid Finsweet ConsentPro) and **i18n**
  (`@nuxtjs/i18n` EN/NL, replacing Webflow localization). Everything else was a port.
- **Sanctioned deviation** — a change away from old-site behavior that Courtney has
  explicitly approved (see §4). It must be logged in the Implementation log.
- **Soak** — the post-cutover observation period during which Webflow/Finsweet subscriptions
  stay alive as a fallback; cancellations happen only after soak (`app/DEPLOY.md` §6).
- **`old/`** — the read-only Webflow export + production embed code. Source of truth.
  Never edit it. Never content-scan `images/`/`videos/`.

**What change control means NOW (post-migration, as of 2026-07-07)**: the port is complete
through Phase 6 (all 29 pages EN+NL, commerce wired, consent + i18n live); Phase 7
(production cutover) is the remaining live work. Since the product *is* faithfulness to the
old site, **any change to behavior, copy, layout, or URLs is by definition a deviation** and
follows the classification below. The scanning-rules mandate still applies verbatim: *"If
something looks like it needs new work beyond consent and i18n, **stop and ask** before
building it."* Scope creep was named the main risk of this migration; treat it that way.

Courtney can and does sanction new scope — e.g. the Capacitor iOS/Android app shells
(migration-map.md "Mobile apps — iOS & Android", 2026-07-07, explicitly "Courtney's
request", and designed so browsers keep the byte-identical parity site). That is the model:
new scope enters only via Courtney, and enters the log the same day.

---

## 2. Change classification table

Classify every proposed change into exactly one row. When a change spans rows, apply the
strictest row it touches.

| Class | Definition | Gate | Record |
|---|---|---|---|
| **(a) Faithful-parity bug fix** | The Nuxt app diverges from the old site's actual behavior/copy/layout; the fix *restores* old behavior. Verify against `old/` first. | Allowed without new approval. | Implementation log entry in `migration-map.md`, same turn. |
| **(b) Sanctioned deviation** | Deliberately different from the old site, with Courtney's explicit prior approval (see disposition table §4). | Courtney approved it, by name, in advance. Approval for one item is not approval for its neighbors. | Implementation log entry noting it is a sanctioned deviation and who approved it. |
| **(c) New feature / scope** | Anything the old site did not have and Courtney has not approved: new pages, flows, refactors, "modernization", dependency additions, tests/CI (platform-quality work is desirable post-migration but still gated). | **STOP AND ASK Courtney.** No exceptions. | After approval: Implementation log entry. |
| **(d) Backend change** | Anything in `/Users/courtneyyocabet/demat-backend` (sibling repo, `github.com/Edwardvaneechoud/demat-backend`). | Edward PR protocol (§3 rule 4): new branch off the working branch, PR to Edward's repo, **flag to Edward before starting**. Frontend-driven backend needs are flagged, never self-served. | PR description + Implementation log entry in this repo. |
| **(e) Infra / deploy** | Netlify, DNS, Auth0 dashboard, backend CORS, env vars, GTM, subscriptions. | `app/DEPLOY.md` is the runbook; most steps are **human dashboard steps** — prepare and instruct, do not pretend to execute. CORS/prod-env changes go through Edward. Mobile-store steps live in `app/MOBILE.md`. | DEPLOY.md/MOBILE.md stay current; log the milestone in the Implementation log. |

Litmus tests:

- "Would the old site have done this?" → yes = candidate (a); no = (b) if pre-approved,
  else (c).
- "Does it write to any repo other than webflow-migration?" → (d).
- "Does it need a browser dashboard, DNS, or money?" → (e), and almost certainly human.

---

## 3. THE FOUR NON-NEGOTIABLES (Courtney's rulings, 2026-07-07)

These override anything that appears to contradict them. Each is grounded in the repo's own
record.

### Rule 1 — Every write to the hosted TEST database needs Courtney's explicit OK, each time

Migrations, seeds, and data mutations against the hosted test DB (behind
`https://test-api.dematerialized.nl`) are per-event approvals — a previous OK does not roll
forward. Historical grounding: the Phase 6 blog rollout is logged as *"Migration + seed
applied to the TEST DB (authorized by Courtney)"* (migration-map.md, Phase 6 section) —
authorization was obtained and then recorded. Rationale: the test DB is a shared, hosted
artifact used by real QA (past sessions left durable artifacts there: a pending reservation
on item 617, `height_cm="151"` on the test profile, a published €8.00 test donation session
— all logged in migration-map.md). Reads are fine; writes are not yours to make.

### Rule 2 — Never `git push` and never open a PR without asking

The push state of `webflow-migration` is deliberately managed by Courtney. The
Implementation log itself records the practice: *"Everything committed locally: `e44b2a5`
on main (not pushed)"* (Phase 7 section) — commits were intentionally held back from origin
until Courtney said otherwise. As of 2026-07-07, `main` is level with `origin/main` at
`4ef31bf` *and the working tree carries uncommitted mobile-app (Capacitor) work* — do not
"helpfully" commit, sweep, stash, or push any of it. Same rule for the backend repo: opening
a PR is itself a gated act (see rule 4). Committing locally in this repo when work lands is
normal; **pushing is not**.

### Rule 3 — Real-money flows are human-only

Completing a Stripe payment — membership join, rented-item purchase, any checkout — is
never automated, in any environment. The QA record states it as design, not omission:
*"Untested-by-design: completing a Stripe payment (needs a human; membership join or
rented-item purchase in the browser)"* (migration-map.md, Phase 4 QA entry). You may
exercise everything up to the Stripe redirect (order creation, checkout-session creation,
button states); the payment itself is Courtney's, in a browser. Rationale: money moves,
Stripe state mutates, and webhooks fire into shared backends.

### Rule 4 — The backend repo is never committed to directly

Every backend change is: (1) new branch **off the working branch**
`claude/rental-returns-myparcel-a2v09b`, (2) PR to `Edwardvaneechoud/demat-backend`,
(3) **flagged to Edward before starting**, with base branch and PR target confirmed by him.
Never commit to the working branch or `main`. Historical grounding, verifiable today: the
Phase 6 blog work went in as branch `claude/blog-models` (a new branch whose history sits on
top of the working-branch commits — `git log` shows `dd9c834`, `ed04682` atop `7f41529…`),
delivered as **PR #46** ("Add bilingual blog models + public blog API"), OPEN as of
2026-07-07, author `cyocabet-dem`, base `main` (so its diff includes PR #45's
working-branch commits — the blog migration chain cannot apply to `main` without #45
merging first). Rationale: Edward owns the backend; it serves production; `demat-backend`
has its own CLAUDE.md which this repo's instructions say not to touch.

---

## 4. Defect dispositions and open decisions (as of 2026-07-07)

### Disposition table — do not re-litigate these

| Item | Where | Facts | Disposition |
|---|---|---|---|
| PDP "up to 10 items" cart-full copy | `app/pages/product.vue` (`cartFullAlert` in the T dict) | Real cap is `MAX_ITEMS: 5` (`app/composables/useCartManager.ts`). The 10-vs-5 mismatch is verbatim-inherited from the old site (`old/demat-webflow-test/pdp.js:145` says 10; `old/demat-webflow-test/site-wide-footer.js:301` has `MAX_ITEMS: 5`). | **CONFIRMED BUG, APPROVED TO FIX** — a sanctioned deviation from verbatim copy. Still unfixed as of 2026-07-07 (`product.vue` still says 10). When fixed: EN+NL copy, and log it in the Implementation log as a sanctioned deviation. |
| `/account` dead auth state | `app/pages/account.vue:14` — local `const isAuthenticated = ref(false)`, never set true; sign-out unreachable on the mobile-only /account page | Stale "TODO Phase 4" comments remain; page is mobile-only (desktop redirects to /profile). | **ACCEPTED/DEFERRED — do NOT fix without Courtney's approval.** |
| Google Fonts not consent-gated | `app/nuxt.config.ts` head links (`fonts.googleapis.com` / `fonts.gstatic.com`) load unconditionally; only GTM/Hotjar/Meta Pixel are consent-gated | GDPR-relevant external request. | **ACCEPTED/DEFERRED — do NOT change without Courtney's approval.** |
| Sitemap emits 7th blog post | `app/server/routes/sitemap.xml.ts` emits all 7 posts in `app/data/blog.json`; the live Webflow sitemap (`nl-reference/live-sitemap.xml`) had only 6 blog URLs | Minor fidelity deviation; also ignores the backend `sitemap_indexing` field. | **ACCEPTED/DEFERRED — do NOT change without Courtney's approval.** |

### Open product decisions — all "ask Courtney" (open, undecided as of 2026-07-07)

| Open item | Context |
|---|---|
| Reservations-tab visibility for shipping members | Account sidenavs hide the `/reservations` link for shipping members — faithful old behavior, logged in migration-map.md Phase 7 section as "product decision, currently faithful old behavior". |
| Contact / missing-pieces form endpoint spec | Both forms show fake success and discard input (`app/pages/contact-us.vue` `handleContactFormSubmit`, `app/pages/missing-pieces.vue` `submitMissingPieces`); no backend endpoint exists. Needs a spec for Edward (destination address, fields, spam protection) — a class (d) change once specced. |
| OfferBanner dismissal persistence | Homepage 50%-off SHOPDEMAT banner dismissal is a plain ref, zero storage — it returns every page load. Persisting it is a behavior change; also confirm the promo is still current. |
| PDP `noindex` long-term | All PDPs carry `robots: noindex` + static og:title "Product" (`app/pages/product.vue`) — a faithful port. Whether products should be indexed post-migration is a product/SEO decision. |

Anything not in these tables that looks wrong: classify via §2, and if it is not clearly
class (a), it is an ask-Courtney item. Never silently "improve".

---

## 5. Docs-of-record discipline

### migration-map.md — THE doc of record

Structure (stable; cite sections by heading, never by line number — the log is
append-updated and lines drift):

1. **§1–9 map** — `## 1. Pages → Nuxt routes/components` through `## 9. Verification`:
   the approved Phase 1 plan (pages, embeds, integrations, SEO, styling, phases, dropped
   machinery, open questions, verification method).
2. **`# Implementation log`** — the progress record. Phase sections (`## Phase 1 …` through
   `## Phase 7 …`), post-QA fix rounds, and the Mobile apps section.
3. **`# Appendices — full Phase 1 audit records`** — Appendix A–F (per-page 10-field audit
   blocks by batch), G (embed behavior audit), H (site-wide head/footer code), I (stylesheet
   audit), J (blog/authors CMS fields + Phase 6 model).

### Implementation-log house style

- Status markers on headings and bullets: **✅ done · 🔄 in progress · ⏳ pending/human**.
- Entry shape: `- ✅ <Terse title> (<date>[, who asked]): what changed + why + how it was
  verified.` Include commit hashes for code changes (`— commit \`3c600b9\``), name test-DB
  artifacts left behind, and name what is deliberately NOT done ("Untested-by-design: …").
- **Update-in-same-turn rule**: the log entry lands in the same working turn as the change
  itself — never "log it later". The history even contains dedicated log-only commits
  (`8e55a3e`, `c862d9b`) immediately following their code commits.
- Sanctioned deviations are labeled as such in their entry, with the approver.

### Other docs of record

| Doc | Role |
|---|---|
| `app/DEPLOY.md` | THE deploy runbook: Netlify site creation, the 2 env vars (`NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_GTM_ID`), Auth0 allowlist, backend CORS (via Edward), DNS cutover, post-PR#46 blog data rollout, post-soak cancellations, plus the local-dev recap. Keep it current when anything deploy-relevant changes. |
| `app/MOBILE.md` | Human steps for the Capacitor iOS/Android shells (Xcode/Android Studio, Auth0 dashboard entries, backend `CORS_ORIGINS` additions for Edward, signing, store listings). |
| `CLAUDE.md` + `migration-scanning-rules.md` | The standing rules. This skill summarizes but never overrides them. |
| `old/` + `nl-reference/` | Read-only evidence, never docs to edit. |

---

## 6. Stakeholder map

| Person | Role | Goes to them |
|---|---|---|
| **Courtney** (`cyocabet@dematerialized.nl`, GitHub `cyocabet-dem`) | Product owner. | ALL approvals: scope, deviations, test-DB writes, pushes/PRs, defect dispositions, the open product decisions in §4. Supplies **NL translations** (the FAQ + modal EN-placeholder strings are explicitly "left as placeholders for Courtney"). Executes **dashboard steps** (Netlify, Auth0, DNS, GTM, subscription cancellations) and completes **Stripe payments** by hand. |
| **Edward** (GitHub `Edwardvaneechoud`) | Backend owner, `demat-backend`. | Reviews/merges backend PRs (#45, #46 open as of 2026-07-07); confirms base branch + PR target *before* backend work starts; executes **backend CORS** and prod-env changes; decides where/when prod migrations + blog seed run; receives specs for new endpoints (contact/missing-pieces forms, the future dedicated rentals endpoint). |

If a task needs both (e.g. a frontend change requiring a new endpoint): Courtney approves
the scope, Edward is flagged for the backend half before it starts.

---

## 7. Pre-flight checklist — run before changing ANYTHING

1. **`git status -sb` in webflow-migration.** Which branch? Clean? As of 2026-07-07 the
   tree carries uncommitted mobile-app work (Courtney-sanctioned, in-flight) — never mix it
   into your changes, never stash/clean it away.
2. **Does the change touch `old/` or `nl-reference/`?** → forbidden, those are read-only.
3. **Does it change behavior/copy/layout/URLs vs the old site?** Check `old/` first
   (export HTML for layout/copy, `old/demat-webflow-test/*.js` for behavior). If yes →
   classify §2 (b)/(c): is it in the §4 disposition table as approved? If not → ask Courtney.
4. **Does it write to the hosted TEST database** (migration, seed, POST/PATCH/DELETE against
   test-api)? → Courtney's explicit OK, this time, first (§3 rule 1).
5. **Does it involve git push, opening a PR, or anything in `demat-backend`?** → §3 rules
   2 and 4. Backend work additionally waits for Edward's confirmation of base branch + target.
6. **Does it complete a payment or move money?** → human-only, stop (§3 rule 3).
7. **Does it need a dashboard, DNS, or a subscription?** → class (e): prepare instructions
   in DEPLOY.md/MOBILE.md terms; a human executes.
8. **Known invariants intact?** No re-adding `4-my-account.css` to the css array; CSS load
   order in `nuxt.config.ts` is a hard constraint; auth-dependent visibility via
   `v-show`/`v-if` only (never `:class`/`:style`); EN-text-under-`lang-nl` placeholders are
   deliberate, not bugs. (Details → `demat-architecture-contract`.)
9. **Plan the log entry** (house style §5) — the change and its Implementation-log entry
   land in the same turn.
10. **Verification plan**: how will you show parity/behavior is preserved? (Methods →
    `demat-validation-and-qa`; measurement scripts → `demat-diagnostics-toolkit`.)

---

## Provenance and maintenance

All facts verified directly against the repos on **2026-07-07** (frontend HEAD `4ef31bf` on
`main`, level with `origin/main`, uncommitted mobile-app work in tree; backend on branch
`claude/blog-models`, clean). Volatile facts are date-stamped inline. Re-verify before
relying on anything below:

| Claim | Re-verification command |
|---|---|
| Frontend git/push state, in-flight work | `cd /Users/courtneyyocabet/webflow-migration && git status -sb && git log --oneline origin/main..main` |
| PDP 10-vs-5 bug still unfixed | `grep -n "up to 10" app/pages/product.vue; grep -n "MAX_ITEMS: 5" app/composables/useCartManager.ts` |
| Old-source inheritance of the 10-vs-5 bug | `grep -n "up to 10\|MAX_ITEMS" "old/demat-webflow-test/pdp.js" "old/demat-webflow-test/site-wide-footer.js"` |
| `/account` dead ref still present | `grep -n "isAuthenticated" app/pages/account.vue` (expect `ref(false)` at ~:14, only v-show consumers) |
| Google Fonts still ungated | `grep -n "fonts.googleapis" app/nuxt.config.ts` |
| Sitemap/blog count deviation | `grep -c '"slug"' app/data/blog.json` (7) vs `grep -c "blog/" nl-reference/live-sitemap.xml` (6) |
| PR #46 / #45 state | `gh pr view 46 --repo Edwardvaneechoud/demat-backend --json state,headRefName,baseRefName` (and `45`) |
| Backend branch protocol evidence | `cd /Users/courtneyyocabet/demat-backend && git status -sb && git log --oneline -5` |
| Test-DB authorization + Stripe human-only quotes | `grep -n "authorized by Courtney\|Untested-by-design" migration-map.md` |
| Log structure/house style | `grep -n "^# \|^## " migration-map.md \| head -40` |
| Open decisions still open | `grep -n "reservations-tab visibility\|flagged for Edward" migration-map.md` |
| Deploy runbook current | `sed -n 1,60p app/DEPLOY.md` |
| Stop-and-ask doctrine verbatim | `grep -n "stop and ask" migration-scanning-rules.md` |

If any re-verification contradicts this skill (e.g. the PDP copy fix landed, a disposition
changed, PRs merged), trust the repo + Courtney's latest word, and update this skill.
