# CLAUDE.md — `old/demat-webflow-test/`

The **production embed code that runs the live Dematerialized site** — *not* test code. A local copy
of the `cyocabet-dem/demat-webflow` GitHub repo. The Webflow HTML loads these files at runtime via
jsDelivr (`cdn.jsdelivr.net/gh/cyocabet-dem/demat-webflow@<ref>/<file>`). **Source of truth for
behavior** — each file must be ported to a Vue component/composable in Nuxt (Phase 3–4).

## Files

| File | Purpose |
|------|---------|
| `styles.css` | All custom CSS (modals, cart, filters, etc.) — supplements the Webflow export CSS |
| `my-account.css` | Styling for the account area |
| `sidenav` | Account side-navigation CSS (brand color vars; injected via page head `<style>`) |
| `components.js` | Injects shared HTML for modals (cart, reservation, upgrade, etc.) |
| `auth.js` | Auth0 authentication + onboarding logic |
| `site-wide-footer.js` | Cart, reservations, and membership handlers loaded site-wide |
| `account-app.js` | Account app shell / routing |
| `profile.js` | Profile page logic |
| `clothing.js` | Clothing (catalog) page logic |
| `pdp.js` | Product detail page logic |
| `purchase-cart.js` | Cart + Stripe checkout logic |
| `purchases.js` | Purchases page logic |
| `rentals.js` | Rentals logic (MyParcel touchpoints) |
| `reservations.js` | Reservations page logic |
| `donations.js` | Donations / store-credit logic |
| `README.md` | Original repo readme: file table + Webflow head/body setup instructions |
| `.github/` | CI workflow that purges the jsDelivr CDN cache. See its `CLAUDE.md`. |

Integrations touched here: Auth0, Stripe, MyParcel, and the FastAPI backend (test/live API base
URLs). The i18n helper logic (`window.DematI18n`) also lives in these files. When porting, preserve
behavior exactly and retire each jsDelivr `<script>`/`<link>` reference as its logic moves into Nuxt.
