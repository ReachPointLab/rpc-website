#!/usr/bin/env node
// Builds the site into dist/.
//   1. copies the hand-written pages and assets
//   2. generates the newsroom (index, one page per post, RSS, posts.json) from newsroom/posts/*.md
//   3. writes sitemap.xml
// Zero dependencies. Flags: --samples (include `sample: true` posts), --drafts (include `draft: true` posts).
// Production builds use neither flag, so placeholder and draft posts never ship.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIST = path.join(ROOT, process.env.RPC_OUT || 'dist');

const SITE = 'https://reachpointcapital.com';
const OG_IMAGE = `${SITE}/assets/og-image.png`;
const CATEGORIES = ['Company', 'Research', 'Product', 'Press'];
const SKIP_AT_ROOT = new Set([
  '.git', '.gitignore', '.claude', '.vercel', '.DS_Store', 'node_modules', 'dist', 'docs',
  'scripts', 'newsroom', 'legal', 'package.json', 'package-lock.json', 'vercel.json', 'README.md',
  'index.backup.2026-03-08.html',
]);

// ── small helpers ──────────────────────────────────────────────────────────
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`)
  .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const rfc822 = (iso) => new Date(`${iso}T12:00:00Z`).toUTCString();

// ── markdown (headings, paragraphs, lists, quotes, code, links, bold/italic) ─
function inline(text) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_, label, href) => {
    const ok = /^(https?:\/\/|mailto:|\/|#)/i.test(href);
    if (!ok) return label;
    const external = /^https?:/i.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if (/^```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
    } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      const level = Math.max(2, m[1].length); // the post title is the page's h1
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
      i++;
    } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr />');
      i++;
    } else if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
    } else if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, ''));
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`);
    } else if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\d+\.\s+/, ''));
      out.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ol>`);
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?|[-*]\s+|\d+\.\s+|-{3,}$|\*{3,}$)/.test(lines[i])) {
        para.push(lines[i++]);
      }
      out.push(`<p>${inline(para.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

// ── posts ──────────────────────────────────────────────────────────────────
// The `---` block at the top of a markdown file: simple "key: value" lines, then the body.
function frontMatter(file, raw) {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing the --- front matter block at the top`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 1) throw new Error(`${file}: can't read front-matter line "${line}"`);
    let v = line.slice(i + 1).trim();
    if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
    meta[line.slice(0, i).trim()] = v;
  }
  return { meta, body: m[2].trim() };
}

function parsePost(file, raw) {
  const { meta, body } = frontMatter(file, raw);
  const slug = path.basename(file, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${file}: file name must be lowercase words joined by dashes, e.g. my-first-update.md`);
  }
  if (!meta.title) throw new Error(`${file}: "title" is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || '') || Number.isNaN(Date.parse(meta.date))) {
    throw new Error(`${file}: "date" must look like 2026-10-15`);
  }
  if (!CATEGORIES.includes(meta.category)) {
    throw new Error(`${file}: "category" must be one of ${CATEGORIES.join(', ')} (got "${meta.category || ''}")`);
  }
  if (!meta.summary) throw new Error(`${file}: "summary" is required (one or two sentences)`);
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: meta.title,
    date: meta.date,
    category: meta.category,
    summary: meta.summary,
    draft: meta.draft === 'true',
    sample: meta.sample === 'true',
    minutes: Math.max(1, Math.round(words / 200)),
    html: renderMarkdown(body),
    url: `/newsroom/${slug}/`,
  };
}

async function loadPosts({ samples, drafts }) {
  const dir = path.join(ROOT, 'newsroom', 'posts');
  const files = (await fs.readdir(dir).catch(() => []))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const posts = [];
  for (const f of files) posts.push(parsePost(f, await fs.readFile(path.join(dir, f), 'utf8')));
  return posts
    .filter((p) => (samples || !p.sample) && (drafts || !p.draft))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

// ── page shell (header/footer/head come from index.html so they live in one place) ──
function extractParts(home) {
  const grab = (re, name) => {
    const m = home.match(re);
    if (!m) throw new Error(`index.html is missing its ${name} block`);
    return m[0];
  };
  return {
    sharedHead: grab(/<!-- shared:start -->[\s\S]*?<!-- shared:end -->/, 'shared <head>'),
    bg: grab(/<!-- bg:start -->[\s\S]*?<!-- bg:end -->/, 'background'),
    header: grab(/<header id="site-header">[\s\S]*?<\/header>/, 'header'),
    footer: grab(/<footer id="about">[\s\S]*?<\/footer>/, 'footer'),
  };
}

// `nav` is the header link to mark as the current page (null for pages that are not in the nav).
// `canonical` is left out for pages that should not name a canonical address, such as the 404 page.
function shell(parts, { title, description, canonical, ogType = 'website', noindex = false, nav = 'newsroom', jsonLd = '', body }) {
  const header = nav ? parts.header.replaceAll(`data-nav="${nav}"`, `data-nav="${nav}" aria-current="page"`) : parts.header;
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
${noindex ? '  <meta name="robots" content="noindex" />\n' : ''}${canonical ? `  <link rel="canonical" href="${canonical}" />` : ''}
  <meta property="og:site_name" content="Reach Point Capital" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
${canonical ? `  <meta property="og:url" content="${canonical}" />` : ''}
  <meta property="og:type" content="${ogType}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  ${parts.sharedHead}
${jsonLd}</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${parts.bg}
  ${header}
  <main id="main">
${body}
  </main>
  ${parts.footer}
  <script src="/assets/site.js" defer></script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

// ── newsroom templates ─────────────────────────────────────────────────────
const arrow = '<span aria-hidden="true">→</span>';

function cardHtml(p, { featured = false, delay = 0 } = {}) {
  const flag = p.sample ? '<span class="chip chip--flag">Sample</span>' : p.draft ? '<span class="chip chip--flag">Draft</span>' : '';
  return `<a class="news-card${featured ? ' is-featured' : ''}" href="${p.url}" data-category="${esc(p.category)}" data-reveal style="--d:${delay}">
  <div class="news-meta"><span class="chip">${esc(p.category)}</span>${flag}<time datetime="${p.date}">${fmtDate(p.date)}</time></div>
  <h2>${esc(p.title)}</h2>
  <p>${esc(p.summary)}</p>
  <span class="more">Read update ${arrow}</span>
</a>`;
}

function indexBody(posts) {
  const counts = new Map();
  for (const p of posts) counts.set(p.category, (counts.get(p.category) || 0) + 1);
  const filters = counts.size > 1
    ? `<div class="filter-bar" role="group" aria-label="Filter updates by category" data-filter-bar>
        <button type="button" class="filter-chip" data-filter="all" aria-pressed="true">All <span>${posts.length}</span></button>
        ${CATEGORIES.filter((c) => counts.has(c)).map((c) => `<button type="button" class="filter-chip" data-filter="${c}" aria-pressed="false">${c} <span>${counts.get(c)}</span></button>`).join('\n        ')}
      </div>`
    : '';
  const list = posts.length
    ? `${filters}
      <div class="news-grid" data-news-grid>
        ${posts.map((p, i) => cardHtml(p, { featured: i === 0, delay: Math.min(i, 5) })).join('\n        ')}
      </div>`
    : `<div class="news-empty" data-reveal>
        <svg class="empty-mark" viewBox="0 0 120 120" fill="none" aria-hidden="true"><path d="M14 104C14 54 54 14 104 14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M14 104C14 64 44 34 84 34" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".5"/><circle cx="104" cy="14" r="3" fill="currentColor"/></svg>
        <h2>First updates coming soon.</h2>
        <p>Company news, research notes and product updates will be published here. For press and general inquiries, write to <a href="mailto:info@reachpointcapital.com">info@reachpointcapital.com</a>.</p>
      </div>`;
  return `    <section class="page-hero">
      <div class="container">
        <div class="hero-eyebrow"><span class="eyebrow-rule"></span>Reach Point Capital</div>
        <h1 class="page-title"><span class="line"><span>The</span></span> <span class="line"><em><span>Newsroom.</span></em></span></h1>
        <p class="page-lede">Company news, research notes and product updates.</p>
      </div>
    </section>
    <section class="news-section">
      <div class="container">
      ${list}
      </div>
    </section>`;
}

function postBody(p, newer, older) {
  const nav = (label, post, cls) => post
    ? `<a class="post-nav-link ${cls}" href="${post.url}"><span class="post-nav-label">${label}</span><span class="post-nav-title">${esc(post.title)}</span></a>`
    : '<span></span>';
  return `    <article class="post">
      <div class="container container--narrow">
        <a class="back-link" href="/newsroom/"><span aria-hidden="true">←</span> Newsroom</a>
        <header class="post-header">
          <div class="news-meta"><span class="chip">${esc(p.category)}</span><time datetime="${p.date}">${fmtDate(p.date)}</time><span>${p.minutes} min read</span></div>
          <h1 class="post-title">${esc(p.title)}</h1>
          <p class="post-summary">${esc(p.summary)}</p>
        </header>
        ${p.sample ? '<p class="sample-banner">Placeholder post for the local preview. It is excluded from the production build.</p>' : ''}
        <div class="prose">
${p.html}
        </div>
        <nav class="post-nav" aria-label="More updates">
          ${nav('Newer', newer, 'is-newer')}
          ${nav('Older', older, 'is-older')}
        </nav>
      </div>
    </article>`;
}

function postJsonLd(p) {
  if (p.sample || p.draft) return '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: p.title,
    description: p.summary,
    datePublished: p.date,
    mainEntityOfPage: `${SITE}${p.url}`,
    image: OG_IMAGE,
    author: { '@type': 'Organization', name: 'Reach Point Capital' },
    publisher: { '@type': 'Organization', name: 'Reach Point Capital', url: SITE },
  };
  return `  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n`;
}

function feedXml(posts) {
  const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}${p.url}</link>
      <guid isPermaLink="true">${SITE}${p.url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.summary)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Reach Point Capital Newsroom</title>
    <link>${SITE}/newsroom/</link>
    <description>Company news, research notes and product updates from Reach Point Capital.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
}

// ── legal pages and the 404 page ───────────────────────────────────────────
// legal/*.md become /privacy/, /disclaimer/ and so on. A page marked `draft: true` is a placeholder for legal review:
// like draft posts it is built for the local preview only, and the footer links appear only for pages that are built,
// so a production build cannot ship placeholder legal text.
async function loadLegal({ drafts }) {
  const dir = path.join(ROOT, 'legal');
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const pages = [];
  for (const f of files) {
    const slug = path.basename(f, '.md');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || ['assets', 'newsroom', 'dist'].includes(slug)) {
      throw new Error(`legal/${f}: file name must be lowercase words joined by dashes and must not clash with a site folder`);
    }
    const { meta, body } = frontMatter(`legal/${f}`, await fs.readFile(path.join(dir, f), 'utf8'));
    if (!meta.title) throw new Error(`legal/${f}: "title" is required`);
    pages.push({
      slug,
      title: meta.title,
      summary: meta.summary || '',
      updated: meta.updated || '',
      link: meta.link || meta.title,
      order: Number(meta.order) || 99,
      draft: meta.draft === 'true',
      html: renderMarkdown(body),
      url: `/${slug}/`,
    });
  }
  return pages
    .filter((p) => drafts || !p.draft)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

// Adds a row of legal links to the footer (shared by every page). No pages built, no links.
function withLegalLinks(footer, pages) {
  if (!pages.length) return footer;
  const links = pages.map((p) => `<a href="${p.url}">${esc(p.link)}</a>`).join('\n        ');
  return footer.replace(/<\/div>\s*<\/footer>$/, `  <nav class="footer-legal" aria-label="Legal">\n        ${links}\n      </nav>\n    </div>\n  </footer>`);
}

function legalBody(p) {
  // Square-bracketed capitals in a draft are fill-in-the-blank markers for counsel; make them easy to spot.
  const html = p.draft ? p.html.replace(/\[([A-Z][^\]<]*)\]/g, '<mark class="placeholder">[$1]</mark>') : p.html;
  return `    <article class="post">
      <div class="container container--narrow">
        <a class="back-link" href="/"><span aria-hidden="true">←</span> Home</a>
        <header class="post-header">
          <h1 class="post-title">${esc(p.title)}</h1>
          ${p.summary ? `<p class="post-summary">${esc(p.summary)}</p>` : ''}
          ${p.updated ? `<div class="news-meta"><span>Last updated ${esc(p.updated)}</span></div>` : ''}
        </header>
        ${p.draft ? '<p class="sample-banner">Draft for legal review. This text is a placeholder: it appears in the local preview only and is left out of the production build until <code>draft: true</code> is removed from its file in <code>legal/</code>.</p>' : ''}
        <div class="prose">
${html}
        </div>
      </div>
    </article>`;
}

function notFoundBody() {
  return `    <section class="page-hero">
      <div class="container">
        <div class="hero-eyebrow"><span class="eyebrow-rule"></span>Error 404</div>
        <h1 class="page-title"><span class="line"><span>Page not</span></span> <span class="line"><em><span>found.</span></em></span></h1>
        <p class="page-lede">That address doesn’t lead anywhere. It may have moved, or the link may be mistyped.</p>
      </div>
    </section>
    <section class="news-section">
      <div class="container">
        <div class="news-empty" data-reveal>
          <h2>Where to next?</h2>
          <p><a href="/">Home</a> &nbsp;·&nbsp; <a href="/newsroom/">Newsroom</a> &nbsp;·&nbsp; <a href="mailto:info@reachpointcapital.com">Contact us</a></p>
        </div>
      </div>
    </section>`;
}

function sitemapXml(posts, today, legal = []) {
  const urls = [
    { loc: `${SITE}/`, lastmod: today, priority: '1.0' },
    { loc: `${SITE}/newsroom/`, lastmod: posts[0]?.date || today, priority: '0.8' },
    ...posts.map((p) => ({ loc: `${SITE}${p.url}`, lastmod: p.date, priority: '0.6' })),
    ...legal.map((p) => ({ loc: `${SITE}${p.url}`, lastmod: today, priority: '0.3' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

// ── build ──────────────────────────────────────────────────────────────────
export async function build({ samples = false, drafts = false } = {}) {
  const [home, posts, legal] = await Promise.all([
    fs.readFile(path.join(ROOT, 'index.html'), 'utf8'),
    loadPosts({ samples, drafts }),
    loadLegal({ drafts }),
  ]);
  const base = extractParts(home);
  const parts = { ...base, footer: withLegalLinks(base.footer, legal) };

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });
  for (const entry of await fs.readdir(ROOT)) {
    if (SKIP_AT_ROOT.has(entry) || /^dist(-|$)/.test(entry)) continue;
    await fs.cp(path.join(ROOT, entry), path.join(DIST, entry), {
      recursive: true,
      filter: (src) => path.basename(src) !== '.DS_Store',
    });
  }

  const write = async (rel, content) => {
    const file = path.join(DIST, rel);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
  };

  if (legal.length) await write('index.html', home.replace(base.footer, () => parts.footer)); // the home page's own footer gets the links too
  await Promise.all(legal.map((p) => write(`${p.slug}/index.html`, shell(parts, {
    title: `${p.title} — Reach Point Capital`,
    description: p.summary || p.title,
    canonical: `${SITE}${p.url}`,
    noindex: p.draft,
    nav: null,
    body: legalBody(p),
  }))));
  await write('404.html', shell(parts, { // Vercel serves this for any address that does not exist
    title: 'Page not found — Reach Point Capital',
    description: 'The page you were looking for could not be found.',
    noindex: true,
    nav: null,
    body: notFoundBody(),
  }));

  await write('newsroom/index.html', shell(parts, {
    title: 'Newsroom — Reach Point Capital',
    description: 'Company news, research notes and product updates from Reach Point Capital.',
    canonical: `${SITE}/newsroom/`,
    body: indexBody(posts),
  }));

  await Promise.all(posts.map((p, i) => write(`newsroom/${p.slug}/index.html`, shell(parts, {
    title: `${p.title} — Reach Point Capital`,
    description: p.summary,
    canonical: `${SITE}${p.url}`,
    ogType: 'article',
    noindex: p.sample || p.draft,
    jsonLd: postJsonLd(p),
    body: postBody(p, posts[i - 1], posts[i + 1]),
  }))));

  const published = posts.filter((p) => !p.sample && !p.draft);
  await write('newsroom/feed.xml', feedXml(published));
  await write('newsroom/posts.json', JSON.stringify(posts.map((p) => ({
    slug: p.slug, title: p.title, date: p.date, dateLabel: fmtDate(p.date),
    category: p.category, summary: p.summary, url: p.url, sample: p.sample, draft: p.draft,
  })), null, 2));
  await write('sitemap.xml', sitemapXml(published, new Date().toISOString().slice(0, 10), legal.filter((p) => !p.draft)));

  return { posts: posts.length, samples: posts.filter((p) => p.sample).length, legal: legal.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Set(process.argv.slice(2));
  build({ samples: args.has('--samples'), drafts: args.has('--drafts') })
    .then(({ posts, samples, legal }) => console.log(`Built dist/ — ${posts} newsroom post${posts === 1 ? '' : 's'}${samples ? ` (${samples} sample)` : ''}, ${legal} legal page${legal === 1 ? '' : 's'}, 404 page`))
    .catch((err) => { console.error(`Build failed: ${err.message}`); process.exit(1); });
}
