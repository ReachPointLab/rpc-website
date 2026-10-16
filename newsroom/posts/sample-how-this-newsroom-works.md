---
title: Sample post — how the newsroom works
date: 2026-10-15
category: Company
summary: A placeholder update that shows how a post reads on the Reach Point Capital newsroom. It is excluded from the live site.
sample: true
---

This is a **placeholder post**. It exists only so the layout can be reviewed in the local preview. It is flagged `sample: true`, so the production build leaves it out.

## Writing a post

Each post is a short markdown file in `newsroom/posts/`. The block at the top sets the title, date, category and summary. Everything below it is the article itself.

- Use `##` headings to break up longer updates.
- Use lists for key points.
- Add [links](https://reachpointcapital.com) wherever they help the reader.

> Pull quotes render like this, set in the same serif face as the rest of the site.

## Publishing

Copy `_template.md`, give the new file a short dash-separated name, fill it in and push. The build turns it into its own page, then adds it to the home page, the newsroom list, the RSS feed and the sitemap.
