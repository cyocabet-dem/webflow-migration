#!/usr/bin/env node
// route-crawl.mjs — crawl every route of the Dematerialized Nuxt app and check
// HTTP status + exact SSR <title> against the expected-title map extracted verbatim
// from the pages' useHead() calls (verified against app/pages/* on 2026-07-07).
//
// This reproduces the project's historical route-crawl acceptance bar
// ("Final crawl: 64 checks green — every page EN+NL, all blog posts EN+NL,
// product page, robots" — migration-map.md, Implementation log, Phase 5).
// The exact check count here differs (this script also crawls the NL fallback
// route of every EN-only blog post) but the coverage is a superset of that bar.
//
// Usage:
//   node route-crawl.mjs                       # crawl http://localhost:3000
//   node route-crawl.mjs --base http://localhost:3001
//   node route-crawl.mjs --sku DM-0001         # also check /product?sku=... (EN+NL)
//   node route-crawl.mjs --list                # print the check plan, no network
//   node route-crawl.mjs --timeout 30000       # per-request timeout in ms (default 15000)
//
// Requires: Node >= 18 (global fetch). No npm installs. Needs a running dev
// server (`npm run dev` in app/) unless --list.
// Exit code: 0 = all green, 1 = any failure, 2 = usage/setup error.

// ---------------------------------------------------------------------------
// Expected titles — verbatim from each page's useHead({ title: ... }).
// NL routes serve the SAME (English) titles: every page head is a static
// string, not locale-switched (verified 2026-07-07). If a check starts failing
// because a title became locale-aware, that is a deliberate change — update
// this map, do not "fix" the page.
// ---------------------------------------------------------------------------
const PAGE_TITLES = {
  '/': 'Dematerialized | Clothing Rentals For Everyday Life',
  '/about-us': 'Dematerialized | About Us',
  '/account': 'Account',
  '/also-this': 'also this',
  '/cancellation-policy': 'Cancellation Policy | Dematerialized',
  '/clothing': 'Shop The Collection | Dematerialized',
  '/contact-us': 'Contact Us | Dematerialized',
  '/cookie-policy': 'Cookie Policy',
  '/donation-store-credit-policy': 'Donation & Store Credit Policy',
  '/donations-credits': 'Donations & Credits',
  '/donations': 'The Easy Way To Donate Your Clothes | Dematerialized',
  '/error-membership-signup': 'Error Membership Signup',
  '/faq': 'Dematerialized | Frequently Asked Questions',
  '/how-it-works': 'How It Works - Clothing Rental In Den Bosch | Dematerialized',
  '/mailing-list': 'Join Our Mailing List | Dematerialized',
  '/memberships': 'Clothing Rental Memberships | Dematerialized',
  '/missing-pieces': 'missing pieces',
  '/my-membership': 'My Membership',
  '/my-rentals': 'My Rentals',
  '/privacy-policy': 'Privacy Policy',
  '/profile': 'Profile',
  '/purchase-success': 'Purchase Success',
  '/purchases': 'Purchases',
  '/reservations': 'Reservations',
  '/return-policy': 'Return Policy | Dematerialized',
  '/terms-and-conditions': 'Terms and Conditions',
  '/welcome-to-dematerialized': 'Welcome to Dematerialized',
  '/wish-list': 'Wish List',
}
// NOT in the map: /product — no-sku requests are redirected server-side to
// /clothing (await navigateTo in app/pages/product.vue setup), checked separately
// below. With a sku, its SSR title is the literal 'Product' (hydrates to
// "<name> – Dematerialized" client-side, which a crawler never sees).

// Blog posts — slugs + titles verbatim from app/data/blog.json (2026-07-07).
// /nl/blog/<slug> for an EN-only post renders the EN variant (pickVariant
// fallback in app/composables/useBlogPosts.ts), so its expected title is the EN one.
const BLOG_POSTS = [
  {
    slug: 'you-own-way-more-clothes-than-you-wear-a-monthly-clothing-rental-explainer',
    en: 'you own way more clothes than you wear (a monthly clothing rental explainer)',
    nl: 'you own way more clothes than you wear (a monthly clothing rental explainer)',
  },
  {
    slug: 'i-didnt-quit-fast-fashion-to-save-the-planet-it-was-pettier-than-that',
    en: 'I didn’t quit fast fashion to save the planet (it was pettier than that)',
    nl: null,
  },
  { slug: 'yay-or-nay-florals', en: 'yay or nay: florals', nl: null },
  {
    slug: 'heres-to-all-the-returns-we-forgot-to-return',
    en: 'here’s to all the returns we “forgot” to return',
    nl: null,
  },
  {
    slug: 'we-love-a-good-closet-purge-until-where-is-that-top',
    en: "we love a good closet purge until…where's that top? oh…",
    nl: null,
  },
  {
    slug: 'we-need-to-talk-about-your-vinted-purchases',
    en: 'we need to talk about your Vinted purchases…',
    nl: null,
  },
  {
    slug: 'personal-style-is-a-scam-and-were-all-falling-for-it',
    en: "personal style is a scam (and we're all falling for it)",
    nl: null,
  },
]

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2)
function argValue(flag, fallback) {
  const i = argv.indexOf(flag)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const BASE = argValue('--base', 'http://localhost:3000').replace(/\/+$/, '')
const SKU = argValue('--sku', null)
const TIMEOUT_MS = Number(argValue('--timeout', '15000')) || 15000
const LIST_ONLY = argv.includes('--list')

// ---------------------------------------------------------------------------
// Check plan
// ---------------------------------------------------------------------------
/** @type {{path:string, kind:'title'|'redirect'|'robots'|'status404', expect:string}[]} */
const checks = []

for (const [path, title] of Object.entries(PAGE_TITLES)) {
  checks.push({ path, kind: 'title', expect: title })
  checks.push({ path: path === '/' ? '/nl' : `/nl${path}`, kind: 'title', expect: title })
}
for (const post of BLOG_POSTS) {
  checks.push({ path: `/blog/${post.slug}`, kind: 'title', expect: post.en })
  checks.push({ path: `/nl/blog/${post.slug}`, kind: 'title', expect: post.nl ?? post.en })
}
if (SKU) {
  checks.push({ path: `/product?sku=${encodeURIComponent(SKU)}`, kind: 'title', expect: 'Product' })
  checks.push({ path: `/nl/product?sku=${encodeURIComponent(SKU)}`, kind: 'title', expect: 'Product' })
}
checks.push({ path: '/product', kind: 'redirect', expect: '/clothing' })
checks.push({ path: '/robots.txt', kind: 'robots', expect: 'Sitemap: https://dematerialized.nl/sitemap.xml' })
checks.push({ path: '/this-route-does-not-exist-9f2c', kind: 'status404', expect: '404' })

if (LIST_ONLY) {
  for (const c of checks) console.log(`${c.kind.padEnd(9)} ${c.path}  =>  ${c.expect}`)
  console.log(`\n${checks.length} checks planned against ${BASE}`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Helpers
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

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? decodeEntities(m[1]).trim() : null
}

async function fetchWithTimeout(url, opts = {}) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { redirect: 'manual', ...opts, signal: ctl.signal })
  } finally {
    clearTimeout(t)
  }
}

async function runCheck(c) {
  const url = `${BASE}${c.path}`
  try {
    if (c.kind === 'redirect') {
      const res = await fetchWithTimeout(url)
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location') || ''
        return loc.includes(c.expect)
          ? { ...c, ok: true, got: `${res.status} -> ${loc}` }
          : { ...c, ok: false, got: `${res.status} -> ${loc}` }
      }
      // Defensive fallback: some setups resolve the navigateTo internally and
      // return 200 with the /clothing page body. Accept iff the title matches.
      if (res.status === 200) {
        const title = extractTitle(await res.text())
        return title === PAGE_TITLES['/clothing']
          ? { ...c, ok: true, got: `200 with clothing title (redirect resolved server-side)` }
          : { ...c, ok: false, got: `200 with title ${JSON.stringify(title)}` }
      }
      return { ...c, ok: false, got: `HTTP ${res.status}` }
    }

    if (c.kind === 'status404') {
      const res = await fetchWithTimeout(url)
      return { ...c, ok: res.status === 404, got: `HTTP ${res.status}` }
    }

    // title / robots checks follow redirects (locale routing etc.)
    const res = await fetchWithTimeout(url, { redirect: 'follow' })
    if (res.status !== 200) return { ...c, ok: false, got: `HTTP ${res.status}` }
    const body = await res.text()
    if (c.kind === 'robots') {
      return body.includes(c.expect)
        ? { ...c, ok: true, got: 'sitemap line present' }
        : { ...c, ok: false, got: `body missing ${JSON.stringify(c.expect)}` }
    }
    const title = extractTitle(body)
    return { ...c, ok: title === c.expect, got: title === c.expect ? 'ok' : `title=${JSON.stringify(title)}` }
  } catch (err) {
    return { ...c, ok: false, got: `fetch error: ${err?.cause?.code || err?.name || err}` }
  }
}

// ---------------------------------------------------------------------------
// Main — small concurrency pool so the dev server isn't hammered.
// ---------------------------------------------------------------------------
const CONCURRENCY = 6
const results = []
let cursor = 0
async function worker() {
  while (cursor < checks.length) {
    const c = checks[cursor++]
    results.push(await runCheck(c))
  }
}

// Preflight: is anything listening at BASE?
try {
  await fetchWithTimeout(`${BASE}/`, { redirect: 'follow' })
} catch (err) {
  console.error(`Cannot reach ${BASE} (${err?.cause?.code || err?.name || err}).`)
  console.error('Start the dev server first: cd app && npm run dev   (port 3000 per .claude/launch.json)')
  process.exit(2)
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

results.sort((a, b) => checks.findIndex((c) => c.path === a.path) - checks.findIndex((c) => c.path === b.path))
let pass = 0
for (const r of results) {
  const mark = r.ok ? 'PASS' : 'FAIL'
  if (r.ok) pass++
  console.log(`${mark}  ${r.kind.padEnd(9)} ${r.path.padEnd(90)} ${r.ok ? '' : `expected ${JSON.stringify(r.expect)} — got ${r.got}`}`)
}
console.log(`\n${pass}/${results.length} checks green against ${BASE}`)
process.exit(pass === results.length ? 0 : 1)
