#!/usr/bin/env node
// seo-diff.mjs — diff a page's SEO head (title / meta description / og:* /
// twitter:* / canonical / robots) between the running Nuxt app and the
// corresponding reference HTML in the repo:
//   * default reference: the Webflow static export, old/dematerialized-24fc59.webflow (2)/<page>.html
//     (the migration's source of truth for EN heads)
//   * --ref nl: the captured live Dutch pages, nl-reference/<page>.nl.html
//     (INFORMATIONAL ONLY — see note below)
//
// Usage (run from anywhere; repo paths are resolved from this script's location):
//   node seo-diff.mjs /about-us                          # vs old export, dev server on :3000
//   node seo-diff.mjs /about-us --base http://localhost:3001
//   node seo-diff.mjs /faq --ref nl                      # vs nl-reference capture (informational)
//   node seo-diff.mjs /about-us --dump-ref               # parse + print the reference head only (no server needed)
//
// Requires: Node >= 18. No npm installs. Needs a running dev server unless --dump-ref.
// Exit code: 0 = no unexplained mismatches, 1 = mismatches, 2 = usage error.
//
// KNOWN SANCTIONED DEVIATION (annotated automatically, not counted as a failure):
// og:image / twitter:image were re-hosted during the migration — the old export
// points at https://cdn.prod.website-files.com/<site>/<hash>_<name>.png, the app
// serves https://dematerialized.nl/images/meta/<name>.png (migration-map.md,
// Implementation log: "og:image re-hosting (2026-07-05)"). If the trailing
// filename matches after stripping the Webflow asset-hash prefix, the diff is OK.
//
// --ref nl NOTE (as of 2026-07-07): the live Webflow NL pages carried localized
// Dutch <title>/meta (e.g. "Dematerialized | Over ons") while the Nuxt app serves
// the same static English head on /nl routes. That is the app's current, shipped
// behavior — whether to localize heads is an OPEN change-control question, not a
// bug to fix from this script's output. Route head changes through demat-change-control.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// repo/.claude/skills/demat-diagnostics-toolkit/scripts/ -> repo root is 4 levels up
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const OLD_EXPORT_DIR = join(REPO_ROOT, 'old', 'dematerialized-24fc59.webflow (2)')
const NL_REF_DIR = join(REPO_ROOT, 'nl-reference')

// Route -> old-export filename. Every Nuxt page has a same-named export page
// (verified 2026-07-07). Blog detail pages are EXCLUDED: the export's
// detail_blog.html is a CMS template with placeholder head values, so a diff
// against it is meaningless — verify blog heads by eye or via route-crawl titles.
const ROUTE_TO_OLD = {
  '/': 'index.html',
  '/about-us': 'about-us.html',
  '/account': 'account.html',
  '/also-this': 'also-this.html',
  '/cancellation-policy': 'cancellation-policy.html',
  '/clothing': 'clothing.html',
  '/contact-us': 'contact-us.html',
  '/cookie-policy': 'cookie-policy.html',
  '/donation-store-credit-policy': 'donation-store-credit-policy.html',
  '/donations-credits': 'donations-credits.html',
  '/donations': 'donations.html',
  '/error-membership-signup': 'error-membership-signup.html',
  '/faq': 'faq.html',
  '/how-it-works': 'how-it-works.html',
  '/mailing-list': 'mailing-list.html',
  '/memberships': 'memberships.html',
  '/missing-pieces': 'missing-pieces.html',
  '/my-membership': 'my-membership.html',
  '/my-rentals': 'my-rentals.html',
  '/privacy-policy': 'privacy-policy.html',
  '/product': 'product.html',
  '/profile': 'profile.html',
  '/purchase-success': 'purchase-success.html',
  '/purchases': 'purchases.html',
  '/reservations': 'reservations.html',
  '/return-policy': 'return-policy.html',
  '/terms-and-conditions': 'terms-and-conditions.html',
  '/welcome-to-dematerialized': 'welcome-to-dematerialized.html',
  '/wish-list': 'wish-list.html',
}

// Route -> nl-reference capture (only 17 pages were captured on 2026-07-05;
// account/checkout pages were not public NL pages).
const ROUTE_TO_NLREF = Object.fromEntries(
  [
    '/', '/about-us', '/also-this', '/cancellation-policy', '/clothing', '/contact-us',
    '/cookie-policy', '/donation-store-credit-policy', '/donations', '/faq', '/how-it-works',
    '/mailing-list', '/memberships', '/missing-pieces', '/privacy-policy', '/return-policy',
    '/terms-and-conditions',
  ].map((r) => [r, `${r === '/' ? 'index' : r.slice(1)}.nl.html`]),
)

const FIELDS = [
  'title',
  'description',
  'og:title',
  'og:description',
  'og:image',
  'og:type',
  'twitter:title',
  'twitter:description',
  'twitter:image',
  'twitter:card',
  'robots',
  'canonical',
]

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
const pagePath = argv.find((a) => a.startsWith('/'))
function argValue(flag, fallback) {
  const i = argv.indexOf(flag)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const BASE = argValue('--base', 'http://localhost:3000').replace(/\/+$/, '')
const REF = argValue('--ref', 'old') // 'old' | 'nl'
const DUMP_ONLY = argv.includes('--dump-ref')

if (!pagePath) {
  console.error('Usage: node seo-diff.mjs <page-path> [--base URL] [--ref old|nl] [--dump-ref]')
  console.error('Known paths: ' + Object.keys(ROUTE_TO_OLD).join(' '))
  process.exit(2)
}

const refMap = REF === 'nl' ? ROUTE_TO_NLREF : ROUTE_TO_OLD
const refDir = REF === 'nl' ? NL_REF_DIR : OLD_EXPORT_DIR
const refFileName = refMap[pagePath]
if (!refFileName) {
  console.error(`No ${REF === 'nl' ? 'nl-reference capture' : 'old-export file'} mapped for ${pagePath}.`)
  if (REF === 'nl') console.error('NL captures exist only for: ' + Object.keys(ROUTE_TO_NLREF).join(' '))
  process.exit(2)
}
const refPath = join(refDir, refFileName)
if (!existsSync(refPath)) {
  console.error(`Reference file not found: ${refPath}`)
  process.exit(2)
}

// ---------------------------------------------------------------------------
// Head parsing (regex-based; both sources are static, well-formed head markup)
// ---------------------------------------------------------------------------
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
}

function parseAttrs(tag) {
  const attrs = {}
  const re = /([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)')/g
  let m
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = decodeEntities(m[3] ?? m[4] ?? '')
  return attrs
}

function extractHeadFields(html) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const head = headMatch ? headMatch[1] : html
  const out = {}
  const t = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  out.title = t ? decodeEntities(t[1]).trim() : null

  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const a = parseAttrs(tag)
    const key = (a.name || a.property || '').toLowerCase()
    if (!key || a.content === undefined) continue
    if (FIELDS.includes(key) && out[key] === undefined) out[key] = a.content
  }
  for (const tag of head.match(/<link\b[^>]*>/gi) || []) {
    const a = parseAttrs(tag)
    if ((a.rel || '').toLowerCase() === 'canonical' && out.canonical === undefined) out.canonical = a.href ?? null
  }
  return out
}

// Sanctioned og:image re-host: cdn.prod.website-files.com/<hex>/<hex>_<name> -> /images/meta/<name>
function imageBasename(url) {
  if (!url) return url
  const last = url.split('/').pop() || ''
  return last.replace(/^[0-9a-f]{20,}_/i, '')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const refFields = extractHeadFields(readFileSync(refPath, 'utf8'))

if (DUMP_ONLY) {
  console.log(`Reference head fields — ${refPath}:`)
  for (const f of FIELDS) console.log(`  ${f.padEnd(20)} ${refFields[f] === undefined || refFields[f] === null ? '(absent)' : JSON.stringify(refFields[f])}`)
  process.exit(0)
}

let html
try {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 15000)
  const res = await fetch(`${BASE}${pagePath === '/' ? '/' : pagePath}`, { redirect: 'follow', signal: ctl.signal })
  clearTimeout(timer)
  if (res.status !== 200) {
    console.error(`Dev server returned HTTP ${res.status} for ${pagePath}`)
    process.exit(2)
  }
  html = await res.text()
} catch (err) {
  console.error(`Cannot reach ${BASE}${pagePath} (${err?.cause?.code || err?.name || err}).`)
  console.error('Start the dev server first: cd app && npm run dev')
  process.exit(2)
}

const newFields = extractHeadFields(html)

console.log(`SEO diff for ${pagePath}`)
console.log(`  new: ${BASE}${pagePath}`)
console.log(`  ref: ${refPath}${REF === 'nl' ? '  (INFORMATIONAL — live NL heads were localized; app serves EN heads on /nl by current design)' : ''}`)
console.log('')

let mismatches = 0
for (const f of FIELDS) {
  const a = refFields[f] ?? null
  const b = newFields[f] ?? null
  if (a === b) {
    console.log(`  OK        ${f.padEnd(20)} ${a === null ? '(absent in both)' : JSON.stringify(a)}`)
    continue
  }
  if ((f === 'og:image' || f === 'twitter:image') && a && b && imageBasename(a) === imageBasename(b)) {
    console.log(`  OK*       ${f.padEnd(20)} sanctioned re-host: ${imageBasename(a)} (Webflow CDN -> /images/meta/)`)
    continue
  }
  mismatches++
  console.log(`  MISMATCH  ${f}`)
  console.log(`            ref: ${a === null ? '(absent)' : JSON.stringify(a)}`)
  console.log(`            new: ${b === null ? '(absent)' : JSON.stringify(b)}`)
}

console.log('')
if (mismatches === 0) {
  console.log('Result: verbatim head parity (og:image re-hosting excepted).')
} else {
  console.log(`Result: ${mismatches} mismatched field(s).${REF === 'nl' ? ' (nl mode is informational — EN-head-on-/nl is current behavior, an open change-control question.)' : ' Every EN mismatch is a parity finding — check migration-map.md before changing anything.'}`)
}
process.exit(mismatches === 0 ? 0 : 1)
