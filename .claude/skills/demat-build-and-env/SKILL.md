---
name: demat-build-and-env
description: Load when setting up or repairing the Dematerialized dev environment — fresh clone, npm install / nuxt dev failures, choosing between the three dev modes (hosted-test-API proxy, full-local backend, mock session), running the FastAPI backend locally (Poetry, .env vs .env.test, TEST_MODE), using the auth-bypass runner run_local_backend.py, or when authed API calls 401 in dev, CORS errors appear in the browser console, or someone asks "how do I run this / log in locally / why is there no lint or typecheck?".
---

# demat-build-and-env — recreate the working environment from scratch

**Covers:** prerequisites, frontend setup (`app/`), the three dev modes and why the `/dev-api`
proxy exists, the mock-auth mechanism, the auth-bypass backend runner (shipped in this skill's
`scripts/`), running the FastAPI backend locally, and the environment's known traps.
**Use when:** standing up dev from nothing, or debugging "it won't run / won't log in / 401s in dev".
**Do NOT use for:** deploying or Netlify/Nitro production anatomy (→ `demat-run-and-operate`),
the production cutover itself (→ `demat-cutover-campaign`), understanding auth/cart flows as code
(→ `demat-commerce-and-auth`), or what evidence counts when verifying (→ `demat-validation-and-qa`).

Two repos are involved:

| Repo | Path | Role |
|---|---|---|
| `webflow-migration` | `/Users/courtneyyocabet/webflow-migration` (origin `git@github.com:cyocabet-dem/webflow-migration.git`) | Nuxt 3 frontend in `app/`; read-only Webflow reference in `old/` |
| `demat-backend` | `/Users/courtneyyocabet/demat-backend` (origin `git@github.com:Edwardvaneechoud/demat-backend.git`) | FastAPI backend, reference-only; run locally only when a dev mode needs it |

## 1. Prerequisites (verified 2026-07-07)

| Tool | Version in use | How installed | Needed for |
|---|---|---|---|
| Node | v26.4.0 at `/opt/homebrew/bin/node` | Homebrew | frontend |
| npm | ships with Node | Homebrew | frontend |
| Python (Poetry venv) | 3.14.6 (pyproject requires `^3.11`; system `python3` is 3.9.6 — too old, never use it directly) | Poetry-managed virtualenv | backend only |
| Poetry | 2.4.1 | — | backend only |
| Docker | any recent | — | backend **test suite** only (Postgres container) |

**Trap — Node is not pinned anywhere.** There is no `.nvmrc` and no `engines` field in
`app/package.json`. Local dev uses whatever Homebrew Node is installed; **Netlify's build Node
version is controlled in the Netlify dashboard, not by this repo**. If a build behaves differently
on Netlify than locally, check the dashboard's Node setting first.

## 2. Frontend setup from scratch

```bash
git clone git@github.com:cyocabet-dem/webflow-migration.git
cd webflow-migration/app
npm install
npm run dev        # → http://localhost:3000
```

Notes on `npm install`:

- `postinstall` runs `nuxt prepare`, which generates `.nuxt/` — including the
  `.nuxt/tsconfig.json` that `app/tsconfig.json` extends. If TypeScript tooling complains about a
  missing tsconfig, `nuxt prepare` hasn't run.
- `app/package.json` has an `allowScripts` block listing the only packages permitted to run
  install scripts: `esbuild@0.25.12`, `esbuild@0.28.1`, `@parcel/watcher@2.5.6`. (`allowScripts`
  is not a native npm feature; which wrapper consumes it in this environment is unverified. If
  esbuild fails at dev-server start with a "binary not installed" error, these entries — and their
  pinned versions after an esbuild upgrade — are the first suspects.)
- As of 2026-07-07 the app also carries Capacitor 8 dependencies and `build:mobile` /
  `mobile:*` scripts for the iOS/Android shells — see `app/MOBILE.md`. They are irrelevant to web
  dev; `npm run dev` ignores them entirely.

`.claude/launch.json` (repo root) defines two dev-server configurations for the preview tooling:

| Name | Command | Port |
|---|---|---|
| `nuxt-dev` | `npm run dev --prefix app` | 3000 (autoPort) |
| `nuxt-dev-mock` | `npm run dev:mock --prefix app` | 3001 (autoPort) |

**There are deliberately no lint, typecheck, or test scripts in the frontend** (no ESLint config,
no Prettier config, `vue-tsc` not installed, no `.github/` CI). The Netlify build is the only
automated check. Do not add tooling gates without change control (→ `demat-change-control`); the
backend, by contrast, has ruff/black/mypy/pytest (see §6).

## 3. The three dev modes

From the "Local development recap" table in `app/DEPLOY.md`, verified against
`app/nuxt.config.ts` (`$development` block):

| Mode | Command | API | Login | Use for |
|---|---|---|---|---|
| **Normal dev** | `npm run dev` | hosted test API (`https://test-api.dematerialized.nl`) via `/dev-api` proxy | real Auth0 | almost everything |
| **Full-local** | `DEV_API_TARGET=http://localhost:8000 npm run dev` + backend running locally (§6) | local FastAPI, whatever DB its `.env` points at | real Auth0 | backend-coupled frontend work; stepping through API code |
| **Mock session** | `npm run dev:mock` + the auth-bypass runner (§5) | local FastAPI with token check bypassed | none — fake signed-in session | UI work on authed pages without touching Auth0 |

`npm run dev:mock` is defined in `app/package.json` as
`NUXT_PUBLIC_DEV_MOCK_AUTH=1 DEV_API_TARGET=http://localhost:8000 nuxt dev` — it sets **both**
the mock flag and the local proxy target in one command.

**Why the proxy exists.** The backend's CORS allowlist (CORS = the browser mechanism that blocks
JavaScript on origin A from calling API origin B unless B explicitly allows A) contains **no
localhost origins**. So in dev, `runtimeConfig.public.apiBase` is set to `/dev-api` and Nitro
(Nuxt's built-in server engine) proxies `/dev-api/*` server-side to
`process.env.DEV_API_TARGET || 'https://test-api.dematerialized.nl'` with `changeOrigin: true`.
The browser only ever talks same-origin to `localhost:3000`; CORS never comes into play.

**Trap — bypassing the proxy.** Any dev-mode code that calls `https://test-api.dematerialized.nl`
directly from the browser (hardcoded URL, env override, copy-pasted fetch) fails with CORS errors
that do not reproduce in staging/production, where `apiBase` is an absolute URL and the real
origins are allowlisted. In dev, always go through `useRuntimeConfig().public.apiBase`.

## 4. Mock-auth mechanism (what `dev:mock` actually does)

Implementation: top of `app/plugins/auth0.client.ts`, guarded by
`if (cfg.devMockAuth && import.meta.dev)` — it needs **both** the runtime flag
(`NUXT_PUBLIC_DEV_MOCK_AUTH=1`; default `''` in `nuxt.config.ts`, commented "Never set in
production") and a dev build (`import.meta.dev` is compile-time false in production bundles).

When active, the plugin installs a fake `window.auth0Client` instead of the real Auth0 SPA client:

- `isAuthenticated()` → `true`; `getUser()` → `{ name: 'Dev User', email: 'dev@localhost' }`
- `getTokenSilently()` → the literal string `'dev-mock-token'` — **not a JWT**. Every composable
  sends it as the `Authorization: Bearer` token, so against the real test or live API every
  authed call is rejected (401). Mock mode only works with a backend whose token check is
  bypassed (§5 or `TEST_MODE`).
- `loginWithRedirect` / `loginWithPopup` / `handleRedirectCallback` → no-ops;
  `logout()` → `window.location.href = '/'`
- It then sets the auth state, awaits `refreshUserData()` (GET `/users/me` — **this backend
  lookup is where the impersonated identity actually comes from**, not the fake client), flips
  `authReady`, removes the `auth-pending` class from `<html>` (the anti-flash auth gate), logs
  `[auth] DEV MOCK AUTH active — all requests impersonate the local-backend user`, and returns
  before any real Auth0 client is created.

Limits: one fixed user per backend run (whoever the runner impersonates); login/logout/redirect
flows cannot be exercised (the post-login → `/memberships` redirect and onboarding-modal logic
live only in the real path); client-only — there is no SSR-side session, so server-rendered HTML
is always the signed-out state (this is why the project's hydration rule exists; →
`demat-architecture-contract`).

## 5. The auth-bypass runner — `scripts/run_local_backend.py` (shipped with this skill)

This skill ships the canonical copy at
`.claude/skills/demat-build-and-env/scripts/run_local_backend.py`. It is checked into neither
repo by design (it is a dev convenience referenced by `app/plugins/auth0.client.ts` and
`app/DEPLOY.md` as "the auth-bypass runner").

**What it does.** Starts the backend with
`app.dependency_overrides[auth.get_token_claims] = fake_claims` — FastAPI's dependency-override
mechanism, applied at runtime with **zero backend file changes**. `get_token_claims`
(`demat-backend/app/auth.py`) is the dependency that normally validates the Auth0 JWT; the
override makes every request carry the claims `{"sub": <impersonated user's auth0 id>}`. At
startup it resolves that user from the database by email, prints who it is impersonating, then
runs uvicorn on `127.0.0.1:8000`.

**Usage:**

```bash
cd /Users/courtneyyocabet/demat-backend
poetry run python /Users/courtneyyocabet/webflow-migration/.claude/skills/demat-build-and-env/scripts/run_local_backend.py [email]
# then, in webflow-migration/app:
npm run dev:mock
```

- It must run **from the demat-backend repo root** (it derives the backend path from the current
  working directory and refuses to start if `app/main.py` isn't there).
- Default impersonation email: `cyocabet@dematerialized.nl`.
- **Fallback warning:** if that email isn't found, it silently falls back to the **first user in
  the DB with a non-null `stripe_id`** — you can end up impersonating an arbitrary member. Always
  read the `[dev-backend] impersonating: …` startup line before trusting what you see in the UI.

**NEVER against production.** The runner disables authentication on whatever database the
backend's `.env` points at. Unlike `TEST_MODE` (§6), it has **no fail-closed host guard** — it
will happily run against any DB. Hard rule: never point it at the production database.

**Verify the DB target before first run:**

```bash
grep -E '^PG_(HOST|DBNAME)=' /Users/courtneyyocabet/demat-backend/.env
```

Confirm the host is the hosted TEST database (or localhost), never production. Do this once per
machine/checkout and again any time `.env` may have changed.

**Discipline (Courtney's standing rules, 2026-07-07 — non-negotiable):**

1. Any **write** to the hosted TEST database (migrations, seeds, data mutations — including POSTs
   made through the UI while running this way) requires Courtney's explicit OK, each time.
   Browsing/GETs are fine; note that authed requests can JIT-create a user row on first contact.
2. Real-money flows are human-only: never automate completing a Stripe payment (membership join,
   purchase) — stop at the Stripe redirect.
3. The backend repo is never committed to directly: any backend change is a new branch off the
   working branch + PR to `Edwardvaneechoud/demat-backend`, flagged to Edward before starting.
   The runner exists precisely so local dev needs no backend change at all.
4. Never `git push` or open a PR from either repo without asking first.

## 6. Backend local run (demat-backend)

```bash
cd /Users/courtneyyocabet/demat-backend
poetry install
poetry run uvicorn app.main:app --port 8000     # normal run (real Auth0 token validation)
```

**Env file selection** (`app/core/config.py`): outside Docker, the backend loads `.env` when
`TEST_MODE` is unset/false, and `.env.test` when `TEST_MODE=true`; a missing file is a hard
`FileNotFoundError` at startup. As of 2026-07-07 only `.env` exists in the local checkout —
running with `TEST_MODE=true` requires creating `.env.test` first. Required keys include the
`AUTH0_*` and `PG_*` variables (`PG_USERNAME`, `PG_HOST`, `PG_PORT` default 5432, `PG_DBNAME`
default postgres); `.env` files are not committed.

**`TEST_MODE=true` — the other auth bypass.** When set, `app/main.py` overrides both
`get_token_claims` and `get_current_user`: every request becomes an auto-created **local admin**
user (`auth_account='local|admin'`, `email='admin@localhost'`, `is_admin=True`), and the server
prints `TEST_MODE: Auth bypassed — all requests use local admin user`. Safety: `config.py`'s
`assert_safe_test_mode` **refuses to start** if `PG_HOST` is not in `{localhost, 127.0.0.1, ::1}`.

**When to use which bypass:**

| | Runner (§5) | `TEST_MODE=true` |
|---|---|---|
| Identity | a **real** user from the DB (default Courtney's account — real memberships, rentals, credits) | synthetic `local|admin` (admin, no membership history) |
| Data | whatever DB `.env` points at (typically hosted TEST) | local DB only (fail-closed guard; needs `.env.test`) |
| Backend changes | none (`dependency_overrides` at runtime) | none (built-in branch in `main.py`) |
| Fits | frontend UI work needing realistic member data (`npm run dev:mock`) | isolated backend hacking / admin endpoints against a scratch local DB |

**Backend test suite** (requires Docker):

```bash
cd /Users/courtneyyocabet/demat-backend
make test                          # or: poetry run pytest
poetry run pytest -m "not external"   # skip tests hitting Auth0/Gemini/S3
```

Tests use a Postgres 15 container (`demat_test_db`) on host port **5433** via
`docker-compose.test.yml`, lifecycle-managed by `tests/conftest.py`. The backend also has real
quality gates — `poetry run ruff check app/`, `poetry run black app/`, `poetry run mypy app/`
(see `demat-backend/CLAUDE.md`) — but remember: the backend is reference-only; running its checks
is fine, changing its code goes through the Edward PR protocol (§5 rule 3).

## 7. Known traps (recap table)

| Trap | Consequence | Avoidance |
|---|---|---|
| No Node pin (`.nvmrc`/`engines` absent) | Netlify may build on a different Node than local v26.4.0 | Netlify dashboard controls build Node; check there first |
| No frontend lint/typecheck/tests; `vue-tsc` not installed | Netlify build is the only automated check; type errors ship silently | Manual/QA verification (→ `demat-validation-and-qa`); don't assume a green build means type-safe |
| `dev:mock` without the local bypassed backend | every authed call 401s (`'dev-mock-token'` is not a JWT) | always pair `npm run dev:mock` with §5's runner (or a `TEST_MODE` backend) |
| Calling the test API directly from the browser in dev | CORS failures that don't reproduce in prod | always route via `apiBase` = `/dev-api` proxy |
| Runner email fallback | silently impersonates the first `stripe_id` user | read the startup `impersonating:` line |
| Runner has no DB-host guard | could disable auth against any DB `.env` names | verify `PG_HOST` before first run; never production |
| `TEST_MODE=true` locally | `FileNotFoundError` — `.env.test` doesn't exist in this checkout | create `.env.test` pointing at a local DB first |
| System `python3` is 3.9.6 | backend needs `^3.11` | always go through `poetry run` (venv is 3.14.6) |
| Mobile (Capacitor) scripts in package.json | confusion with web dev workflow | web dev uses only `dev`/`dev:mock`/`build`; mobile is `app/MOBILE.md`'s domain |

## Provenance and maintenance

All facts verified against the repos on **2026-07-07** (frontend HEAD on `main`; backend on
branch `claude/blog-models`). Courtney's discipline rules in §5 were stated by Courtney on
2026-07-07 and override anything that appears to contradict them.

Re-verification one-liners for anything that may drift:

| Fact | Check |
|---|---|
| Node version / no pin | `node --version; ls /Users/courtneyyocabet/webflow-migration/app/.nvmrc 2>/dev/null; grep -n '"engines"' /Users/courtneyyocabet/webflow-migration/app/package.json` |
| npm scripts (dev, dev:mock, postinstall) | `grep -n '"dev\|postinstall' /Users/courtneyyocabet/webflow-migration/app/package.json` |
| allowScripts entries | `grep -n -A4 'allowScripts' /Users/courtneyyocabet/webflow-migration/app/package.json` |
| Dev proxy + DEV_API_TARGET | `grep -n -B2 -A6 'devProxy' /Users/courtneyyocabet/webflow-migration/app/nuxt.config.ts` |
| Three-modes table | `sed -n '/Local development recap/,$p' /Users/courtneyyocabet/webflow-migration/app/DEPLOY.md` |
| Mock-auth guard + token | `grep -n "devMockAuth\|dev-mock-token" /Users/courtneyyocabet/webflow-migration/app/plugins/auth0.client.ts` |
| launch.json configs | `cat /Users/courtneyyocabet/webflow-migration/.claude/launch.json` |
| vue-tsc / lint absence | `ls /Users/courtneyyocabet/webflow-migration/app/node_modules/vue-tsc 2>/dev/null; ls /Users/courtneyyocabet/webflow-migration/app/eslint.config.* 2>/dev/null` |
| get_token_claims anchor | `grep -n 'def get_token_claims' /Users/courtneyyocabet/demat-backend/app/auth.py` |
| TEST_MODE bypass block | `grep -n -A6 'if TEST_MODE' /Users/courtneyyocabet/demat-backend/app/main.py` |
| TEST_MODE fail-closed guard | `grep -n -B2 -A8 'assert_safe_test_mode' /Users/courtneyyocabet/demat-backend/app/core/config.py` |
| Env-file selection | `grep -n 'env.test\|TEST_MODE' /Users/courtneyyocabet/demat-backend/app/core/config.py` |
| Which .env files exist | `ls -a /Users/courtneyyocabet/demat-backend | grep '^\.env'` |
| DB target before runner use | `grep -E '^PG_(HOST\|DBNAME)=' /Users/courtneyyocabet/demat-backend/.env` |
| Test DB container port | `grep -n 5433 /Users/courtneyyocabet/demat-backend/docker-compose.test.yml` |
| Poetry venv Python | `cd /Users/courtneyyocabet/demat-backend && poetry env info | head -3` |
| Runner still matches backend API | `grep -n 'dependency_overrides\|get_fastapi_session' /Users/courtneyyocabet/webflow-migration/.claude/skills/demat-build-and-env/scripts/run_local_backend.py` |
