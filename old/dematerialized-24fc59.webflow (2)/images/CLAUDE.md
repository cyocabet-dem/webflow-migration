# CLAUDE.md — `images/`

**248 binary image assets** from the Webflow export: product photos, logos, backgrounds, icons, and
OG images. Mix of `.png` (162), `.webp` (72), `.jpeg`/`.jpg` (13), `.svg` (1). Many come in Webflow's
responsive size variants (e.g. `*-p-500.png`, `*-p-1080.webp`).

## Rule: do NOT scan

Never read, parse, OCR, or analyze the contents of these files. Treat each as an opaque asset:

- Record only its **filename and the path that references it** (from the HTML/CSS) so it can be
  re-linked in Nuxt.
- **Copy verbatim** into the Nuxt `public/` directory, preserving filenames so existing references
  keep resolving.
- No pixel-based alt-text, transcoding, or "optimizing" unless explicitly asked.
- To see what exists, use `ls` — never a content read.
