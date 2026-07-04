# Migration rules & directory map (addendum to the migration brief)

Refines **how** Claude Code reads `old/` and **what counts as in scope**. Takes precedence over the
main brief on both. Read before Phase 1.

---

## Governing principle: migrate, don't rebuild

This is a **faithful port of the current site into Nuxt**, not a redesign or a feature release.
Default to reproducing what exists — same layout, same styling, same behavior, same copy, same
URLs. When in doubt, match the old site rather than "improve" it.

**Only two areas get new engineering.** They are in scope because they replace paid third-party
tooling and save real money:

1. **Cookie consent** — a custom GDPR/ePrivacy consent system replacing Finsweet (Phase 2).
2. **Multi-language (i18n)** — `@nuxtjs/i18n` with EN/NL and room to add locales, replacing the
   Webflow native localization + custom CSS-toggle setup (Phase 2).

**Target stack is Nuxt (Nuxt 3, Vue 3 SFCs, TypeScript) — nothing else.** All ported embed code
becomes Vue components and composables.

Everything else is migration. Do **not**:
- redesign layouts, restyle components, or "modernize" the UI
- add features, pages, or flows that don't exist today
- refactor or re-architect the custom JS beyond what porting it to Vue requires
- reprocess assets (see below)

If something looks like it needs new work beyond consent and i18n, **stop and ask** before building
it. Extra scope is the main risk to this migration — treat it as such.

---

## Effort & model: be smart, not frugal

Optimize for a correct, faithful migration, **not** for minimum tokens. Spend what the work needs:
read the full page/CSS/JS when porting it, reason carefully, verify against the old site, and
double-check the tricky parts (i18n reconciliation, consent, SEO parity). **Reach for the strongest
model — Fable 5 — whenever maximum smartness helps**: the Phase 1 audit judgments, architectural
decisions, the i18n/consent design, and any gnarly behavior port. Use a lighter model only for
genuinely mechanical passes (bulk asset copying, simple find-and-replace).

The scanning rules below are about **relevance, not thrift** — skip images/videos because their
*contents* are irrelevant to a port and read `.txt` on demand because most pages don't need them, not
to pinch tokens. Never cut corners on reasoning or coverage to save tokens.

---

## Scanning rules

Three rules:

1. **Never scan images or videos** — they are binaries to copy, not content to read.
2. **HTML and CSS are the source of truth** — read them first, by default.
3. **Open `.txt` files only when the task needs that specific one** — not up front, not in bulk.

### 1. Images & videos — lift and shift, never read

- `old/dematerialized-24fc59.webflow (2)/images/` (248 files)
- `old/dematerialized-24fc59.webflow (2)/videos/` (16 files)

**Pure lift and shift: copy the files as-is, without ever looking at their contents.** Record only
**filename + the path that references it** (from the HTML/CSS) so it can be re-linked, then copy
verbatim into the Nuxt `public/` dir, preserving filenames. No content reads, OCR, pixel-based
alt-text, transcoding, or optimizing. Need to know which assets exist? `ls`, never a content read.

### 2. HTML & CSS — source of truth

- `old/dematerialized-24fc59.webflow (2)/*.html` — every page (layout & structure)
- `old/dematerialized-24fc59.webflow (2)/css/` — `dematerialized-24fc59.webflow.css` (main),
  `webflow.css` (framework), `normalize.css` (reset) — design
- `old/dematerialized-24fc59.webflow (2)/js/webflow.js` — Webflow IX2 runtime; read only when
  reproducing a specific interaction
- `old/demat-webflow-test/` — **the production embed code that runs the live site**, not test code.
  It is a local copy of the `cyocabet-dem/demat-webflow` repo, which the Webflow HTML loads at
  runtime via jsDelivr (`cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<ref>/<file>` — e.g.
  `pdp.js`, `site-wide-footer.js`, `styles.css`). These `<script>`/`<link>` tags in the HTML and
  the site head/footer code are how the JS attaches to and drives the Webflow pages. **This is the
  source of truth for behavior** — every file here must be ported to a Vue component/composable in
  Phase 3–4, and each jsDelivr `<script>`/`<link>` reference retired once its logic moves into Nuxt:
  - accounts/Auth0: `account-app.js`, `auth.js`, `profile.js`
  - catalog/product: `clothing.js`, `pdp.js`
  - cart/Stripe: `purchase-cart.js`, `purchases.js`
  - rentals/MyParcel: `rentals.js`, `reservations.js`
  - donations/store credit: `donations.js`
  - shared UI & i18n helpers: `components.js`, `site-wide-footer.js`, `sidenav`
  - styling: `styles.css`, `my-account.css`

Validate styling against the brand tokens in the main brief (plum `#4B073F`, magenta `#A92296`,
charcoal `#24282d`, soft pink `#fff4fe`; Fraunces/Inter; lowercase UI; 50px pills; 20px image radius).

### 3. `.txt` files — read on demand only

`old/fallback_code/` holds Webflow head/body code and CMS field defs. Open a file only when the
current task needs that snippet; don't bulk-read.

- **Site-wide** (analytics/consent/global head): `site_head_code_webflow_test.txt`,
  `site_footer_code_webflow_test.txt`
- **Per-page head/body/JSON-LD** (only for the page you're rebuilding): `homepage_*`, `clothing_page_*`,
  `product_page_*`, `how-it-works_body_code.txt`, `mailing-list-page_*`, `account-page_*`,
  `profile-page_*`, `my-rentals-page_*`, `purchases-page_*`, `reservations-page_body_code.txt`,
  `donations-credits-page_body_code.txt`, `wish-list_*`
- **CMS fields** (blog model, Phase 6): `webflow-blog-fields.txt`, `webflow-authors-fields.txt`

The HTML already inlines most of what matters — reach for a `.txt` only for the exact
Webflow-injected snippet (tags, JSON-LD, embeds) or the CMS field list.

---

## Directory map

| Path | Contains | Rule |
|------|----------|------|
| `old/dematerialized-24fc59.webflow (2)/*.html` | Page markup | **Scan** — source of truth for layout |
| `old/dematerialized-24fc59.webflow (2)/css/` | 3 stylesheets | **Scan** — source of truth for design |
| `old/dematerialized-24fc59.webflow (2)/js/webflow.js` | IX2 runtime | Scan only to reproduce an interaction |
| `old/dematerialized-24fc59.webflow (2)/images/` | 248 images | **Don't scan** — list & copy as-is |
| `old/dematerialized-24fc59.webflow (2)/videos/` | 16 videos | **Don't scan** — list & copy as-is |
| `old/demat-webflow-test/` | Production embed JS + CSS (loaded via jsDelivr, **not** test code) | **Scan** — source of truth for behavior |
| `old/fallback_code/*.txt` | Head/body code, JSON-LD, CMS fields | Read **only when the task needs that file** |
| `demat-backend` (sibling repo, `github.com/Edwardvaneechoud/demat-backend`) | FastAPI backend (Auth0, Stripe, MyParcel, Odoo, RFID) | **Don't scan it all — just be aware of the endpoints** in `app/api/routes/`. Read a route file only when wiring its frontend call. Reference-only except Phase 6 blog work (new branch + PR to that repo) |
| `.DS_Store`, `.git/`, `README.md` | Cruft | Ignore |

---

## Phase 1 — parallel HTML scan

**Highest priority: a one-to-one port to Nuxt.** The audit exists to make an exact reproduction
possible, so capture what the new page must match, not opinions on how to improve it.

Run this in two steps.

### Step 1 — lock the scan spec (do this once, before fanning out)

Write the shared per-page extraction checklist that **every** agent will follow identically, so the
output is uniform and mergeable. Every agent, for every page assigned to it, records:

1. **Identity** — file, route/slug, `<title>`, purpose, EN/NL variant.
2. **Layout** — sections/blocks top-to-bottom (hero, nav, grids, footer, …) with the wrapper CSS
   classes for each, so the Vue component tree mirrors the DOM one-to-one.
3. **Styling** — which stylesheet(s) the classes come from; any inline `<style>`.
4. **Embeds & scripts** — inline `<script>`/`<style>`, and every jsDelivr `<script>`/`<link>`
   (which `demat-webflow` file it loads). Note what each does and its Vue target.
5. **Forms** — action/endpoint, fields, method.
6. **Interactions** — Webflow IX2 hooks (`data-w-id`, `data-w-*`); mark decorative vs functional.
7. **SEO** — title, meta description, canonical, OG, Twitter, and any JSON-LD (verbatim).
8. **Assets** — image/video **filenames + referencing paths only** (no content scan).
9. **Links** — internal/external nav targets.
10. **Scope flag** — anything that can't be ported like-for-like, or would need work beyond consent
    and i18n → open question.

Output per page: one structured Markdown block in this exact field order → the merge into
`migration-map.md` is mechanical.

### Step 2 — fan out across parallel agents

Split the ~35 HTML pages into batches and launch the agents **in parallel, in a single message**,
each running the identical Step 1 spec. Give each agent only the file paths in its batch (plus this
addendum), not the whole tree. Suggested batches:

- **A — Home & marketing:** `index.html`, `about-us.html`, `how-it-works.html`, `contact-us.html`
- **B — Catalog:** `clothing.html`, `product.html`, `missing-pieces.html`, `also-this.html`, `search.html`
- **C — Account:** `account.html`, `profile.html`, `my-rentals.html`, `reservations.html`,
  `purchases.html`, `purchase-success.html`, `wish-list.html`
- **D — Donations & membership:** `donations.html`, `donations-credits.html`, `memberships.html`,
  `my-membership.html`, `mailing-list.html`, `welcome-to-dematerialized.html`, `error-membership-signup.html`
- **E — Policies & FAQ:** `cancellation-policy.html`, `cookie-policy.html`,
  `donation-store-credit-policy.html`, `privacy-policy.html`, `return-policy.html`,
  `terms-and-conditions.html`, `faq.html`
- **F — Blog & errors:** `detail_blog.html`, `detail_author.html`, `detail_items.html`,
  `401.html`, `404.html`

Agents read HTML/CSS (and the custom JS/CSS) only; pull from `.txt` files only for the exact
Webflow-injected snippet a page needs. Merge all blocks into `migration-map.md`, mapping every
page/embed/integration to a **like-for-like Nuxt target**, then **stop for review**.
