// Démarrage : choisit la vue (chambre 3D ou classique) et ne charge la 3D que si elle est utilisée.
// La vue classique est imposée sur téléphone (plus simple à lire), et choisie d'office quand la connexion
// est lente, l'appareil modeste ou WebGL absent.
(function () {
  'use strict';
  var V = '?v=20261122a';
  var html = document.documentElement;
  var asked = new URLSearchParams(location.search).get('vue');   // « classique », « 3d » ou rien
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

  var mode = asked === 'classique' ? 'classic' : (asked === '3d' ? '3d' : (slow || weak || soft ? 'classic' : '3d'));
  if (!gl) mode = 'classic';
  window.PORTFOLIO = {
    mode: mode, gl: gl, phone: phone,
    // raison affichée quand la vue classique a été choisie automatiquement (aucune sur téléphone)
    reason: mode === 'classic' && asked !== 'classique' && !phone ? (!gl ? 'webgl' : (slow ? 'reseau' : 'appareil')) : '',
  };
  html.classList.add(mode === 'classic' ? 'classic' : 'mode-3d');
  // La barre latérale garde l'état choisi (ouverte ou fermée), appliqué avant le premier affichage pour qu'elle ne saute pas
  try { if (localStorage.getItem('portfolio-menu') === 'closed') html.classList.add('side-closed'); } catch (e) { /* stockage indisponible */ }

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
      if (mode === '3d') location.replace('?vue=classique' + location.hash);
    };
    document.head.appendChild(s);
  }
  function next(i) {
    if (i >= files.length) return;
    if (mode === '3d' && i === files.length - 1) fontsReady(function () { load(i); });   // le dernier script crée la chambre
    else load(i);
  }
  // Ce script est lu dans <head> pour que la vue classique s'affiche dès le premier rendu, sans écran
  // de chargement ; les scripts suivants ont besoin de toute la page, ils attendent donc la fin du HTML.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { next(0); });
  else next(0);
})();
