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
  // Téléphone : petit écran, ou écran tactile dont le plus petit côté est celui d'un téléphone
  var phone = matchMedia('(max-width: 820px)').matches
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

  var files = ['js/main.min.js' + V];
  if (mode === '3d') {
    // Police de la chambre, chargée seulement pour la 3D
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(f);
    files = ['js/vendor/three.min.js', 'js/vendor/OrbitControls.js', 'js/weather.min.js' + V, 'js/room.min.js' + V].concat(files);
  }
  (function next(i) {
    if (i >= files.length) return;
    var s = document.createElement('script');
    s.src = files[i];
    s.onload = function () { next(i + 1); };
    s.onerror = function () {
      // Un fichier de la 3D n'a pas pu se charger (réseau coupé…) : on bascule sur la vue classique
      if (mode === '3d') location.replace('?vue=classique' + location.hash);
    };
    document.body.appendChild(s);
  })(0);
})();
