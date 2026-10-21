# Reach Point Capital website

Source for reachpointcapital.com: plain HTML, CSS and JavaScript, plus a small build step that generates the
newsroom. No dependencies to install (Node 20 or newer).

## Run it

```bash
npm run dev     # http://localhost:4173 — includes sample and draft posts, rebuilds when you save a file
npm run dev:live  # http://localhost:4174 — previews exactly what production will show (no sample or draft posts)
npm run build   # production build into dist/ (this is what Vercel runs)
```

## Where things live

| Path | What it is |
| --- | --- |
| `index.html` | The home page. Its `<head>`, background, header and footer are copied into every newsroom page by the build (they sit between the `shared`, `bg`, `<header>` and `<footer>` markers), so change them here, once. |
| `assets/site.css`, `assets/site.js` | Styles and behavior for every page, including the animated background. Reduced-motion is respected. |
| `assets/theme-init.js` | Tiny script in `<head>` that applies the saved light/dark theme before first paint. |
| `newsroom/posts/*.md` | Newsroom posts. See [`newsroom/README.md`](newsroom/README.md) for how to add one. |
| `scripts/build.mjs` | Builds `dist/`: copies the site, generates the newsroom pages, RSS feed, `posts.json` and `sitemap.xml`. |
| `scripts/dev.mjs` | The local preview server used by `npm run dev`. |
| `vercel.json` | Tells Vercel to run the build and serve `dist/`, and sets the security headers (including the Content-Security-Policy: scripts may only come from this site, so do not add inline `<script>` blocks; put code in `assets/`). `npm run dev` sends the same headers, so a blocked resource shows up in the browser console locally. |
| `legal/*.md` | Privacy notice and disclaimer (see "Legal pages and the 404 page" below). |

## Deploying

Pushing to `main` builds and deploys to production on Vercel. Any other branch gets its own preview URL, which
is the safe way to check a change before it goes live.

Placeholder posts (`sample: true`) and drafts (`draft: true`) are left out of production builds.

## Legal pages and the 404 page

`legal/privacy.md` and `legal/disclaimer.md` become `/privacy/` and `/disclaimer/`, and the footer gets a link to each
page that is built. Both files are currently placeholders marked `draft: true`, with `[LEGAL REVIEW: …]` markers where
counsel needs to confirm or write the wording. Like draft posts, draft legal pages appear in `npm run dev` only:
production builds leave out the pages **and** their footer links.

To publish them, replace the placeholder text, set the real effective date in `updated:`, and delete the `draft: true`
line from each file.

Every build also writes `404.html`, which Vercel serves for any address that does not exist.
