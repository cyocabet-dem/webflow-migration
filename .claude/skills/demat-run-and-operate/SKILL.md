---
name: demat-run-and-operate
description: Load when running, building, previewing, or deploying the Dematerialized Nuxt app, or when asking "what does npm run X do", "where does the output land", "which env var controls Y", "how do I add a config flag", "why doesn't a new blog post show in the sitemap", "how does the backend deploy", or "is that row in the test DB real user data". Covers command anatomy, the Netlify pipeline, the full runtimeConfig/env-var registry, static-asset and sitemap topology, backend deploy awareness, blog data rollout, and the test-DB artifact inventory.
---

# demat-run-and-operate — running, deploying, and what lands where

**What this covers:** what every npm script actually does here, how the Netlify deploy pipeline works (and what it doesn't have), the complete configuration-axes registry (`runtimeConfig.public` keys + build-time env vars) with the checklist for adding a new one, where static assets/sitemap/blog data live, how the sibling backend deploys itself, the blog data-rollout commands, and which rows in the hosted TEST database are migration artifacts rather than user data.

**When to use:** any question shaped like "run/build/deploy this", "which env var / config key", "where is this file served from", "why is X missing from the sitemap", "how do backend changes reach the test API", or "what's this weird row in the test DB".

**When NOT to use:**
- Executing the actual **production cutover** (Netlify site creation, DNS, Auth0/CORS allowlists, soak, cancellations) → **demat-cutover-campaign**. This skill explains the machinery; that skill is the decision-gated sequence.
- Recreating the **dev environment from scratch**, the three dev modes in depth, or the local-backend auth-bypass runner → **demat-build-and-env**.
- Approval rules, scope gates, who may authorize what → **demat-change-control** (summarized below where operations touch it, but that skill is authoritative).
- Measuring/verifying a deployed site (crawls, SEO diffs) → **demat-diagnostics-toolkit** / **demat-validation-and-qa**.

Repo layout reminder for zero-context readers: the Nuxt 3 app lives in `app/` inside `/Users/courtneyyocabet/webflow-migration`; `old/` is the read-only Webflow reference; the FastAPI backend is a **separate sibling repo** at `/Users/courtneyyocabet/demat-backend` (GitHub `Edwardvaneechoud/demat-backend`) and is reference-only from here.

---

## 1. Command anatomy (`app/package.json` scripts)

Run everything from `app/` (or `npm run <script> --prefix app` from the repo root).

| Command | What it actually does here |
|---|---|
| `npm run dev` | `nuxt dev` — dev server on port 3000 (`.claude/launch.json` config `nuxt-dev`). The `$development` block in `nuxt.config.ts` sets `runtimeConfig.public.apiBase = '/dev-api'` and a Nitro devProxy forwards `/dev-api` → `DEV_API_TARGET` or `https://test-api.dematerialized.nl`. This proxy exists because the backend's CORS allowlist has **no localhost origins** — any dev API call that skips the proxy fails in the browser. |
| `npm run dev:mock` | `NUXT_PUBLIC_DEV_MOCK_AUTH=1 DEV_API_TARGET=http://localhost:8000 nuxt dev` — fake signed-in session against a locally-run auth-bypassed backend (launch config `nuxt-dev-mock`, port 3001). Details and the paired backend runner → **demat-build-and-env**. |
| `npm run build` | `nuxt build` — the deploy command. Locally emits `.output/` (a `server/` Node bundle + `public/` static assets; `.output` is gitignored). **On Netlify**, Nitro (Nuxt's server engine) auto-detects the Netlify environment and applies its Netlify **preset**: the server bundle is emitted as Netlify serverless functions (SSR pages and the `/sitemap.xml` server route run there) plus the static publish dir. No preset config is written anywhere — detection is automatic. |
| `npm run generate` | `nuxt generate` — full static pre-render. **Not used by the Netlify deploy** (Netlify runs `npm run build`). As of 2026-07-07 it IS used by the mobile pipeline: `build:mobile` = `NUXT_MOBILE=1 nuxt generate`, which flips `ssr: false` (see `isMobileBuild` in `nuxt.config.ts`) and emits a static SPA to `.output/public` for the Capacitor shells. |
| `npm run preview` | `nuxt preview` — serves the previously built `.output/` locally. Useful sanity check before trusting a Netlify deploy preview. |
| `npm run postinstall` | `nuxt prepare` — regenerates `.nuxt/` (types, tsconfig). Runs automatically on `npm install`. |
| `build:mobile`, `mobile:sync`, `mobile:ios`, `mobile:android`, `mobile:assets` | Capacitor 8 iOS/Android shells around the same app (added 2026-07-07, **uncommitted in the working tree as of that date**). `mobile:sync` = build:mobile → `scripts/prune-mobile-bundle.mjs` (ships only CSS-referenced media, ~212MB → ~50MB) → `cap sync` into `app/ios/` + `app/android/`. See `app/MOBILE.md`. Irrelevant to the web deploy. |

There are **no** `lint`, `format`, `test`, or `typecheck` scripts, and no ESLint/Prettier/vue-tsc configuration — the Netlify build is the only automated check on the frontend. Node version is unpinned (no `.nvmrc`, no `engines`); local dev uses Homebrew Node.

---

## 2. Netlify pipeline — the whole pipeline

`netlify.toml` at the **repo root** (not in `app/`):

```toml
[build]
  base = "app"
  command = "npm run build"
  publish = "dist"
```

Facts that surprise people:

- **`publish = "dist"` is largely vestigial.** Under the auto-detected Nitro Netlify preset, `nuxt build` itself emits the serverless functions and tells Netlify the real publish output; the `dist` value is not what serves the site. Don't "fix" it without testing a deploy preview.
- **There is no CI in the frontend repo.** No `.github/` directory exists. Netlify's git integration (build on push to the connected branch, deploy previews on PRs) is the entire pipeline. Remember discipline rule: **never `git push` or open a PR without asking Courtney first** — a push to the connected branch IS a deploy trigger once the Netlify site exists.
- **No `_redirects`, no `[[redirects]]`.** 404 handling is entirely Nuxt's `app/error.vue` (a faithful port of the Webflow 404 page, `robots noindex`). Forced-HTTPS/www rules would live in the Netlify dashboard, not the repo.
- **`app/public/_headers` exists as of 2026-07-07** (uncommitted, added with the mobile work) but does exactly one thing: sets `Content-Type: application/json` on `/.well-known/apple-app-site-association` (iOS universal links need JSON despite the extensionless filename). It is not a general headers policy.
- The only server-side code that ships is Nitro's SSR renderer plus **one** custom server route: `app/server/routes/sitemap.xml.ts` (see §5).

Deploy-time environment variables are set in the Netlify dashboard (Site settings → Environment variables) — the canonical table is `app/DEPLOY.md` §2 and mirrored in §3 below. The full dashboard sequence (site creation, Auth0 allowlist, backend CORS, DNS) is **demat-cutover-campaign**'s territory.

---

## 3. Environment-variable scheme

Nuxt convention: every key under `runtimeConfig.public` in `nuxt.config.ts` is overridable at **runtime of the built server** via `NUXT_PUBLIC_<KEY_IN_SCREAMING_SNAKE_CASE>`. Only two variables differ between environments:

| Variable | Production value | Test/previews (= default if unset) | Consumer |
|---|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `https://api.dematerialized.nl` | `https://test-api.dematerialized.nl` (dev mode uses `/dev-api` proxy instead) | every API call site |
| `NUXT_PUBLIC_GTM_ID` | `GTM-56PZW3LP` (PROD container) | `GTM-556SMQSF` (TEST container) | `plugins/analytics.client.ts` |

Everything else ships the **same value in all environments** (they are public client IDs; per `CLAUDE.md`, public IDs in client code are fine). `NUXT_PUBLIC_DEV_MOCK_AUTH` must **never** be set in production — it is additionally guarded by `import.meta.dev`, so a prod build ignores it, but do not rely on that.

## 4. Config-axes catalog (the config-and-flags home)

### 4a. `runtimeConfig.public` registry (`app/nuxt.config.ts`, verified 2026-07-07)

| Key | Default (in repo) | Prod override | Who consumes it |
|---|---|---|---|
| `apiBase` | `https://test-api.dematerialized.nl`; dev-mode `$development` block overrides to `/dev-api` | `NUXT_PUBLIC_API_BASE=https://api.dematerialized.nl` | ~26 files: all commerce/auth/catalog/blog composables (`useAuth`, `useCartManager`, `usePurchaseCart`, `useWishlistManager`, `useUserMembership`, `useCatalog`, `useCatalogCache`, `useMembershipCheckout`, `useBlogPosts`), account/commerce pages, `OnboardingModal.vue`, `MailBanner.vue`, cart plugins |
| `auth0Domain` | `dev-rgs24jdzcvdydd77.eu.auth0.com` | same in all envs | `plugins/auth0.client.ts` |
| `auth0ClientId` | `o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV` | same in all envs (`app/MOBILE.md` notes a possible `NUXT_PUBLIC_AUTH0_CLIENT_ID` override for a native-type Auth0 app — mobile-only contingency, not prod web) | `plugins/auth0.client.ts` |
| `gtmId` | `GTM-556SMQSF` (TEST container) | `NUXT_PUBLIC_GTM_ID=GTM-56PZW3LP` | `plugins/analytics.client.ts` (consent-gated) |
| `hotjarId` | `6427900` | same | `plugins/analytics.client.ts` (consent-gated) |
| `metaPixelId` | `1337973184818900` | same | `plugins/analytics.client.ts` (consent-gated; skipped in the native apps for Apple ATT reasons) |
| `geoapifyKey` | `ce61be62b3c344838d731909f625cfd1` | same | `components/OnboardingModal.vue` (address autocomplete) |
| `devMockAuth` | `''` (off) | **NEVER set in production** | `plugins/auth0.client.ts` (`cfg.devMockAuth && import.meta.dev`) |

### 4b. Build/dev-time env vars (not runtimeConfig)

| Variable | Effect | Where read |
|---|---|---|
| `DEV_API_TARGET` | Retargets the dev-only `/dev-api` Nitro proxy (e.g. `http://localhost:8000` for a local backend). Dev mode only; no effect on builds. | `nuxt.config.ts` `$development.nitro.devProxy` |
| `NUXT_MOBILE=1` | Flips `ssr: false` for `nuxt generate` (static SPA for the Capacitor apps). Never set for the Netlify web build. | `nuxt.config.ts` top (`isMobileBuild`) |

### 4c. Checklist: adding a new config axis

Adding a configuration axis is a **change-control event** — it is new engineering beyond the sanctioned parity scope, so stop and get Courtney's approval first (→ **demat-change-control**), then:

1. Add the key with a safe (test/off) default under `runtimeConfig.public` in `app/nuxt.config.ts`, with a comment stating the prod override if any.
2. Production/preview values go in as `NUXT_PUBLIC_<KEY>` env vars in the Netlify dashboard — never a second hardcoded value in code.
3. Update the environment-variable table in `app/DEPLOY.md` §2.
4. Consume it via `useRuntimeConfig().public.<key>` (never `process.env` in client code — it isn't populated in the browser bundle).
5. Log the change in `migration-map.md` → `# Implementation log`, in the same turn the work lands.

---

## 5. What lands where

| Thing | Location | Serving path / notes |
|---|---|---|
| Static assets | `app/public/` | Served verbatim at the site root. As of 2026-07-07: `images/` (251 files, incl. `images/blog/` 35 files and `images/meta/` 10 files — the re-hosted 1200×630 og-images), `videos/` (16 files), `robots.txt`, `favicon.png`, `webclip.png`, plus uncommitted mobile additions `_headers` and `.well-known/` (apple-app-site-association, assetlinks.json). Zero Webflow-CDN dependencies remain. |
| `robots.txt` | `app/public/robots.txt` | One line: `Sitemap: https://dematerialized.nl/sitemap.xml`. No User-agent/Disallow rules — intentional. |
| Sitemap | `app/server/routes/sitemap.xml.ts` (server route, runs in the Netlify function) | Hand-built XML: 18 static page paths × (nl + en entries, each with nl/en/x-default `xhtml:link` alternates) + blog URLs read from the **bundled** `app/data/blog.json` (`/blog/{slug}` when `en.title` exists; `/nl/blog/{slug}` only when `nl.title` exists). |
| Blog data | `app/data/blog.json` | 7 posts scraped from live Webflow on 2026-07-05 (1 has an NL variant). Dual role: runtime **fallback** for `useBlogPosts` (used whenever the `/blogs` API fails, times out, or returns empty) and the **seed source** for the backend's `scripts/seed_blog.py`. |

Two operational consequences of the sitemap being blog.json-driven:

- **Posts published only via the Phase 6 blog API will never appear in the sitemap** until `app/data/blog.json` is updated. If "why isn't the new post in the sitemap" comes up, this is why. Changing the sitemap to read the API would be new engineering → change control.
- The bundled 7th post (`you-own-way-more-clothes-than-you-wear-...`) appears in the app's sitemap but was **absent from the live Webflow sitemap** (6 blog URLs, archived at `nl-reference/live-sitemap.xml`). Per Courtney's ruling (2026-07-07) this is an **accepted/deferred** deviation — do NOT "fix" it without her approval (→ demat-change-control disposition table).

---

## 6. Backend operational awareness (reference-only — never commit to that repo)

The backend (`/Users/courtneyyocabet/demat-backend`, GitHub `Edwardvaneechoud/demat-backend`) deploys itself to Hetzner via its own GitHub Actions; the frontend team only needs to know when its changes become visible:

| Workflow | Trigger | Deploys to |
|---|---|---|
| `.github/workflows/deploy-hetzner.yml` | push to `main` (+ manual `workflow_dispatch`) | **TEST** (`test-api.dematerialized.nl`) |
| `.github/workflows/deploy-hetzner-prod.yml` | release **published** (+ manual dispatch with a tag) | **PROD** (`api.dematerialized.nl`) |
| `.github/workflows/test-coverage.yml` | push / PR to main, master, develop | tests only |

So: **a merged backend PR auto-deploys to the test API**; production requires Edward to publish a release. Backend changes from our side are always: new branch off the working branch `claude/rental-returns-myparcel-a2v09b`, PR to `Edwardvaneechoud/demat-backend`, flagged to Edward before starting — never direct commits (discipline rule, → demat-change-control).

### Blog data rollout (Phase 6 tail — gated, do not run unprompted)

As of 2026-07-07, backend **PR #45** (`claude/rental-returns-myparcel-a2v09b`) and **PR #46** (`claude/blog-models`, the blog work) are both OPEN. The blog Alembic migration's `down_revision` is a migration that only exists on the #45 branch, so **the migration chain cannot apply to `main` until #45 merges first**. After #46 merges, the rollout (run from the backend repo with the target env):

```bash
poetry run alembic upgrade head
poetry run python scripts/seed_blog.py            # reads ../webflow-migration/app/data/blog.json by default; idempotent on (slug, locale)
poetry run python scripts/upload_blog_images.py   # uploads app/public/images/blog/* to S3, rewrites seeded DB URLs; idempotent
```

- S3 destination is `{IMAGE_BUCKET_LOCATION}/blog/`: **test** = `demat-europe-test/img/blog/` (forced when `test_mode`, see `app/core/config.py` `IMAGE_BUCKET_LOCATION`), **prod** = `demat-europe/img/blog/`.
- **Authorization gates:** any write to the hosted TEST database (migrations, seeds, data mutations) requires **Courtney's explicit OK, each time**; the prod run is **Edward's call** on where/when (`app/DEPLOY.md` §5b). → demat-change-control.
- No urgency: the frontend serves identical bundled content until the API is live (silent fallback in `useBlogPosts`), so this is decoupled from the web cutover.
- Already done (2026-07-05, Courtney-authorized): migration + seed + image upload against the TEST DB — 7 EN + 1 NL posts, 2 authors, 35 images public-read in `demat-europe-test/img/blog/`.

---

## 7. Test-DB artifact inventory (as of 2026-07-07)

The hosted TEST database contains rows created by migration QA. **They are artifacts, not user data** — don't "clean them up" reflexively (some are kept deliberately for verification), and don't mistake them for real activity. Source of record: `migration-map.md` → `# Implementation log` (Phase 4/6 and Post-QA round 2 entries).

| Artifact | Origin | Status |
|---|---|---|
| Pending reservation for **item 617** under Courtney's test account | 2026-07-05 end-to-end authed commerce QA (full reservation lifecycle test) | left in place |
| Published donation session with **€8.00 balance** | QA round 2 issue #1 investigation (credits-total question) | deliberately left for Courtney to verify against |
| Test account profile `height_cm = "151"` (was unset) | QA round 2 issue #6 fix verification (string-typed attribute 422 fix) | side effect, left in place |
| Mailing-list subscriber row from the 2026-07-05 form-wiring verification (200 + success) | mailing-list `/mailing-list/subscribe` live test | address not recorded in the log; reported as `migration-test@dematerialized.nl` — **unverified** |
| Blog tables: 8 post rows (7 EN + 1 NL), 2 authors; 35 S3 objects under `demat-europe-test/img/blog/` | Phase 6 seed + image upload (Courtney-authorized) | intentional seed data |

Reminder while operating against the test DB: **real-money flows are human-only** — never automate completing a Stripe payment (membership join or purchase), even with test cards; and every new test-DB write needs Courtney's OK first.

---

## 8. Operating rules that bind this skill

- **Never `git push` or open a PR without asking Courtney** — in the frontend repo a push is a deploy trigger (once the Netlify site exists); in the backend repo pushes/PRs go to Edward's repo. Unpushed/uncommitted local state may be deliberate (as of 2026-07-07 the Capacitor mobile work sits uncommitted in the working tree).
- **Parity first:** anything beyond running/deploying the app as-is (new redirects, headers, sitemap logic, config axes, build steps) is a change-control event → **demat-change-control**.
- **Log what lands:** operational changes that touch the repo get an entry in `migration-map.md` → `# Implementation log` in the same turn.
- `old/` is read-only; never edit it; never content-scan `old/images/` or `old/videos/`.

---

## Provenance and maintenance

All facts verified against the repos on **2026-07-07** (frontend HEAD `4ef31bf` on `main` plus uncommitted mobile working-tree changes; backend branch `claude/blog-models`). The mobile (Capacitor) additions were uncommitted at verification time — expect `package.json`, `nuxt.config.ts`, and `app/public/` to have gained those entries in a later commit.

Re-verification one-liners (run before trusting a volatile fact):

| Fact | Check |
|---|---|
| npm scripts / mobile scripts | `cat app/package.json` |
| Netlify build config | `cat netlify.toml` |
| runtimeConfig keys + defaults | `sed -n '/runtimeConfig/,/^  },/p' app/nuxt.config.ts` |
| Dev proxy / `DEV_API_TARGET` | `grep -n -A8 '\$development' app/nuxt.config.ts` |
| No frontend CI | `ls -a /Users/courtneyyocabet/webflow-migration \| grep -i github` (expect no hit) |
| `_headers` / `_redirects` state | `ls app/public/; cat app/public/_headers 2>/dev/null` |
| Asset counts | `ls app/public/images \| wc -l; ls app/public/videos \| wc -l; ls app/public/images/blog \| wc -l` |
| Sitemap page list + blog source | `cat app/server/routes/sitemap.xml.ts` |
| blog.json post/NL count | `python3 -c "import json;d=json.load(open('app/data/blog.json'));print(len(d['posts']),[p['slug'] for p in d['posts'] if p.get('nl') and p['nl'].get('title')])"` |
| Backend PR #45/#46 state | `gh pr view 45 --repo Edwardvaneechoud/demat-backend --json state; gh pr view 46 --repo Edwardvaneechoud/demat-backend --json state` |
| Backend deploy triggers | `grep -n -A5 '^on:' /Users/courtneyyocabet/demat-backend/.github/workflows/deploy-hetzner*.yml` |
| S3 bucket location logic | `grep -n -A2 'IMAGE_BUCKET_LOCATION' /Users/courtneyyocabet/demat-backend/app/core/config.py` |
| Test-DB artifact log entries | `grep -n 'item 617\|€8.00\|height_cm' migration-map.md` |
| Unpushed frontend commits | `git rev-list --left-right --count origin/main...main` (was `0 0` on 2026-07-07 — but ask before any push regardless) |
| DEPLOY.md env table current | `sed -n '12,20p' app/DEPLOY.md` |
