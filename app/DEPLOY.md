# Deploying the Dematerialized frontend

The app deploys to **Netlify** from this repo. `netlify.toml` at the repo root already points the
build at this `app/` folder (Nitro auto-detects Netlify and emits the right output). What remains
is dashboard work — nothing else in the code needs to change.

## 1. Create the Netlify site

- Netlify → Add new site → Import from Git → pick this repository.
- Build settings are read from `netlify.toml` (base `app`, command `npm run build`) — accept them.

## 2. Environment variables (Site settings → Environment variables)

| Variable | Production value | Deploy previews / staging |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `https://api.dematerialized.nl` | `https://test-api.dematerialized.nl` |
| `NUXT_PUBLIC_GTM_ID` | `GTM-56PZW3LP` | `GTM-556SMQSF` (default if unset) |

Everything else (Auth0 domain/client, Hotjar, Meta Pixel, Geoapify) ships with the same value in
all environments and needs no variable.

## 3. Auth0 allowlist (Applications → "your account" SPA app → Settings)

Append the production domain — and any Netlify domain you want to test logins on — to all three:
- **Allowed Callback URLs**: `https://dematerialized.nl/`
- **Allowed Logout URLs**: `https://dematerialized.nl/`
- **Allowed Web Origins**: `https://dematerialized.nl`

(`http://localhost:3000` entries from development can stay.)

## 4. Backend CORS allowlist (ask Edward / backend config)

The API's CORS allowlist must include the new origins, or browser calls fail exactly like they did
from localhost before the dev proxy:
- `https://dematerialized.nl` (likely already present — it's today's production origin)
- the `https://<site>.netlify.app` domain if you want deploy previews to hit the test API

## 5. DNS cutover (when ready to go live)

1. Deploy to production on Netlify and click through the site against the live API first.
2. In your DNS provider, point `dematerialized.nl` (and `www`) at Netlify per Netlify's domain
   instructions (Domain settings → Add custom domain — it shows the exact records).
3. Webflow keeps serving until DNS propagates; there is no downtime window to coordinate.

## 6. After the soak period

- Cancel the Webflow subscription and the Finsweet ConsentPro subscription.
- Archive the `cyocabet-dem/demat-webflow` repo (the jsDelivr embeds are no longer referenced).
- The Webflow CDN (`cdn.prod.website-files.com`) is no longer used by the app — all assets,
  including blog and meta images, are served from `public/`.

## Local development recap

| Mode | Command | Notes |
|---|---|---|
| Normal dev | `npm run dev` | Hosted test API via `/dev-api` proxy; real Auth0 login |
| Full-local | `DEV_API_TARGET=http://localhost:8000 npm run dev` + `poetry run uvicorn app.main:app --port 8000` in `demat-backend` | Real login, local backend, test DB |
| Mock session | `npm run dev:mock` + the auth-bypass runner | Fake signed-in session for UI work |
