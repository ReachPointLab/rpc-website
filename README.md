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
| `newsroom/posts/*.md` | Newsroom posts. See [`newsroom/README.md`](newsroom/README.md) for how to add one. |
| `scripts/build.mjs` | Builds `dist/`: copies the site, generates the newsroom pages, RSS feed, `posts.json` and `sitemap.xml`. |
| `scripts/dev.mjs` | The local preview server used by `npm run dev`. |
| `vercel.json` | Tells Vercel to run the build and serve `dist/`. |

## Deploying

Pushing to `main` builds and deploys to production on Vercel. Any other branch gets its own preview URL, which
is the safe way to check a change before it goes live.

Placeholder posts (`sample: true`) and drafts (`draft: true`) are left out of production builds.
