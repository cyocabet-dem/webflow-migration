# CLAUDE.md — repository root

Repo for migrating the **Dematerialized** website off Webflow into **Nuxt** (Nuxt 3, Vue 3 SFCs,
TypeScript), hosted on Netlify. The FastAPI backend stays as-is.

## What's here

| Path | Contents |
|------|----------|
| `migration-scanning-rules.md` | **Read this first.** Governing rules: faithful one-to-one port (only cookie consent + i18n are new work), how to scan `old/`, and the parallel Phase 1 HTML-scan plan. |
| `old/` | Read-only reference material — the Webflow static export, the production embed JS/CSS, and the Webflow head/body/CMS code snippets. See `old/CLAUDE.md`. |
| `../demat-backend/` (sibling repo) | The **FastAPI backend** (Auth0, Stripe, MyParcel, Odoo, RFID). GitHub: `github.com/Edwardvaneechoud/demat-backend`, cloned locally at `/Users/courtneyyocabet/demat-backend/`. Included so the frontend knows **where the API endpoints come from**, and it's where the Phase 6 blog table/model gets added (via PR). Reference-only otherwise. |
| `README.md` | One-line repo name. |

The new Nuxt project gets built in a **new folder in this same repo**, based on `old/`.

## Rules of engagement

- Audit before building: produce `migration-map.md` (Phase 1) and wait for approval before scaffolding.
- Highest priority is a **one-to-one port** to Nuxt. Reproduce layout, styling, behavior, copy, and
  URLs exactly. The only sanctioned new engineering is cookie consent and multi-language (i18n).
- `old/` is read-only. Treat it as the source of truth, never edit it.
- Never scan `images/` or `videos/` — list filenames and copy assets as-is.
- No secrets in code; public IDs (GTM, GA4, etc.) in client code are fine.

## Backend (`github.com/Edwardvaneechoud/demat-backend`, sibling repo)

Separate git repo, not part of this one — cloned locally at `/Users/courtneyyocabet/demat-backend/`,
remote `github.com/Edwardvaneechoud/demat-backend`. It has its own `CLAUDE.md` — don't touch it.
The Phase 6 blog table/model is added **here**, and the PR targets this GitHub repo.

- **Don't scan the whole backend. Just be aware of the endpoints.** They live in
  **`app/api/routes/`** — route modules by domain: `clothing_items.py` / `clothing_item_manager.py`,
  `membership_routes.py`, `stripe_router.py`, `returns_router.py`, `shipments_router.py`,
  `fulfillment_router.py`, `odoo_router.py`, `mailing_list_router.py`, `search_router.py`,
  `user_management.py`, `sku_generator_router.py`, the `email_*` routers, and `ai_assistant.py`.
  `app/main.py` wires them together. Read a route file only when wiring the matching frontend call.
- **Read endpoints from the FastAPI source**, not the live API. Frontend points at the test API
  (`https://test-api.dematerialized.nl`) in dev/staging and the live API
  (`https://api.dematerialized.nl`) in prod, switched by env var.
- The backend **stays as-is**. Do not modify it except where a frontend integration point requires
  it — and flag any such change before making it.
- The one planned change is **Phase 6**: add the bilingual blog table/model here. The repo is
  already on the working branch `claude/rental-returns-myparcel-a2v09b` (ahead of main, has the
  latest endpoints incl. MyParcel returns in `returns_router.py`). Base blog work on that branch,
  **create a new branch off it**, never commit to the working branch directly, and open a PR to
  `github.com/Edwardvaneechoud/demat-backend` for Edward. Confirm the base branch and PR target with
  Edward before starting.
