# Newsroom

Each post is one markdown file in `newsroom/posts/`. The build (`scripts/build.mjs`) turns them into pages,
the newsroom list, the home-page "Latest" strip, the RSS feed (`/newsroom/feed.xml`) and the sitemap.

## Add a post

1. Copy `posts/_template.md` to a new file named with lowercase words and dashes, e.g. `posts/q4-research-update.md`.
2. Fill in the front matter and write the article below it.
3. Preview it: `npm run dev`, then open http://localhost:4173/newsroom/
4. Commit and push. Vercel runs the build on deploy.

## Front matter

| Field      | Required | Notes                                              |
| ---------- | -------- | -------------------------------------------------- |
| `title`    | yes      | The headline.                                      |
| `date`     | yes      | `YYYY-MM-DD`. Newest posts show first.             |
| `category` | yes      | One of `Company`, `Research`, `Product`, `Press`.  |
| `summary`  | yes      | One or two sentences, shown on cards and in link previews. |
| `draft`    | no       | `draft: true` keeps it out of the live site.       |
| `sample`   | no       | `sample: true` marks placeholder posts. Excluded from live builds. |

The markdown supports `##`–`####` headings, paragraphs, bullet and numbered lists, `>` quotes, `---` rules,
fenced code blocks, links, **bold**, *italic* and `code`.

## Preview vs. live

`npm run dev` shows sample and draft posts so you can see the layout. `npm run build` (what Vercel runs) leaves
both out. Delete the two `sample-*.md` files whenever you like.
