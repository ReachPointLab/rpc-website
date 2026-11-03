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
| `vercel.json` | Tells Vercel to run the build and serve `dist/`, and sets the security headers (including the Content-Security-Policy: scripts may only come from this site, so do not add inline `<script>` blocks; put code in `assets/`). `npm run dev` sends the same headers, so a blocked resource shows up in the browser console locally. `vercel.json` also routes `/tranche/` to tranche_ (the credit capital-structure tool, a separate server) through a rewrite; the site-wide headers deliberately skip `/tranche` because tranche_ sets its own, and two Content-Security-Policy headers on one response would both be enforced. The rewrite exists on Vercel only: `/tranche/` shows the 404 page under `npm run dev`. |
| `legal/*.md` | Privacy notice and disclaimer (see "Legal pages and the 404 page" below). |

## Deploying

Pushing to `main` builds and deploys to production on Vercel. Any other branch gets its own preview URL, which
is the safe way to check a change before it goes live.

Placeholder posts (`sample: true`) and drafts (`draft: true`) are left out of production builds.

## Legal pages and the 404 page

`legal/privacy.md` and `legal/disclaimer.md` become `/privacy/` and `/disclaimer/`, and the footer gets a link to each
page that is built. Both files are published: they cover the website and tranche_, and the effective date is in
`updated:`. They were written without a lawyer's review, so when you change how the site or tranche_ handles
information (for example by adding accounts, analytics or cookies), update the matching sentences here too.

A legal page marked `draft: true` is a work in progress. Like draft posts, it appears in `npm run dev` only:
production builds leave out the page **and** its footer link. Remove the line to publish it.

Every build also writes `404.html`, which Vercel serves for any address that does not exist.
