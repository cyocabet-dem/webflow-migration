// Runs before every other plugin (filename order). The real splash hide happens
// on app:mounted in plugins/native.client.ts, but that plugin only runs after the
// awaited auth0 plugin — whose network calls could hold the splash indefinitely.
// This arms an unconditional cap the moment the app process starts.
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return
  setTimeout(() => {
    void import('@capacitor/splash-screen').then(({ SplashScreen }) =>
      SplashScreen.hide({ fadeOutDuration: 250 })
    )
  }, 4000)
})
