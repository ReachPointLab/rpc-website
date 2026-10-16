/* Reach Point Capital — shared behavior for the home page and the newsroom.
   Everything here is progressive: with JS off, or with "reduce motion" on, the pages still read in full. */
(() => {
  'use strict';
  window.__rpc = true; // tells the <head> failsafe that this script ran

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const store = {
    get(key, area = 'localStorage') { try { return window[area].getItem(key); } catch { return null; } },
    set(key, value, area = 'localStorage') { try { window[area].setItem(key, value); } catch { /* storage blocked */ } },
  };

  /* ── header: solid background once the page scrolls ── */
  const header = $('#site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── theme toggle (remembers the choice) ── */
  const themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      store.set('rpc-theme', next);
      window.dispatchEvent(new Event('rpc:theme'));
    });
  }

  /* ── mobile menu ── */
  const menuBtn = $('.menu-toggle');
  const menu = $('#mobile-menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menu.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
    };
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ── scroll reveal ── */
  const revealIO = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;
  const reveal = (el) => (revealIO ? revealIO.observe(el) : el.classList.add('is-in'));
  $$('[data-reveal]').forEach(reveal);

  /* ── easing helpers (used by the background) ── */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /* ── thesis: light up the point nearest the middle of the screen ── */
  const thesisList = $('.thesis-points');
  if (thesisList && 'IntersectionObserver' in window) {
    thesisList.classList.add('is-tracking');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-active', entry.isIntersecting));
    }, { rootMargin: '-40% 0px -40% 0px' });
    $$('.thesis-point', thesisList).forEach((p) => io.observe(p));
  }

  /* ── cards: a cursor-following spotlight (the card also lifts a few pixels on hover, in CSS) ── */
  const bindCard = (card) => {
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  };
  $$('.portfolio-card, .news-card').forEach(bindCard);

  /* ── contact button: a gentle magnetic pull ── */
  const cta = $('.contact-btn');
  if (cta && finePointer.matches && !reduceMotion.matches) {
    cta.addEventListener('pointermove', (e) => {
      const r = cta.getBoundingClientRect();
      cta.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    cta.addEventListener('pointerleave', () => { cta.style.transform = ''; });
  }

  /* ── newsroom: category filter ── */
  const filterBar = $('[data-filter-bar]');
  const newsGrid = $('[data-news-grid]');
  if (filterBar && newsGrid) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const filter = btn.dataset.filter;
      $$('[data-filter]', filterBar).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      newsGrid.classList.toggle('is-filtered', filter !== 'all');
      $$('.news-card', newsGrid).forEach((card) => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
    });
  }

  /* ── home page: "Latest" strip, filled from /newsroom/posts.json (hidden when there are no posts) ── */
  const latest = $('[data-latest]');
  if (latest) {
    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    };
    const newsCard = (p, i) => {
      const card = el('a', 'news-card');
      card.href = String(p.url).startsWith('/newsroom/') ? p.url : '/newsroom/';
      card.setAttribute('data-reveal', '');
      card.style.setProperty('--d', String(i));
      const meta = el('div', 'news-meta');
      meta.append(el('span', 'chip', p.category));
      if (p.sample) meta.append(el('span', 'chip chip--flag', 'Sample'));
      const time = el('time', null, p.dateLabel);
      time.dateTime = p.date;
      meta.append(time);
      const more = el('span', 'more');
      more.append('Read update ', el('span', null, '→'));
      more.lastChild.setAttribute('aria-hidden', 'true');
      card.append(meta, el('h3', null, p.title), el('p', null, p.summary), more);
      return card;
    };
    fetch('/newsroom/posts.json', { headers: { accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : []))
      .then((posts) => {
        const items = (Array.isArray(posts) ? posts : []).filter((p) => !p.draft).slice(0, 3);
        const grid = $('[data-latest-grid]', latest);
        if (!items.length || !grid) return;
        items.forEach((p, i) => grid.append(newsCard(p, i)));
        latest.hidden = false;
        $$('.news-card', grid).forEach((card) => { bindCard(card); reveal(card); });
      })
      .catch(() => { /* no feed available: the strip simply stays hidden */ });
  }

  /* ── background: a slow "long arc" with drifting nodes that notice the cursor ── */
  const canvas = $('#arc');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const TAU = Math.PI * 2;
    const RINGS = [{ k: 1, alpha: 0.26 }, { k: 1.13, alpha: 0.14 }, { k: 1.3, alpha: 0.07 }];
    // a bright pulse sweeps along each arc now and then (period and offset in ms)
    const COMETS = [{ ring: 0, period: 9000, offset: 2200 }, { ring: 1, period: 13000, offset: 6500 }, { ring: 2, period: 17000, offset: 11000 }];
    let w = 0, h = 0, rgb = '160,169,184', raf = 0;
    let dust = [], nodes = [];
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: -999, py: -999 };
    let scroll = window.scrollY, scrollTarget = scroll;
    const introMs = store.get('rpc-arc-seen', 'sessionStorage') ? 900 : 2800;
    store.set('rpc-arc-seen', '1', 'sessionStorage');
    const t0 = performance.now();

    const readColors = () => { rgb = getComputedStyle(root).getPropertyValue('--arc-rgb').trim() || rgb; };

    const seed = () => {
      const count = Math.round(Math.min(70, (w * h) / 26000));
      dust = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h, z: 0.25 + Math.random() * 0.75,
        r: 0.4 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.05, vy: (Math.random() - 0.5) * 0.05,
        p: Math.random() * TAU,
      }));
      nodes = Array.from({ length: w < 700 ? 5 : 9 }, (_, i) => ({
        ring: i % RINGS.length, u0: Math.random(), speed: 0.00002 + Math.random() * 0.00003,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (now) => {
      const still = reduceMotion.matches;
      const t = now - t0;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      scroll += (scrollTarget - scroll) * 0.08;
      const intro = still ? 1 : easeOut(clamp(t / introMs, 0, 1));
      const hasCursor = !still && mouse.px > -100;

      ctx.clearRect(0, 0, w, h);

      if (hasCursor) {
        const g = ctx.createRadialGradient(mouse.px, mouse.py, 0, mouse.px, mouse.py, 280);
        g.addColorStop(0, `rgba(${rgb},0.07)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // the arcs: centred off-screen at the lower right, drawn in on load, drifting with scroll and cursor
      const cx = w * 0.88 - (mouse.x - 0.5) * 34;
      const cy = h * 1.14 - scroll * 0.2 - (mouse.y - 0.5) * 22;
      const R = Math.max(h * 0.9, w * 0.46) + scroll * 0.04;
      const a0 = Math.PI * 1.02 - scroll * 0.00006;
      const a1 = Math.PI * 1.7 - scroll * 0.00006;
      ctx.lineCap = 'round';
      const breathe = (i) => (still ? 0 : Math.sin(t * 0.0004 + i * 1.7) * 5);
      RINGS.forEach((ring, i) => {
        const r = R * ring.k + breathe(i);
        const end = a0 + (a1 - a0) * clamp(intro * (1.12 - i * 0.06), 0, 1);
        const grad = ctx.createLinearGradient(cx - r, cy, cx, cy - r);
        grad.addColorStop(0, `rgba(${rgb},0)`);
        grad.addColorStop(0.35, `rgba(${rgb},${ring.alpha})`);
        grad.addColorStop(0.8, `rgba(${rgb},${ring.alpha})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = i === 0 ? 1.2 : 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, end);
        ctx.stroke();
      });

      // pulses: a short bright streak with a glowing head, fading in and out along its arc
      if (!still && intro > 0.95) {
        COMETS.forEach((c) => {
          const p = ((t + c.offset) % c.period) / c.period;
          if (p > 0.55) return;
          const u = easeInOut(p / 0.55);
          const r = R * RINGS[c.ring].k + breathe(c.ring);
          const fade = Math.sin(Math.PI * u);
          const span = (a1 - a0) * 0.1;
          const head = a0 + (a1 - a0) * u;
          ctx.lineWidth = 1.4;
          for (let k = 0; k < 6; k++) {
            ctx.strokeStyle = `rgba(${rgb},${0.55 * fade * ((k + 1) / 6)})`;
            ctx.beginPath();
            ctx.arc(cx, cy, r, head - span + (span * k) / 6, head - span + (span * (k + 1)) / 6);
            ctx.stroke();
          }
          const hx = cx + Math.cos(head) * r;
          const hy = cy + Math.sin(head) * r;
          const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 20);
          glow.addColorStop(0, `rgba(${rgb},${0.5 * fade})`);
          glow.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(hx, hy, 20, 0, TAU); ctx.fill();
        });
      }

      // nodes travelling along the arcs; they brighten and reach toward the cursor
      nodes.forEach((n) => {
        const u = still ? n.u0 : (n.u0 + t * n.speed) % 1;
        if (u > intro) return;
        const ang = a0 + (a1 - a0) * u;
        const r = R * RINGS[n.ring].k + breathe(n.ring);
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) return;
        const near = hasCursor ? clamp(1 - Math.hypot(x - mouse.px, y - mouse.py) / 230, 0, 1) : 0;
        const halo = ctx.createRadialGradient(x, y, 0, x, y, 14 + near * 14);
        halo.addColorStop(0, `rgba(${rgb},${0.28 + near * 0.3})`);
        halo.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(x, y, 14 + near * 14, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(${rgb},${0.55 + near * 0.4})`;
        ctx.beginPath(); ctx.arc(x, y, 1.6 + near * 1.2, 0, TAU); ctx.fill();
        if (near > 0) {
          ctx.strokeStyle = `rgba(${rgb},${0.22 * near})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(mouse.px, mouse.py); ctx.stroke();
        }
      });

      // fine dust with a touch of depth
      dust.forEach((d) => {
        if (!still) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -5) d.x = w + 5; else if (d.x > w + 5) d.x = -5;
          if (d.y < -5) d.y = h + 5; else if (d.y > h + 5) d.y = -5;
        }
        const x = d.x + (mouse.x - 0.5) * -14 * d.z;
        const y = (((d.y - scroll * 0.06 * d.z) % h) + h) % h;
        const twinkle = still ? 0.2 : 0.14 + 0.1 * Math.sin(now * 0.001 + d.p);
        ctx.fillStyle = `rgba(${rgb},${twinkle * intro})`;
        ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
      });
    };

    let lastDraw = 0;
    const tick = (now) => {
      raf = 0;
      // cap at ~60fps so high-refresh displays don't burn extra battery on a background
      if (now - lastDraw >= 14.5 || reduceMotion.matches) { lastDraw = now; draw(now); }
      if (!reduceMotion.matches && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

    readColors();
    resize();
    start();

    window.addEventListener('resize', () => { resize(); start(); }, { passive: true });
    window.addEventListener('scroll', () => { scrollTarget = window.scrollY; }, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      mouse.tx = e.clientX / w; mouse.ty = e.clientY / h; mouse.px = e.clientX; mouse.py = e.clientY;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { mouse.px = -999; mouse.py = -999; });
    window.addEventListener('rpc:theme', () => { readColors(); start(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    reduceMotion.addEventListener('change', start);
  }
})();
