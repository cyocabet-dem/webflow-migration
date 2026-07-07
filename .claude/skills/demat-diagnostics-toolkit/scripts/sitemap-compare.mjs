#!/usr/bin/env node
// sitemap-compare.mjs — diff the app's /sitemap.xml URL set against the archived
// live Webflow sitemap (nl-reference/live-sitemap.xml, captured 2026-07-05).
//
// Usage:
//   node sitemap-compare.mjs                          # fetch http://localhost:3000/sitemap.xml
//   node sitemap-compare.mjs --base http://localhost:3001
//   node sitemap-compare.mjs --base https://dematerialized.nl   # post-cutover production check
//   node sitemap-compare.mjs --static                 # no server: rebuild the expected set from
//                                                     # the repo (sitemap.xml.ts PAGES + app/data/blog.json)
//
// Requires: Node >= 18. Exit: 0 = only known-accepted deviations, 1 = unexplained
// deviations, 2 = setup error.
//
// KNOWN ACCEPTED DEVIATION (as of 2026-07-07, per Courtney's disposition —
// ACCEPTED/DEFERRED, do NOT "fix" without her approval; see demat-change-control):
// the app sitemap emits the 7th blog post, which the live Webflow sitemap lacked:
//   https://dematerialized.nl/blog/you-own-way-more-clothes-than-you-wear-a-monthly-clothing-rental-explainer
//   https://dematerialized.nl/nl/blog/you-own-way-more-clothes-than-you-wear-a-monthly-clothing-rental-explainer
// (the NL twin exists because that post is the only one with an NL variant in
// app/data/blog.json; app/server/routes/sitemap.xml.ts emits NL blog URLs only
// when post.nl.title exists).

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const LIVE_SITEMAP = join(REPO_ROOT, 'nl-reference', 'live-sitemap.xml')
const BLOG_JSON = join(REPO_ROOT, 'app', 'data', 'blog.json')

const SITE = 'https://dematerialized.nl'

// Mirror of PAGES in app/server/routes/sitemap.xml.ts (verified 2026-07-07).
// If --static output diverges from a fetched sitemap, this copy is stale —
// re-read sitemap.xml.ts.
const PAGES = [
  '', '/memberships', '/how-it-works', '/clothing', '/wish-list', '/mailing-list',
  '/privacy-policy', '/terms-and-conditions', '/cookie-policy', '/cancellation-policy',
  '/return-policy', '/contact-us', '/donations', '/faq', '/about-us', '/also-this',
  '/missing-pieces', '/donation-store-credit-policy',
]

const ACCEPTED_EXTRA = new Set([
  `${SITE}/blog/you-own-way-more-clothes-than-you-wear-a-monthly-clothing-rental-explainer`,
  `${SITE}/nl/blog/you-own-way-more-clothes-than-you-wear-a-monthly-clothing-rental-explainer`,
])

const argv = process.argv.slice(2)
function argValue(flag, fallback) {
  const i = argv.indexOf(flag)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const BASE = argValue('--base', 'http://localhost:3000').replace(/\/+$/, '')
const STATIC = argv.includes('--static')

function extractLocs(xml) {
  return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()))
}

if (!existsSync(LIVE_SITEMAP)) {
  console.error(`Archived live sitemap not found: ${LIVE_SITEMAP}`)
  process.exit(2)
}
const liveSet = extractLocs(readFileSync(LIVE_SITEMAP, 'utf8'))

let newSet
let newLabel
if (STATIC) {
  // Rebuild the URL set the same way app/server/routes/sitemap.xml.ts does.
  const blog = JSON.parse(readFileSync(BLOG_JSON, 'utf8'))
  newSet = new Set()
  for (const p of PAGES) {
    newSet.add(`${SITE}/nl${p}`)
    newSet.add(`${SITE}${p || ''}`)
  }
  for (const post of blog.posts) {
    if (post.en?.title) newSet.add(`${SITE}/blog/${post.slug}`)
    if (post.nl?.title) newSet.add(`${SITE}/nl/blog/${post.slug}`)
  }
  newLabel = 'expected set rebuilt from repo (sitemap.xml.ts PAGES mirror + app/data/blog.json)'
} else {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 15000)
    const res = await fetch(`${BASE}/sitemap.xml`, { signal: ctl.signal })
    clearTimeout(timer)
    if (res.status !== 200) {
      console.error(`GET ${BASE}/sitemap.xml returned HTTP ${res.status}`)
      process.exit(2)
    }
    newSet = extractLocs(await res.text())
    newLabel = `${BASE}/sitemap.xml`
  } catch (err) {
    console.error(`Cannot fetch ${BASE}/sitemap.xml (${err?.cause?.code || err?.name || err}).`)
    console.error('Start the dev server first (cd app && npm run dev), or use --static.')
    process.exit(2)
  }
}

const missing = [...liveSet].filter((u) => !newSet.has(u)).sort()
const extra = [...newSet].filter((u) => !liveSet.has(u)).sort()
const extraAccepted = extra.filter((u) => ACCEPTED_EXTRA.has(u))
const extraUnexplained = extra.filter((u) => !ACCEPTED_EXTRA.has(u))

console.log(`Sitemap compare`)
console.log(`  live (archived 2026-07-05): ${LIVE_SITEMAP}  (${liveSet.size} URLs)`)
console.log(`  new: ${newLabel}  (${newSet.size} URLs)\n`)

if (missing.length) {
  console.log(`MISSING from new sitemap (present on live Webflow) — parity regressions (${missing.length}):`)
  for (const u of missing) console.log(`  - ${u}`)
} else {
  console.log('MISSING: none — every live URL is present.')
}

if (extraAccepted.length) {
  console.log(`\nEXTRA — known accepted deviation, 7th blog post (ACCEPTED by Courtney 2026-07-07; do not remove without approval) (${extraAccepted.length}):`)
  for (const u of extraAccepted) console.log(`  + ${u}`)
}
if (extraUnexplained.length) {
  console.log(`\nEXTRA — UNEXPLAINED, investigate (${extraUnexplained.length}):`)
  for (const u of extraUnexplained) console.log(`  + ${u}`)
}
if (!extra.length) console.log('\nEXTRA: none.')

const clean = missing.length === 0 && extraUnexplained.length === 0
console.log(`\nResult: ${clean ? 'PARITY (accepted deviations only)' : 'DEVIATIONS FOUND'}`)
process.exit(clean ? 0 : 1)
