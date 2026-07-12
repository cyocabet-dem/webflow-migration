// Partner platform bootstrap + (in later phases) the partner reservation cart bridge.
// Named to sort after auth0.client.ts (plugins run in filename-alphabetical order and
// the auth0 plugin is awaited), so window.auth0Client exists here when auth init succeeded —
// still null-checked everywhere per house convention.

export default defineNuxtPlugin((nuxtApp) => {
  const pp = usePartnerPlatform()

  // Probe availability once per session; when the partner backend isn't deployed the
  // probe fails silently and every partner surface stays hidden (site unchanged).
  nuxtApp.hook('app:mounted', async () => {
    const enabled = await pp.probe()
    if (!enabled) return
    // Resolve roles for nav visibility when a session exists.
    await pp.fetchMe()
  })
})
