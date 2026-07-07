# Dematerialized iOS & Android apps

The native apps are **Capacitor 8 shells around this same Nuxt app**: `npm run
build:mobile` builds it as a static SPA, `scripts/prune-mobile-bundle.mjs` slims
it, and `cap sync` copies it into the `ios/` and `android/` projects. One
codebase, full feature parity with the website by construction.

Everything mobile-specific is gated at runtime on `Capacitor.isNativePlatform()`
(helpers in `composables/useNativeApp.ts`), so browsers keep getting the exact
Webflow-faithful site.

## What the native shells add

| Concern | Where | How it works |
|---|---|---|
| Splash + status bar | `capacitor.config.ts`, `plugins/native.client.ts` | Black brand splash until app mount; dark status-bar icons over the white chrome |
| Safe areas (notch / home indicator) | `assets/css/8-native-app.css` | Scoped to `body.native-app`; iOS `env()`, Android via Capacitor's injected `--safe-area-inset-*` |
| Auth0 login/logout | `plugins/auth0.client.ts`, `composables/useAuth.ts` | In-app system browser (Google sign-in blocks WebViews) + custom-scheme callback `nl.dematerialized.app://…` handled via `appUrlOpen` |
| Stripe checkout | `useMembershipCheckout.ts`, `usePurchaseCart.ts`, `plugins/native.client.ts` | Opens in in-app browser (Apple Pay works there) with `https://dematerialized.nl` return URLs; on return the app syncs state and lands on the same pages as the web flow |
| Android back button | `plugins/native.client.ts` | History back; minimizes at the root |
| Deep links | `AndroidManifest.xml`, `Info.plist`, `public/.well-known/` | Custom scheme active now; universal links once the placeholders below are filled |
| Bundle size | `scripts/prune-mobile-bundle.mjs` | Ships CSS-referenced media only (~50MB app); DOM-level media loads from the production site (rewriter in `plugins/native.client.ts`) |
| Meta Pixel | `plugins/analytics.client.ts` | Not loaded natively — it would require Apple's App Tracking Transparency prompt (guideline 5.1.2). GTM + Hotjar remain, consent-gated |

## One-time setup outside this repo (blockers before first login/API call)

1. **Backend CORS (Edward)** — the WebView origins must be allowed by the API.
   `CORS_ORIGINS` is an env var on the backend (`app/core/config.py`, comma-
   separated, falls back to `DEFAULT_CORS_ORIGINS`). Add to both test and prod:
   `capacitor://localhost` (iOS) and `https://localhost` (Android). No code
   change needed if set via the env var. **This repo does not modify the backend.**
2. **Auth0 dashboard** (application `o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV`):
   - Allowed Callback URLs, add: `nl.dematerialized.app://dev-rgs24jdzcvdydd77.eu.auth0.com/capacitor/nl.dematerialized.app/callback`
   - Allowed Logout URLs: add the same URL
   - Allowed Origins (CORS): add `capacitor://localhost`, `https://localhost`
   - If Auth0 refuses a custom-scheme callback on this SPA-type application,
     create a **Native**-type application with the same settings/API audience and
     build the apps with `NUXT_PUBLIC_AUTH0_CLIENT_ID=<native app client id>`.
3. **Apple / Google accounts** — Apple Developer Program ($99/yr) and a Google
   Play Console account ($25 once) for signing and store listings.

## Building

```sh
# Debug/test builds (test API, test GTM container):
npm run mobile:ios       # build + sync + open Xcode
npm run mobile:android   # build + sync + open Android Studio

# Store builds — point at production before syncing:
NUXT_PUBLIC_API_BASE=https://api.dematerialized.nl \
NUXT_PUBLIC_GTM_ID=GTM-56PZW3LP \
npm run mobile:sync
```

Machine prerequisites (not needed for web work):
- **iOS**: full Xcode from the App Store (Capacitor 8 uses Swift Package
  Manager — CocoaPods is *not* needed). Then `sudo xcode-select -s /Applications/Xcode.app`.
- **Android**: Android Studio (bundles the SDK + JDK).

In Xcode: select the `App` target → Signing & Capabilities → pick the team.
In Android Studio: Build → Generate Signed App Bundle for release.

Icons/splash are generated: `node scripts/gen-mobile-assets.mjs && npm run
mobile:assets` (already committed; re-run only if the brand art changes).

## Universal links (seamless Stripe return — optional but recommended)

Until these are configured, Stripe returns open the production website in the
in-app browser; closing it lands the user on the right in-app page (handled in
`plugins/native.client.ts`). With them, `https://dematerialized.nl/...` links
(including Stripe returns) open directly in the app:

1. `public/.well-known/apple-app-site-association`: replace `TEAMID` with the
   Apple Team ID; deploy the site; in Xcode add the **Associated Domains**
   capability with `applinks:dematerialized.nl`.
2. `public/.well-known/assetlinks.json`: replace the placeholder with the
   release-key SHA-256 (`keytool -list -v -keystore <keystore>` or Play Console →
   App integrity); deploy. The `autoVerify` intent filter is already in the manifest.

## Store submission notes

- **App Review (iOS)**: guideline 4.2 dislikes bare website wrappers. This app
  ships its UI locally, has native auth/checkout handling, splash, deep links —
  describe those in the review notes. Keep the Meta Pixel disabled natively
  unless an ATT prompt is added.
- **Privacy labels / Data safety**: GTM + GA4 and Hotjar run (consent-gated) —
  declare analytics data collection on both stores. Auth0 (identifiers), Stripe
  (payment info, handled by Stripe's hosted page).
- **Display name**: currently "Dematerialized" (`CFBundleDisplayName`, Android
  `app_name`); iOS truncates around ~14 characters on the home screen — decide
  whether a shorter name (e.g. "Demat") is preferable.
- Versioning lives in `ios/App/App.xcodeproj` (`MARKETING_VERSION`) and
  `android/app/build.gradle` (`versionName`/`versionCode`).

## Day-to-day

- `ios/` and `android/` are committed source; `.output/` and the copied web
  bundles inside them are build products (gitignored by the Capacitor templates).
- After any web-app change: `npm run mobile:sync` re-embeds the fresh bundle.
- `npm run build` (web) and `npm run build:mobile` share `.output/` — always run
  `mobile:sync` (not just `cap sync`) before opening Xcode/Android Studio so the
  right bundle is embedded.
