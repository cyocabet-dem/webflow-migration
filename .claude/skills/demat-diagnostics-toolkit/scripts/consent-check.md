# consent-check — manual verification recipe for the cookie-consent gate

A manual-but-exact checklist (no code) for verifying that GTM, Hotjar, and the
Meta Pixel load **only after** the matching consent category is granted, and
that the consent cookie is written correctly. Facts verified against
`app/composables/useConsent.ts` and `app/plugins/analytics.client.ts` on
2026-07-07.

Why manual: consent gating is a browser-runtime behavior (script injection on a
window event). A curl of the HTML proves nothing — the vendor scripts are
injected client-side, never server-rendered.

## The contract you are verifying

| Category | Gates | Network hosts that must NOT appear before grant |
|---|---|---|
| `analytics` | Google Tag Manager + Hotjar | `www.googletagmanager.com`, `static.hotjar.com` |
| `marketing` | Meta Pixel | `connect.facebook.net`, `www.facebook.com/tr` (pixel beacon) |
| `personalization` | **nothing** (no consumer exists as of 2026-07-07) | n/a |
| `essentials` | always on, not toggleable | n/a |

- Cookie: **`demat-consent`**, JSON, maxAge 180 days, `sameSite: lax`. Shape:
  `{"v":1,"essentials":true,"marketing":<bool>,"personalization":<bool>,"analytics":<bool>,"ts":"<ISO date>"}`
- Grant event: window `CustomEvent` **`demat:consent-changed`** (fired by `save()`;
  `onConsentGranted` runs loaders immediately if already granted, else on this event —
  no reload needed for a grant).
- Known one-way behavior (by design, not a bug): **revoking** a category does NOT
  unload already-injected scripts — they keep running until the next full page load.
- Expected IDs (dev/test defaults from `nuxt.config.ts` `runtimeConfig.public`):
  GTM `GTM-556SMQSF` (**test** container; prod must set `NUXT_PUBLIC_GTM_ID=GTM-56PZW3LP`),
  Hotjar `6427900`, Meta Pixel `1337973184818900`.
- As of 2026-07-07 an in-flight (uncommitted) change adds an `isNativeApp()` guard that
  skips the Meta Pixel inside the Capacitor app shells; in ordinary browsers it is inert.

## Recipe

### 0. Clean slate (mandatory — a stale cookie invalidates everything)

Use one of:
- Chrome/Edge: fresh profile — `open -na "Google Chrome" --args --user-data-dir=$(mktemp -d)`
- Any browser: a new private/incognito window with no other tabs of the site open
- Or DevTools → Application → Storage → Cookies → delete `demat-consent`, then hard-reload

Then open DevTools **before** navigating: Network tab, filter box ready; and
Application → Cookies.

### 1. First load, no decision

Navigate to the app (dev: `http://localhost:3000`).

- [ ] Consent banner visible at the bottom (text starts "we use cookies to make the shared closet work…"; buttons: `preferences`, `deny`, `accept all`).
- [ ] Application → Cookies: **no `demat-consent` cookie** exists.
- [ ] Network tab, filter `googletagmanager` → **zero requests**. Filter `hotjar` → zero. Filter `facebook` → zero. Filter `connect.facebook` → zero.
- [ ] Console: no `dataLayer`-related vendor noise; typing `window.fbq` returns `undefined`; `window.hj` returns `undefined`.
- [ ] Browse 2–3 pages without deciding — the above stays true (banner persists, no vendor requests).

### 2. Deny all

Click `deny`.

- [ ] Banner closes; small round cookie button appears bottom-left (the reopen widget).
- [ ] Cookie `demat-consent` now exists; value (URL-decode it) is JSON with `"marketing":false,"personalization":false,"analytics":false` and a fresh `ts`.
- [ ] Network: still **zero** requests to `googletagmanager.com` / `static.hotjar.com` / `connect.facebook.net`, including after navigating a few pages and a hard reload.

### 3. Grant analytics only (tests the no-reload event path)

Click the bottom-left cookie widget → preferences panel opens. Check
`analytics` only → `save preferences`.

- [ ] **Without any reload**: Network shows a request to `https://www.googletagmanager.com/gtm.js?id=GTM-556SMQSF` (dev/test) and `https://static.hotjar.com/c/hotjar-6427900.js?sv=6`.
- [ ] **No** request to `connect.facebook.net` (marketing still denied).
- [ ] Cookie now has `"analytics":true`, others false.
- [ ] Console: `window.dataLayer` is an array whose first pushes include `{event: 'gtm.js'}`; `window.hj` is a function; `window.fbq` is still `undefined`.

### 4. Grant marketing

Reopen preferences, also check `marketing`, save.

- [ ] Network gains `https://connect.facebook.net/en_US/fbevents.js` and then a `facebook.com/tr` beacon with `id=1337973184818900&ev=PageView`.
- [ ] `window.fbq` is now a function.

### 5. Revocation caveat (verify the documented one-way behavior)

Reopen preferences, uncheck everything, save.

- [ ] Cookie flips to all-false, BUT already-loaded GTM/Hotjar/pixel keep running in this page session (expected — documented no-teardown).
- [ ] Hard reload: now zero vendor requests again. If vendor requests still appear after a reload with an all-false cookie, that IS a bug — open demat-debugging-playbook.

### 6. Preferences-backdrop edge case (by design, looks like a bug)

Fresh profile again, first visit: click `preferences`, then click the dark
backdrop (not the save button).

- [ ] Panel closes **without saving**; no cookie is written; the banner reappears. This is by design (`@click.self` close does not persist).

### 7. What is intentionally NOT consent-gated

- [ ] `fonts.googleapis.com` / `fonts.gstatic.com` requests appear on every load regardless of consent. Google Fonts loading unconditionally is a **known ACCEPTED/DEFERRED item** (Courtney's disposition, 2026-07-07) — do not gate it without her approval; see demat-change-control.

## Failure interpretation

| Observation | Meaning | Go to |
|---|---|---|
| Vendor request BEFORE any grant | Consent gate broken (loader outside `onConsentGranted`, or a script tag added elsewhere) | inspect `app/plugins/analytics.client.ts` + any new plugin; demat-i18n-and-consent |
| Grant → nothing loads until reload | `demat:consent-changed` event path broken (`save()` in `useConsent.ts` or listener in `onConsentGranted`) | demat-i18n-and-consent |
| Wrong GTM container ID in prod | Env var `NUXT_PUBLIC_GTM_ID` not set to `GTM-56PZW3LP` on Netlify | demat-cutover-campaign / demat-run-and-operate |
| Cookie shape differs from `{v:1,…}` | `useConsent.ts` schema changed — check hasn't been updated, or an unsanctioned edit | demat-architecture-contract |
| Banner reappears every visit despite deciding | Cookie not persisting (SSR/`useCookie` issue, or browser blocks cookies) | demat-debugging-playbook |
