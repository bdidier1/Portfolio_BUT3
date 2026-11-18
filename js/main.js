// Interface : rubriques, fenêtre à onglets, menu latéral, bulle de pensée, navigateur du PC, version classique
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const html = document.documentElement;
  const BOOT = window.PORTFOLIO || { mode: 'classic', gl: false, reason: '' };
  const KEYS = ['apropos', 'projets', 'competences', 'parcours', 'veille', 'contact', 'cv', 'reveil'];
  const SECTIONS = ['apropos', 'projets', 'competences', 'parcours', 'veille', 'cv', 'contact'];
  const WINDOW_KEYS = ['competences', 'cv', 'contact'];   // s'ouvrent dans la fenêtre à droite
  const NAMES = { apropos: 'À propos', projets: 'Projets', competences: 'Compétences', parcours: 'Parcours', veille: 'Veille', cv: 'CV', contact: 'Contact', reveil: 'Météo' };
  const TAGLINES = { apropos: 'Qui je suis', projets: 'Ce que j\'ai réalisé', competences: 'Ce que je sais faire', parcours: 'D\'où je viens', veille: 'Comment je me tiens à jour', cv: 'Mon curriculum vitae', contact: 'Me joindre', reveil: 'L\'heure et le temps à Belfort' };
  const OBJECTS = { apropos: 'Baptiste, sur sa chaise', projets: 'L\'ordinateur', competences: 'L\'armoire', parcours: 'Le lit et le portable', veille: 'La bibliothèque', cv: 'Le cadre au mur', contact: 'Le téléphone', reveil: 'Le réveil' };
  const ICONS = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    apropos: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    projets: 'M3 4h18v12H3zM8 20h8M12 16v4',
    competences: 'M4 4h16v16H4zM12 4v16M4 12h8',
    parcours: 'M5 19c4 0 3-7 7-7s3-7 7-7M5 19a2 2 0 1 0 0-.01M19 5a2 2 0 1 0 0-.01',
    veille: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13',
    cv: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8',
    contact: 'M3 5h18v14H3zM3 6l9 7 9-7',
    reveil: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M5 3L2 6M19 3l3 3',
    cube: 'M12 2l9 5v10l-9 5-9-5V7zM12 22V12M21 7l-9 5-9-5',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  };
  const svg = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth <= 720;

  const win = $('#fenetre');
  const panels = {};
  KEYS.forEach((k) => { panels[k] = $('#p-' + k); });

  // Logo indisponible (hors ligne, CDN bloqué) : on affiche les initiales à la place
  document.addEventListener('error', (e) => {
    const im = e.target;
    if (!(im instanceof HTMLImageElement) || !im.closest('.skill__logo')) return;
    const box = im.parentNode, name = (im.closest('.skill').querySelector('strong') || {}).textContent || '?';
    box.classList.add('skill__logo--txt'); box.textContent = name.replace(/[^A-Za-z0-9#+]/g, '').slice(0, 2);
  }, true);

  // Formulaire de contact : après l'envoi, retour sur la page « merci » de ce site, quelle que soit son adresse
  const next = $('#form-next');
  if (next) next.value = new URL('merci.html', location.href).href.split('#')[0].split('?')[0];

  // ---------- Fiches projets : communes à la chambre 3D et à la vue classique ----------
  const CATS = [['tous', 'Tous'], ['stage', 'Stages'], ['universitaire', 'Universitaires'], ['personnel', 'Personnels'], ['automatisation', 'Automatisation']];
  const CAT_LABEL = { stage: 'Stage', universitaire: 'Projet universitaire', personnel: 'Projet personnel', automatisation: 'Automatisation' };
  const cards = [...document.querySelectorAll('#p-projets .card')];
  const catsOf = (card) => (card.dataset.cat || '').split(' ').filter(Boolean);
  const inCat = (card, k) => k === 'tous' || catsOf(card).includes(k);
  const dlg = $('#pmodal'), dlgBody = $('#pmodal-body');
  let lastFocus = null;

  // La fiche s'ouvre au premier plan ; la page derrière ne défile plus tant qu'elle est ouverte
  function openProject(card) {
    lastFocus = document.activeElement;
    dlgBody.textContent = '';
    const c = card.cloneNode(true);
    c.removeAttribute('id');
    const cats = document.createElement('p'); cats.className = 'card__cats';
    catsOf(card).forEach((k) => { const s = document.createElement('span'); s.textContent = CAT_LABEL[k] || k; cats.append(s); });
    c.prepend(cats);
    dlgBody.append(c);
    html.classList.add('modal-open');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlgBody.scrollTop = 0;
    $('#pmodal-close').focus({ preventScroll: true });
  }
  function closeProject() { if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else { dlg.removeAttribute('open'); onClosed(); } } }
  function onClosed() {
    html.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  dlg.addEventListener('close', onClosed);
  $('#pmodal-close').addEventListener('click', closeProject);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeProject(); });   // clic à côté de la fiche

  // Boutons de catégorie : Tous, Stages, Universitaires, Personnels, Automatisation
  function buildFilters(active, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'filters'; wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', 'Afficher les projets par catégorie');
    CATS.forEach(([k, label]) => {
      const n = cards.filter((c) => inCat(c, k)).length;
      if (!n) return;
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.cat = k; b.setAttribute('aria-pressed', String(k === active));
      b.textContent = label;
      const s = document.createElement('span'); s.className = 'filters__n'; s.textContent = n; b.append(s);
      wrap.append(b);
    });
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onChange(b.dataset.cat);
    });
    return wrap;
  }

  // Cadre court d'un projet : image, catégories, titre, contexte, résumé, technologies
  function projectTile(card) {
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'ptile'; t.dataset.cat = card.dataset.cat || '';
    const img = card.querySelector('figure img'), logo = card.querySelector('.card__logo');
    const media = document.createElement('span'); media.className = 'ptile__media';
    // Vignette légère (img/projets/mini/) : l'image complète n'est chargée qu'à l'ouverture de la fiche
    const mini = (src) => src.replace(/^img\/projets\/([^/]+)\.\w+$/, 'img/projets/mini/$1.webp');
    if (img) { const i = document.createElement('img'); i.src = mini(img.getAttribute('src')); i.alt = ''; i.loading = 'lazy'; i.decoding = 'async'; media.append(i); }
    else if (logo) { const i = document.createElement('img'); i.src = logo.getAttribute('src'); i.alt = ''; i.className = 'ptile__logo' + (logo.matches('.card__logo--dark') ? ' card__logo--dark' : ''); media.append(i); media.classList.add('ptile__media--logo'); }
    else { media.classList.add('ptile__media--code'); media.textContent = '</>'; }
    t.append(media);
    const badge = card.querySelector('.badge');
    if (badge) { const b = badge.cloneNode(true); b.classList.add('ptile__badge'); t.append(b); }
    const eyebrow = document.createElement('span'); eyebrow.className = 'ptile__cat';
    eyebrow.textContent = catsOf(card).map((k) => CAT_LABEL[k] || k).join(' · ');
    const h = document.createElement('strong'); h.className = 'ptile__title'; h.textContent = card.querySelector('h2').textContent.trim();
    const meta = document.createElement('span'); meta.className = 'ptile__meta'; meta.textContent = card.querySelector('.meta').textContent;
    const sum = document.createElement('span'); sum.className = 'ptile__sum'; sum.textContent = (card.querySelector('.meta ~ p') || {}).textContent || '';
    const tags = document.createElement('span'); tags.className = 'ptile__tags';
    [...card.querySelectorAll('.tags li')].slice(0, 4).forEach((li) => { const s = document.createElement('i'); s.textContent = li.textContent; tags.append(s); });
    const more = document.createElement('span'); more.className = 'ptile__more'; more.textContent = 'Voir le projet →';
    t.append(eyebrow, h, meta, sum, tags, more);
    t.addEventListener('click', () => openProject(card));
    return t;
  }
  function projectGrid(cat) {
    const grid = document.createElement('div'); grid.className = 'ptiles';
    cards.filter((c) => inCat(c, cat)).forEach((c) => grid.append(projectTile(c)));
    return grid;
  }

  // ---------- Bouton en haut à droite : passer de la 3D à la vue classique et inversement ----------
  const sw = $('#mode-switch');
  function updateSwitch(key) {
    if (!sw) return;
    const k = key ? '#' + key : '';
    const to3d = BOOT.mode === 'classic';
    sw.href = (to3d ? '?vue=3d' : '?vue=classique') + k;
    sw.innerHTML = svg(to3d ? ICONS.cube : ICONS.list) + '<span>' + (to3d ? 'Vue 3D' : 'Vue classique') + '</span>';
    sw.setAttribute('aria-label', to3d ? 'Passer à la chambre en 3D' : 'Passer à la vue classique');
  }
  if (sw && BOOT.mode === 'classic' && !BOOT.gl) sw.remove(); else updateSwitch(null);

  // ---------- Vue classique (choisie, ou imposée par l'appareil) ----------
  let room = null;
  if (BOOT.mode === '3d' && window.THREE && window.Room) {
    try {
      room = window.Room.create($('#scene'), {
        onPick: (k) => activate(k), onHover: hoverPin, onBook: onBook, onLevel: onLevel,
        onTransit: (on) => html.classList.toggle('in-transit', on),
        onLost: () => { location.replace('?vue=classique' + location.hash); },
      });
    } catch (e) { room = null; }
  }
  if (!room) { classicMode(); return; }

  function classicMode() {
    html.classList.remove('mode-3d'); html.classList.add('classic');
    BOOT.mode = 'classic'; updateSwitch(null);
    ['#scene', '#sky', '#precip', '#pins', '#bubble', '#hint', '#thought', '#modebar', '#secnav', '#sectitle', '#dock', '#browser', '#nav-toggle', '#drawer', '#drawer-backdrop', '#title']
      .forEach((s) => { const el = $(s); if (el) el.remove(); });
    const note = $('#classic-note');
    const NOTES = {
      webgl: 'La 3D n\'est pas disponible sur cet appareil : voici la version classique du portfolio.',
      reseau: 'Connexion lente détectée : la version légère du portfolio s\'affiche. La chambre en 3D reste accessible en haut à droite.',
      appareil: 'Version légère affichée pour cet appareil. La chambre en 3D reste accessible en haut à droite.',
    };
    note.hidden = !NOTES[BOOT.reason];
    if (NOTES[BOOT.reason]) note.textContent = NOTES[BOOT.reason];
    win.hidden = false;
    win.querySelector('.window__bar').remove();
    KEYS.forEach((k) => { if (panels[k]) { panels[k].hidden = false; panels[k].removeAttribute('role'); } });

    // Projets : catégories + cadres ; la fiche complète s'ouvre au premier plan
    const proj = panels.projets;
    $('#projects').hidden = true;
    let grid = projectGrid('tous');
    const filters = buildFilters('tous', (cat) => { const g = projectGrid(cat); grid.replaceWith(g); grid = g; });
    proj.querySelector('.lead').after(filters, grid);

    // Icônes du menu, façon réglages iOS
    document.querySelectorAll('.classic-nav a').forEach((a) => {
      const ico = document.createElement('span'); ico.className = 'ico ico--' + a.dataset.k; ico.innerHTML = svg(ICONS[a.dataset.k]);
      a.prepend(ico);
    });

    // Menu burger (petits écrans) : s'ouvre et se ferme, se referme après un choix
    const burger = $('#classic-burger'), side = $('.classic-side');
    const setMenu = (open) => {
      side.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    burger.addEventListener('click', () => setMenu(!side.classList.contains('is-open')));
    $('#classic-menu').addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && side.classList.contains('is-open') && !dlg.open) { setMenu(false); burger.focus(); } });
    document.addEventListener('click', (e) => { if (side.classList.contains('is-open') && !side.contains(e.target)) setMenu(false); });

    // Le lien du menu correspondant à la section lue est mis en évidence (et le bouton 3D y mène)
    const links = [...document.querySelectorAll('.classic-nav a')];
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
        updateSwitch(e.target.id.replace(/^p-/, ''));
      }), { rootMargin: '-35% 0px -60% 0px' });
      KEYS.forEach((k) => { if (panels[k]) io.observe(panels[k]); });
    }
    // Lien partagé vers une rubrique (#projets) : on y descend directement
    const go = (k) => { const p = panels[k]; if (p) p.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }); };
    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) { e.preventDefault(); go(o.dataset.open); }
    });
    const h = location.hash.slice(1);
    if (KEYS.includes(h)) requestAnimationFrame(() => go(h));
    $('#loader').remove();
  }

  // ---------- Chambre 3D ----------
  const tabsEl = $('#tabs');
  const pinsEl = $('#pins');
  const bubble = $('#bubble');
  const bubbleText = $('#bubble-text');
  const hint = $('#hint');
  const modebar = $('#modebar');
  const dock = $('#dock');
  const browser = $('#browser');
  const secnav = $('#secnav');
  const sectitle = $('#sectitle');
  const thought = $('#thought');
  const cloud = $('#thought-cloud');
  const navToggle = $('#nav-toggle');
  const drawer = $('#drawer');
  { const cs = $('.classic-side'); if (cs) cs.remove(); }

  let current = null;       // rubrique affichée (null = vue d'ensemble)
  let openKeys = [];        // onglets de la fenêtre
  let active = null;

  // ---------- Ciel en temps réel (météo de Belfort) ----------
  // Le fond (dégradé, nuages lents) est redessiné 8 fois par seconde ; la pluie, à chaque image, sur sa propre couche
  (function sky() {
    const c = $('#sky'), ctx = c.getContext('2d', { alpha: false });
    const pc = $('#precip'), pctx = pc.getContext('2d');
    let pw = 1, ph = 1;
    function fit() {
      const sc = isMobile() ? 0.35 : 0.5;
      c.width = Math.ceil(innerWidth * sc); c.height = Math.ceil(innerHeight * sc);
      pw = pc.width = innerWidth; ph = pc.height = innerHeight;
      lastBg = -1e9;
    }
    let lastBg = -1e9, wet = false;
    fit(); addEventListener('resize', fit);
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden || current === 'parcours') return;   // caché par le monde au-dessus des nuages
      const t = now / 1000;
      if (now - lastBg > 125) { lastBg = now; window.Weather.drawSky(ctx, c.width, c.height, t, { noPrecip: true }); }
      if (wet || window.Weather.kind().rain || window.Weather.kind().snow) {
        pctx.clearRect(0, 0, pw, ph);
        wet = window.Weather.drawPrecip(pctx, pw, ph, t, { density: isMobile() ? 0.6 : 1 });
      }
    })(0);
  })();

  // ---------- Fenêtre à onglets (Compétences, CV, Contact) ----------
  function renderTabs() {
    tabsEl.textContent = '';
    openKeys.forEach((k) => {
      const p = panels[k];
      const wrap = document.createElement('div');
      wrap.className = 'tab' + (k === active ? ' is-active' : '');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tab__btn'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', k === active); b.tabIndex = k === active ? 0 : -1;
      b.id = 'tab-' + k; b.setAttribute('aria-controls', 'p-' + k); b.dataset.key = k;
      b.textContent = p.dataset.title;
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'tab__x'; x.dataset.close = k;
      x.setAttribute('aria-label', 'Fermer l\'onglet ' + p.dataset.title); x.textContent = '✕';
      wrap.append(b, x);
      tabsEl.append(wrap);
    });
    const cur = tabsEl.querySelector('.is-active');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function openWindow(k) {
    if (!openKeys.includes(k)) openKeys.push(k);
    active = k;
    win.hidden = false;
    win.classList.toggle('window--wide', k === 'cv');
    KEYS.forEach((x) => { if (panels[x]) { panels[x].hidden = x !== k; panels[x].setAttribute('aria-labelledby', 'tab-' + x); } });
    win.querySelector('.window__body').scrollTop = 0;
    renderTabs();
    panels[k].focus({ preventScroll: true });
  }
  function hideWindow() { win.hidden = true; openKeys = []; active = null; renderTabs(); }

  // ---------- Bulle de pensée (À propos) ----------
  const tBody = $('#thought-body');
  tBody.append(panels.apropos.querySelector('.markdown-body').cloneNode(true));
  tBody.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  function showThought() {
    thought.hidden = false;
    drawCloud();
    thought.classList.remove('is-in'); void thought.offsetWidth; thought.classList.add('is-in');
    tBody.scrollTop = 0;
    setTimeout(() => { if (!thought.hidden) cloud.focus({ preventScroll: true }); }, 400);
  }
  function hideThought() { thought.hidden = true; thought.classList.remove('is-in'); }
  // Contour du nuage : une suite régulière d'arrondis autour du cadre, recalculée à chaque changement de taille
  const shape = $('#thought-shape'), M = 20;
  let shapeKey = '';
  function drawCloud() {
    const w = cloud.offsetWidth + 2 * M, h = cloud.offsetHeight + 2 * M;
    if (w < 60 || h < 60) return;
    const key = w + 'x' + h;
    if (key === shapeKey) return;
    shapeKey = key;
    shape.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    shape.setAttribute('width', w); shape.setAttribute('height', h);
    const x0 = M, y0 = M, x1 = w - M, y1 = h - M, r = Math.min(70, (x1 - x0) / 3, (y1 - y0) / 3);
    const sides = [x1 - x0 - 2 * r, Math.PI * r / 2, y1 - y0 - 2 * r, Math.PI * r / 2, x1 - x0 - 2 * r, Math.PI * r / 2, y1 - y0 - 2 * r, Math.PI * r / 2];
    const total = sides.reduce((a, b) => a + b, 0);
    const n = Math.max(10, Math.round(total / (isMobile() ? 52 : 66)));
    // point du cadre arrondi à la distance d (sens des aiguilles d'une montre, depuis le haut à gauche)
    function at(d) {
      d = ((d % total) + total) % total;
      const pts = [
        (t) => [x0 + r + t, y0], (t) => [x1 - r + Math.sin(t / r) * r, y0 + r - Math.cos(t / r) * r],
        (t) => [x1, y0 + r + t], (t) => [x1 - r + Math.cos(t / r) * r, y1 - r + Math.sin(t / r) * r],
        (t) => [x1 - r - t, y1], (t) => [x0 + r - Math.sin(t / r) * r, y1 - r + Math.cos(t / r) * r],
        (t) => [x0, y1 - r - t], (t) => [x0 + r - Math.cos(t / r) * r, y0 + r - Math.sin(t / r) * r],
      ];
      for (let i = 0; i < 8; i++) { if (d <= sides[i]) return pts[i](d); d -= sides[i]; }
      return pts[0](0);
    }
    const step = total / n;
    let p = at(0), dPath = 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    for (let i = 1; i <= n; i++) {
      const q = at(i * step), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const rad = len * (i % 2 ? 0.58 : 0.66);
      dPath += 'A' + rad.toFixed(1) + ' ' + rad.toFixed(1) + ' 0 0 1 ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      p = q;
    }
    shape.querySelector('path').setAttribute('d', dPath + 'Z');
  }
  if (window.ResizeObserver) new ResizeObserver(() => { if (!thought.hidden) drawCloud(); }).observe(cloud);
  $('#thought-close').addEventListener('click', () => closeAll());

  // ---------- Zone libre de l'écran : titres, fenêtre, bulle, barre du bas ----------
  function computeInsets() {
    const mob = isMobile();
    const ins = { top: 0, right: 0, bottom: 0, left: 0 };
    if (!mob) ins.left = navToggle.offsetWidth + 8;
    if (!win.hidden) {
      if (mob) ins.bottom = innerHeight - win.offsetTop + 6;
      else ins.right = innerWidth - win.offsetLeft + 6;
    }
    if (!thought.hidden) {
      if (mob) ins.bottom = innerHeight - cloud.offsetTop + 24;
      else ins.right = innerWidth - cloud.offsetLeft + 30;
    }
    const cx = mob ? innerWidth / 2 : (ins.left + innerWidth - ins.right) / 2;
    html.style.setProperty('--title-x', cx + 'px');
    if (!secnav.hidden) ins.top = secnav.offsetTop + secnav.offsetHeight + 10;
    else ins.top = 70;
    if (!dock.hidden) ins.bottom = Math.max(ins.bottom, innerHeight - dock.offsetTop + 8);
    return ins;
  }
  function applyInsets() { room.setInsets(current ? computeInsets() : {}); }

  // ---------- Passer à la section précédente / suivante ----------
  function updateSecNav() {
    const i = SECTIONS.indexOf(current);
    secnav.hidden = i < 0;
    sectitle.hidden = !current;
    if (!current) return;
    $('#sectitle-name').textContent = NAMES[current];
    $('#sectitle-sub').textContent = TAGLINES[current];
    sectitle.style.animation = 'none'; void sectitle.offsetWidth; sectitle.style.animation = '';
    if (i < 0) return;
    const n = SECTIONS.length;
    $('#sec-prev').textContent = '◀ ' + NAMES[SECTIONS[(i + n - 1) % n]];
    $('#sec-next').textContent = NAMES[SECTIONS[(i + 1) % n]] + ' ▶';
    $('#sec-label').textContent = (i + 1) + '/' + n;
  }
  secnav.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sec]');
    if (!b) return;
    const i = SECTIONS.indexOf(current), n = SECTIONS.length;
    if (i >= 0) activate(SECTIONS[(i + (b.dataset.sec === 'next' ? 1 : n - 1)) % n]);
  });

  // ---------- Menu latéral ----------
  const dList = $('#drawer-list');
  ['home'].concat(SECTIONS, ['reveil']).forEach((k) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'drawer__item'; b.dataset.go = k;
    b.innerHTML = '<span class="drawer__ico">' + svg(ICONS[k]) + '</span><span class="drawer__txt"><strong></strong><small></small></span>';
    b.querySelector('strong').textContent = k === 'home' ? 'Vue de la chambre' : NAMES[k];
    b.querySelector('small').textContent = k === 'home' ? 'Revenir à la vue d\'ensemble' : TAGLINES[k];
    b.title = k === 'home' ? '' : OBJECTS[k];
    li.append(b); dList.append(li);
  });
  function markDrawer() {
    dList.querySelectorAll('.drawer__item').forEach((b) => {
      const on = b.dataset.go === (current || 'home');
      b.classList.toggle('is-current', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  function openDrawer() {
    markDrawer();
    $('#to-classic').href = '?vue=classique' + (current ? '#' + current : '');
    html.classList.add('drawer-open');
    drawer.inert = false;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Fermer le menu des sections');
    setTimeout(() => { const c = dList.querySelector('.is-current') || dList.querySelector('button'); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function closeDrawer(focusBack) {
    if (!html.classList.contains('drawer-open')) return;
    html.classList.remove('drawer-open');
    drawer.inert = true;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Ouvrir le menu des sections');
    if (focusBack) navToggle.focus({ preventScroll: true });
  }
  navToggle.addEventListener('click', () => (html.classList.contains('drawer-open') ? closeDrawer() : openDrawer()));
  $('#drawer-close').addEventListener('click', () => closeDrawer(true));
  $('#drawer-backdrop').addEventListener('click', () => closeDrawer());
  dList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    closeDrawer();
    if (b.dataset.go === 'home') closeAll(); else activate(b.dataset.go);
  });

  // ---------- Commandes en bas de l'écran ----------
  function setHash(k) {
    try { history.replaceState(null, '', k ? '#' + k : location.pathname + location.search); } catch (e) { /* ignoré */ }
  }
  function dockHtml(h) { dock.hidden = !h; dock.innerHTML = h || ''; }

  let lvl = 0, lvlTotal = 5, lvlItem = null;
  function levelDock() {
    dockHtml('<button type="button" class="btn btn--ghost" data-l="prev"' + (lvl === 0 ? ' disabled' : '') + '>◀ Précédent</button>'
      + '<span class="lvl">' + (lvl ? lvlItem.lvl + ' · ' + lvlItem.title : 'Mon parcours · ' + lvlTotal + ' niveaux') + '</span>'
      + '<button type="button" class="btn" data-l="next"' + (lvl === lvlTotal ? ' disabled' : '') + '>' + (lvl === 0 ? 'Commencer ▶' : 'Suivant ▶') + '</button>'
      + (lvl ? '<button type="button" class="btn btn--ghost" data-l="ov">Vue d\'ensemble</button>' : ''));
  }
  const VEILLE_TIP = '<span>Clique sur un livre pour l\'ouvrir. <span class="muted">Fais glisser pour regarder autour.</span></span>';
  function onLevel(n, total, item) { lvl = n; lvlTotal = total; lvlItem = item; if (current === 'parcours') levelDock(); }
  function onBook(id, name) {
    if (current !== 'veille') return;
    dockHtml(id ? '<span>Tu lis : <strong>' + name + '</strong>. <span class="muted">Clique pour le reposer.</span></span>' : VEILLE_TIP);
  }
  dock.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !b.dataset.l) return;
    if (b.dataset.l === 'prev') room.setLevel(lvl - 1);
    if (b.dataset.l === 'next') room.setLevel(lvl + 1);
    if (b.dataset.l === 'ov') room.setLevel(0);
  });

  // Clavier : flèches pour changer de niveau dans le parcours
  document.addEventListener('keydown', (e) => {
    if (current !== 'parcours' || e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') room.setLevel(lvl + 1);
    if (e.key === 'ArrowLeft') room.setLevel(lvl - 1);
  });

  // ---------- Compétences : les mêmes données alimentent la vitrine 3D de l'armoire ----------
  // (construite à la première ouverture de l'armoire : les logos ne sont téléchargés que si on la regarde)
  let vitrine = false;
  function buildVitrine() {
  if (vitrine) return; vitrine = true;
  room.setSkills([...document.querySelectorAll('#p-competences .skillset')].map((sec) => ({
    name: sec.querySelector('.skillset__title').firstChild.textContent.trim(),
    color: sec.style.getPropertyValue('--c').trim(),
    items: [...sec.querySelectorAll('.skill, .pills li')].map((el) => {
      if (!el.matches('.skill')) return { name: el.textContent.trim() };
      const img = el.querySelector('.skill__logo img'), mono = el.querySelector('.skill__logo--txt');
      return { name: el.querySelector('strong').textContent.trim(), src: img ? img.src : null, mono: mono ? mono.textContent.trim() : null };
    }),
  })));
  }

  // ---------- Projets : navigateur posé sur l'écran du PC ----------
  // Page « Mes projets » avec les catégories ; un projet s'ouvre en fiche au premier plan
  let bCat = 'tous';
  function renderBrowser() {
    const tabs = $('#btabs'), page = $('#bpage');
    tabs.textContent = '';
    const tab = document.createElement('button');
    tab.type = 'button'; tab.setAttribute('role', 'tab'); tab.className = 'btab is-active'; tab.setAttribute('aria-selected', 'true');
    tab.textContent = 'Mes projets';
    tabs.append(tab);
    const setUrl = () => { $('#burl').textContent = 'bdidier1.github.io/Portfolio_BUT3/projets' + (bCat === 'tous' ? '' : '?categorie=' + bCat); };
    setUrl();
    page.textContent = '';
    const h = document.createElement('h1'); h.textContent = 'Mes projets';
    const p = document.createElement('p'); p.className = 'lead'; p.textContent = 'Mes stages, mon application publiée et mes projets les plus aboutis. Choisis une catégorie, puis clique sur un projet pour l\'ouvrir.';
    let grid = projectGrid(bCat);
    const filters = buildFilters(bCat, (cat) => { bCat = cat; setUrl(); const g = projectGrid(cat); grid.replaceWith(g); grid = g; });
    const gh = document.createElement('p'); gh.className = 'bgit';
    gh.innerHTML = 'Tous mes projets sont sur <a href="https://github.com/bdidier1" target="_blank" rel="noopener noreferrer">github.com/bdidier1</a>';
    page.append(h, p, filters, grid, gh);
    page.scrollTop = 0;
  }

  // Le navigateur suit exactement l'écran 3D ; sur petit écran il prend toute la place libre
  let bRect = '';
  function placeBrowser() {
    const r = room.screenRect();
    let st;
    if (!isMobile() && r.width >= 560 && r.height >= 320) {
      st = { left: r.left, top: r.top, width: r.width, height: r.height, font: Math.max(12, Math.min(16, r.width / 58)) };
      browser.classList.remove('browser--full');
    } else {
      const top = secnav.hidden ? 60 : secnav.offsetTop + secnav.offsetHeight + 10;
      st = { left: 8, top, width: innerWidth - 16, height: innerHeight - top - 8, font: 13 };
      browser.classList.add('browser--full');
    }
    const key = [st.left, st.top, st.width, st.height].map((v) => v.toFixed(1)).join();
    if (key === bRect) return;
    bRect = key;
    Object.assign(browser.style, { left: st.left + 'px', top: st.top + 'px', width: st.width + 'px', height: st.height + 'px', fontSize: st.font + 'px' });
  }
  function showBrowser() {
    if (current !== 'projets') return;
    renderBrowser();
    bRect = '';
    placeBrowser();
    browser.hidden = false;
  }

  // ---------- Ouvrir / fermer une rubrique ----------
  function activate(k) {
    if (!KEYS.includes(k) || k === current) return;
    closeDrawer();
    hideBubble();
    hint.classList.add('is-hidden');
    pinsEl.classList.add('is-hidden');
    room.setWaving(false);
    current = k;
    if (k === 'competences') buildVitrine();
    document.body.classList.add('in-mode');
    browser.hidden = true;
    hideThought();
    if (WINDOW_KEYS.includes(k)) { dockHtml(''); modebar.hidden = true; openWindow(k); }
    else {
      hideWindow();
      modebar.hidden = false;
      lvl = 0; lvlItem = null;
      if (k === 'parcours') levelDock();
      else if (k === 'veille') dockHtml(VEILLE_TIP);
      else dockHtml('');
      if (k === 'apropos') showThought();
    }
    updateSecNav();
    applyInsets();
    room.enter(k, () => { if (k === 'projets') showBrowser(); });
    setHash(k);
    updateSwitch(k);
  }

  function closeAll() {
    if (current === null) return;
    current = null;
    hideWindow(); hideThought();
    browser.hidden = true; dockHtml('');
    modebar.hidden = true; secnav.hidden = true; sectitle.hidden = true;
    document.body.classList.remove('in-mode');
    pinsEl.classList.remove('is-hidden');
    setHash(null);
    updateSwitch(null);
    applyInsets();
    room.exit(() => {
      if (current) return;
      hint.classList.remove('is-hidden');
      say('Explore ma chambre : chaque objet cache une rubrique.', 6500);
    });
  }

  function closeTab(k) {
    const i = openKeys.indexOf(k);
    if (i < 0) return;
    openKeys.splice(i, 1);
    if (!openKeys.length) { closeAll(); return; }
    if (k === active) { const keep = openKeys.slice(); activate(keep[Math.min(i, keep.length - 1)]); keep.forEach((x) => { if (!openKeys.includes(x)) openKeys.push(x); }); renderTabs(); } else renderTabs();
  }

  tabsEl.addEventListener('click', (e) => {
    const x = e.target.closest('[data-close]');
    if (x) { closeTab(x.dataset.close); return; }
    const b = e.target.closest('[role="tab"]');
    if (b && b.dataset.key !== active) { const keep = openKeys.slice(); activate(b.dataset.key); openKeys = keep; renderTabs(); }
  });
  tabsEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const keep = openKeys.slice(), i = keep.indexOf(active);
    const n = keep[(i + (e.key === 'ArrowRight' ? 1 : -1) + keep.length) % keep.length];
    activate(n); openKeys = keep; renderTabs();
    $('#tab-' + n).focus();
  });
  $('#close').addEventListener('click', closeAll);
  $('#mode-close').addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || dlg.open) return;
    if (html.classList.contains('drawer-open')) closeDrawer(true);
    else if (current) closeAll();
  });
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); activate(o.dataset.open); }
  });
  // Lien direct vers une rubrique (#projets), aussi après le chargement
  addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (KEYS.includes(h)) activate(h); else if (!h) closeAll();
  });

  let resizeTimer = null;
  addEventListener('resize', () => {
    if (!current) return;
    browser.hidden = true;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyInsets();
      room.refit(() => { if (current === 'projets') showBrowser(); });
    }, 180);
  });

  // ---------- Étiquettes sur les objets ----------
  const pinEls = {};
  room.pins.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pin'; b.textContent = p.label;
    b.addEventListener('click', () => activate(p.key));
    b.addEventListener('mouseenter', () => room.setHover(p.key));
    b.addEventListener('mouseleave', () => room.setHover(null));
    b.addEventListener('focus', () => room.setHover(p.key));
    b.addEventListener('blur', () => room.setHover(null));
    pinsEl.append(b);
    pinEls[p.key] = b;
  });
  function hoverPin(k) { Object.keys(pinEls).forEach((key) => pinEls[key].classList.toggle('is-hover', key === k)); }

  // ---------- Bulle de dialogue ----------
  let typer = null, hideTimer = null, bubbleOn = false;
  function say(text, autoHide) {
    if (current) return;
    clearInterval(typer); clearTimeout(hideTimer);
    bubble.hidden = false; bubbleOn = true;
    if (pinEls.apropos) pinEls.apropos.classList.add('is-hidden');
    room.setWaving(!autoHide);
    if (reduceMotion) bubbleText.textContent = text;
    else {
      let i = 0; bubbleText.textContent = '';
      typer = setInterval(() => { bubbleText.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typer); }, 28);
    }
    if (autoHide) hideTimer = setTimeout(hideBubble, autoHide);
  }
  function hideBubble() {
    clearInterval(typer); clearTimeout(hideTimer);
    bubble.hidden = true; bubbleOn = false;
    if (pinEls.apropos) pinEls.apropos.classList.remove('is-hidden');
  }
  bubble.addEventListener('click', () => activate('apropos'));
  bubble.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate('apropos'); } });
  bubble.setAttribute('aria-label', 'Baptiste dit bonjour : cliquer pour ouvrir À propos');

  // ---------- Suivi des éléments posés sur la scène pendant le rendu ----------
  room.onFrame = () => {
    if (!current) {
      for (const key in pinEls) {
        const p = room.pinPosition(key);
        const el = pinEls[key];
        el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-100%)';
        el.style.visibility = p.ok ? 'visible' : 'hidden';
      }
    }
    if (bubbleOn) {
      const h = room.project(room.headPosition());
      // La bulle grandit pendant que le texte s'écrit : on la garde dans l'écran avec sa largeur maximale
      const bw = isMobile() ? 190 : 240;
      const bx = Math.max(8, Math.min(innerWidth - bw - 12, h.x + 56));
      bubble.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + (h.y + 70).toFixed(1) + 'px)';
    }
    if (!browser.hidden && current === 'projets') placeBrowser();
  };

  // ---------- Démarrage ----------
  const loader = $('#loader');
  loader.classList.add('is-done'); setTimeout(() => loader.remove(), 600);
  const fromHash = location.hash.slice(1);
  if (KEYS.includes(fromHash)) activate(fromHash);
  else room.intro(() => say('Salut, moi c\'est Baptiste ! Clique sur moi pour faire connaissance.'));
})();
