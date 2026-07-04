# CLAUDE.md — Webflow static export (`dematerialized-24fc59.webflow (2)/`)

The **Webflow Designer static export** of the Dematerialized site. **Source of truth for layout and
design.** Read-only.

## Contents

| Path | What it is |
|------|-----------|
| `*.html` | Every page of the site (~35 files). Source of truth for structure/layout. |
| `css/` | The three stylesheets (main project CSS + Webflow framework + normalize). Source of truth for design. See its `CLAUDE.md`. |
| `js/` | `webflow.js` — the Webflow IX2 interactions runtime. See its `CLAUDE.md`. |
| `images/` | 248 image assets. **Do not scan** — list & copy as-is. See its `CLAUDE.md`. |
| `videos/` | 16 video/poster assets. **Do not scan** — list & copy as-is. See its `CLAUDE.md`. |

## Pages (by type)

- **Home & marketing:** `index.html`, `about-us.html`, `how-it-works.html`, `contact-us.html`
- **Catalog:** `clothing.html`, `product.html`, `missing-pieces.html`, `also-this.html`, `search.html`
- **Account:** `account.html`, `profile.html`, `my-rentals.html`, `reservations.html`,
  `purchases.html`, `purchase-success.html`, `wish-list.html`
- **Donations & membership:** `donations.html`, `donations-credits.html`, `memberships.html`,
  `my-membership.html`, `mailing-list.html`, `welcome-to-dematerialized.html`, `error-membership-signup.html`
- **Policies & FAQ:** `cancellation-policy.html`, `cookie-policy.html`,
  `donation-store-credit-policy.html`, `privacy-policy.html`, `return-policy.html`,
  `terms-and-conditions.html`, `faq.html`
- **Blog & errors:** `detail_blog.html`, `detail_author.html`, `detail_items.html`, `401.html`, `404.html`

These pages `<script>`/`<link>` in the production embed code from `old/demat-webflow-test/` via
jsDelivr. Each page maps one-to-one to a Nuxt route/component. This grouping is the basis for the
parallel Phase 1 scan batches — see `migration-scanning-rules.md`.
