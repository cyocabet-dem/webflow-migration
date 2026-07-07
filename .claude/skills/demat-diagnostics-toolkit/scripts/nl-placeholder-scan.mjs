#!/usr/bin/env node
// nl-placeholder-scan.mjs — static scan of app/ for English text sitting in
// Dutch slots. Fully offline; no dev server needed.
//
// Background (verified 2026-07-07): during QA round 2 (commit 3c600b9) the live
// NL FAQ was found stale, so NL copy was realigned to current EN with the EN
// text left in the NL slot as a placeholder "for Courtney". There is NO marker
// or comment convention — placeholders are detectable ONLY as nl-value == en-value.
// Two mechanisms carry bilingual copy:
//   (a) verbatim markup pairs:  <span class="lang-en">X</span><span class="lang-nl">Y</span>
//       (toggled by CSS on html[lang], app/assets/css/6-lang-toggle.css)
//   (b) per-file dicts:         key: { en: '...', nl: '...' }
// This script reports every pair where the two sides are identical.
//
// IMPORTANT: identical en/nl is not automatically a defect. Some pairs are
// intentional (loanwords, names, times). Known probably-intentional strings are
// annotated "[allowlisted]" below rather than counted; a few are annotated
// "[uncertain]" because nobody has confirmed intent. Supplying real Dutch is
// Courtney's call — do NOT invent translations; see demat-i18n-and-consent for
// the NL placeholder protocol.
//
// Usage:
//   node nl-placeholder-scan.mjs             # scan <repo>/app
//   node nl-placeholder-scan.mjs --strict    # exit 1 if any non-allowlisted hit
//
// Requires: Node >= 18. Exit: 0 (informational) unless --strict and hits exist.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const APP_DIR = join(REPO_ROOT, 'app')
const SKIP_DIRS = new Set(['node_modules', '.nuxt', '.output', 'dist', 'public'])

// Identical-by-design (or plausibly so). Keyed by the normalized string.
// 'probably intentional' = same word in Dutch usage; 'uncertain' = intent never
// confirmed (candidate question for Courtney, see demat-change-control).
const ALLOWLIST = new Map([
  ['item', 'probably intentional (same word in NL)'],
  ['items', 'probably intentional (same word in NL; my-rentals pluralizer also returns "items" for NL)'],
  ['instagram', 'probably intentional (brand name)'],
  ['tiktok', 'probably intentional (brand name)'],
  ['facebook', 'probably intentional (brand name)'],
  ['pinterest', 'probably intentional (brand name)'],
  ['faq', 'probably intentional (same abbreviation in NL)'],
  ['12:00 - 16:00', 'probably intentional (opening hours)'],
  ['slim', 'uncertain — fit option; may be acceptable Dutch or awaiting translation'],
  ['regular', 'uncertain — fit option; may be acceptable Dutch or awaiting translation'],
  ['oversized', 'uncertain — fit option; may be acceptable Dutch or awaiting translation'],
  ['google search', 'uncertain — heard-about-us option; intent never confirmed'],
  ['influencer', 'uncertain — heard-about-us option; intent never confirmed'],
])

function normalize(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.startsWith('.')) yield* walk(p)
    } else if (/\.(vue|ts|js|mjs)$/.test(name)) {
      yield p
    }
  }
}

const findings = [] // { file, line, kind, text, note }

for (const file of walk(APP_DIR)) {
  const content = readFileSync(file, 'utf8')
  const rel = relative(REPO_ROOT, file)

  // (a) adjacent lang-en / lang-nl span pairs (allow arbitrary extra attrs & whitespace)
  const spanRe = /<span[^>]*class="[^"]*\blang-en\b[^"]*"[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*class="[^"]*\blang-nl\b[^"]*"[^>]*>([\s\S]*?)<\/span>/g
  let m
  while ((m = spanRe.exec(content))) {
    const en = normalize(m[1].replace(/<[^>]+>/g, ' '))
    const nl = normalize(m[2].replace(/<[^>]+>/g, ' '))
    if (en && en === nl) {
      const key = en.toLowerCase()
      findings.push({
        file: rel,
        line: lineOf(content, m.index),
        kind: 'lang-span',
        text: en,
        note: ALLOWLIST.get(key) || null,
      })
    }
  }

  // (b) dict entries: en: '...'|"..." followed by nl: '...'|"..." (same entry,
  // possibly across lines — the QA-round-2 dicts use both layouts)
  const dictRe = /\ben:\s*(['"])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*\n?\s*nl:\s*(['"])((?:\\.|(?!\3)[\s\S])*?)\3/g
  while ((m = dictRe.exec(content))) {
    const en = normalize(m[2])
    const nl = normalize(m[4])
    if (en && en === nl) {
      const key = en.toLowerCase()
      findings.push({
        file: rel,
        line: lineOf(content, m.index),
        kind: 'T-dict',
        text: en,
        note: ALLOWLIST.get(key) || null,
      })
    }
  }
}

findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)))

const placeholders = findings.filter((f) => !f.note)
const annotated = findings.filter((f) => f.note)

function truncate(s, n = 100) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

console.log('NL placeholder scan — identical en/nl pairs in app/ (nl==en is the ONLY detection signal)\n')

if (placeholders.length) {
  console.log(`PLACEHOLDERS — EN text in the NL slot, awaiting Courtney's Dutch (${placeholders.length}):`)
  for (const f of placeholders) {
    console.log(`  ${f.file}:${f.line}  [${f.kind}]  ${truncate(f.text)}`)
  }
} else {
  console.log('PLACEHOLDERS: none found — every bilingual pair differs (or was allowlisted).')
}

if (annotated.length) {
  console.log(`\nALLOWLISTED — identical by (probable) design, listed for completeness (${annotated.length}):`)
  for (const f of annotated) {
    console.log(`  ${f.file}:${f.line}  [${f.kind}]  ${truncate(f.text, 40)}  — ${f.note}`)
  }
}

console.log(`\nTotal identical pairs: ${findings.length} (${placeholders.length} placeholder, ${annotated.length} allowlisted)`)
console.log('Reminder: filling placeholders needs real Dutch from Courtney — never machine-fill; log fills in migration-map.md Implementation log.')

process.exit(process.argv.includes('--strict') && placeholders.length ? 1 : 0)
