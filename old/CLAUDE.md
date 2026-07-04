# CLAUDE.md — `old/`

**Read-only reference material** for the Webflow → Nuxt migration. Source of truth for layout,
styling, and behavior. Never edit anything in here.

## Contents

| Path | What it is |
|------|-----------|
| `dematerialized-24fc59.webflow (2)/` | The Webflow **static site export** — all page HTML, CSS, the Webflow JS runtime, and image/video assets. Source of truth for layout & design. See its `CLAUDE.md`. |
| `demat-webflow-test/` | The **production embed code** (JS + CSS) that runs the live site, loaded into Webflow via jsDelivr. Source of truth for behavior. See its `CLAUDE.md`. |
| `fallback_code/` | The Webflow **custom head/body code, JSON-LD, and CMS field definitions** (`.txt` snippets Webflow injects per page and site-wide). All the `.txt` files live here now. Read on demand, not in bulk. See its `CLAUDE.md`. |

## The `.txt` snippet files (all in `fallback_code/`)

- **Site-wide:** `site_head_code_webflow_test.txt`, `site_footer_code_webflow_test.txt`
- **Per-page head/body/JSON-LD:** `homepage_*`, `clothing_page_*` (incl. `_JSON-LD_`), `product_page_*`,
  `how-it-works_body_code.txt`, `mailing-list-page_*`, `account-page_*`, `profile-page_*`,
  `my-rentals-page_*` (incl. `_JSON-LD_`), `purchases-page_*`, `reservations-page_body_code.txt`,
  `donations-credits-page_body_code.txt`, `wish-list_*`
- **CMS field definitions (for the Phase 6 blog model):** `webflow-blog-fields.txt`,
  `webflow-authors-fields.txt`

## How to read this folder

Scan **HTML, CSS, and the custom JS/CSS**. Open a `.txt` file in `fallback_code/` only when a page or
integration needs that exact snippet or field list. **Never** read image/video contents — lift and
shift them, copying files as-is. Full rules in the repo root `migration-scanning-rules.md`.
