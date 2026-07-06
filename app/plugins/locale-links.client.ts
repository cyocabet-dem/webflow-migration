// Locale-preserving link handling — the DematI18n.localizeHrefs() equivalent.
// The ported markup keeps its verbatim <a href="/…"> anchors (EN paths); when the
// site is on /nl, this prefixes internal navigations so the language sticks, and
// routes them through vue-router (SPA navigation) instead of a full reload.
export default defineNuxtPlugin(() => {
  const router = useRouter()

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    if (anchor.target && anchor.target !== '_self') return
    if (anchor.hasAttribute('download') || anchor.hasAttribute('hreflang')) return // hreflang = the locale switcher
    const href = anchor.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return

    const currentPath = router.currentRoute.value.path
    const onNL = currentPath === '/nl' || currentPath.startsWith('/nl/')
    const alreadyNL = href === '/nl' || href.startsWith('/nl/')
    const target = onNL && !alreadyNL ? (href === '/' ? '/nl' : `/nl${href}`) : href

    e.preventDefault()
    router.push(target)
  })
})
