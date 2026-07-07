// Dematerialized frontend — faithful port of the Webflow site (see ../migration-map.md).

// The Capacitor iOS/Android apps (MOBILE.md) ship this same app as a static SPA
// bundle: NUXT_MOBILE=1 only flips rendering for `nuxt generate`; all native
// behavior is gated at runtime via Capacitor.isNativePlatform().
const isMobileBuild = process.env.NUXT_MOBILE === '1'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-04',
  devtools: { enabled: true },
  ssr: !isMobileBuild,

  // The backend's CORS allowlist has no localhost origins, so in dev the API is
  // reached same-origin via /dev-api and proxied by Nitro. Staging/prod call it directly.
  $development: {
    runtimeConfig: { public: { apiBase: '/dev-api' } },
    nitro: {
      devProxy: {
        // DEV_API_TARGET=http://localhost:8000 points dev at a locally-run backend.
        '/dev-api': {
          target: process.env.DEV_API_TARGET || 'https://test-api.dematerialized.nl',
          changeOrigin: true,
        },
      },
    },
  },

  modules: ['@nuxtjs/i18n'],

  // Load order is a hard constraint: later sheets override earlier ones exactly as on the old site
  // (export CSS → jsDelivr styles.css → account CSS). Do not reorder.
  css: [
    '~/assets/css/0-normalize.css',
    '~/assets/css/1-webflow.css',
    '~/assets/css/2-dematerialized.webflow.css',
    '~/assets/css/3-demat-custom.css',
    // 4-my-account.css intentionally NOT loaded: no page in the Webflow export references
    // it (it styled the dead account-app.js UI) and its generic selectors (.reservation-card,
    // .rental-card, .btn-primary…) collide with the live design in styles.css.
    '~/assets/css/5-sidenav.css',
    '~/assets/css/6-lang-toggle.css',
    '~/assets/css/7-auth-gate.css',
    // Native-app-only chrome (safe areas); every rule is scoped to body.native-app,
    // which only the Capacitor shells set — inert in browsers.
    '~/assets/css/8-native-app.css',
  ],

  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      link: [
        { rel: 'shortcut icon', href: '/images/favicon.png', type: 'image/x-icon' },
        { rel: 'apple-touch-icon', href: '/images/webclip.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Playfair+Display:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // Test API by default; production deploy sets NUXT_PUBLIC_API_BASE=https://api.dematerialized.nl
      apiBase: 'https://test-api.dematerialized.nl',
      auth0Domain: 'dev-rgs24jdzcvdydd77.eu.auth0.com',
      auth0ClientId: 'o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV',
      // TEST GTM container by default; production sets NUXT_PUBLIC_GTM_ID=GTM-56PZW3LP
      gtmId: 'GTM-556SMQSF',
      hotjarId: '6427900',
      metaPixelId: '1337973184818900',
      geoapifyKey: 'ce61be62b3c344838d731909f625cfd1',
      // Dev-only: NUXT_PUBLIC_DEV_MOCK_AUTH=1 fakes an authenticated session against a
      // locally-run backend whose token check is bypassed. Never set in production.
      devMockAuth: '',
    },
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en', file: 'en.json', name: 'English' },
      { code: 'nl', language: 'nl-NL', file: 'nl.json', name: 'Nederlands' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    bundle: { optimizeTranslationDirective: false },
  },
})
