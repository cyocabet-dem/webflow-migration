# CLAUDE.md — `old/fallback_code/`

Home of the **Webflow custom-code snippet files** — the `.txt` files that hold the head/body code,
JSON-LD, site-wide head/footer, and CMS field definitions Webflow injects per page and site-wide.
All of these were moved here out of the `old/` root; this is now their single location. Read-only.

## Contents

- **Site-wide:** `site_head_code_webflow_test.txt`, `site_footer_code_webflow_test.txt`
- **Per-page head/body/JSON-LD:** `account-page_*`, `clothing_page_*` (incl. `_JSON-LD_`),
  `donations-credits-page_body_code.txt`, `homepage_*`, `how-it-works_body_code.txt`,
  `mailing-list-page_*`, `my-rentals-page_*` (incl. `_JSON-LD_`), `product_page_*`, `profile-page_*`,
  `purchases-page_*`, `reservations-page_body_code.txt`, `wish-list_*`
- **CMS field definitions (Phase 6 blog model):** `webflow-blog-fields.txt`, `webflow-authors-fields.txt`

## How to use

**Read on demand only** — open a file only when the page or integration you're working on needs that
exact snippet; don't bulk-read. These snippets are what Webflow injects per page: inline
`<style>`/`<script>`, JSON-LD, the jsDelivr `<script>` tags that load the `old/demat-webflow-test/`
code, plus third-party loads (Auth0 SPA JS, Finsweet CMS slider, and the Vue 3 global build on the
profile and wish-list pages).
