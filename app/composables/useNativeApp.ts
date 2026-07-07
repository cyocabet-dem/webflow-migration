// Helpers for the Capacitor iOS/Android shells (see MOBILE.md). Everything here
// is inert in browsers: isNativeApp() is false, so no native code path runs and
// the web app keeps matching the Webflow original exactly.
import { Capacitor } from '@capacitor/core'

/** Production website origin — used for Stripe return URLs from the native apps
 *  (Stripe requires https URLs; the WebView origin `capacitor://localhost` is not one). */
export const WEB_ORIGIN = 'https://dematerialized.nl'

/** Reverse-DNS app id — must match appId in capacitor.config.ts and the
 *  URL schemes registered in Info.plist / AndroidManifest.xml. */
export const NATIVE_APP_ID = 'nl.dematerialized.app'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** Auth0's Capacitor callback convention: <appId>://<domain>/capacitor/<appId>/callback.
 *  Must be listed in the Auth0 dashboard under Allowed Callback URLs and Allowed Logout URLs. */
export function auth0NativeCallbackUri(auth0Domain: string): string {
  return `${NATIVE_APP_ID}://${auth0Domain}/capacitor/${NATIVE_APP_ID}/callback`
}

/** Open a URL in the in-app system browser (SFSafariViewController / Chrome Custom Tab).
 *  Used for Auth0 universal login and Stripe hosted checkout — both need a real
 *  browser context (Google sign-in blocks WebViews; Apple Pay needs Safari). */
export async function openInAppBrowser(url: string): Promise<void> {
  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url, windowName: '_self' })
}

/** Close the in-app browser. No-ops where unsupported (Android Custom Tabs
 *  close themselves when the app comes forward). */
export async function closeInAppBrowser(): Promise<void> {
  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch {
    // Browser.close() is not implemented on Android — nothing to do.
  }
}

// A Stripe checkout opened in the in-app browser returns to the app either via a
// universal link or simply by the user closing the browser. This flag lets
// plugins/native.client.ts know a checkout was in flight so it can sync state
// (module-level on purpose: client-only, single WebView, survives route changes).
type PendingCheckout = 'membership' | 'purchase'
let pendingCheckout: PendingCheckout | null = null

export function setPendingNativeCheckout(kind: PendingCheckout): void {
  pendingCheckout = kind
}

export function takePendingNativeCheckout(): PendingCheckout | null {
  const kind = pendingCheckout
  pendingCheckout = null
  return kind
}
