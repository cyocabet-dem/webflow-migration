# CLAUDE.md — `.github/`

CI configuration copied from the `cyocabet-dem/demat-webflow` repo.

| Path | Purpose |
|------|---------|
| `workflows/purge-cdn.yml` | GitHub Actions workflow that purges the jsDelivr CDN cache when the embed scripts change, so Webflow picks up the latest JS/CSS. |

Reference only — this CI belongs to the old jsDelivr delivery mechanism and is **not** carried into
the Nuxt project (Nuxt bundles the code directly, so no CDN purge is needed).
