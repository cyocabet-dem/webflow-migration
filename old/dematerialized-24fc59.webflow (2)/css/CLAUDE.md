# CLAUDE.md — `css/`

Stylesheets from the Webflow export. **Source of truth for design.** Read-only.

| File | Purpose |
|------|---------|
| `dematerialized-24fc59.webflow.css` | The main project styles — all Webflow-authored classes for the site's layout and components. |
| `webflow.css` | Webflow framework base styles. |
| `normalize.css` | CSS reset. |

Note: additional custom CSS lives outside this folder in `old/demat-webflow-test/` (`styles.css`,
`my-account.css`, `sidenav`), injected at runtime. Validate all styling against the brand tokens in
`migration-scanning-rules.md` (plum `#4B073F`, magenta `#A92296`, charcoal `#24282d`, soft pink
`#fff4fe`; Fraunces/Inter; lowercase UI; 50px pills; 20px image radius).
