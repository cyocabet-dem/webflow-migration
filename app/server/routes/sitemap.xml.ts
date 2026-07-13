// Mirrors the live Webflow sitemap: bilingual page pairs with en/nl/x-default alternates,
// blog posts per locale variant (EN always; NL only where a Dutch variant exists).
import blogData from '~/data/blog.json'

const SITE = 'https://dematerialized.nl'

const PAGES = [
  '',
  '/memberships',
  '/how-it-works',
  '/clothing',
  '/wish-list',
  '/mailing-list',
  '/privacy-policy',
  '/terms-and-conditions',
  '/cookie-policy',
  '/cancellation-policy',
  '/return-policy',
  '/contact-us',
  '/donations',
  '/faq',
  '/about-us',
  '/also-this',
  '/missing-pieces',
  '/donation-store-credit-policy',
  '/partners',
]

function alternates(path: string): string {
  return (
    `        <xhtml:link rel="alternate" hreflang="nl" href="${SITE}/nl${path}"/>\n` +
    `        <xhtml:link rel="alternate" hreflang="en" href="${SITE}${path || ''}"/>\n` +
    `        <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${path || ''}"/>`
  )
}

function pageEntries(path: string): string {
  return (
    `    <url>\n        <loc>${SITE}/nl${path}</loc>\n${alternates(path)}\n    </url>\n` +
    `    <url>\n        <loc>${SITE}${path || ''}</loc>\n${alternates(path)}\n    </url>`
  )
}

// Module-level cache of partner slugs (5-minute TTL) so crawler bursts don't hit the
// partner API on every request. A failed refresh caches an empty list for the TTL —
// the sitemap keeps serving the static pages and stops hammering an unreachable API.
const SLUG_CACHE_TTL_MS = 5 * 60 * 1000
let slugCache: { slugs: string[]; timestamp: number } | null = null

async function getPartnerSlugs(): Promise<string[]> {
  if (slugCache && Date.now() - slugCache.timestamp < SLUG_CACHE_TTL_MS) {
    return slugCache.slugs
  }
  let slugs: string[] = []
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'https://test-api.dematerialized.nl'
    const res = await fetch(`${apiBase}/partner-platform/public/partners`, {
      signal: controller.signal,
    })
    if (res.ok) {
      // The abort timer stays armed through the BODY read too — a stalled body
      // stream must not hang the sitemap any more than a stalled connect.
      const partners = await res.json()
      if (Array.isArray(partners)) {
        slugs = partners
          .map((p) => (typeof p?.slug === 'string' ? p.slug : ''))
          .filter(Boolean)
      }
    }
  } catch {
    /* partner platform unreachable — static pages only */
  } finally {
    clearTimeout(timer)
  }
  slugCache = { slugs, timestamp: Date.now() }
  return slugs
}

export default defineEventHandler(async (event) => {
  const urls: string[] = PAGES.map(pageEntries)

  // Best-effort partner storefront URLs (/partners/{slug}); the sitemap must never
  // break, so any failure (partner backend not deployed, timeout) silently emits
  // only the static pages above.
  for (const slug of await getPartnerSlugs()) {
    urls.push(pageEntries(`/partners/${encodeURIComponent(slug)}`))
  }

  for (const post of blogData.posts) {
    if (post.en?.title) {
      urls.push(`    <url>\n        <loc>${SITE}/blog/${post.slug}</loc>\n    </url>`)
    }
    if (post.nl?.title) {
      urls.push(`    <url>\n        <loc>${SITE}/nl/blog/${post.slug}</loc>\n    </url>`)
    }
  }

  setHeader(event, 'content-type', 'application/xml')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') +
    '\n</urlset>'
  )
})
