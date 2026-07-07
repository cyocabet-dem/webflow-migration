---
name: demat-cutover-campaign
description: The decision-gated, executable campaign for taking dematerialized.nl live on Netlify and retiring Webflow — the project's hardest remaining live problem. Load this when asked to "go live", "deploy to production", "cut over DNS", "execute DEPLOY.md", "set up the Netlify site", "retire/cancel Webflow", "roll out the blog data to prod", or when debugging a failed production Netlify build, an Auth0 callback error on the new domain, or CORS failures from a netlify.app origin.
---

# Dematerialized production cutover campaign

**What this covers:** the end-to-end, phase-by-phase runbook for deploying the Nuxt app (this repo's `app/`) to Netlify, pointing `dematerialized.nl` at it, verifying it, rolling out blog data, and retiring Webflow. Grounded in `app/DEPLOY.md` (the canonical deploy doc) plus repo/backend state verified 2026-07-07.
**When to use:** executing or planning any part of the production cutover, or triaging a failure during it.
**When NOT to use:** day-to-day dev/deploy anatomy or test-DB inventory → `demat-run-and-operate`; recreating the dev environment → `demat-build-and-env`; running/interpreting the crawler, SEO differ, sitemap comparator → `demat-diagnostics-toolkit`; what counts as acceptance evidence → `demat-validation-and-qa`; scope/approval doctrine and who decides what → `demat-change-control` (this skill routes every gate through it).

## Jargon (defined once)

| Term | Meaning here |
|---|---|
| **Cutover** | Switching the live domain `dematerialized.nl` from Webflow's servers to the Netlify-hosted Nuxt app by changing DNS records. |
| **Soak** | A watch period after cutover, running the new site in production before doing anything irreversible (cancelling Webflow). |
| **Parity** | The project's prime directive: the Nuxt app reproduces the Webflow site's layout, copy, URLs, and behavior exactly (see `webflow-parity-reference`). |
| **jsDelivr** | CDN that served the old site's custom JS/CSS from the GitHub repo `cyocabet-dem/demat-webflow`. The Nuxt app has zero jsDelivr references (verified by grep) — that repo becomes archivable after cutover. |
| **Apex** | The bare domain `dematerialized.nl` (vs the `www` subdomain). |
| **Deploy preview** | Netlify's per-PR/branch build on a `*.netlify.app` URL, distinct from the production deploy. |
| **GTM** | Google Tag Manager. Test container `GTM-556SMQSF` (the code default), production container `GTM-56PZW3LP`. Loads only after analytics consent. |
| **CORS** | Browser cross-origin policy. The FastAPI backend has an explicit origin allowlist (`CORS_ORIGINS` env var, wired in `demat-backend/app/main.py` CORSMiddleware block ~line 176). New frontend origins fail until added. |
| **Finsweet ConsentPro** | The old site's paid cookie-consent widget, replaced by the app's own consent system (`demat-i18n-and-consent`). Its subscription is cancelled at retirement. |

## Actors and hard rules (non-negotiable, from change control)

| Actor | Owns |
|---|---|
| **Courtney** | Netlify dashboard, Auth0 dashboard, DNS provider, all approvals below, and **every real-money action** (completing a Stripe payment is never automated — human-only, always). |
| **Edward** | Backend: `CORS_ORIGINS`, production env/host, merging backend PRs #45/#46, running prod migrations/seeds. Every backend change = new branch off the working branch + PR to `Edwardvaneechoud/demat-backend`, flagged to Edward before starting. Never commit to the backend repo directly. |
| **Claude session** | Preflight checks, verification runs, diagnostics, drafting exact values for the humans to paste into dashboards. |

Standing rules that bind every phase: (1) **never `git push` or open a PR without Courtney's explicit OK**; (2) **any write to the hosted TEST database needs Courtney's OK each time**; (3) **payments are human-only**; (4) writes to the **LIVE** database (reservations, orders, profile edits via the live API) are real business data — Courtney drives or explicitly approves each one.

---

## Phase 0 — Preflight (Claude session; decision gates for Courtney)

### 0.1 Repo state — what would actually deploy

**Netlify builds from the GitHub remote (`git@github.com:cyocabet-dem/webflow-migration.git`), not your working tree.** Only pushed commits exist to Netlify. Run:

```bash
cd /Users/courtneyyocabet/webflow-migration
git fetch origin
git status --short
git log --oneline -3
git rev-list --count origin/main..main   # commits ahead of the remote
```

**Expected (state as of 2026-07-07):** `origin/main` == local `main` == `4ef31bf` (0 ahead) — the full migrated app through QA round 2 is already on the remote. **But the working tree was dirty**: uncommitted Capacitor/mobile work (new `app/MOBILE.md`, `app/assets/css/8-native-app.css`, `app/public/_headers`, modified `nuxt.config.ts`, `package.json`, several plugins/composables). Uncommitted work **will not be in the Netlify build**.

- **If `main` is ahead of `origin/main`** → those commits must be pushed before Netlify can build them. **Pushing needs Courtney's explicit OK** — earlier in this project unpushed-by-default was deliberate. Ask, then push, then continue.
- **If the working tree is dirty** → decision gate for Courtney: cut over from the last pushed commit as-is, or land the in-flight work first (commit + push, with her OK). Do not silently commit anything.
- **If `origin/main` has commits you don't have locally** → someone else pushed; `git pull` and re-review before proceeding.

### 0.2 Backend PR state (informational — blog rollout is Phase 8, non-blocking)

```bash
gh pr view 46 --repo Edwardvaneechoud/demat-backend --json state,mergeable,baseRefName,headRefName
gh pr view 45 --repo Edwardvaneechoud/demat-backend --json state,baseRefName,headRefName
```

**Expected (as of 2026-07-07):** both OPEN. #45 = `claude/rental-returns-myparcel-a2v09b` → main (rentals/returns/MyParcel). #46 = `claude/blog-models` → main (blog API), MERGEABLE, and its branch is stacked on #45's branch. Neither blocks Phases 1–7: the frontend serves identical bundled blog content as a fallback (see Phase 8).

### 0.3 Confirm executors

Dashboard steps (Netlify, Auth0, DNS) are Courtney's; backend CORS/prod env is Edward's. Confirm both are available and agree on timing **before** starting Phase 1 — Phases 3 and 4 must complete before Phase 6 (DNS), or users hit login/API failures on the live domain.

---

## Phase 1 — Create the Netlify site (Courtney, dashboard)

Per `app/DEPLOY.md` §1: Netlify → Add new site → Import from Git → pick `cyocabet-dem/webflow-migration`. Build settings come from the repo-root `netlify.toml` — accept them:

```toml
[build]
  base = "app"
  command = "npm run build"
  publish = "dist"
```

Nitro auto-detects Netlify during `nuxt build` and emits the serverless functions + real publish output; the `publish = "dist"` value is largely preset-managed — **do not "fix" it**.

**KNOWN RISK — no Node pin.** The repo has no `.nvmrc` and no `engines` field anywhere; local dev ran Homebrew Node v26.4.0. Netlify will use its own default. **Record the Node version from the first build log** (deploy log header prints it). Adding a pin later (e.g. `NODE_VERSION` env var) is a change — route it through `demat-change-control`.

**Gate — expected observation:** first deploy builds green and the site serves on `https://<site>.netlify.app`. Homepage renders (against the **test** API until Phase 2 env vars are set — the code default `apiBase` is `https://test-api.dematerialized.nl`).

- **If the build fails** → read the deploy log: (a) Node version incompatibility with Nuxt ^3.17 (compare against the local v26.4.0 that is known-good); (b) `postinstall` (`nuxt prepare`) or native-dep install-script behavior — locally the sandbox restricted install scripts to an `allowScripts` list (`esbuild`, `@parcel/watcher`) in `app/package.json`; on Netlify plain npm runs scripts normally, so a *different* failure shape here means a real dependency problem, not the sandbox. (c) If it fails resolving the `app/` base or lockfile, confirm Netlify picked up `netlify.toml` from the repo root.
- **If the build is green but pages 500** → check Netlify Functions logs (Nitro SSR runs as a function); see `demat-run-and-operate` for the Netlify/Nitro anatomy.

## Phase 2 — Environment variables (Courtney, dashboard)

Site settings → Environment variables. Exactly two, per `app/DEPLOY.md` §2 (verified against `app/nuxt.config.ts` runtimeConfig):

| Variable | Production context | Deploy previews / staging |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `https://api.dematerialized.nl` | `https://test-api.dematerialized.nl` (also the code default if unset) |
| `NUXT_PUBLIC_GTM_ID` | `GTM-56PZW3LP` | `GTM-556SMQSF` (the code default if unset) |

Use Netlify's deploy-context scoping so previews keep test values. Everything else (Auth0 domain/client, Hotjar `6427900`, Meta Pixel, Geoapify) ships the same value in all environments — no variables needed.

Redeploy after setting them (env vars apply at build time for the payload).

**Gate — expected observations:**
- `curl -s https://<site>.netlify.app/ | grep -o 'GTM-[A-Z0-9]*'` → `GTM-56PZW3LP` on the production deploy (the public runtime config is serialized into the page payload). Note GTM itself does **not** load until analytics consent is granted — absence of a `googletagmanager.com` request pre-consent is correct behavior, not a failure.
- DevTools Network tab on `/clothing`: the catalog fetch (`GET <apiBase>/search`) hits `https://api.dematerialized.nl/...`.
- **If API calls still hit `test-api`** → the env var isn't scoped to the context you're viewing, or you're looking at a preview deploy; re-check scoping and redeploy.

## Phase 3 — Auth0 allowlist (Courtney, dashboard)

Auth0 → Applications → the "your account" SPA app → Settings (per `app/DEPLOY.md` §3; tenant `dev-rgs24jdzcvdydd77.eu.auth0.com`, client `o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV` — public IDs, hardcoded in `nuxt.config.ts`). **Append** (don't replace — keep `http://localhost:3000` dev entries) the production domain and any `*.netlify.app` domain you want to test logins on, to all three fields:

| Field | Value |
|---|---|
| Allowed Callback URLs | `https://dematerialized.nl/` (the app's `redirect_uri` is `window.location.origin + '/'` — trailing slash, root path, per `app/plugins/auth0.client.ts`) |
| Allowed Logout URLs | `https://dematerialized.nl/` |
| Allowed Web Origins | `https://dematerialized.nl` (no trailing slash — it's an origin) |

Add the `https://<site>.netlify.app` equivalents now so Phase 5 login smoke works pre-DNS.

**Gate — expected observation:** on `https://<site>.netlify.app`, sign in via the auth modal → Auth0 Universal Login → redirected back signed-in, navbar shows the account state.

**If you see X instead → branch:**
- Auth0 error page **"Callback URL mismatch"** → Allowed Callback URLs (check trailing slash and exact scheme/host).
- Login works but **sign-out lands on an Auth0 error** → Allowed Logout URLs.
- Login redirect works but the session **doesn't persist / silent token renewal fails** (console errors on token calls from your origin) → Allowed Web Origins.

## Phase 4 — Backend CORS allowlist (Edward)

The API's allowlist is the `CORS_ORIGINS` env var consumed by the CORSMiddleware block in `demat-backend/app/main.py` (~line 176-181). **Do not touch the backend repo — ask Edward** to add:

- `https://dematerialized.nl` — likely already present (it's today's production origin, serving Webflow), verify rather than assume;
- `https://<site>.netlify.app` — needed for Phase 5 pre-DNS verification (per `DEPLOY.md` §4, add it to whichever API — test or live — that deploy targets).

**Before the fix, expect this exact signature** in the browser console from the netlify.app origin: *"Access to fetch at 'https://api.dematerialized.nl/…' from origin 'https://<site>.netlify.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."* — same failure mode localhost had before the dev proxy existed (documented in `nuxt.config.ts` comments).

**Gate — expected observation:** signed in on the netlify.app domain, an authed call succeeds — e.g. Network tab shows `GET /users/me` → 200 with a JSON user. Public endpoints (`/search`) also need CORS, so the catalog rendering is itself a check.

## Phase 5 — Full verification on the production deploy, pre-DNS (Claude session + Courtney)

Per `DEPLOY.md` §5 step 1: **"click through the site against the live API first"** — the production Netlify deploy already points at `https://api.dematerialized.nl` (Phase 2), so verify on `https://<site>.netlify.app` before touching DNS.

Run the measurement suite (tools and interpretation → `demat-diagnostics-toolkit`; acceptance bars → `demat-validation-and-qa`):

| Check | Expected result |
|---|---|
| Route crawl (all 29 pages × EN+NL + sitemap + robots) | Fully green — no 404/500/redirect surprises. (The migration's final pre-cutover crawl was 64 checks green, per the migration-map Implementation log.) |
| SEO diff vs `old/` export heads | **Zero findings** (that was the bar the migration met). |
| Sitemap compare vs `nl-reference/live-sitemap.xml` | Exactly **one known deviation**: the app emits a 7th blog post (`you-own-way-more-clothes-than-you-wear-…`) absent from the live sitemap — an accepted deviation per Courtney's 2026-07-07 disposition. Anything else is a finding. |
| Consent | Fresh browser profile → banner appears; **zero** requests to googletagmanager.com / hotjar.com / facebook.net before accepting; accept analytics → `gtm.js?id=GTM-56PZW3LP` loads. (Google Fonts loading unconditionally is a **known accepted** item — do not "fix" during cutover.) |
| i18n | `/nl` routes render Dutch, `html[lang]` flips, locale switcher round-trips. Known EN-placeholder strings under NL are accepted pending Courtney's translations — not cutover findings. |
| Login smoke | Sign-in/sign-out round-trip on the netlify.app domain (Phase 3 gate re-run against live API). |
| Commerce smoke — **read-only** | Catalog filters, PDP gallery, wishlist *display*, cart *open/close*. **STOP before any write**: on the live API, adding to basket / reserving / ordering creates real business records. Writes are Courtney-driven or Courtney-approved, case by case. |
| **Money gate — human only** | Courtney personally completes one real membership join **or** purchase end-to-end on the production deploy (Stripe live). Never automated, no exceptions. |

- **If the crawl shows 404s on valid routes** → do NOT add netlify.toml redirects; the app's 404 is `app/error.vue` and all routes are real Nuxt pages — a 404 here means the build/preset mis-emitted, investigate the deploy log (→ `demat-run-and-operate`).
- **If blog pages show bundled content** → correct and expected until Phase 8; the console shows `[Blog] API unavailable, using bundled content` (useBlogPosts.ts) — not a failure.
- **If any parity finding appears** → it's a stop-and-ask through `demat-change-control`, not an inline fix during cutover.

## Phase 6 — DNS cutover (Courtney, DNS provider + Netlify dashboard)

1. In Netlify: Domain settings → Add custom domain → `dematerialized.nl` (+ `www`). Netlify shows the exact records (apex A/ALIAS or NETLIFY record; `www` CNAME).
2. In the DNS provider, set those records for apex + `www`.
3. **There is no downtime window to coordinate**: Webflow keeps serving until each resolver's cache expires (per `DEPLOY.md` §5). Both sites are live simultaneously during propagation — that is fine.

**Expected observations:**
```bash
dig +short dematerialized.nl        # → Netlify's IP / flattened record
dig +short www.dematerialized.nl    # → Netlify CNAME target
curl -sI https://dematerialized.nl | grep -i '^server\|^x-nf'   # Netlify response headers once propagated
```
Netlify auto-provisions a Let's Encrypt certificate after DNS points at it — expect minutes-to-an-hour; the dashboard shows certificate status.

- **If the certificate stalls** → usually stale/conflicting old records (AAAA leftovers, CAA restrictions); check the DNS zone for leftovers pointing at Webflow.
- **ROLLBACK PLAN (state it plainly):** point the DNS records back at Webflow's values. Webflow is still subscribed and still serving its copy until Phase 9 — reverting DNS fully restores the old site. This is why **nothing gets cancelled until after the soak**.

## Phase 7 — Post-cutover verification on the live domain (Claude session + Courtney)

Re-run the Phase 5 table against `https://dematerialized.nl`, plus:

| Check | How | Expected |
|---|---|---|
| Prod GTM firing | Tag Assistant, or console: `window.dataLayer` after accepting analytics consent | `gtm.js` event present; container `GTM-56PZW3LP` loaded; tags fire per container config (container contents live in GTM, not this repo) |
| hreflang + sitemap | `curl -s https://dematerialized.nl/sitemap.xml` and view-source hreflang alternates | 18 static page pairs + blog entries; alternates reference `https://dematerialized.nl` (the hardcoded SITE base in `app/server/routes/sitemap.xml.ts` — now truthful) |
| Auth0 on apex | Full login round-trip on `https://dematerialized.nl` | Works (Phase 3 already allowlisted the apex) |
| robots.txt | `curl -s https://dematerialized.nl/robots.txt` | `Sitemap: https://dematerialized.nl/sitemap.xml` |

- **If login fails on the apex but worked on netlify.app** → Phase 3 fields are missing the apex entries (check trailing slash on Callback/Logout, no slash on Web Origins).

## Phase 8 — Blog data rollout (SEPARATE track — Edward; non-blocking)

**Not coupled to the cutover.** The frontend serves identical bundled blog content (`app/data/blog.json`, 7 posts) whenever the API fails or returns empty — production users see the right content either way (`DEPLOY.md` §5b: "no urgency coupling this to the cutover").

**Dependency chain (verified 2026-07-07):** the blog migration `b8c2d4e6f0a1_add_blog_tables.py` has `down_revision = "f0a1b2c3d4e5"` (the rental-returns migration), which exists **only on PR #45's branch, not on main** — the migration chain cannot apply to prod until #45 lands. The documented sequence is **Edward merges PR #45, then PR #46**. (#46's branch is stacked on #45's, so GitHub reports it mergeable on its own — merge order is still Edward's call; confirm with him before anything runs.)

Then, **run by Edward with the production backend env** (never a Claude session against prod; also gated by the live-DB rule):

```bash
# in demat-backend, prod env
poetry run alembic upgrade head                      # applies f0a1b2c3d4e5 → b8c2d4e6f0a1 → d5e7f9a1b3c6
poetry run python scripts/seed_blog.py               # reads webflow-migration app/data/blog.json; idempotent on (slug, locale)
poetry run python scripts/upload_blog_images.py      # uploads app/public/images/blog/ to S3 + rewrites DB URLs; idempotent
```

Images land under `{IMAGE_BUCKET_LOCATION}/blog/` = **`demat-europe/img/blog/`** in prod (the non-test default in `demat-backend/app/core/config.py`; test mode uses `demat-europe-test/img`).

**Gate — expected observations:**
- `curl -s 'https://api.dematerialized.nl/blogs?locale=en' | python3 -m json.tool | grep -c '"slug"'` → 7 posts.
- Frontend now serves API content — how to tell: (a) no `[Blog] API unavailable, using bundled content` console.info on `/also-this`; (b) blog images load from S3 object URLs instead of `/images/blog/...` paths.
- Note: the sitemap still lists blog posts from the **bundled** blog.json regardless (known design, `sitemap.xml.ts` imports it statically) — no change expected there.

## Phase 9 — Soak, then retirement (Courtney; IRREVERSIBLE steps gated)

**Soak checklist** (duration is **open — Courtney's call**; 2–4 weeks is a candidate, not a decision):
- Netlify: function errors, build health, bandwidth anomalies.
- Auth0 logs: failed logins, callback errors.
- Stripe dashboard: membership joins and purchases completing (real ones from real users).
- GTM/GA4: traffic continuity vs pre-cutover baseline (container `GTM-56PZW3LP`).
- Search Console: sitemap accepted, no crawl-error spike, hreflang health.
- User reports via the shop/team; the contact form is a known launch-state stub (shows success, discards input) — reports will arrive by other channels.

**Retirement steps — each has a precondition; retirement is IRREVERSIBLE for live-NL content** (once Webflow is cancelled, the production Dutch pages cease to exist anywhere live):

| Step | Precondition (verify first) |
|---|---|
| Cancel the Webflow subscription | Soak passed AND Courtney explicitly signs off AND the NL hedge exists: `ls nl-reference/*.nl.html \| wc -l` → **17** captures + `nl-reference/live-sitemap.xml` present (they do as of 2026-07-07 — the 2026-07-05 live-NL captures are the only surviving record of production Dutch copy once Webflow is gone). Cancelling also kills the DNS rollback plan — this is the true point of no return. |
| Cancel the Finsweet ConsentPro subscription | The app's own consent system verified live (Phase 5/7 consent checks green). Independent of Webflow cancellation timing. |
| Archive `cyocabet-dem/demat-webflow` on GitHub | `grep -rn jsdelivr app/ --include='*.ts' --include='*.vue'` → zero hits (verified 2026-07-07); the repo is not archived yet as of 2026-07-07 (`gh repo view cyocabet-dem/demat-webflow --json isArchived` → false). Archiving is reversible; do it last, after Webflow itself is gone. |

The local `old/` directory and `nl-reference/` stay in this repo permanently — they remain the parity source of truth.

---

## Fenced-off wrong paths (do NOT do these)

- **Do not add `netlify.toml` redirects for 404s.** `app/error.vue` *is* the 404 (a parity port of the old 404 page, noindex). There is deliberately no `_redirects` file. (The only `app/public/_headers` entry is an iOS apple-app-site-association content-type from the uncommitted mobile work — unrelated.)
- **Do not "fix" `publish = "dist"`** in netlify.toml. Nitro's Netlify preset manages the real output.
- **Do not set `NUXT_PUBLIC_DEV_MOCK_AUTH` anywhere near production.** It fakes an authenticated session; it's guarded by `import.meta.dev` but it has no business in any Netlify env context.
- **Do not run the blog scripts (`alembic upgrade`, `seed_blog.py`, `upload_blog_images.py`) against prod yourself.** Edward runs them, with Courtney aware. (Against the TEST DB they'd *also* need Courtney's per-run OK.)
- **Do not reorder the campaign so DNS (Phase 6) moves before Auth0 (Phase 3) and CORS (Phase 4).** Real users on the live domain would hit login callback errors and blocked API calls immediately.
- **Do not complete any Stripe payment programmatically** — the money gate is Courtney, in person, every time.
- **Do not fix parity/known-issue items mid-cutover** (Google Fonts consent-gating, sitemap 7th post, `/account` dead auth ref, NL placeholders): they are accepted/deferred dispositions owned by `demat-change-control`. The single approved fix (PDP "up to 10 items" copy vs the real MAX_ITEMS=5 cap) is its own change with its own Implementation-log entry — not a cutover task.
- **Do not cancel Webflow before the soak sign-off** — it is the rollback plan.

## Summary table

| Phase | Actor | Gate | Expected observation | Rollback |
|---|---|---|---|---|
| 0 Preflight | Claude + Courtney | Repo pushed state confirmed; push needs Courtney's OK; executors confirmed | `origin/main` == intended cut commit; PRs #45/#46 state known | n/a (nothing changed yet) |
| 1 Netlify site | Courtney (dashboard) | First build green | Site serves on `<site>.netlify.app`; Node version recorded | Delete site |
| 2 Env vars | Courtney (dashboard) | Redeploy with prod values | `GTM-56PZW3LP` in page payload; Network calls hit `api.dematerialized.nl` | Unset vars, redeploy |
| 3 Auth0 allowlist | Courtney (dashboard) | Login round-trip on netlify.app | Signed-in navbar state after redirect | Remove appended entries |
| 4 Backend CORS | Edward | Authed API call from Netlify origin | `GET /users/me` → 200, no CORS console error | Edward removes origins |
| 5 Pre-DNS verification | Claude (checks) + Courtney (money) | Crawl green; SEO diff 0; sitemap diff = known 7th post only; consent clean; one human real payment | All bars met on netlify.app against live API | n/a (read-mostly; writes Courtney-gated) |
| 6 DNS cutover | Courtney (DNS provider) | dig/curl show Netlify; cert issued | Live domain serves the Nuxt app; no downtime window needed | **Point DNS back at Webflow** |
| 7 Post-cutover checks | Claude + Courtney | Phase-5 suite + GTM/hreflang/Auth0 on apex | All green on `dematerialized.nl` | DNS rollback still available |
| 8 Blog rollout | Edward (prod env) | PR #45 then #46 merged; migrate+seed+upload run | `GET /blogs?locale=en` → 7 posts; no bundled-fallback console.info | Fallback self-heals (API failure → bundled content) |
| 9 Soak + retirement | Courtney | Soak sign-off; nl-reference hedge verified (17 files + live-sitemap.xml) | Webflow + ConsentPro cancelled; `demat-webflow` archived | **None after Webflow cancellation — irreversible** |

## Provenance and maintenance

All repo-grounded facts verified **2026-07-07** against `webflow-migration` @ `4ef31bf` (working tree carried uncommitted Capacitor/mobile changes) and `demat-backend` @ `claude/blog-models` (`dd9c834`). Courtney's rulings (approved fix, accepted deferrals, the four unwritten rules, cutover-as-priority) dated 2026-07-07. Volatile facts: PR states, remote sync, working-tree dirtiness, Netlify/Auth0/DNS dashboard state (not inspectable from the repo), and whether `cyocabet-dem/demat-webflow` is archived.

Re-verification commands:

| Fact | Command |
|---|---|
| Deploy doc unchanged | `git log --oneline -3 -- app/DEPLOY.md` and re-read `app/DEPLOY.md` |
| Remote sync / unpushed commits | `git fetch origin && git rev-list --count origin/main..main && git status --short` |
| PR #46 / #45 state | `gh pr view 46 --repo Edwardvaneechoud/demat-backend --json state,mergeable` (same for 45) |
| Blog migration chain | `grep -n down_revision /Users/courtneyyocabet/demat-backend/alembic/versions/b8c2d4e6f0a1_add_blog_tables.py`; on main: `git -C /Users/courtneyyocabet/demat-backend log main --oneline -- alembic/versions/f0a1b2c3d4e5_add_rental_returns.py` (empty = not on main yet) |
| Prod env-var names/values | `grep -n "apiBase\|gtmId" app/nuxt.config.ts` and the table in `app/DEPLOY.md` §2 |
| Auth0 redirect shape | `grep -n "redirect_uri" app/plugins/auth0.client.ts` (expect `window.location.origin + '/'`) |
| CORS mechanism | `grep -n "CORS_ORIGINS\|allow_origins" /Users/courtneyyocabet/demat-backend/app/main.py` |
| Node pin still absent | `ls app/.nvmrc 2>&1; grep -n engines app/package.json` |
| Sitemap static pages (18) | `sed -n '7,26p' app/server/routes/sitemap.xml.ts` |
| Bundled blog posts (7) vs live sitemap (6) | `grep -c '"slug"' app/data/blog.json; grep -c "/blog/" nl-reference/live-sitemap.xml` |
| Blog fallback log line | `grep -n "API unavailable" app/composables/useBlogPosts.ts` |
| NL hedge exists | `ls nl-reference/*.nl.html \| wc -l` (expect 17) and `ls nl-reference/live-sitemap.xml` |
| jsDelivr fully unreferenced | `grep -rn jsdelivr app/ --include='*.ts' --include='*.vue' --include='*.toml'` (expect no hits) |
| demat-webflow archive state | `gh repo view cyocabet-dem/demat-webflow --json isArchived` |
| S3 blog prefix | `grep -n IMAGE_BUCKET_LOCATION /Users/courtneyyocabet/demat-backend/app/core/config.py /Users/courtneyyocabet/demat-backend/scripts/upload_blog_images.py` |
