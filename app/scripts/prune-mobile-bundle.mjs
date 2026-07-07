// Slims the generated mobile bundle (.output/public) before `cap sync`.
//
// The Webflow export ships ~210MB of responsive image variants and videos.
// Bundling those would blow past Google Play's 200MB base limit, so the apps
// keep only what CSS references (a runtime rewriter can't touch url() rules —
// see the media rewriter in plugins/native.client.ts) plus the favicon/webclip.
// Every other /images/ and /videos/ reference is DOM-level and gets rewritten
// to load from the production site, exactly like the mobile website does.
import { readFile, readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'

const APP = new URL('..', import.meta.url).pathname
const OUT = join(APP, '.output/public')

// Collect /images/... and /videos/... paths referenced via CSS url() — in the
// stylesheets AND in inline style attributes in Vue templates (e.g. the video
// poster backgrounds on how-it-works/about-us/donations). Element attributes
// (src/srcset/poster) are handled at runtime by the rewriter instead.
// The head icons are also kept (nuxt.config.ts links /images/favicon.png + webclip).
const keep = new Set(['images/favicon.png', 'images/webclip.png'])

function collectUrlRefs(text) {
  // Webflow-exported inline styles encode their quotes (url(&quot;/videos/…&quot;)).
  const normalized = text.replaceAll('&quot;', '"').replaceAll('&#39;', "'")
  for (const m of normalized.matchAll(/url\((['"]?)\/(images|videos)\/([^)'"]+)\1\)/g)) {
    keep.add(join(m[2], decodeURIComponent(m[3])))
  }
}

const cssDir = join(APP, 'assets/css')
for (const f of await readdir(cssDir)) {
  if (f.endsWith('.css')) collectUrlRefs(await readFile(join(cssDir, f), 'utf8'))
}
for (const dir of ['pages', 'components', 'layouts']) {
  for (const entry of await readdir(join(APP, dir), { recursive: true })) {
    if (entry.endsWith('.vue')) collectUrlRefs(await readFile(join(APP, dir, entry), 'utf8'))
  }
}

let kept = 0
let keptBytes = 0
let removed = 0
let removedBytes = 0

async function pruneDir(dir, rel) {
  for (const entry of await readdir(join(OUT, dir), { withFileTypes: true })) {
    const relPath = join(rel, entry.name)
    const absPath = join(OUT, dir, entry.name)
    if (entry.isDirectory()) {
      await pruneDir(join(dir, entry.name), relPath)
      continue
    }
    const size = (await stat(absPath)).size
    if (keep.has(relPath) || keep.has(join(dir, entry.name))) {
      kept += 1
      keptBytes += size
    } else {
      removed += 1
      removedBytes += size
      await rm(absPath)
    }
  }
}

for (const dir of ['images', 'videos']) {
  try {
    await pruneDir(dir, dir)
  } catch {
    // Directory absent from the build — nothing to prune.
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1) + 'MB'
console.log(
  `mobile bundle pruned: kept ${kept} CSS-referenced media files (${mb(keptBytes)}), ` +
    `removed ${removed} (${mb(removedBytes)}) — the apps load those from the production site`
)
