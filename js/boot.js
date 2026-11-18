// Démarrage : choisit la vue (chambre 3D ou classique) et ne charge la 3D que si elle est utilisée.
// La vue classique est choisie d'office quand la connexion est lente, l'appareil modeste ou WebGL absent.
(function () {
  'use strict';
  var V = '?v=20261118a';
  var html = document.documentElement;
  var asked = new URLSearchParams(location.search).get('vue');   // « classique », « 3d » ou rien
  var c = navigator.connection || {};
  var slow = !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
  var weak = (navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2);
  var gl = (function () {
    try {
      var cv = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (cv.getContext('webgl') || cv.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  var mode = asked === 'classique' ? 'classic' : (asked === '3d' ? '3d' : (slow || weak ? 'classic' : '3d'));
  if (!gl) mode = 'classic';
  window.PORTFOLIO = {
    mode: mode, gl: gl,
    // raison affichée quand la vue classique a été choisie automatiquement
    reason: mode === 'classic' && asked !== 'classique' ? (!gl ? 'webgl' : (slow ? 'reseau' : 'appareil')) : '',
  };
  html.classList.add(mode === 'classic' ? 'classic' : 'mode-3d');

  var files = ['js/main.js' + V];
  if (mode === '3d') {
    // Police de la chambre, chargée seulement pour la 3D
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(f);
    files = ['js/vendor/three.min.js', 'js/vendor/OrbitControls.js', 'js/weather.js' + V, 'js/room.js' + V].concat(files);
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
