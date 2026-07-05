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

export default defineEventHandler((event) => {
  const urls: string[] = PAGES.map(pageEntries)

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
