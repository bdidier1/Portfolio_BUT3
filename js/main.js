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
  // Les fiches complètes sont dans un <template> : hors du rendu tant qu'on ne les ouvre pas
  const tpl = $('#project-cards');
  const cards = tpl ? [...tpl.content.querySelectorAll('.card')] : [...document.querySelectorAll('#p-projets .card')];
  const isMain = (card) => card.dataset.rank !== 'autre';
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
    markZoomable(c);
    html.classList.add('modal-open');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlgBody.scrollTop = 0;
    $('#pmodal-close').focus({ preventScroll: true });
  }
  function closeProject() { if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); onClosed(); } }
  function onClosed() {
    html.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  // Une rubrique entière au premier plan (notes de veille dans la chambre 3D)
  function openPanel(k) {
    const p = panels[k]; if (!p) return;
    lastFocus = document.activeElement;
    dlgBody.textContent = '';
    const c = document.createElement('div'); c.className = 'card card--panel';
    [...p.children].forEach((ch) => c.append(ch.cloneNode(true)));
    c.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    const h = c.querySelector('h1'); if (h) { const h2 = document.createElement('h2'); h2.textContent = h.textContent; h.replaceWith(h2); }
    dlgBody.append(c);
    html.classList.add('modal-open');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlgBody.scrollTop = 0;
    $('#pmodal-close').focus({ preventScroll: true });
  }
  dlg.addEventListener('close', onClosed);
  $('#pmodal-close').addEventListener('click', closeProject);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeProject(); });   // clic à côté de la fiche

  // ---------- Images des projets : un clic les affiche en grand, avec zoom ----------
  // Zoom : molette, boutons + et −, double clic / double toucher, pincement ; déplacement : glisser ou flèches.
  const lb = document.createElement('dialog');
  lb.className = 'lightbox'; lb.setAttribute('aria-label', 'Image du projet en grand');
  const I = { plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', close: 'M6 6l12 12M18 6L6 18', prev: 'M15 5l-7 7 7 7', next: 'M9 5l7 7-7 7' };
  lb.innerHTML = '<div class="lightbox__bar"><p class="lightbox__count" aria-live="polite"></p><div class="lightbox__tools">'
    + '<button type="button" data-act="out" aria-label="Dézoomer">' + svg(I.minus) + '</button>'
    + '<button type="button" data-act="reset" class="lightbox__pct" aria-label="Revenir à la taille d\'origine">100%</button>'
    + '<button type="button" data-act="in" aria-label="Zoomer">' + svg(I.plus) + '</button>'
    + '<button type="button" data-act="close" aria-label="Fermer l\'image">' + svg(I.close) + '</button></div></div>'
    + '<div class="lightbox__stage"><img class="lightbox__img" alt="" draggable="false"></div>'
    + '<button type="button" class="lightbox__nav lightbox__nav--prev" data-act="prev" aria-label="Image précédente">' + svg(I.prev) + '</button>'
    + '<button type="button" class="lightbox__nav lightbox__nav--next" data-act="next" aria-label="Image suivante">' + svg(I.next) + '</button>'
    + '<p class="lightbox__cap"></p><p class="lightbox__tip">Molette ou double clic pour zoomer · glisser pour déplacer · Échap pour fermer</p>';
  document.body.append(lb);
  const lbStage = lb.querySelector('.lightbox__stage'), lbImg = lb.querySelector('.lightbox__img');
  const lbPct = lb.querySelector('.lightbox__pct'), lbOut = lb.querySelector('[data-act="out"]'), lbIn = lb.querySelector('[data-act="in"]');
  const lbPrev = lb.querySelector('[data-act="prev"]'), lbNext = lb.querySelector('[data-act="next"]');
  const LB_MAX = 6;
  let lbList = [], lbIdx = 0, lbScale = 1, lbX = 0, lbY = 0, lbOpener = null;

  function lbApply() {
    // L'image ne peut pas sortir de la scène : on borne le déplacement selon la taille zoomée
    const mx = Math.max(0, (lbImg.offsetWidth * lbScale - lbStage.clientWidth) / 2);
    const my = Math.max(0, (lbImg.offsetHeight * lbScale - lbStage.clientHeight) / 2);
    lbX = Math.max(-mx, Math.min(mx, lbX)); lbY = Math.max(-my, Math.min(my, lbY));
    lbImg.style.transform = 'translate(' + lbX.toFixed(1) + 'px,' + lbY.toFixed(1) + 'px) scale(' + lbScale.toFixed(3) + ')';
    lbPct.textContent = Math.round(lbScale * 100) + '%';
    lbStage.classList.toggle('is-zoomed', lbScale > 1.001);
    lbOut.disabled = lbScale <= 1.001; lbIn.disabled = lbScale >= LB_MAX - 0.001;
  }
  // (cx, cy) : point à garder sous le curseur, mesuré depuis le centre de la scène
  function lbZoom(next, cx, cy) {
    next = Math.max(1, Math.min(LB_MAX, next));
    const k = next / lbScale;
    lbX = cx - (cx - lbX) * k; lbY = cy - (cy - lbY) * k; lbScale = next;
    if (next === 1) { lbX = 0; lbY = 0; }
    lbApply();
  }
  const lbCenter = (x, y) => { const r = lbStage.getBoundingClientRect(); return [x - (r.left + r.width / 2), y - (r.top + r.height / 2)]; };
  function lbShow(i) {
    lbIdx = i; lbScale = 1; lbX = 0; lbY = 0;
    const im = lbList[i], fig = im.closest('figure'), cap = fig && fig.querySelector('figcaption');
    lbImg.removeAttribute('src');
    lbImg.src = im.currentSrc || im.src;
    lbImg.alt = im.alt || '';
    lb.querySelector('.lightbox__cap').textContent = (cap && cap.textContent.trim()) || im.alt || '';
    lb.querySelector('.lightbox__count').textContent = lbList.length > 1 ? (i + 1) + ' / ' + lbList.length : '';
    lbPrev.hidden = lbNext.hidden = lbList.length < 2;
    lbPrev.disabled = i === 0; lbNext.disabled = i === lbList.length - 1;
    lbApply();
  }
  lbImg.addEventListener('load', lbApply);
  addEventListener('resize', () => { if (lb.open) lbApply(); });
  function openLightbox(list, i, from) {
    lbList = list; lbOpener = from;
    lbShow(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    lb.querySelector('[data-act="close"]').focus({ preventScroll: true });
  }
  // Fermeture : le focus revient tout de suite sur l'image cliquée (l'événement « close » sert de filet pour la touche Échap)
  function lbRestore() {
    lbImg.removeAttribute('src');
    if (lbOpener && lbOpener.isConnected && lbOpener.focus) lbOpener.focus({ preventScroll: true });
    lbOpener = null;
  }
  function lbClose() { if (lb.open) { lb.close(); lbRestore(); } }
  lb.addEventListener('close', lbRestore);
  lb.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'close') lbClose();
    else if (a === 'in') lbZoom(lbScale * 1.5, 0, 0);
    else if (a === 'out') lbZoom(lbScale / 1.5, 0, 0);
    else if (a === 'reset') lbZoom(1, 0, 0);
    else if (a === 'prev' && lbIdx > 0) lbShow(lbIdx - 1);
    else if (a === 'next' && lbIdx < lbList.length - 1) lbShow(lbIdx + 1);
  });
  lbStage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const c = lbCenter(e.clientX, e.clientY);
    lbZoom(lbScale * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), c[0], c[1]);
  }, { passive: false });
  // Souris et doigts : un pointeur déplace l'image zoomée, deux pointeurs la pincent
  const lbPtrs = new Map(); let lbPinch = null, lbDrag = null, lbMoved = false, lbTapAt = 0;
  lbStage.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    try { lbStage.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà terminé : on continue sans capture */ }
    lbPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); lbMoved = false;
    if (lbPtrs.size === 2) { const p = [...lbPtrs.values()]; lbPinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, s: lbScale }; lbDrag = null; }
    else if (lbPtrs.size === 1) lbDrag = { x: e.clientX, y: e.clientY, tx: lbX, ty: lbY };
  });
  lbStage.addEventListener('pointermove', (e) => {
    const p = lbPtrs.get(e.pointerId); if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (lbPinch && lbPtrs.size === 2) {
      const q = [...lbPtrs.values()], c = lbCenter((q[0].x + q[1].x) / 2, (q[0].y + q[1].y) / 2);
      lbZoom(lbPinch.s * Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y) / lbPinch.d, c[0], c[1]); lbMoved = true;
    } else if (lbDrag) {
      const dx = e.clientX - lbDrag.x, dy = e.clientY - lbDrag.y;
      if (Math.hypot(dx, dy) > 5) lbMoved = true;
      if (lbScale > 1.001) { lbX = lbDrag.tx + dx; lbY = lbDrag.ty + dy; lbApply(); }
    }
  });
  function lbEnd(e, tap) {
    lbPtrs.delete(e.pointerId);
    if (lbPtrs.size < 2) lbPinch = null;
    if (lbPtrs.size === 1) { const p = [...lbPtrs.values()][0]; lbDrag = { x: p.x, y: p.y, tx: lbX, ty: lbY }; } else lbDrag = null;
    if (!tap) return;
    // Double clic / double toucher : zoom avant sur le point visé, ou retour à la taille d'origine
    const now = performance.now();
    if (now - lbTapAt < 320) { const c = lbCenter(e.clientX, e.clientY); lbZoom(lbScale > 1.05 ? 1 : 2.5, c[0], c[1]); lbTapAt = 0; }
    else {
      lbTapAt = now;
      const r = lbImg.getBoundingClientRect();     // la capture du pointeur fait de la scène la cible : on teste la position
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) lbClose();   // un clic dans le noir ferme l'image
    }
  }
  lbStage.addEventListener('pointerup', (e) => lbEnd(e, !lbMoved && lbPtrs.size === 1));
  lbStage.addEventListener('pointercancel', (e) => lbEnd(e, false));
  lb.addEventListener('keydown', (e) => {
    const step = 70;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); lbZoom(lbScale * 1.4, 0, 0); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); lbZoom(lbScale / 1.4, 0, 0); }
    else if (e.key === '0') { e.preventDefault(); lbZoom(1, 0, 0); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (e.target.closest && e.target.closest('button') && lbScale <= 1.001 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;
      e.preventDefault();
      if (lbScale > 1.001) {
        if (e.key === 'ArrowLeft') lbX += step; else if (e.key === 'ArrowRight') lbX -= step; else if (e.key === 'ArrowUp') lbY += step; else lbY -= step;
        lbApply();
      } else if (e.key === 'ArrowLeft' && lbIdx > 0) lbShow(lbIdx - 1);
      else if (e.key === 'ArrowRight' && lbIdx < lbList.length - 1) lbShow(lbIdx + 1);
    }
  });

  // Les images des fiches deviennent cliquables (souris, toucher, clavier)
  function markZoomable(root) {
    root.querySelectorAll('figure img').forEach((im) => {
      im.classList.add('zoomable'); im.tabIndex = 0; im.setAttribute('role', 'button');
      im.setAttribute('aria-label', 'Agrandir l\'image' + (im.alt ? ' : ' + im.alt : ''));
      im.closest('figure').classList.add('is-zoomable');
    });
  }
  const zoomables = () => [...dlgBody.querySelectorAll('figure img.zoomable')];
  dlgBody.addEventListener('click', (e) => {
    const im = e.target.closest('img.zoomable'); if (!im) return;
    const all = zoomables(); openLightbox(all, all.indexOf(im), im);
  });
  dlgBody.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('zoomable')) { e.preventDefault(); e.target.click(); }
  });

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
    if (img) {
      // Deux tailles de vignette : 320 px (écran standard) et 560 px (écran haute densité)
      const i = document.createElement('img'), src = mini(img.getAttribute('src'));
      i.src = src; i.srcset = src.replace(/\.webp$/, '-s.webp') + ' 320w, ' + src + ' 560w';
      i.sizes = '(max-width: 600px) calc(100vw - 56px), 300px';
      i.width = 560; i.height = 350; i.alt = ''; i.loading = 'lazy'; i.decoding = 'async'; media.append(i);
    }
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
  // Ligne compacte pour les autres projets : titre, contexte et ouverture de la fiche
  function projectRow(card) {
    const li = document.createElement('li');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'prow';
    const h = document.createElement('strong'); h.textContent = card.querySelector('h2').textContent.trim();
    const m = document.createElement('span'); m.className = 'prow__meta'; m.textContent = card.querySelector('.meta').textContent;
    const go = document.createElement('span'); go.className = 'prow__go'; go.setAttribute('aria-hidden', 'true'); go.textContent = '→';
    b.append(h, m, go);
    b.addEventListener('click', () => openProject(card));
    li.append(b);
    return li;
  }
  // Les projets principaux en cadres, puis les autres en liste plus discrète
  function projectGrid(cat) {
    const wrap = document.createElement('div'); wrap.className = 'pgroup';
    const list = cards.filter((c) => inCat(c, cat));
    const grid = document.createElement('div'); grid.className = 'ptiles';
    list.filter(isMain).forEach((c) => grid.append(projectTile(c)));
    if (grid.childElementCount) wrap.append(grid);
    const others = list.filter((c) => !isMain(c));
    if (others.length) {
      const h = document.createElement('h2'); h.className = 'pothers__title'; h.textContent = 'Autres projets';
      const ul = document.createElement('ul'); ul.className = 'pothers';
      others.forEach((c) => ul.append(projectRow(c)));
      wrap.append(h, ul);
    }
    return wrap;
  }

  // ---------- Bouton en haut à droite : passer de la 3D à la vue classique et inversement ----------
  const sw = $('#mode-switch');
  function updateSwitch(key) {
    if (!sw) return;
    const k = key ? '#' + key : '';
    const to3d = BOOT.mode === 'classic';
    sw.href = (to3d ? '?vue=3d' : '?vue=classique') + k;
    sw.innerHTML = svg(to3d ? ICONS.cube : ICONS.list) + '<span>' + (to3d ? 'Vue 3D' : 'Vue classique') + '</span>';
    sw.dataset.ready = '1';
    sw.setAttribute('aria-label', to3d ? 'Vue 3D : passer à la chambre en 3D' : 'Vue classique : passer à la page sans 3D');
  }
  if (sw && BOOT.mode === 'classic' && !BOOT.gl) sw.remove(); else updateSwitch(null);
  // Le lien change de vue en rechargeant la page : un simple changement de #rubrique ne le ferait pas (même ?vue=3d), d'où le rechargement explicite
  if (sw) sw.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    try { if (BOOT.mode === 'classic') sessionStorage.setItem('portfolio-force3d', '1'); else sessionStorage.removeItem('portfolio-force3d'); } catch (err) { /* ignoré */ }
    const href = sw.getAttribute('href');
    try { history.replaceState(null, '', location.pathname + href); } catch (err) { /* ignoré */ }
    location.reload();
  });

  // ---------- Barre latérale : on peut l'ouvrir et la fermer quand on veut (grand écran) ----------
  const sideBtn = $('#side-toggle');
  function paintSide() {
    const open = !html.classList.contains('side-closed');
    sideBtn.setAttribute('aria-expanded', String(open));
    sideBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }
  function setSide(open) {
    html.classList.toggle('side-closed', !open);
    paintSide();
    try { if (BOOT.mode === '3d') localStorage.setItem('portfolio-menu-3d', open ? 'open' : 'closed'); } catch (e) { /* stockage indisponible : l'état n'est juste pas retenu */ }
    window.dispatchEvent(new Event('sidechange'));
  }
  sideBtn.addEventListener('click', () => setSide(html.classList.contains('side-closed')));
  paintSide();

  // ---------- Vue classique (choisie, ou imposée par l'appareil) ----------
  let room = null;
  if (BOOT.mode === '3d' && window.THREE && window.Room) {
    try {
      room = window.Room.create($('#scene'), {
        onPick: (k) => activate(k), onHover: hoverPin, onBook: onBook, onLevel: onLevel,
        onTransit: (on) => html.classList.toggle('in-transit', on),
        onLost: () => { location.replace('?vue=classique' + (location.hash || (BOOT.route ? '#' + BOOT.route : ''))); },
      });
    } catch (e) { room = null; }
  }
  if (!room) { classicMode(); return; }

  function classicMode() {
    // Classes changées seulement si besoin : chaque modification de <html> recalcule les styles de toute la page
    if (!html.classList.contains('classic')) { html.classList.remove('mode-3d'); html.classList.add('classic'); }
    BOOT.mode = 'classic'; html.classList.remove('side-closed'); updateSwitch(null);
    ['#scene', '#sky', '#precip', '#pins', '#bubble', '#hint', '#thought', '#modebar', '#secnav', '#sectitle', '#dock', '#browser', '#title']
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
    let grid = projectGrid('tous');
    const filters = buildFilters('tous', (cat) => { const g = projectGrid(cat); grid.replaceWith(g); grid = g; });
    proj.querySelector('.lead').after(filters, grid);

    // Icônes du menu, façon réglages iOS
    document.querySelectorAll('.classic-nav a').forEach((a) => {
      if (a.querySelector('.ico')) return;
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
    const go = (k, instant) => { const p = panels[k]; if (p) p.scrollIntoView({ block: 'start', behavior: instant || reduceMotion ? 'auto' : 'smooth' }); };
    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) { e.preventDefault(); go(o.dataset.open); }
    });
    const h = BOOT.route || location.hash.slice(1);
    if (KEYS.includes(h)) requestAnimationFrame(() => go(h, true));
    $('#loader').remove();
    if (sw) sw.dataset.ready = '1';
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
  // Barre latérale : la même que la vue classique ; en 3D elle occupe la gauche et la chambre le reste de l'écran
  const sideW = () => (matchMedia('(max-width: 900px)').matches || html.classList.contains('side-closed') ? 0 : 280);

  let current = null;       // rubrique affichée (null = vue d'ensemble)
  let openKeys = [];        // onglets de la fenêtre
  let active = null;

  // ---------- Ciel en temps réel (météo de Belfort) ----------
  // Les nuages sont déplacés à chaque image (30 par seconde au plus, 20 si l'ordinateur peine) : mouvement fluide et très léger,
  // car le décor est gardé en mémoire (voir createSky dans weather.js). La pluie, à chaque image, sur sa propre couche.
  (function sky() {
    const c = $('#sky'), pc = $('#precip'), pctx = pc.getContext('2d');
    const bg = window.Weather.createSky(c);
    let pw = 1, ph = 1;
    function fit() {
      const sc = isMobile() ? 0.35 : 0.5;
      bg.resize(Math.ceil(innerWidth * sc), Math.ceil(innerHeight * sc));
      pw = pc.width = innerWidth; ph = pc.height = innerHeight;
    }
    let lastBg = -1e9, wet = false;
    fit(); addEventListener('resize', fit);
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden || current === 'parcours') return;   // caché par le monde au-dessus des nuages
      const gap = html.classList.contains('lite') ? 48 : 30;
      if (now - lastBg >= gap) { lastBg = now; bg.frame(now); }
      if (wet || window.Weather.kind().rain || window.Weather.kind().snow) {
        pctx.clearRect(0, 0, pw, ph);
        wet = window.Weather.drawPrecip(pctx, pw, ph, now / 1000, { density: isMobile() ? 0.6 : 1 });
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
    if (!win.hidden) {
      if (mob) ins.bottom = innerHeight - win.offsetTop + 6;
      else ins.right = innerWidth - win.offsetLeft + 6;
    }
    if (!thought.hidden) {
      if (mob) ins.bottom = innerHeight - cloud.offsetTop + 24;
      else ins.right = innerWidth - cloud.offsetLeft + 30;
    }
    const sw = sideW();
    const cx = mob ? innerWidth / 2 : (sw + ins.left + innerWidth - ins.right) / 2;
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

  // ---------- Barre latérale : la rubrique ouverte est mise en évidence ----------
  const navLinks = [...document.querySelectorAll('.classic-nav a')];
  function markNav() {
    navLinks.forEach((a) => {
      const on = a.dataset.k === current;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  // Le nom en haut de la barre ramène à la vue d'ensemble de la chambre
  const me = $('.classic-side__me');
  if (me) me.addEventListener('click', (e) => { e.preventDefault(); if (current) closeAll(); else window.scrollTo(0, 0); });
  // Si la fenêtre devient trop étroite pour la barre latérale, la vue classique prend le relais
  matchMedia('(max-width: 900px)').addEventListener('change', (e) => { if (e.matches) location.reload(); });

  // ---------- Commandes en bas de l'écran ----------
  function setHash(k) {
    try { history.replaceState(null, '', location.pathname + location.search + (k ? '#' + k : '')); } catch (e) { /* ignoré */ }
  }
  function dockHtml(h) { dock.hidden = !h; dock.innerHTML = h || ''; }

  let lvl = 0, lvlTotal = 5, lvlItem = null;
  function levelDock() {
    dockHtml('<button type="button" class="btn btn--ghost" data-l="prev"' + (lvl === 0 ? ' disabled' : '') + '>◀ Précédent</button>'
      + '<span class="lvl">' + (lvl ? lvlItem.lvl + ' · ' + lvlItem.title : 'Mon parcours · ' + lvlTotal + ' niveaux') + '</span>'
      + '<button type="button" class="btn" data-l="next"' + (lvl === lvlTotal ? ' disabled' : '') + '>' + (lvl === 0 ? 'Commencer ▶' : 'Suivant ▶') + '</button>'
      + (lvl ? '<button type="button" class="btn btn--ghost" data-l="ov">Vue d\'ensemble</button>' : ''));
  }
  const VEILLE_TIP = '<span>Cliquez sur un livre pour l\'ouvrir. <span class="muted">Faites glisser pour regarder autour.</span></span>'
    + '<button type="button" class="btn" data-notes="1">Lire le blog de veille</button>';
  function onLevel(n, total, item) { lvl = n; lvlTotal = total; lvlItem = item; if (current === 'parcours') levelDock(); }
  function onBook(id, name) {
    if (current !== 'veille') return;
    dockHtml(id ? '<span>Vous lisez : <strong>' + name + '</strong>. <span class="muted">Cliquez pour le reposer.</span></span>' : VEILLE_TIP);
  }
  dock.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.notes) { openPanel('veille'); return; }
    if (!b || !b.dataset.l) return;
    if (b.dataset.l === 'prev') room.setLevel(lvl - 1);
    if (b.dataset.l === 'next') room.setLevel(lvl + 1);
    if (b.dataset.l === 'ov') room.setLevel(0);
  });

  // Clavier : flèches pour changer de niveau dans le parcours
  document.addEventListener('keydown', (e) => {
    if (current !== 'parcours' || (e.target.matches && e.target.matches('input, textarea'))) return;
    if (e.key === 'ArrowRight') room.setLevel(lvl + 1);
    if (e.key === 'ArrowLeft') room.setLevel(lvl - 1);
  });

  // ---------- Compétences : les mêmes données alimentent la vitrine 3D de l'armoire ----------
  // (construite à la première ouverture de l'armoire : les logos ne sont téléchargés que si on la regarde)
  let vitrine = false;
  function buildVitrine() {
  if (vitrine) return; vitrine = true;
  room.setSkills([...document.querySelectorAll('#p-competences .skillset:not(.skillset--flat)')].map((sec) => ({
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
    const p = document.createElement('p'); p.className = 'lead'; p.textContent = 'Mon stage, mon application publiée et mes projets les plus aboutis. Choisissez une catégorie, puis cliquez sur un projet pour l\'ouvrir.';
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
      st = { left: r.left + sideW(), top: r.top, width: r.width, height: r.height, font: Math.max(12, Math.min(16, r.width / 58)) };
      browser.classList.remove('browser--full');
    } else {
      const top = secnav.hidden ? 60 : secnav.offsetTop + secnav.offsetHeight + 10;
      st = { left: sideW() + 8, top, width: innerWidth - sideW() - 16, height: innerHeight - top - 8, font: 13 };
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
    hideBubble();
    hint.classList.add('is-hidden');
    pinsEl.classList.add('is-hidden');
    room.setWaving(false);
    current = k;
    if (k === 'competences') buildVitrine();
    document.body.classList.add('in-mode');
    browser.hidden = true;
    hideThought();
    modebar.hidden = false;      // le retour à la chambre est proposé dans toutes les rubriques
    if (WINDOW_KEYS.includes(k)) { dockHtml(''); openWindow(k); }
    else {
      hideWindow();
      lvl = 0; lvlItem = null;
      if (k === 'parcours') levelDock();
      else if (k === 'veille') dockHtml(VEILLE_TIP);
      else dockHtml('');
      if (k === 'apropos') showThought();
    }
    updateSecNav();
    markNav();
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
    markNav();
    setHash(null);
    updateSwitch(null);
    applyInsets();
    room.exit(() => {
      if (current) return;
      hint.classList.remove('is-hidden');
      say('Explorez ma chambre : chaque objet cache une rubrique.', 6500);
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
    if (current) closeAll();
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

  // La chambre se recadre quand la barre s'ouvre ou se ferme ; si une animation est en cours, on attend qu'elle se termine
  let sideTimer = null;
  function relayout(tries) {
    applyInsets();
    if (!current) return;
    if (room.busy && (tries || 0) < 12) { clearTimeout(sideTimer); sideTimer = setTimeout(() => relayout((tries || 0) + 1), 250); return; }
    browser.hidden = true;
    room.refit(() => { if (current === 'projets') showBrowser(); });
  }
  addEventListener('sidechange', () => { clearTimeout(sideTimer); sideTimer = setTimeout(() => relayout(0), 60); });

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
    bubble.setAttribute('aria-label', text + ' Cliquer pour ouvrir À propos.');   // le nom accessible commence par le texte affiché
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

  // ---------- Suivi des éléments posés sur la scène pendant le rendu ----------
  // Ordinateur qui peine (moins de 28 images/s pendant 3 s de suite) : on supprime les flous et les ombres coûteux
  let fpsN = 0, fpsT = performance.now(), slowRuns = 0;
  document.addEventListener('visibilitychange', () => { fpsN = 0; fpsT = performance.now(); slowRuns = 0; });
  room.onFrame = () => {
    fpsN++;
    const nowT = performance.now();
    if (nowT - fpsT >= 1500) {
      const fps = fpsN * 1000 / (nowT - fpsT); fpsN = 0; fpsT = nowT;
      if (!document.hidden && fps < 28) slowRuns++; else slowRuns = 0;
      if (slowRuns >= 2 && !html.classList.contains('lite')) html.classList.add('lite');
    }
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
      const bx = Math.max(sideW() + 8, Math.min(innerWidth - bw - 12, h.x + sideW() + 56));
      bubble.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + (h.y + 70).toFixed(1) + 'px)';
    }
    if (!browser.hidden && current === 'projets') placeBrowser();
  };

  // ---------- Démarrage ----------
  const loader = $('#loader');
  loader.classList.add('is-done'); setTimeout(() => loader.remove(), 600);
  { }
  const fromHash = BOOT.route || location.hash.slice(1);
  if (KEYS.includes(fromHash)) activate(fromHash);
  else room.intro(() => say('Bonjour, je suis Baptiste ! Cliquez sur moi pour faire connaissance.'));
})();
