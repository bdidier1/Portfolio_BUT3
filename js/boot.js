// Démarrage : choisit la vue (chambre 3D ou classique) et ne charge la 3D que si elle est utilisée.
// La vue classique est imposée sur téléphone (plus simple à lire), et choisie d'office quand la connexion
// est lente, l'appareil modeste ou WebGL absent.
(function () {
  'use strict';
  var V = '?v=20261122a';
  var html = document.documentElement;
  // Routes acceptées : ?vue=3d#contact, ?vue=classique#projets, #cv, et les écritures approchantes
  // (?vue=3d/contact, ?vue=3dcontact, ?vue=3d%23contact, caractères invisibles collés dans un lien copié…).
  var KEYS = ['apropos', 'projets', 'competences', 'parcours', 'veille', 'contact', 'cv', 'reveil'];
  var raw = '';
  try { raw = decodeURIComponent(location.search + ' ' + location.hash); } catch (e) { raw = location.search + ' ' + location.hash; }
  raw = raw.replace(/[​-‏⁠﻿­]/g, '').toLowerCase()
    .replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u');
  var vm = /vue=(3d|classique|classic)/.exec(raw);
  var asked = vm ? (vm[1] === '3d' ? '3d' : 'classique') : null;
  var rest = raw.replace(/vue=(3d|classique|classic)/g, ' ').replace(/[^a-z]+/g, ' ');
  var route = '';
  KEYS.forEach(function (k) { if (!route && k !== 'cv' && rest.indexOf(k) > -1) route = k; });
  if (!route && /competence/.test(rest)) route = 'competences';
  if (!route && /(^| )cv( |$)/.test(rest)) route = 'cv';

  var c = navigator.connection || {};
  var slow = !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
  var weak = (navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2);
  // Téléphone ou petite fenêtre : la barre latérale de la chambre 3D a besoin d'au moins 900 px de large
  var phone = matchMedia('(max-width: 900px)').matches
    || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600);
  var soft = false;   // WebGL calculé par le processeur (pas de carte graphique) : la 3D serait saccadée
  var gl = phone ? false : (function () {
    try {
      var cv = document.createElement('canvas');
      var ctx = window.WebGLRenderingContext && (cv.getContext('webgl') || cv.getContext('experimental-webgl'));
      if (!ctx) return false;
      var info = ctx.getExtension('WEBGL_debug_renderer_info');
      var name = info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      var lose = ctx.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return true;
    } catch (e) { return false; }
  })();

  // Un lien ?vue=3d (ou le bouton « Vue 3D ») est un choix explicite : on l'honore, sans le contredire par les tests de performance.
  // Seule l'ouverture sans consigne laisse le site choisir selon l'appareil.
  var force = asked === '3d';
  try {
    if (asked === 'classique') sessionStorage.removeItem('portfolio-force3d');
    else if (asked === '3d') sessionStorage.setItem('portfolio-force3d', '1');
    else if (sessionStorage.getItem('portfolio-force3d') === '1') force = true;
  } catch (e) { /* stockage indisponible */ }
  var mode = asked === 'classique' ? 'classic' : ((slow || weak || soft) && !force ? 'classic' : '3d');
  if (!gl) mode = 'classic';
  // Rendu 3D calculé par le processeur (pas de carte graphique) : la chambre saccaderait et bloquerait la page.
  // On affiche alors une image de la chambre, et la vraie 3D ne démarre qu'au premier geste du visiteur.
  var facade = mode === '3d' && soft;
  window.PORTFOLIO = {
    mode: mode, gl: gl, phone: phone, route: route, force: force, facade: facade,
    // raison affichée quand la vue classique a été choisie automatiquement (aucune sur téléphone)
    reason: mode === 'classic' && asked !== 'classique' && !phone ? (!gl ? 'webgl' : (slow ? 'reseau' : 'appareil')) : '',
  };
  html.classList.add(mode === 'classic' ? 'classic' : 'mode-3d');
  // Barre latérale : fermée par défaut dans la chambre 3D (elle reste ouverte si le visiteur l'a ouverte), ouverte dans la vue classique
  var menuOpen = false;
  try { menuOpen = localStorage.getItem('portfolio-menu-3d') === 'open'; } catch (e) { /* stockage indisponible */ }
  if (mode === '3d' && !menuOpen) html.classList.add('side-closed');
  // Adresse normalisée (?vue=3d#contact) : un lien approximatif est réécrit proprement sans recharger la page
  try {
    var clean = (asked ? '?vue=' + asked : location.search.replace(/[^\x20-\x7e]/g, '')) + (route ? '#' + route : '');
    if (asked && clean !== location.search + location.hash) history.replaceState(null, '', location.pathname + clean);
  } catch (e) { /* ignoré */ }

  var files = ['js/main.min.js' + V];
  // Police Ubuntu (texte, titres, textures de la chambre) : demandée tout de suite, sans attendre que le CSS soit analysé
  ['400', '700'].forEach(function (w) {
    var p = document.createElement('link');
    p.rel = 'preload'; p.as = 'font'; p.type = 'font/woff2'; p.crossOrigin = 'anonymous'; p.href = 'fonts/ubuntu-' + w + '.woff2';
    document.head.appendChild(p);
  });
  if (mode === '3d') files = ['js/vendor/three.min.js', 'js/vendor/OrbitControls.js', 'js/weather.min.js' + V, 'js/room.min.js' + V].concat(files);

  // La chambre dessine du texte sur des textures : la police doit être prête avant sa création (1,5 s d'attente au plus)
  function fontsReady(cb) {
    var done = false;
    function go() { if (!done) { done = true; cb(); } }
    setTimeout(go, 1500);
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('400 16px Ubuntu'), document.fonts.load('700 16px Ubuntu')]).then(go, go);
    else go();
  }
  function load(i) {
    var s = document.createElement('script');
    s.src = files[i];
    s.onload = function () { next(i + 1); };
    s.onerror = function () {
      // Un fichier de la 3D n'a pas pu se charger (réseau coupé…) : on bascule sur la vue classique
      if (mode === '3d') location.replace('?vue=classique' + (route ? '#' + route : ''));
    };
    document.head.appendChild(s);
  }
  function next(i) {
    if (i >= files.length) return;
    if (mode === '3d' && i === files.length - 1) fontsReady(function () { load(i); });   // le dernier script crée la chambre
    else load(i);
  }
  // Image de la chambre + bouton, à la place de la 3D (voir « facade » plus haut) ; la 3D se lance au premier geste
  function showFacade() {
    var loader = document.getElementById('loader'); if (loader) loader.remove();
    var f = document.createElement('div');
    f.id = 'facade'; f.className = 'facade';
    f.innerHTML = '<img src="img/chambre-3d.webp" alt="" width="1600" height="900" decoding="async" fetchpriority="high">'
      + '<div class="facade__box"><button type="button" class="facade__go">Lancer la chambre en 3D</button>'
      + '<a class="facade__alt" href="?vue=classique' + (route ? '#' + route : '') + '">Vue classique</a></div>';
    document.body.appendChild(f);
    var ev = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    function go() {
      ev.forEach(function (n) { removeEventListener(n, onGesture, true); });
      var l = document.createElement('div'); l.id = 'loader'; l.className = 'loader'; l.innerHTML = '<p>Chargement<span class="dots"></span></p>';
      document.body.appendChild(l);
      next(0);
    }
    function onGesture(e) { if (e.target && e.target.closest && e.target.closest('.facade__alt')) return; go(); }
    ev.forEach(function (n) { addEventListener(n, onGesture, { capture: true, passive: true }); });
  }
  // Ce script est lu dans <head> pour que la vue classique s'affiche dès le premier rendu, sans écran
  // de chargement ; les scripts suivants ont besoin de toute la page, ils attendent donc la fin du HTML.
  function start() { if (facade) showFacade(); else next(0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
