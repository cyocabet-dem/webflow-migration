// Shared body scroll-lock for stacked partner overlays (cart panel + checkout modal).
// A plain counter: each open surface takes the lock once and releases it once, and
// body overflow is only restored when the LAST holder releases — so closing the cart
// panel underneath an open checkout modal (or vice versa) never unfreezes the page.
// Client-only by nature (document writes); calls are no-ops during SSR.
// Portal/admin page-local modals keep their own handling (out of scope here).

export function usePpBodyLock() {
  const count = useState<number>('pp-body-lock-count', () => 0)

  function lock() {
    if (!import.meta.client) return
    count.value += 1
    document.body.style.overflow = 'hidden'
  }

  function unlock() {
    if (!import.meta.client) return
    count.value = Math.max(0, count.value - 1)
    if (count.value === 0) document.body.style.overflow = ''
  }

  return { count, lock, unlock }
}
