# CLAUDE.md — `videos/`

**16 binary video and poster assets** from the Webflow export — hero/background videos for the
About Us, How It Works, and Donations pages. Each clip ships in several formats plus a poster still:
`.mp4`, `.webm`, `.mov`, and `-poster-*.jpg`.

## Rule: do NOT scan

Never read, parse, or analyze the contents of these files. Treat each as an opaque asset:

- Record only its **filename and the path that references it** (from the HTML/CSS) so it can be
  re-linked in Nuxt.
- **Copy verbatim** into the Nuxt `public/` directory, preserving filenames.
- No transcoding or "optimizing" unless explicitly asked.
- To see what exists, use `ls` — never a content read.
