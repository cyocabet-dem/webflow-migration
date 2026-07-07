// Capacitor shell config for the iOS/Android apps (see MOBILE.md).
// The apps ship the same Nuxt app as a static SPA bundle: `npm run build:mobile`
// emits .output/public, `npx cap sync` copies it into both native projects.
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'nl.dematerialized.app',
  appName: 'Dematerialized',
  webDir: '.output/public',
  // Pinch-zoom off: the site is a fixed-scale mobile layout; zooming reads as a bug in-app.
  zoomEnabled: false,
  // White behind the iOS status bar / any letterboxing — matches the site chrome.
  backgroundColor: '#ffffff',
  ios: {
    // Long-press link previews feel like a website, not an app.
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      // plugins/native.client.ts hides the splash once the app has mounted.
      launchAutoHide: false,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      // 'LIGHT' = dark icons for light backgrounds (the site chrome is white).
      style: 'LIGHT',
    },
    SystemBars: {
      // Android 15+ edge-to-edge: dark system-bar icons; Capacitor injects the
      // --safe-area-inset-* CSS variables consumed by assets/css/8-native-app.css.
      style: 'LIGHT',
    },
  },
}

export default config
