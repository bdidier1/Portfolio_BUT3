// Chambre 3D de Baptiste (Three.js). Expose window.Room.create(container, handlers).
(function () {
  'use strict';
  const T = THREE;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Ubuntu", system-ui, sans-serif';

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

  const mat = (color, extra) => new T.MeshLambertMaterial(Object.assign({ color }, extra));
  const glow = (color) => { const m = new T.MeshBasicMaterial({ color }); m.userData.glow = true; return m; };

  function box(parent, w, h, d, color, x, y, z, material) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), material || mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function canvasTexture(w, h, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    draw(ctx, w, h);
    const tex = new T.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return { tex, ctx, canvas, w, h };
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test;
    }
    ctx.fillText(line, x, y);
    return y + lh;
  }

  // ---------- Contenu affiché en 3D ----------
  const BOOKS = [
    { id: 'so', name: 'Stack Overflow', color: 0xf48024, tag: 'Comprendre et résoudre',
      points: ['Lire les réponses les plus votées pour comprendre une erreur.', 'Retenir les bonnes pratiques en Java, Python et SQL.', 'Poser des questions précises quand je suis bloqué.'] },
    { id: 'gh', name: 'GitHub', color: 0x24292f, tag: 'Lire le code des autres',
      points: ['Explorer des projets open source pour voir comment ils sont organisés.', 'Suivre les README et les nouveautés des outils que j\'utilise.', 'Publier mes propres projets : github.com/bdidier1'] },
    { id: 'rd', name: 'Reddit', color: 0xff4500, tag: 'L\'actualité du métier',
      points: ['Suivre les nouveautés des langages et des frameworks.', 'Découvrir des outils et des retours d\'expérience.', 'Voir ce qui se passe dans la communauté des développeurs.'] },
    { id: 'dc', name: 'Discord', color: 0x5865f2, tag: 'Échanger en direct',
      points: ['Entraide entre développeurs sur des serveurs dédiés.', 'Poser mes questions et aider à mon tour.', 'Rester en contact avec la communauté.'] },
  ];

  const CSS_COL = (n) => '#' + n.toString(16).padStart(6, '0');

  function drawLogo(c, id, cx, cy, s) {
    c.save(); c.translate(cx, cy); c.scale(s / 100, s / 100);
    if (id === 'so') {
      c.fillStyle = '#bcbbbb'; c.fillRect(-42, 20, 84, 12); c.fillRect(-42, 4, 12, 28); c.fillRect(30, 4, 12, 28);
      c.fillStyle = '#f48024';
      for (let i = 0; i < 4; i++) {
        c.save(); c.translate(0, 10 - i * 14); c.rotate((-4 + i * 16) * Math.PI / 180);
        c.fillRect(-32, -4, 64, 9); c.restore();
      }
    } else if (id === 'gh') {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fill();
      c.fillStyle = '#24292f'; c.beginPath(); c.arc(0, 4, 30, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-28, -14); c.lineTo(-24, -34); c.lineTo(-8, -24); c.fill();
      c.beginPath(); c.moveTo(28, -14); c.lineTo(24, -34); c.lineTo(8, -24); c.fill();
      c.beginPath(); c.moveTo(14, 28); c.quadraticCurveTo(26, 44, 10, 52); c.lineTo(-10, 52); c.lineTo(-10, 28); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-11, 0, 5, 0, 7); c.arc(11, 0, 5, 0, 7); c.fill();
    } else if (id === 'rd') {
      c.fillStyle = '#ff4500'; c.beginPath(); c.arc(0, 0, 46, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 8, 30, 21, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(-30, -8, 8, 0, 7); c.arc(30, -8, 8, 0, 7); c.fill();
      c.fillStyle = '#ff4500'; c.beginPath(); c.arc(-11, 4, 6, 0, 7); c.arc(11, 4, 6, 0, 7); c.fill();
      c.strokeStyle = '#ff4500'; c.lineWidth = 3; c.beginPath(); c.arc(0, 12, 12, 0.25, Math.PI - 0.25); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -13); c.lineTo(8, -36); c.lineTo(24, -32); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(26, -32, 6, 0, 7); c.fill();
    } else {
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(-40, -22); c.quadraticCurveTo(-40, -36, -26, -38); c.quadraticCurveTo(-12, -42, 0, -40);
      c.quadraticCurveTo(12, -42, 26, -38); c.quadraticCurveTo(40, -36, 40, -22); c.lineTo(46, 22);
      c.quadraticCurveTo(46, 34, 34, 36); c.lineTo(20, 36); c.lineTo(14, 26); c.lineTo(-14, 26); c.lineTo(-20, 36); c.lineTo(-34, 36);
      c.quadraticCurveTo(-46, 34, -46, 22); c.closePath(); c.fill();
      c.fillStyle = '#5865f2'; c.beginPath(); c.ellipse(-16, 0, 8, 11, 0, 0, 7); c.ellipse(16, 0, 8, 11, 0, 0, 7); c.fill();
    }
    c.restore();
  }

  const TIMELINE = [
    { lvl: 'NIVEAU 1', date: '2024', title: 'Bac STI2D', place: 'Spécialité Systèmes d\'Information et Numérique', text: 'J\'y ai acquis mes premières bases en programmation et en systèmes numériques.' },
    { lvl: 'NIVEAU 2', date: '2024 → 2027', title: 'BUT Informatique', place: 'IUT Nord Franche-Comté, Belfort', text: 'Parcours Réalisation d\'applications : j\'apprends à concevoir, développer et tester des applications.' },
    { lvl: 'NIVEAU 3', date: 'Juin – juil. 2025', title: 'Job d\'été', place: 'Auchan, Bessoncourt', text: 'Je m\'occupais de la mise en rayon et du réapprovisionnement.' },
    { lvl: 'NIVEAU 4', date: 'Avril – juin 2026', title: 'Stage développeur', place: 'EzDEV, Montreux-Château', text: 'J\'ai fait passer une application de Python 3.11 à 3.13 et automatisé ses tests.' },
    { lvl: 'PROCHAIN NIVEAU', date: 'Janvier 2027', title: 'Actemium', place: 'Stage de 3e année · automatisation', text: 'J\'y automatiserai des tâches avec Power Apps et des agents Copilot Studio.', final: true },
  ];

  const CODE = [
    [['const ', '#c586c0'], ['baptiste', '#9cdcfe'], [' = {', '#d4d4d4']],
    [['  formation: ', '#9cdcfe'], ['"BUT Informatique"', '#ce9178'], [',', '#d4d4d4']],
    [['  stage: ', '#9cdcfe'], ['"Actemium, 2027"', '#ce9178'], [',', '#d4d4d4']],
    [['  langages: [', '#9cdcfe'], ['"Java"', '#ce9178'], [', ', '#d4d4d4'], ['"Python"', '#ce9178'], ['],', '#d4d4d4']],
    [['};', '#d4d4d4']],
    [['', '#fff']],
    [['function ', '#c586c0'], ['recruter', '#dcdcaa'], ['(candidat) {', '#d4d4d4']],
    [['  if ', '#c586c0'], ['(candidat.motivé) {', '#d4d4d4']],
    [['    return ', '#c586c0'], ['"Contactez-moi !"', '#ce9178'], [';', '#d4d4d4']],
    [['  }', '#d4d4d4']],
    [['}', '#d4d4d4']],
  ];

  function drawScreen(ctx, w, h, chars) {
    ctx.fillStyle = '#0b1018'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#161d29'; ctx.fillRect(0, 0, w, 26);
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(16 + i * 18, 13, 5, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#8b93a1'; ctx.font = '12px ' + FONT; ctx.fillText('projets/  ·  cliquez pour ouvrir', 90, 17);
    ctx.font = '15px ' + FONT;
    let left = chars;
    for (let i = 0; i < CODE.length; i++) {
      const y = 52 + i * 21;
      ctx.fillStyle = '#4a5160'; ctx.fillText(String(i + 1), 8, y);
      let x = 36;
      for (const [txt, col] of CODE[i]) {
        const part = txt.slice(0, Math.max(0, left));
        left -= txt.length;
        ctx.fillStyle = col; ctx.fillText(part, x, y);
        x += ctx.measureText(txt).width;
        if (left < 0) {
          if (Math.floor(performance.now() / 450) % 2 === 0) { ctx.fillStyle = '#3fb950'; ctx.fillRect(x - ctx.measureText(txt).width + ctx.measureText(part).width, y - 13, 8, 16); }
          return;
        }
      }
    }
  }

  function create(container, handlers) {
    // Réglages adaptés à l'appareil : moins de pixels et d'ombres sur les petits écrans / appareils modestes
    const dpr = window.devicePixelRatio || 1;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: !lowEnd && dpr < 2.5, alpha: true, powerPreference: 'high-performance' });
      if (!renderer.getContext()) throw new Error('no webgl');
    } catch (e) { return null; }

    renderer.setPixelRatio(Math.min(dpr, lowEnd ? 1 : (small ? 1.5 : 2)));
    renderer.shadowMap.enabled = !lowEnd;
    renderer.shadowMap.type = small ? T.PCFShadowMap : T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;   // mises à jour espacées (voir la boucle)
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (handlers.onLost) handlers.onLost(); });

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 300);
    const HOME_POS = new T.Vector3(5.8, 4.7, 6.6);
    const HOME_TARGET = new T.Vector3(-0.1, 0.95, -0.5);
    camera.position.copy(HOME_POS);

    // La caméra reste à l'intérieur de la chambre : 180° autour de la scène
    const HOME_AZ = Math.atan2(HOME_POS.x - HOME_TARGET.x, HOME_POS.z - HOME_TARGET.z);
    const controls = new T.OrbitControls(camera, canvas);
    controls.target.copy(HOME_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    Object.assign(controls, { minDistance: 2.2, maxDistance: 17, minAzimuthAngle: HOME_AZ - Math.PI / 2, maxAzimuthAngle: HOME_AZ + Math.PI / 2, maxPolarAngle: 1.62 });
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;
    controls.update();

    // ---------- Lumières (liées à la météo réelle) ----------
    const ambient = new T.AmbientLight(0x8fa4cc, 0.62);
    scene.add(ambient);
    const sun = new T.DirectionalLight(0xffffff, 0.75);
    sun.position.set(4, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 22 });
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    const screenLight = new T.PointLight(0x4aa8ff, 1.0, 6);
    screenLight.position.set(1, 1.3, -1.5);
    scene.add(screenLight);
    const lampLight = new T.PointLight(0xffc27a, 0.9, 7);
    lampLight.position.set(2.65, 2.0, -2.0);
    scene.add(lampLight);
    const skyLight = new T.PointLight(0xbfd8ff, 0.4, 5);
    skyLight.position.set(-2.4, 1.8, 1.2);
    scene.add(skyLight);
    const wardLight = new T.PointLight(0xffe2b0, 0, 3.5);
    wardLight.position.set(-2.2, 1.4, -1.5);
    scene.add(wardLight);
    const worldHemi = new T.HemisphereLight(0xcfe4ff, 0x8a7a66, 0);
    scene.add(worldHemi);
    // Projecteur qui met en valeur l'objet de la rubrique ouverte (le reste de la chambre s'assombrit)
    const focusLight = new T.SpotLight(0xfff1d6, 0, 7, 0.5, 0.75, 1.2);
    scene.add(focusLight); scene.add(focusLight.target);
    const FOCUS = { projets: [1.0, 1.05, -2.1], cv: [2.0, 1.95, -2.45], competences: [-2.2, 1.1, -2.0], veille: [-0.95, 1.0, -2.25], apropos: [0.9, 0.9, -0.95], contact: [1.85, 0.8, -1.72], reveil: [-2.65, 0.6, 2.05] };
    const lightBase = { ambient: 0.62, sun: 0.75, lamp: 0.9, sky: 0.4 };
    let focus = 0, focusKey = null, focusLit = [];

    // ---------- Registre des objets cliquables ----------
    const clickable = [], clickWorld = [];
    const byKey = {};
    function register(group, key) {
      group.traverse((o) => {
        if (!o.isMesh) return;
        o.userData.key = key;
        clickable.push(o);
        (byKey[key] = byKey[key] || []).push(o);
      });
    }

    // ---------- Pièce ----------
    const room = new T.Group();
    scene.add(room);

    const floorTex = canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#151c29'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#212c3f'; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
    });
    floorTex.tex.wrapS = floorTex.tex.wrapT = T.RepeatWrapping;
    floorTex.tex.repeat.set(6, 5);
    const floor = box(room, 6, 0.2, 5, 0, 0, -0.1, 0, mat(0xffffff, { map: floorTex.tex }));
    floor.castShadow = false;

    const wallBack = new T.Mesh(new T.PlaneGeometry(6, 3), mat(0x151d2b));
    wallBack.position.set(0, 1.5, -2.5); wallBack.receiveShadow = true; room.add(wallBack);
    const wallLeft = new T.Mesh(new T.PlaneGeometry(5, 3), mat(0x111826));
    wallLeft.position.set(-3, 1.5, 0); wallLeft.rotation.y = Math.PI / 2; wallLeft.receiveShadow = true; room.add(wallLeft);

    box(room, 6, 0.12, 0.06, 0x0b0f16, 0, 0.06, -2.47).castShadow = false;
    box(room, 0.06, 0.12, 5, 0x0b0f16, -2.97, 0.06, 0).castShadow = false;
    box(room, 5.9, 0.03, 0.03, 0, 0, 2.8, -2.47, glow(0x38bdf8)).castShadow = false;
    box(room, 0.03, 0.03, 4.9, 0, -2.97, 2.8, 0, glow(0x3fb950)).castShadow = false;

    const rug = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.02, 40), mat(0x10304a));
    rug.position.set(0.3, 0.01, 0.7); rug.receiveShadow = true; room.add(rug);
    const rug2 = new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 0.025, 40), mat(0x16486b));
    rug2.position.set(0.3, 0.012, 0.7); rug2.receiveShadow = true; room.add(rug2);

    // ---------- Bureau + PC (Projets) ----------
    const SCREEN = { x: 1.0, y: 1.2, z: -2.173, w: 1.02, h: 0.6 };
    const pc = new T.Group(); room.add(pc);
    box(pc, 2.5, 0.06, 0.9, 0x2d3646, 1.0, 0.76, -2.0);
    [[-0.2, -2.38], [2.15, -2.38], [-0.2, -1.65], [2.15, -1.65]].forEach(([x, z]) => box(pc, 0.06, 0.76, 0.06, 0x1a202b, x, 0.38, z));
    box(pc, 2.4, 0.03, 0.03, 0, 1.0, 0.5, -1.58, glow(0xb26bff));
    const screenTex = canvasTexture(512, 300, (c, w, h) => drawScreen(c, w, h, 0));
    box(pc, 1.1, 0.64, 0.05, 0x0a0d12, 1.0, 1.2, -2.2);
    const screenMesh = new T.Mesh(new T.PlaneGeometry(SCREEN.w, SCREEN.h), new T.MeshBasicMaterial({ map: screenTex.tex }));
    screenMesh.position.set(SCREEN.x, SCREEN.y, SCREEN.z); pc.add(screenMesh);
    box(pc, 0.08, 0.3, 0.06, 0x11151c, 1.0, 0.92, -2.26);
    box(pc, 0.4, 0.03, 0.22, 0x11151c, 1.0, 0.8, -2.2);
    const side = canvasTexture(256, 360, (c, w, h) => {
      c.fillStyle = '#040a06'; c.fillRect(0, 0, w, h);
      c.font = '15px ' + FONT; c.fillStyle = '#3fb950';
      ['$ git status', 'On branch main', '$ git commit -m', '  "stage terminé"', '$ pytest', '===== 42 passed =====', '$ npm run dev', 'ready on :3000', '$ _'].forEach((l, i) => c.fillText(l, 10, 28 + i * 24));
    });
    box(pc, 0.52, 0.8, 0.05, 0x0a0d12, 0.08, 1.2, -2.2).rotation.y = 0.3;
    const side2 = new T.Mesh(new T.PlaneGeometry(0.46, 0.74), new T.MeshBasicMaterial({ map: side.tex }));
    side2.position.set(0.08, 1.2, -2.2); side2.rotation.y = 0.3; side2.translateZ(0.03); pc.add(side2);
    box(pc, 0.06, 0.4, 0.05, 0x11151c, 0.08, 0.96, -2.23);
    box(pc, 0.55, 0.025, 0.18, 0x20262f, 1.0, 0.8, -1.78);
    box(pc, 0.52, 0.006, 0.02, 0, 1.0, 0.815, -1.8, glow(0xb26bff)).castShadow = false;
    box(pc, 0.07, 0.03, 0.11, 0x20262f, 1.5, 0.8, -1.78);
    box(pc, 0.24, 0.5, 0.46, 0x151a23, 2.55, 0.25, -2.15);
    box(pc, 0.005, 0.38, 0.34, 0, 2.43, 0.25, -2.15, glow(0x22d3ee)).castShadow = false;
    const mug = new T.Mesh(new T.CylinderGeometry(0.06, 0.055, 0.1, 14), mat(0xf5f5f5));
    mug.position.set(0.52, 0.84, -1.85); mug.castShadow = true; pc.add(mug);
    const coffee = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.005, 14), mat(0x3b2416));
    coffee.position.set(0.52, 0.887, -1.85); pc.add(coffee);
    box(pc, 0.03, 0.06, 0.012, 0xf5f5f5, 0.58, 0.84, -1.85);
    register(pc, 'projets');

    // ---------- Téléphone (Contact) ----------
    const phone = new T.Group(); room.add(phone);
    box(phone, 0.2, 0.02, 0.38, 0x0f1218, 1.85, 0.8, -1.72).rotation.y = -0.35;
    const ps = box(phone, 0.17, 0.005, 0.34, 0, 1.85, 0.812, -1.72, glow(0x3fb950)); ps.rotation.y = -0.35; ps.castShadow = false;
    const env = box(phone, 0.12, 0.004, 0.08, 0xffffff, 1.85, 0.818, -1.72, glow(0xffffff)); env.rotation.y = -0.35; env.castShadow = false;
    register(phone, 'contact');

    // ---------- Chaise + Baptiste (À propos) ----------
    const who = new T.Group(); who.position.set(0.9, 0, -0.95); who.rotation.y = 0.8; room.add(who);
    const chairCol = 0x1b2230;
    box(who, 0.5, 0.07, 0.5, chairCol, 0, 0.5, 0);
    box(who, 0.5, 0.62, 0.07, chairCol, 0, 0.88, -0.27);
    box(who, 0.3, 0.05, 0.08, 0x3fb950, 0, 1.12, -0.27);
    box(who, 0.07, 0.28, 0.07, 0x4a5160, 0, 0.32, 0);
    box(who, 0.66, 0.04, 0.08, 0x4a5160, 0, 0.14, 0);
    box(who, 0.08, 0.04, 0.66, 0x4a5160, 0, 0.14, 0);
    [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]].forEach(([x, z]) => box(who, 0.07, 0.07, 0.07, 0x0b0f16, x, 0.05, z));

    const skin = 0xe3b08c, hair = 0x2b1b13, hoodie = 0x8fc4ee, jeans = 0x232c3d;
    [-0.12, 0.12].forEach((x) => {
      box(who, 0.15, 0.14, 0.46, jeans, x, 0.6, 0.2);
      box(who, 0.14, 0.5, 0.14, jeans, x, 0.33, 0.42);
      box(who, 0.15, 0.08, 0.26, 0xf5f5f5, x, 0.05, 0.5);
    });
    box(who, 0.44, 0.58, 0.27, hoodie, 0, 0.9, -0.02);
    box(who, 0.15, 0.11, 0.02, 0xffffff, 0, 1.15, 0.125);
    box(who, 0.018, 0.42, 0.01, 0xcbd5e1, 0, 0.88, 0.136);
    box(who, 0.14, 0.08, 0.14, skin, 0, 1.24, 0);
    const arms = [];
    [-1, 1].forEach((sd) => {
      const shoulder = new T.Group(); shoulder.position.set(sd * 0.27, 1.12, -0.02); who.add(shoulder);
      box(shoulder, 0.12, 0.34, 0.12, hoodie, 0, -0.17, 0);
      const fore = new T.Group(); fore.position.y = -0.34; shoulder.add(fore);
      box(fore, 0.11, 0.3, 0.11, hoodie, 0, -0.15, 0);
      box(fore, 0.1, 0.1, 0.1, skin, 0, -0.33, 0);
      arms.push({ shoulder, fore, side: sd });
    });
    const head = new T.Group(); head.position.set(0, 1.28, 0.0); who.add(head);
    box(head, 0.3, 0.32, 0.29, skin, 0, 0.16, 0);
    // Cheveux : bruns, bouclés, plus volumineux sur le dessus avec une frange
    (function buildHair() {
      let hs = 7; const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
      const tones = [0x2b1b13, 0x35241a, 0x231510];
      const hb = (w, h, d, x, y, z, rx, ry, rz) => {
        const m = box(head, w, h, d, tones[Math.floor(hr() * 3)], x, y, z);
        m.rotation.set(rx || 0, ry || 0, rz || 0); return m;
      };
      hb(0.345, 0.09, 0.34, 0, 0.345, -0.01);                       // calotte
      hb(0.045, 0.16, 0.25, -0.167, 0.245, -0.02); hb(0.045, 0.16, 0.25, 0.167, 0.245, -0.02);   // côtés
      hb(0.04, 0.07, 0.06, -0.168, 0.165, 0.075); hb(0.04, 0.07, 0.06, 0.168, 0.165, 0.075);     // pattes
      hb(0.345, 0.27, 0.07, 0, 0.19, -0.168); hb(0.3, 0.08, 0.06, 0, 0.09, -0.16);                // nuque
      for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 4; iz++) {                                // boucles du dessus
        const hh = 0.06 + hr() * 0.08;
        hb(0.1, hh, 0.1, -0.12 + ix * 0.08 + (hr() - 0.5) * 0.03, 0.385 + hh / 2, -0.135 + iz * 0.085 + (hr() - 0.5) * 0.03, 0, hr() * 1.2, 0);
      }
      [[-0.175, 0.37, 0.0], [0.175, 0.37, 0.0], [-0.17, 0.35, -0.12], [0.17, 0.35, -0.12]].forEach(([x, y, z]) => hb(0.075, 0.08, 0.08, x, y, z, 0, hr(), 0));
      [[-0.125, 0.05], [-0.065, 0.07], [-0.005, 0.045], [0.06, 0.07], [0.12, 0.05]].forEach(([x, hh]) =>   // frange
        hb(0.07, hh, 0.055, x + (hr() - 0.5) * 0.015, 0.34 - hh / 2 + 0.01, 0.158, 0, 0, (hr() - 0.5) * 0.5));
      for (let i = 0; i < 6; i++) hb(0.03, 0.09, 0.03, -0.11 + i * 0.045 + (hr() - 0.5) * 0.02, 0.5 + hr() * 0.03, -0.1 + hr() * 0.2, (hr() - 0.5) * 0.7, 0, (hr() - 0.5) * 0.7);   // mèches
    })();
    [-0.07, 0.07].forEach((x) => {
      box(head, 0.045, 0.045, 0.01, 0x111111, x, 0.19, 0.146);
      box(head, 0.085, 0.02, 0.012, hair, x, 0.245, 0.147);
    });
    box(head, 0.04, 0.05, 0.04, 0xcf9c78, 0, 0.14, 0.16);
    box(head, 0.1, 0.03, 0.012, 0xffffff, 0, 0.075, 0.148);
    box(head, 0.15, 0.06, 0.014, 0x2b1b13, 0, 0.025, 0.148);
    box(head, 0.2, 0.05, 0.014, 0x3a2a20, 0, 0.1, 0.147).scale.set(1, 0.4, 1);
    [-0.155, 0.155].forEach((x) => box(head, 0.03, 0.08, 0.06, 0xcf9c78, x, 0.14, 0));
    register(who, 'apropos');
    const headWorld = new T.Vector3();

    // ---------- Lit + ordinateur portable (Parcours) ----------
    const bed = new T.Group(); bed.position.set(-2.35, 0, 0.5); room.add(bed);
    box(bed, 1.1, 0.22, 2.1, 0x252d3d, 0, 0.17, 0);
    box(bed, 1.0, 0.2, 2.0, 0x4d86c4, 0, 0.38, 0);
    box(bed, 1.02, 0.08, 1.3, 0x1f4a82, 0, 0.5, 0.33);
    box(bed, 1.03, 0.09, 0.07, 0x3fb950, 0, 0.5, -0.3);
    box(bed, 0.8, 0.12, 0.38, 0xf1f5f9, 0, 0.54, -0.78);
    box(bed, 1.1, 0.35, 0.08, 0x252d3d, 0, 0.43, -1.08);
    const laptop = box(bed, 0.4, 0.02, 0.28, 0x2a3140, 0.05, 0.58, 0.45);
    laptop.rotation.y = 0.3;
    const lscreen = box(bed, 0.4, 0.26, 0.02, 0x0a0d12, 0.0, 0.7, 0.3); lscreen.rotation.set(-0.25, 0.3, 0);
    const lscr = box(bed, 0.36, 0.22, 0.004, 0, 0.0, 0.7, 0.312, glow(0x1f6f33)); lscr.rotation.set(-0.25, 0.3, 0); lscr.castShadow = false;
    register(bed, 'parcours');

    // ---------- Parcours : un monde au-dessus des nuages, un bâtiment par étape ----------
    const WY = 60;
    const world = new T.Group(); scene.add(world); world.visible = false;
    const wAnim = [], wMats = {}, wCards = [];
    const wmat = (c, emis) => { const k = c + '_' + (emis || 0); return wMats[k] || (wMats[k] = new T.MeshLambertMaterial(emis ? { color: c, emissive: emis } : { color: c })); };
    function wb(g, w, h, d, c, x, y, z, emis) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), wmat(c, emis)); m.position.set(x, y, z); g.add(m); return m; }
    function sign(g, w, h, x, y, z, text, sub, bg, fg) {
      const t = canvasTexture(Math.round(w * 256), Math.round(h * 256), (c, cw, ch) => {
        c.fillStyle = bg; c.fillRect(0, 0, cw, ch); c.fillStyle = fg; c.textAlign = 'center';
        let size = ch * (sub ? 0.5 : 0.62); c.font = 'bold ' + size + 'px ' + FONT;
        while (c.measureText(text).width > cw - 20 && size > 10) { size -= 2; c.font = 'bold ' + size + 'px ' + FONT; }
        c.fillText(text, cw / 2, sub ? ch * 0.58 : ch * 0.7);
        if (sub) { c.font = (ch * 0.2) + 'px ' + FONT; c.fillText(sub, cw / 2, ch * 0.88); }
      });
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t.tex }));
      m.position.set(x, y, z); g.add(m); return m;
    }
    function tree(g, x, z, k) { wb(g, 0.14 * k, 0.5 * k, 0.14 * k, 0x6b4a2b, x, 0.25 * k, z); wb(g, 0.5 * k, 0.5 * k, 0.5 * k, 0x2f9e4f, x, 0.7 * k, z); wb(g, 0.34 * k, 0.3 * k, 0.34 * k, 0x38b258, x, 1.05 * k, z); }
    function island(g) {
      wb(g, 5.2, 0.35, 4.4, 0x5fae5a, 0, -0.18, 0);
      wb(g, 4.8, 0.7, 4.0, 0x8a5a34, 0, -0.7, 0);
      wb(g, 3.6, 0.7, 3.0, 0x6e4727, 0, -1.4, 0);
      wb(g, 2.2, 0.6, 1.9, 0x5a3a20, 0, -2.0, 0);
    }
    const builders = [
      function lycee(g) {
        wb(g, 3.4, 1.5, 1.5, 0xe8dcc0, 0, 0.75, -0.2);
        wb(g, 3.6, 0.14, 1.7, 0x9c4a3a, 0, 1.57, -0.2);
        wb(g, 1.1, 0.55, 0.3, 0xe8dcc0, 0, 1.78, 0.5);
        wb(g, 1.3, 0.1, 0.4, 0x9c4a3a, 0, 2.1, 0.5);
        for (let r = 0; r < 2; r++) for (let i = -3; i <= 3; i++) { if (Math.abs(i) < 1 && r === 0) continue; wb(g, 0.32, 0.4, 0.05, 0x7fc4ff, i * 0.46, 0.5 + r * 0.62, 0.56, 0x2a5a8a); }
        wb(g, 0.55, 0.75, 0.06, 0x5b3a1e, 0, 0.375, 0.56);
        wb(g, 1.0, 0.1, 0.35, 0xcfc7b0, 0, 0.05, 0.75);
        sign(g, 1.0, 0.3, 0, 1.78, 0.66, 'LYCÉE', null, '#1d3557', '#ffffff');
        wb(g, 0.05, 1.7, 0.05, 0xcccccc, 1.95, 0.85, 0.9);
        wb(g, 0.14, 0.3, 0.02, 0x2a4bd8, 2.04, 1.6, 0.9); wb(g, 0.14, 0.3, 0.02, 0xffffff, 2.18, 1.6, 0.9); wb(g, 0.14, 0.3, 0.02, 0xe03131, 2.32, 1.6, 0.9);
        tree(g, -2.2, 1.0, 1.1); tree(g, -2.1, -1.0, 0.9);
      },
      function iut(g) {
        wb(g, 2.5, 2.3, 1.5, 0xcfd6dd, 0.4, 1.15, -0.2);
        for (let f = 0; f < 4; f++) wb(g, 2.3, 0.34, 0.05, 0x6fb8e8, 0.4, 0.45 + f * 0.5, 0.58, 0x1c5f90);
        wb(g, 0.9, 3.1, 1.1, 0xaeb7c0, -1.35, 1.55, -0.2);
        for (let f = 0; f < 5; f++) wb(g, 0.7, 0.28, 0.05, 0x6fb8e8, -1.35, 0.5 + f * 0.55, 0.37, 0x1c5f90);
        wb(g, 0.8, 0.12, 0.9, 0x8c96a0, -1.35, 3.15, -0.2);
        wb(g, 0.04, 0.4, 0.04, 0xdddddd, -1.35, 3.4, -0.2);
        wb(g, 0.7, 0.6, 0.06, 0x2a3b4a, 0.4, 0.3, 0.6);
        wb(g, 1.0, 0.07, 0.4, 0x8c96a0, 0.4, 0.75, 0.78);
        wb(g, 2.3, 0.6, 0.08, 0x10161f, 0.4, 2.62, 0.45);
        sign(g, 2.2, 0.52, 0.4, 2.62, 0.5, 'IUT', 'Nord Franche-Comté', '#10161f', '#7ee787');
        tree(g, 2.3, 1.0, 1);
      },
      function auchan(g) {
        wb(g, 3.6, 1.1, 2.0, 0xf1f1f1, 0, 0.55, -0.3);
        wb(g, 3.7, 0.4, 2.1, 0xe2001a, 0, 1.3, -0.3);
        sign(g, 2.4, 0.34, 0, 1.3, 0.77, 'AUCHAN', null, '#e2001a', '#ffffff');
        wb(g, 2.0, 0.65, 0.05, 0x9fd3ff, -0.3, 0.45, 0.74, 0x2a5a7a);
        wb(g, 0.6, 0.7, 0.06, 0x2a3b4a, 1.1, 0.35, 0.74);
        wb(g, 0.14, 2.2, 0.14, 0x444444, -2.2, 1.1, 1.2);
        sign(g, 0.8, 0.5, -2.2, 2.2, 1.28, 'Auchan', null, '#e2001a', '#ffffff');
        wb(g, 0.3, 0.25, 0.2, 0xaaaaaa, 1.5, 0.15, 1.4); wb(g, 0.3, 0.25, 0.2, 0xaaaaaa, 1.9, 0.15, 1.4);
        tree(g, 2.3, -1.2, 0.9);
      },
      function ezdev(g) {
        wb(g, 2.9, 1.9, 1.6, 0x2b3446, 0, 0.95, -0.2);
        for (let r = 0; r < 2; r++) for (let i = -2; i <= 1; i++) { if (r === 0 && (i === -1 || i === 0)) continue; wb(g, 0.5, 0.5, 0.05, 0xffe9a8, i * 0.62 + 0.31, 0.55 + r * 0.7, 0.62, 0x8a6a1a); }
        wb(g, 0.55, 0.65, 0.06, 0x10161f, 0, 0.33, 0.62);
        wb(g, 3.0, 0.1, 1.7, 0x1b2230, 0, 1.95, -0.2);
        wb(g, 1.9, 0.55, 0.1, 0x10161f, 0, 2.35, 0.45);
        sign(g, 1.7, 0.45, 0, 2.35, 0.51, 'EzDEV', null, '#10161f', '#3fb950');
        wb(g, 0.9, 0.28, 0.45, 0x3b82f6, -1.9, 0.2, 1.3); wb(g, 0.5, 0.22, 0.4, 0x9fd3ff, -1.9, 0.45, 1.3);
        tree(g, 2.2, 1.0, 1);
      },
      function futur(g) {
        wb(g, 2.4, 0.9, 1.4, 0xbfc4cc, -0.3, 0.45, -0.1);
        [-1.5, 0.9].forEach((x) => [-0.8, 0.6].forEach((z) => wb(g, 0.06, 2.1, 0.06, 0xf2c94c, x, 1.05, z)));
        wb(g, 2.5, 0.05, 0.05, 0xf2c94c, -0.3, 1.4, 0.6); wb(g, 2.5, 0.05, 0.05, 0xf2c94c, -0.3, 2.1, 0.6);
        wb(g, 2.5, 0.05, 0.05, 0xf2c94c, -0.3, 1.4, -0.8); wb(g, 2.5, 0.05, 0.05, 0xf2c94c, -0.3, 2.1, -0.8);
        wb(g, 0.14, 3.2, 0.14, 0xf29c1f, 1.8, 1.6, -0.6);
        const jib = new T.Group(); jib.position.set(1.8, 3.2, -0.6); g.add(jib);
        wb(jib, 2.6, 0.1, 0.1, 0xf29c1f, -0.8, 0, 0); wb(jib, 0.6, 0.3, 0.3, 0x555555, 0.55, 0, 0);
        wb(jib, 0.02, 0.8, 0.02, 0x222222, -1.8, -0.4, 0); wb(jib, 0.3, 0.2, 0.3, 0xcaa05a, -1.8, -0.85, 0);
        wAnim.push((t) => { jib.rotation.y = Math.sin(t * 0.4) * 0.5; });
        wb(g, 2.4, 0.7, 0.08, 0x10161f, -0.3, 2.65, 0.9);
        sign(g, 2.2, 0.6, -0.3, 2.65, 0.95, 'Actemium', null, '#10161f', '#ffc83d');
        const star = new T.Group(); star.position.set(-0.3, 3.55, -0.1); g.add(star);
        const gold = new T.MeshBasicMaterial({ color: 0xffc83d });
        [0, Math.PI / 4].forEach((r) => { const m = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.12), gold); m.rotation.z = r; star.add(m); });
        wAnim.push((t) => { star.rotation.y = t * 1.6; });
        wb(g, 0.5, 0.3, 0.4, 0xb5651d, 1.0, 0.15, 1.3); wb(g, 0.5, 0.3, 0.4, 0xb5651d, 1.6, 0.15, 1.4);
      },
    ];
    const ISLE = TIMELINE.map((e, i) => new T.Vector3(-14 + 7 * i, WY + 0.8 * i, [2, -1, 2, -1, 1][i]));
    TIMELINE.forEach((e, i) => {
      const g = new T.Group(); g.position.copy(ISLE[i]); world.add(g);
      island(g); builders[i](g);
      const acc = e.final ? '#ffc83d' : '#3fb950';
      const cardTex = canvasTexture(640, 400, (c, w, h) => {
        c.fillStyle = 'rgba(8,12,20,0.96)'; c.fillRect(0, 0, w, h);
        c.strokeStyle = acc; c.lineWidth = 5; c.strokeRect(3, 3, w - 6, h - 6);
        c.fillStyle = acc; c.font = 'bold 26px ' + FONT; c.fillText(e.lvl, 28, 52);
        c.fillStyle = '#b5cea8'; c.font = '26px ' + FONT; c.textAlign = 'right'; c.fillText(e.date, w - 28, 52); c.textAlign = 'left';
        c.fillStyle = '#fff'; c.font = 'bold 48px ' + FONT; c.fillText(e.title, 28, 122);
        c.fillStyle = '#9cdcfe'; c.font = '24px ' + FONT; wrapText(c, e.place, 28, 170, w - 56, 30);
        c.fillStyle = '#e6edf3'; c.font = '28px ' + FONT; wrapText(c, e.text, 28, 250, w - 56, 38);
      });
      const card = new T.Mesh(new T.PlaneGeometry(6, 3.75), new T.MeshBasicMaterial({ map: cardTex.tex, transparent: true, side: T.DoubleSide }));
      card.position.set(0, 4.7, -1.0); g.add(card);
      wCards.push({ card, base: 4.7, i });
      g.traverse((o) => { if (o.isMesh) { o.userData.key = 'parcours'; o.userData.level = i + 1; clickWorld.push(o); } });
    });
    for (let i = 0; i < ISLE.length - 1; i++) {
      for (let k = 1; k <= 2; k++) {
        const a = ISLE[i], b = ISLE[i + 1], t = k / 3;
        wb(world, 0.8, 0.14, 0.8, 0xe6d8a8, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - 0.1, a.z + (b.z - a.z) * t + 1.0, 0x6a6030);
      }
    }

    // Nuages (voxel) : ceux de l'envol, et la mer de nuages sous les îles
    const cloudGeo = new T.BoxGeometry(1, 1, 1);
    const cloudMat = new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x7d889c });
    function makeCloud() {
      const g = new T.Group(), n = 5 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const m = new T.Mesh(cloudGeo, cloudMat);
        m.scale.set(0.9 + rnd() * 0.9, 0.6 + rnd() * 0.5, 0.9 + rnd() * 0.8);
        m.position.set((i - n / 2) * 0.7 + rnd() * 0.3, rnd() * 0.4, (rnd() - 0.5) * 0.8);
        g.add(m);
      }
      return g;
    }
    const clouds = new T.Group(); scene.add(clouds); clouds.visible = false;
    const puffs = [];
    for (let i = 0; i < 34; i++) { const g = makeCloud(); g.scale.setScalar(0.001); clouds.add(g); puffs.push({ g, s: 0, size: 1.6 + rnd() * 1.8, rate: 5 + rnd() * 6 }); }
    let cloudsT = 0;
    const sea = new T.Group(); scene.add(sea); sea.visible = false;
    const seaClouds = [];
    for (let i = 0; i < 46; i++) {
      const g = makeCloud(); g.scale.set(5 + rnd() * 4, 1.6 + rnd() * 0.8, 4 + rnd() * 3);
      g.position.set((rnd() - 0.5) * 90, WY - 3.6 + rnd() * 0.8, -35 + rnd() * 60);
      sea.add(g); seaClouds.push(g);
    }

    // ---------- Armoire (Compétences) ----------
    const ward = new T.Group(); ward.position.set(-2.2, 0, -2.07); room.add(ward);
    const wc = 0x3a4457;
    box(ward, 1.2, 2.2, 0.03, 0x2e384a, 0, 1.1, -0.335);
    box(ward, 0.04, 2.2, 0.7, wc, -0.58, 1.1, 0);
    box(ward, 0.04, 2.2, 0.7, wc, 0.58, 1.1, 0);
    box(ward, 1.2, 0.05, 0.7, wc, 0, 2.18, 0);
    box(ward, 1.2, 0.1, 0.7, 0x2a3140, 0, 0.05, 0);
    box(ward, 1.24, 0.05, 0.74, 0x2a3140, 0, 2.22, 0);
    const doors = [-1, 1].map((sd) => {
      const pivot = new T.Group(); pivot.position.set(sd * 0.6, 1.1, 0.35); ward.add(pivot);
      box(pivot, 0.59, 2.0, 0.03, 0x465168, -sd * 0.295, 0.0, 0);
      box(pivot, 0.03, 0.4, 0.05, 0x3fb950, -sd * 0.54, 0, 0.03);
      if (sd === 1) {
        const stk = canvasTexture(64, 64, (c, w, h) => { c.fillStyle = '#0b1018'; c.fillRect(0, 0, w, h); c.fillStyle = '#3fb950'; c.font = 'bold 34px ' + FONT; c.textAlign = 'center'; c.fillText('{}', 32, 44); });
        const sticker = new T.Mesh(new T.PlaneGeometry(0.2, 0.2), new T.MeshBasicMaterial({ map: stk.tex }));
        sticker.position.set(-0.3, 0.55, 0.0165); pivot.add(sticker);
      }
      return { pivot, sd };
    });
    register(ward, 'competences');

    // Vitrine des compétences dans l'armoire : une étagère éclairée par catégorie, une tuile par compétence.
    // Tout est dessiné dans une seule texture (atlas) pour rester léger.
    const SK = { cell: 160, cols: 12, hW: 1024, hH: 56 };
    function buildVitrine(list) {
      const atlas = canvasTexture(2048, 2048, (c, w, h) => { c.clearRect(0, 0, w, h); });
      atlas.tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const amat = new T.MeshBasicMaterial({ map: atlas.tex, transparent: true });
      const backGeo = new T.BoxGeometry(1, 1, 1), backMat = mat(0x1a2130);
      const c = atlas.ctx;
      function rrect(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
      function fitFont(text, size, maxW, weight) { do { c.font = (weight || 'bold') + ' ' + size + 'px ' + FONT; size -= 1; } while (c.measureText(text).width > maxW && size > 10); }
      function drawTile(cell, it, color, img) {
        const S = SK.cell, x = (cell % SK.cols) * S, y = Math.floor(cell / SK.cols) * S;
        c.clearRect(x, y, S, S);
        c.fillStyle = '#f8fafc'; rrect(x + 4, y + 4, S - 8, S - 8, 20); c.fill();
        c.fillStyle = color; c.fillRect(x + 22, y + S - 13, S - 44, 5);
        c.textAlign = 'center'; c.fillStyle = '#111827';
        if (img) {
          try { c.drawImage(img, x + S / 2 - 40, y + 20, 80, 80); } catch (e) { /* logo illisible : on garde le texte */ }
          fitFont(it.name, 23, S - 22); c.fillText(it.name, x + S / 2, y + 128);
        } else if (it.mono) {
          c.fillStyle = color; fitFont(it.mono, 44, S - 40); c.fillText(it.mono, x + S / 2, y + 80);
          c.fillStyle = '#111827'; fitFont(it.name, 23, S - 22); c.fillText(it.name, x + S / 2, y + 128);
        } else {
          // compétence sans logo (méthodes, qualités) : texte sur deux lignes
          const words = it.name.split(' '), mid = Math.ceil(words.length / 2);
          const lines = words.length > 1 && it.name.length > 10 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [it.name];
          lines.forEach((l, i) => { fitFont(l, 26, S - 26); c.fillText(l, x + S / 2, y + S / 2 + 4 + (i - (lines.length - 1) / 2) * 30); });
        }
        atlas.tex.needsUpdate = true;
      }
      function uvPlane(w, h, px, py, pw, ph) {
        const g = new T.PlaneGeometry(w, h), uv = g.attributes.uv;
        const u0 = px / 2048, u1 = (px + pw) / 2048, v1 = 1 - py / 2048, v0 = 1 - (py + ph) / 2048;
        uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
        return new T.Mesh(g, amat);
      }
      const T_W = 0.125, GAP = 0.02, ROW = 0.15, PER = 7;   // 7 compétences par étagère
      let y = 2.13, cell = 0;
      list.forEach((cat, ci) => {
        const col = cat.color || '#3fb950';
        // Titre de l'étagère
        const hx = (ci % 2) * SK.hW, hy = 1536 + Math.floor(ci / 2) * SK.hH;
        c.fillStyle = 'rgba(8,12,20,0.92)'; c.fillRect(hx, hy, SK.hW, SK.hH);
        c.fillStyle = col; c.fillRect(hx, hy, 10, SK.hH);
        c.textAlign = 'left'; c.fillStyle = '#ffffff'; c.font = 'bold 34px ' + FONT; c.fillText(cat.name.toUpperCase(), hx + 28, hy + 40);
        c.textAlign = 'right'; c.fillStyle = col; c.font = 'bold 26px ' + FONT; c.fillText(String(cat.items.length), hx + SK.hW - 22, hy + 39);
        const head = uvPlane(1.06, 1.06 * SK.hH / SK.hW, hx, hy, SK.hW, SK.hH);
        head.position.set(0, y - 0.03, 0.09); ward.add(head);   // étiquette sur le bord avant de l'étagère
        y -= 0.065;
        for (let r = 0; r * PER < cat.items.length; r++) {
          const row = cat.items.slice(r * PER, r * PER + PER);
          const x0 = -((row.length - 1) * (T_W + GAP)) / 2;
          row.forEach((it, i) => {
            const k = cell++;
            drawTile(k, it, col, null);
            if (it.src) {
              const im = new Image(); im.crossOrigin = 'anonymous';
              im.onload = () => drawTile(k, it, col, im);
              im.src = it.src;
            }
            const g = new T.Group(); g.position.set(x0 + i * (T_W + GAP), y - ROW / 2 + 0.008, -0.02); g.rotation.x = -0.14; ward.add(g);
            const back = new T.Mesh(backGeo, backMat); back.scale.set(T_W + 0.012, T_W + 0.012, 0.02); back.position.z = -0.012; g.add(back);
            const face = uvPlane(T_W, T_W, (k % SK.cols) * SK.cell, Math.floor(k / SK.cols) * SK.cell, SK.cell, SK.cell); g.add(face);
          });
          y -= ROW;
          box(ward, 1.12, 0.014, 0.4, 0x2a3344, 0, y, -0.12).castShadow = false;
          box(ward, 1.1, 0.008, 0.008, 0, 0, y - 0.011, 0.075, glow(new T.Color(col).getHex())).castShadow = false;
          y -= 0.012;
        }
      });
    }

    // ---------- Bibliothèque (Veille) ----------
    const shelf = new T.Group(); shelf.position.set(-0.95, 0, -2.3); room.add(shelf);
    box(shelf, 0.05, 1.9, 0.34, 0x4a3b30, -0.5, 0.95, 0);
    box(shelf, 0.05, 1.9, 0.34, 0x4a3b30, 0.5, 0.95, 0);
    box(shelf, 1.05, 0.04, 0.34, 0x4a3b30, 0, 1.9, 0);
    box(shelf, 0.95, 1.9, 0.02, 0x3a2f27, 0, 0.95, -0.16);
    const palette = [0xe05d5d, 0x3b82f6, 0x3fb950, 0xf2c94c, 0x9b6bff, 0xe9edf2, 0x22d3ee, 0xf2994a];
    const BOOK_ROW = 2, BOOK_X0 = -0.17, BOOK_W = 0.075, BOOK_GAP = 0.012;
    for (let s = 0; s < 4; s++) {
      const y = 0.04 + s * 0.5;
      box(shelf, 0.95, 0.04, 0.34, 0x4a3b30, 0, y, 0);
      let x = -0.44;
      const zoneEnd = BOOK_X0 + 4 * (BOOK_W + BOOK_GAP);
      while (x < 0.38) {
        if (s === BOOK_ROW && x > BOOK_X0 - 0.09 && x < zoneEnd) { x = zoneEnd + 0.005; continue; }
        const w = 0.05 + rnd() * 0.05, h = 0.3 + rnd() * 0.12;
        if (s === BOOK_ROW && x + w > BOOK_X0 - 0.01 && x < zoneEnd) { x = zoneEnd + 0.005; continue; }
        box(shelf, w, h, 0.22, palette[Math.floor(rnd() * palette.length)], x + w / 2, y + 0.02 + h / 2, 0.02);
        x += w + 0.005;
      }
    }
    register(shelf, 'veille');

    // Livres de la veille : on peut les sortir et les ouvrir
    const BK = { t: BOOK_W, H: 0.36, D: 0.24 };
    const books = BOOKS.map((b, i) => {
      const g = new T.Group();
      const slot = new T.Vector3(BOOK_X0 + i * (BOOK_W + BOOK_GAP) + BOOK_W / 2, 0.04 + BOOK_ROW * 0.5 + 0.02 + BK.H / 2, 0.02);
      g.position.copy(slot);
      const col = b.color, dark = new T.Color(col).multiplyScalar(0.7).getHex();
      box(g, BK.t, BK.H, 0.012, col, 0, 0, BK.D / 2 - 0.006);
      box(g, 0.01, BK.H, BK.D, dark, -BK.t / 2 + 0.005, 0, 0);
      box(g, BK.t - 0.02, BK.H - 0.02, BK.D - 0.02, 0xf4efe0, 0, 0, -0.005);
      const sp = canvasTexture(64, 256, (c, w, h) => {
        c.fillStyle = CSS_COL(col); c.fillRect(0, 0, w, h);
        drawLogo(c, b.id, 32, 34, 44);
        c.save(); c.translate(32, 76); c.rotate(Math.PI / 2); c.fillStyle = '#fff'; c.font = 'bold 26px ' + FONT; c.textBaseline = 'middle';
        c.fillText(b.name, 4, 0); c.restore();
      });
      const spine = new T.Mesh(new T.PlaneGeometry(BK.t * 0.98, BK.H * 0.98), new T.MeshBasicMaterial({ map: sp.tex }));
      spine.position.z = BK.D / 2 + 0.0005; g.add(spine);
      const pg = canvasTexture(512, 680, (c, w, h) => {
        c.fillStyle = '#f7f1e1'; c.fillRect(0, 0, w, h);
        c.fillStyle = CSS_COL(col); c.fillRect(36, 44, 8, 70);
        c.fillStyle = '#6b6354'; c.font = '22px ' + FONT; c.fillText('CE QUE JE VEILLE', 60, 70);
        c.fillStyle = '#1f1b14'; c.font = 'bold 36px ' + FONT; c.fillText(b.name, 60, 108);
        c.font = '25px ' + FONT; let y = 190;
        b.points.forEach((p) => {
          c.fillStyle = CSS_COL(col); c.fillText('▸', 40, y);
          c.fillStyle = '#2b2620'; y = wrapText(c, p, 80, y, w - 120, 36) + 24;
        });
        c.fillStyle = '#9b927f'; c.font = '18px ' + FONT; c.textAlign = 'center'; c.fillText('— ' + (i + 1) + ' / ' + BOOKS.length + ' —', w / 2, h - 36);
      });
      const pagePlane = new T.Mesh(new T.PlaneGeometry(BK.D - 0.03, BK.H - 0.04), new T.MeshBasicMaterial({ map: pg.tex }));
      pagePlane.rotation.y = Math.PI / 2; pagePlane.position.set((BK.t - 0.02) / 2 + 0.001, 0, -0.005); g.add(pagePlane);
      const hinge = new T.Group(); hinge.position.set(BK.t / 2 - 0.005, 0, BK.D / 2 - 0.006); g.add(hinge);
      box(hinge, 0.01, BK.H, BK.D - 0.006, col, 0, 0, -(BK.D - 0.006) / 2);
      const cv = canvasTexture(512, 680, (c, w, h) => {
        c.fillStyle = CSS_COL(col); c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, 0, 36, h);
        drawLogo(c, b.id, w / 2, 250, 230);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 44px ' + FONT; c.fillText(b.name, w / 2, 470);
        c.font = '24px ' + FONT; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Ma veille informatique', w / 2, 520);
      });
      const outer = new T.Mesh(new T.PlaneGeometry(BK.D - 0.012, BK.H - 0.004), new T.MeshBasicMaterial({ map: cv.tex }));
      outer.rotation.y = Math.PI / 2; outer.position.set(0.0056, 0, -(BK.D - 0.006) / 2); hinge.add(outer);
      const inn = canvasTexture(512, 680, (c, w, h) => {
        c.fillStyle = '#efe7d2'; c.fillRect(0, 0, w, h);
        drawLogo(c, b.id, w / 2, 250, 220);
        c.fillStyle = '#1f1b14'; c.textAlign = 'center'; c.font = 'bold 40px ' + FONT; c.fillText(b.name, w / 2, 450);
        c.fillStyle = CSS_COL(col); c.font = '26px ' + FONT; c.fillText(b.tag, w / 2, 500);
      });
      const inner = new T.Mesh(new T.PlaneGeometry(BK.D - 0.012, BK.H - 0.004), new T.MeshBasicMaterial({ map: inn.tex }));
      inner.rotation.y = -Math.PI / 2; inner.position.set(-0.0056, 0, -(BK.D - 0.006) / 2); hinge.add(inner);
      shelf.add(g);
      g.traverse((o) => { if (o.isMesh) { o.userData.key = 'veille'; o.userData.book = b.id; clickable.push(o); } });
      return { id: b.id, g, hinge, slot, p: 0, target: 0 };
    });

    // ---------- Cadre CV (le vrai CV) ----------
    const cvFrame = new T.Group(); cvFrame.position.set(2.0, 1.95, -2.47); room.add(cvFrame);
    box(cvFrame, 0.82, 1.14, 0.04, 0xd4af37, 0, 0, 0);
    const cvImg = new T.TextureLoader().load('img/cv.webp?v=20261126b');
    cvImg.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const cvFace = new T.Mesh(new T.PlaneGeometry(0.74, 0.74 * 1.4142), new T.MeshBasicMaterial({ map: cvImg }));
    cvFace.position.z = 0.025; cvFrame.add(cvFace);
    register(cvFrame, 'cv');

    // ---------- Réveil (table de nuit) : heure et météo de Belfort ----------
    const stand = new T.Group(); stand.position.set(-2.65, 0, 2.05); room.add(stand);
    box(stand, 0.5, 0.5, 0.5, 0x2a3140, 0, 0.25, 0);
    box(stand, 0.05, 0.03, 0.02, 0x3fb950, 0.0, 0.4, 0.255);
    const clock = new T.Group(); clock.position.set(0, 0.5, 0); clock.rotation.y = 1.1; stand.add(clock);
    box(clock, 0.42, 0.3, 0.13, 0x1d9bb5, 0, 0.15, 0);
    [-0.14, 0.14].forEach((x) => { const bell = new T.Mesh(new T.SphereGeometry(0.065, 12, 8, 0, 6.3, 0, 1.6), mat(0xe9edf2)); bell.position.set(x, 0.31, 0); bell.castShadow = true; clock.add(bell); });
    box(clock, 0.014, 0.05, 0.014, 0x4a5160, 0, 0.35, 0);
    [-0.15, 0.15].forEach((x) => box(clock, 0.05, 0.025, 0.05, 0x0b0f16, x, 0.005, 0.04));
    const clockTex = canvasTexture(576, 360, () => {});
    const clockFace = new T.Mesh(new T.PlaneGeometry(0.36, 0.225), new T.MeshBasicMaterial({ map: clockTex.tex }));
    clockFace.position.set(0, 0.15, 0.066); clock.add(clockFace);
    register(stand, 'reveil');

    function drawIcon(c, id, day, cx, cy, s) {
      c.save(); c.translate(cx, cy); c.lineCap = 'round';
      const sunI = (dx, dy, k) => {
        c.fillStyle = c.strokeStyle = '#ffd24a'; c.lineWidth = s * 0.05;
        c.beginPath(); c.arc(dx, dy, s * 0.2 * k, 0, 7); c.fill();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(dx + Math.cos(a) * s * 0.3 * k, dy + Math.sin(a) * s * 0.3 * k); c.lineTo(dx + Math.cos(a) * s * 0.42 * k, dy + Math.sin(a) * s * 0.42 * k); c.stroke(); }
      };
      const moonI = (dx, dy, k) => {
        c.fillStyle = '#f3f0c8'; c.beginPath(); c.arc(dx, dy, s * 0.3 * k, 0, 7); c.fill();
        c.fillStyle = '#04100a'; c.beginPath(); c.arc(dx + s * 0.14 * k, dy - s * 0.08 * k, s * 0.26 * k, 0, 7); c.fill();
      };
      const cloudI = (dx, dy, col) => {
        c.fillStyle = col;
        c.beginPath(); c.arc(dx - s * 0.16, dy + s * 0.04, s * 0.17, 0, 7); c.arc(dx + s * 0.02, dy - s * 0.08, s * 0.22, 0, 7); c.arc(dx + s * 0.2, dy + s * 0.04, s * 0.16, 0, 7); c.fill();
        c.fillRect(dx - s * 0.16, dy + s * 0.04, s * 0.36, s * 0.17);
      };
      if (id === 'clear') { day ? sunI(0, 0, 1) : moonI(0, 0, 1); }
      else if (id === 'partly') { day ? sunI(-s * 0.14, -s * 0.12, 0.7) : moonI(-s * 0.14, -s * 0.12, 0.7); cloudI(s * 0.06, s * 0.1, '#cfd8e3'); }
      else if (id === 'fog') { c.strokeStyle = '#aab6c4'; c.lineWidth = s * 0.07; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-s * 0.36, i * s * 0.2); c.lineTo(s * 0.36, i * s * 0.2); c.stroke(); } }
      else {
        cloudI(0, -s * 0.1, id === 'storm' ? '#8d98a8' : '#cfd8e3');
        if (id === 'rain' || id === 'drizzle') { c.strokeStyle = '#5aa9ff'; c.lineWidth = s * 0.05; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.2 + s * 0.04, s * 0.2); c.lineTo(i * s * 0.2 - s * 0.04, s * 0.38); c.stroke(); } }
        if (id === 'snow') { c.fillStyle = '#fff'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * s * 0.2, s * 0.3, s * 0.045, 0, 7); c.fill(); } }
        if (id === 'storm') { c.fillStyle = '#ffd24a'; c.beginPath(); c.moveTo(s * 0.04, s * 0.12); c.lineTo(-s * 0.12, s * 0.34); c.lineTo(0, s * 0.34); c.lineTo(-s * 0.06, s * 0.5); c.lineTo(s * 0.14, s * 0.28); c.lineTo(s * 0.02, s * 0.28); c.closePath(); c.fill(); }
      }
      c.restore();
    }

    function drawClock() {
      const c = clockTex.ctx, w = clockTex.w, h = clockTex.h;
      const pn = Weather.parisNow(), k = Weather.kind();
      const hm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
      c.fillStyle = '#04100a'; c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.fillStyle = '#3dff86'; c.font = 'bold 128px ' + FONT;
      c.fillText(String(pn.h).padStart(2, '0') + (pn.s % 2 === 0 ? ':' : ' ') + String(pn.m).padStart(2, '0'), w / 2, 118);
      c.fillStyle = '#8affb4'; c.font = '30px ' + FONT;
      const d = Weather.parisDate();
      c.fillText(d.charAt(0).toUpperCase() + d.slice(1), w / 2, 164);
      c.strokeStyle = '#1f6f33'; c.lineWidth = 2; c.beginPath(); c.moveTo(30, 184); c.lineTo(w - 30, 184); c.stroke();
      if (Weather.ok) {
        drawIcon(c, k.id, Weather.isDay(), 100, 252, 110);
        c.textAlign = 'left';
        c.fillStyle = '#3dff86'; c.font = 'bold 64px ' + FONT; c.fillText(Math.round(Weather.temp) + ' °C', 180, 250);
        c.fillStyle = '#8affb4'; c.font = '30px ' + FONT; c.fillText(k.label, 180, 292);
        c.textAlign = 'center'; c.fillStyle = '#5fd68a'; c.font = '22px ' + FONT;
        c.fillText('Belfort · vent ' + Math.round(Weather.wind) + ' km/h · soleil ' + hm(Weather.sunrise) + ' → ' + hm(Weather.sunset), w / 2, 340);
      } else {
        c.fillStyle = '#5fd68a'; c.font = '30px ' + FONT; c.fillText('Belfort · météo indisponible', w / 2, 270);
      }
      clockTex.tex.needsUpdate = true;
    }

    // ---------- Décor non cliquable ----------
    const post = canvasTexture(256, 340, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1b2a6b'); g.addColorStop(1, '#6b1b8a');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.font = 'bold 38px ' + FONT; c.textAlign = 'center';
      c.fillText('</>', w / 2, 130); c.font = '18px ' + FONT; c.fillText('while(true)', w / 2, 200); c.fillText('{ code(); }', w / 2, 230);
    });
    const poster = new T.Group(); poster.position.set(-2.96, 1.95, -0.45); poster.rotation.y = Math.PI / 2; room.add(poster);
    box(poster, 0.7, 0.92, 0.03, 0x0b0f16, 0, 0, 0);
    const pf = new T.Mesh(new T.PlaneGeometry(0.62, 0.84), new T.MeshBasicMaterial({ map: post.tex })); pf.position.z = 0.02; poster.add(pf);

    // Fenêtre : le ciel est celui de Belfort en ce moment
    const sky = canvasTexture(256, 256, () => {});
    const winSky = Weather.createSky(sky.canvas, { small: true });   // ciel mis en mémoire : les nuages sont seulement déplacés
    winSky.resize(sky.w, sky.h);
    const win = new T.Group(); win.position.set(-2.96, 1.7, 1.2); win.rotation.y = Math.PI / 2; room.add(win);
    box(win, 1.0, 1.2, 0.05, 0x0b0f16, 0, 0, 0);
    const wf = new T.Mesh(new T.PlaneGeometry(0.88, 1.08), new T.MeshBasicMaterial({ map: sky.tex })); wf.position.z = 0.03; win.add(wf);
    box(win, 0.03, 1.08, 0.02, 0x0b0f16, 0, 0, 0.04);
    box(win, 0.88, 0.03, 0.02, 0x0b0f16, 0, 0, 0.04);

    const lamp = new T.Group(); lamp.position.set(2.7, 0, -2.1); room.add(lamp);
    box(lamp, 0.3, 0.04, 0.3, 0x1a202b, 0, 0.02, 0);
    box(lamp, 0.04, 1.9, 0.04, 0x1a202b, 0, 0.95, 0);
    box(lamp, 0.3, 0.25, 0.3, 0, 0, 1.95, 0, glow(0xffd699));

    const plant = new T.Group(); plant.position.set(2.6, 0, 0.5); room.add(plant);
    box(plant, 0.3, 0.3, 0.3, 0xc0603a, 0, 0.15, 0);
    [[0, 0.5, 0, 0.3], [0.1, 0.62, 0.05, 0.22], [-0.1, 0.58, -0.06, 0.24]].forEach(([x, y, z, s]) => box(plant, s, s, s, 0x2f9e4f, x, y, z));

    // Ballon de foot : un icosaèdre tronqué (12 pentagones noirs, 20 hexagones blancs) gonflé en sphère.
    // Les pièces sont posées une à une sur la sphère, avec une couture foncée et douce sur leurs bords ;
    // les normales sont celles d'une sphère, donc l'éclairage est lisse (pas de facettes).
    function footballGeometry(r) {
      const t = (1 + Math.sqrt(5)) / 2;
      const V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]
        .map((v) => new T.Vector3(v[0], v[1], v[2]));
      const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      const third = (a, b) => V[a].clone().lerp(V[b], 1 / 3);
      const panels = [];
      // Un hexagone par face de l'icosaèdre, un pentagone autour de chaque sommet
      F.forEach((f) => panels.push({ black: false, pts: [third(f[0], f[1]), third(f[1], f[0]), third(f[1], f[2]), third(f[2], f[1]), third(f[2], f[0]), third(f[0], f[2])] }));
      V.forEach((v, i) => {
        const pts = [];
        F.filter((f) => f.includes(i)).forEach((f) => f.filter((k) => k !== i).forEach((k) => {
          const p = third(i, k); if (!pts.some((q) => q.distanceTo(p) < 1e-6)) pts.push(p);
        }));
        const n = v.clone().normalize(), u = pts[0].clone().sub(v).normalize(), w = n.clone().cross(u);
        const ang = (p) => Math.atan2(p.clone().sub(v).dot(w), p.clone().sub(v).dot(u));
        pts.sort((p, q) => ang(p) - ang(q));
        panels.push({ black: true, pts });
      });

      const white = new T.Color(0xf6f6f3), black = new T.Color(0x14161a), seam = new T.Color(0x23262c);
      const N = 6, pos = [], nor = [], col = [], tmp = new T.Color();
      const onSphere = (p) => p.clone().normalize().multiplyScalar(r);
      panels.forEach((pn) => {
        const c = pn.pts.reduce((m, p) => m.add(p), new T.Vector3()).multiplyScalar(1 / pn.pts.length);
        const ring = pn.pts.map((p) => c.clone().lerp(p, 0.965));       // petit écart entre les pièces
        const base = pn.black ? black : white;
        ring.forEach((p, k) => {
          const q = ring[(k + 1) % ring.length];
          // Triangle (centre, p, q) découpé en petits triangles, chaque sommet reçoit sa couleur
          const P = (i, j) => c.clone().add(p.clone().sub(c).multiplyScalar(i / N)).add(q.clone().sub(c).multiplyScalar(j / N));
          const push = (i, j, flip) => {
            const s = onSphere(P(i, j)), edge = Math.max(0, 1 - (1 - (i + j) / N) / 0.26);   // 1 sur le bord de la pièce, 0 au-delà
            tmp.copy(base).lerp(seam, 0.85 * edge * edge * (3 - 2 * edge));
            pos.push(s.x, s.y, s.z); nor.push(s.x / r, s.y / r, s.z / r); col.push(tmp.r, tmp.g, tmp.b);
          };
          const tri = (A, B, C) => {
            // Triangle toujours tourné vers l'extérieur, quel que soit le sens de parcours de la pièce
            const a = onSphere(P(A[0], A[1])), b = onSphere(P(B[0], B[1])), d = onSphere(P(C[0], C[1]));
            const out = b.clone().sub(a).cross(d.clone().sub(a)).dot(a) >= 0;
            (out ? [A, B, C] : [A, C, B]).forEach((v) => push(v[0], v[1]));
          };
          for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) {
            tri([i, j], [i + 1, j], [i, j + 1]);
            if (j < N - i - 1) tri([i + 1, j], [i + 1, j + 1], [i, j + 1]);
          }
        });
      });
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      return g;
    }
    const ballG = new T.Group(); ballG.position.set(1.6, 0.14, 0.95); room.add(ballG);
    const ballTilt = new T.Group(); ballTilt.rotation.set(0.5, 0, 0.35); ballG.add(ballTilt);   // axe de rotation incliné
    const ball = new T.Group(); ballTilt.add(ball);                                              // tourne sur lui-même
    const ballSkin = new T.MeshPhongMaterial({ vertexColors: true, shininess: 24, specular: 0x2c2c2c });
    ballSkin.userData.glow = true;      // pas de lueur au survol : elle grisonnerait les pentagones noirs
    const ballShell = new T.Mesh(footballGeometry(0.14), ballSkin);
    ballShell.castShadow = true; ball.add(ballShell);
    const ballCore = new T.Mesh(new T.SphereGeometry(0.1385, 24, 16), new T.MeshLambertMaterial({ color: 0x23262c }));
    ballCore.userData.glow = false; ball.add(ballCore);                                          // visible dans les écarts entre pièces
    register(ballG, 'apropos');

    // ---------- Étiquettes ----------
    const pinDefs = [
      { key: 'apropos', label: 'À propos', pos: () => headWorld.clone().add(new T.Vector3(0, 0.35, 0)) },
      { key: 'projets', label: 'Projets', pos: () => new T.Vector3(1.0, 1.75, -2.2) },
      { key: 'competences', label: 'Compétences', pos: () => new T.Vector3(-2.2, 2.45, -2.07) },
      { key: 'parcours', label: 'Parcours', pos: () => new T.Vector3(-2.35, 1.2, 0.5) },
      { key: 'veille', label: 'Veille', pos: () => new T.Vector3(-0.95, 2.1, -2.3) },
      { key: 'contact', label: 'Contact', pos: () => new T.Vector3(1.85, 1.05, -1.72) },
      { key: 'cv', label: 'CV', pos: () => new T.Vector3(2.0, 2.65, -2.47) },
    ];

    // ---------- Interaction ----------
    const ray = new T.Raycaster();
    const ndc = new T.Vector2();
    let hoverKey = null;

    function paint(key, on) {
      if (!key || !byKey[key]) return;
      byKey[key].forEach((m) => {
        const mt = m.material;
        if (!mt.emissive || mt.userData.glow) return;
        if (on) mt.emissive.copy(mt.color).multiplyScalar(0.5); else mt.emissive.setHex(0);
      });
    }
    function setHover(key) {
      if (key === hoverKey) return;
      paint(hoverKey, false);
      hoverKey = key;
      paint(key, true);
      canvas.classList.toggle('is-pointer', !!key);
      if (handlers.onHover) handlers.onHover(key);
    }
    function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
    function pick(ev) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(room.visible ? clickable : clickWorld, false).find((h) => shown(h.object));
      return hit ? { key: hit.object.userData.key, book: hit.object.userData.book, level: hit.object.userData.level } : null;
    }

    let down = null, hoverPending = null, busy = false;
    canvas.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      canvas.classList.add('is-grabbing');
    });
    window.addEventListener('pointercancel', () => { down = null; canvas.classList.remove('is-grabbing'); });
    window.addEventListener('pointerup', (e) => {
      canvas.classList.remove('is-grabbing');
      if (!down || !e.isPrimary) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 700;
      down = null;
      if (e.target !== canvas || moved > 8 || !quick || tween || busy) return;
      const hit = pick(e);
      if (api.mode === 'parcours' && hit && hit.level != null) { setLevel(hit.level); return; }
      if (api.mode === 'veille') {
        if (hit && hit.book) { toggleBook(hit.book); return; }
        if (openBook) { toggleBook(openBook); return; }
      }
      if (hit && handlers.onPick) handlers.onPick(hit.key);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || down) return;
      hoverPending = e;
    });
    canvas.addEventListener('pointerleave', () => { hoverPending = null; setHover(null); });

    // ---------- Livres ----------
    let openBook = null;
    function toggleBook(id) {
      const same = openBook === id;
      books.forEach((b) => { b.target = b.id === id && !same ? 1 : 0; });
      openBook = same ? null : id;
      if (handlers.onBook) handlers.onBook(openBook, openBook ? BOOKS.find((b) => b.id === openBook).name : null);
    }

    // ---------- Limites de la caméra (ouvertes pendant les déplacements animés) ----------
    const ROOM_LIMITS = { minDistance: 2.2, maxDistance: 17, minAzimuthAngle: HOME_AZ - Math.PI / 2, maxAzimuthAngle: HOME_AZ + Math.PI / 2, minPolarAngle: 0, maxPolarAngle: 1.62, enablePan: true };
    let limits = Object.assign({}, ROOM_LIMITS), holdLimits = false;
    function openLimits() { Object.assign(controls, { minDistance: 0.01, maxDistance: 500, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, minPolarAngle: 0, maxPolarAngle: Math.PI }); }
    function applyLimits() { if (!holdLimits) Object.assign(controls, limits); }

    // ---------- Caméra : déplacements animés ----------
    let tween = null, locked = false;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeIn = (t) => t * t * t;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function flyTo(pos, target, dur, done, opts) {
      opts = opts || {};
      tween = { t: 0, start: performance.now(), dur: reduceMotion ? 0.01 : dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, done, via: opts.via || null, ease: opts.ease || ease };
      controls.enabled = false;
      springAt = Infinity;
      openLimits();
    }

    // Zone libre de l'écran (hors fenêtres, titres, barres) : les objets sont cadrés dedans
    const insets = { top: 0, right: 0, bottom: 0, left: 0 };
    function fitDist(w, h, fillW, fillH) {
      const fw = Math.max(0.3, (W - insets.left - insets.right) / W), fh = Math.max(0.3, (H - insets.top - insets.bottom) / H);
      const tan = Math.tan(T.MathUtils.degToRad(camera.fov / 2)) / camera.zoom;
      return Math.max(h / (fillH * fh * 2 * tan), w / (fillW * fw * 2 * tan * camera.aspect));
    }
    const V = (x, y, z) => new T.Vector3(x, y, z);
    function facing(center, normal, w, h, fillW, fillH) {
      const d = fitDist(w, h, fillW, fillH);
      return { target: center.clone(), pos: center.clone().add(normal.clone().multiplyScalar(d)) };
    }

    // Parcours : un niveau (une île) à la fois
    let level = 0;
    const levelPose = (n) => (n === 0
      ? facing(V(0, WY + 3.4, 0), V(0, 0.12, 1).normalize(), 38, 9, 0.92, 0.8)
      : facing(ISLE[n - 1].clone().add(V(0, 2.5, 0)), V(0.15, 0.08, 1).normalize(), 6.4, 8.2, 0.92, 0.9));
    function setLevel(n) {
      if (busy) return;
      level = Math.max(0, Math.min(TIMELINE.length, n));
      const p = levelPose(level);
      const via = camera.position.clone().lerp(p.pos, 0.5);
      via.y += Math.min(6, camera.position.distanceTo(p.pos) * 0.18);
      flyTo(p.pos, p.target, 0.7, null, { via });
      if (handlers.onLevel) handlers.onLevel(level, TIMELINE.length, level ? TIMELINE[level - 1] : null);
    }

    function poseFor(key) {
      switch (key) {
        case 'apropos': {
          // Baptiste en entier, la tête dans le tiers haut de la zone libre
          const t = V(who.position.x, 0.95, who.position.z);
          const d = Math.max(2.4, fitDist(1.1, 1.95, 0.62, 0.58));
          return { target: t, pos: t.clone().add(V(Math.sin(0.45) * d, 0.42 * d / 2.4, Math.cos(0.45) * d)) };
        }
        case 'projets': return facing(V(SCREEN.x, SCREEN.y, SCREEN.z), V(0, 0, 1), SCREEN.w, SCREEN.h, 0.94, 0.9);
        case 'cv': return facing(V(2.0, 1.95, -2.45), V(0, 0, 1), 0.82, 1.14, 0.8, 0.85);
        case 'competences': return facing(V(-2.2, 1.15, -1.95), V(0, 0.12, 1).normalize(), 1.35, 2.3, 0.78, 0.8);
        case 'veille': return facing(V(-0.95, 1.0, -2.2), V(0, 0.05, 1), 1.1, 1.95, 0.9, 0.85);
        case 'parcours': return levelPose(0);
        case 'reveil': {
          clock.updateMatrixWorld(true);
          const c = new T.Vector3(), n = new T.Vector3();
          clockFace.getWorldPosition(c); clockFace.getWorldDirection(n);
          return { target: c, pos: c.clone().add(n.multiplyScalar(fitDist(0.36, 0.225, 0.7, 0.7))) };
        }
        default: { const t = V(1.85, 0.85, -1.72); return { target: t, pos: t.clone().add(V(0.8, 1.2, 2.0)) }; }
      }
    }

    // État des animations propres à chaque rubrique
    const state = { doors: 0, doorsT: 0, world: 0, worldT: 0, presence: 1, presenceT: 1 };
    let saved = null, springAt = Infinity, springPose = null;
    const LOCKED = ['projets', 'cv', 'competences', 'parcours'];

    function setMode(key) {
      api.mode = key;
      focusKey = FOCUS[key] ? key : null;
      if (focusKey) {
        const f = FOCUS[key];
        focusLight.target.position.set(f[0], f[1], f[2]);
        focusLight.position.set(f[0] + 0.4, f[1] + 1.9, f[2] + 1.8);
      }
      state.doorsT = key === 'competences' ? 1 : 0;
      state.worldT = key === 'parcours' ? 1 : 0;
      state.presenceT = key === 'projets' || key === 'parcours' ? 0 : 1;
      if (key !== 'veille' && openBook) toggleBook(openBook);
      locked = LOCKED.includes(key);
      level = 0;
      springPose = null;
      limits = Object.assign({}, ROOM_LIMITS);
      if (key) limits.minDistance = key === 'reveil' ? 0.3 : (['cv', 'veille', 'competences', 'parcours'].includes(key) ? 0.35 : 0.8);
      if (key === 'parcours') limits.maxDistance = 90;
      if (key === 'veille') {
        // Veille : on peut bouger un peu autour de la bibliothèque, puis la vue revient en face
        const p = poseFor('veille'), off = p.pos.clone().sub(p.target), d = off.length();
        const az = Math.atan2(off.x, off.z), pol = Math.acos(off.y / d);
        springPose = p;
        Object.assign(limits, { minAzimuthAngle: az - 0.42, maxAzimuthAngle: az + 0.42, minPolarAngle: pol - 0.3, maxPolarAngle: Math.min(1.62, pol + 0.22), minDistance: d * 0.55, maxDistance: d * 1.2, enablePan: false });
      }
    }
    controls.addEventListener('start', () => { springAt = Infinity; });
    controls.addEventListener('end', () => { if (springPose) springAt = performance.now() + 650; });

    // ---------- Passage chambre <-> monde du parcours ----------
    // Plongée dans l'écran du portable, flash lumineux, puis descente à travers les nuages
    const warp = document.createElement('div');
    warp.className = 'warp'; warp.setAttribute('aria-hidden', 'true');
    container.appendChild(warp);
    const WARP_MS = reduceMotion ? 0 : 240;
    let seq = 0;
    function laptopView(dist) {
      bed.updateMatrixWorld(true);
      const c = new T.Vector3(), n = new T.Vector3();
      lscr.getWorldPosition(c); lscr.getWorldDirection(n);
      return { target: c, pos: c.clone().add(n.multiplyScalar(dist)) };
    }
    function puffsAlong(a, b, spread) {
      puffs.forEach((p, i) => {
        const t = i / (puffs.length - 1);
        p.g.position.set(a.x + (b.x - a.x) * t + (rnd() - 0.5) * spread, a.y + (b.y - a.y) * t + (rnd() - 0.5) * spread * 0.4, a.z + (b.z - a.z) * t + (rnd() - 0.5) * spread);
        p.g.rotation.y = rnd() * 6;
      });
    }
    const transit = (on) => { if (handlers.onTransit) handlers.onTransit(on); };
    function toSky(dest, finish, my) {
      busy = true; holdLimits = true; transit(true);
      const lv = laptopView(0.32);
      flyTo(lv.pos, lv.target, 0.5, () => {
        if (my !== seq) return;
        warp.classList.add('is-on');
        setTimeout(() => {
          if (my !== seq) return;
          room.visible = false; world.visible = true; sea.visible = true;
          const start = dest.pos.clone().add(V(-6, 30, 16));
          const via = dest.pos.clone().add(V(-14, 6, 8));
          camera.position.copy(start);
          controls.target.copy(dest.target.clone().add(V(0, -10, 0)));
          puffsAlong(start.clone().lerp(via, 0.25), via.clone().lerp(dest.pos, 0.35), 9);
          puffs.forEach((p) => { p.s = 1; });
          cloudsT = 1;
          warp.classList.remove('is-on');
          flyTo(dest.pos, dest.target, 1.1, () => { cloudsT = 0; busy = false; holdLimits = false; applyLimits(); transit(false); finish(); }, { via, ease: easeOut });
        }, WARP_MS);
      }, { ease: easeIn });
    }
    function fromSky(dest, finish, my) {
      busy = true; holdLimits = true; transit(true);
      const up = camera.position.clone().add(V(4, 16, 10));
      puffsAlong(camera.position.clone().add(V(0, 5, 3)), up, 8);
      cloudsT = 1;
      flyTo(up, controls.target.clone().add(V(0, 6, 0)), 0.5, () => {
        if (my !== seq) return;
        warp.classList.add('is-on');
        setTimeout(() => {
          if (my !== seq) return;
          cloudsT = 0; puffs.forEach((p) => { p.s = 0; });
          world.visible = false; sea.visible = false; room.visible = true;
          const lv = laptopView(0.32);
          camera.position.copy(lv.pos); controls.target.copy(lv.target);
          warp.classList.remove('is-on');
          flyTo(dest.pos, dest.target, 0.8, () => { busy = false; holdLimits = false; applyLimits(); transit(false); finish(); }, { ease: easeOut });
        }, WARP_MS);
      }, { ease: easeIn });
    }
    // Si l'animation est interrompue (autre rubrique choisie), on remet la bonne scène
    function settleScene(key) {
      cloudsT = 0;
      warp.classList.remove('is-on');
      const sky = key === 'parcours';
      room.visible = !sky; world.visible = sky; sea.visible = sky;
      busy = false; holdLimits = false; transit(false);
    }

    function enter(key, done) {
      if (!saved) saved = { pos: camera.position.clone(), target: controls.target.clone() };
      const was = api.mode;
      const inSky = world.visible && !room.visible;
      if (busy) settleScene(was);
      setMode(key);
      const my = ++seq;
      const p = poseFor(key);
      const finish = () => { if (my !== seq) return; if (done) done(); };
      if (key === 'parcours' && !(was === 'parcours' && inSky)) toSky(p, finish, my);
      else if (key !== 'parcours' && world.visible && !room.visible) fromSky(p, finish, my);
      else flyTo(p.pos, p.target, 0.75, finish);
    }
    function exit(done) {
      const was = api.mode;
      if (busy) settleScene(was);
      setMode(null);
      const my = ++seq;
      const s = saved || { pos: HOME_POS.clone(), target: HOME_TARGET.clone() };
      saved = null;
      const finish = () => { if (my !== seq) return; if (done) done(); };
      if (world.visible && !room.visible) fromSky(s, finish, my); else flyTo(s.pos, s.target, 0.7, finish);
    }
    // Recadrage après un changement de taille d'écran ou de la zone libre
    function refit(done) {
      if (!api.mode || busy) return;
      const p = api.mode === 'parcours' ? levelPose(level) : poseFor(api.mode);
      if (springPose) springPose = p;
      flyTo(p.pos, p.target, 0.35, done);
    }

    // Rectangle de l'écran du PC dans la page (pour le navigateur posé dessus)
    function screenRect() {
      camera.updateMatrixWorld();
      const pts = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => api.project(V(SCREEN.x + sx * SCREEN.w / 2, SCREEN.y + sy * SCREEN.h / 2, SCREEN.z)));
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    }

    // ---------- Redimensionnement et décalage de la vue (fenêtre ouverte) ----------
    let W = 1, H = 1;
    const shift = { x: 0, y: 0, tx: 0, ty: 0 };
    function applyView() {
      camera.zoom = Math.min(1, Math.max(0.42, camera.aspect / 1.35));
      if (shift.x || shift.y) camera.setViewOffset(W, H, shift.x, shift.y, W, H); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    function resize() {
      W = container.clientWidth || 1; H = container.clientHeight || 1;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      applyView();
      if (api.onResize) api.onResize();
    }

    // ---------- Boucle ----------
    const clock3 = new T.Clock();
    const projV = new T.Vector3();
    const minT = new T.Vector3(-3, 0, -2.5), maxT = new T.Vector3(3, 2.8, 2.5);
    let waving = true, typed = -1, lastTyped = 0, lastSlow = -9, lastSky = -9, curDay = 1, frameN = 0, lastHover = -9;
    // Résolution adaptative : si l'appareil peine (moins de ~45 images/s), on réduit la densité de pixels
    const PR_MAX = renderer.getPixelRatio(), PR_MIN = Math.min(PR_MAX, 0.75);
    let pr = PR_MAX, avg = 1 / 60, adaptT = -3, slowChecks = 0;   // adaptT négatif : 3 s de chauffe avant de juger
    function adapt(dt) {
      if (document.hidden || dt <= 0) return;
      avg += (dt - avg) * 0.05;
      adaptT += dt;
      if (adaptT < 1.5) return;
      adaptT = 0;
      let next = pr;
      if (avg > 1 / 45 && pr > PR_MIN) next = Math.max(PR_MIN, pr - 0.25);
      else if (avg < 1 / 57 && pr < PR_MAX) next = Math.min(PR_MAX, pr + 0.25);
      if (next !== pr) { pr = next; renderer.setPixelRatio(pr); renderer.setSize(W, H); }
      // Garde-fou : même à la résolution minimale, moins de ~24 images/s pendant plusieurs secondes
      // => la chambre est trop lourde pour cet appareil, on passe à la vue classique (sauf si le visiteur a forcé la 3D)
      if (pr <= PR_MIN && avg > 0.042 && !(window.PORTFOLIO && window.PORTFOLIO.force)) {
        if (++slowChecks >= 4 && handlers.onLost) { slowChecks = -99; handlers.onLost(); }
      } else if (slowChecks > 0) slowChecks--;
    }
    const dayCol = new T.Color(0xbcd0f0), nightCol = new T.Color(0x3a4a78);

    function applyWeather() {
      const pn = Weather.parisNow(), f = Weather.dayFactor(pn.minutes), k = Weather.kind();
      const cloud = k.cloud;
      curDay = f;
      ambient.color.copy(nightCol).lerp(dayCol, f);
      lightBase.ambient = 0.4 + 0.38 * f * (1 - 0.35 * cloud);
      lightBase.sun = (0.12 + 0.7 * f) * (1 - 0.6 * cloud);
      sun.color.setHex(f > 0.05 && f < 0.6 ? 0xffd2a0 : 0xffffff);
      lightBase.lamp = 0.55 + 0.7 * (1 - f);
      lightBase.sky = 0.1 + 0.8 * f * (1 - 0.5 * cloud);
      skyLight.color.setHex(f > 0.5 ? 0xcfe4ff : 0x5a74b8);
      drawClock();
    }

    const api = {
      onFrame: null, onResize: null, mode: null,
      pins: pinDefs.map((p) => ({ key: p.key, label: p.label })),
      enter, exit, refit, toggleBook, screenRect, setLevel,
      get busy() { return busy || !!tween; },
      setSkills(list) { try { buildVitrine(list); } catch (e) { /* la vitrine est un décor : on continue sans */ } },
      setWaving(v) { waving = v; },
      // Marges occupées par l'interface : la vue se décale et les objets sont cadrés dans la zone libre
      setInsets(ins) {
        Object.assign(insets, { top: 0, right: 0, bottom: 0, left: 0 }, ins);
        shift.tx = (insets.right - insets.left) / 2; shift.ty = (insets.bottom - insets.top) / 2;
      },
      setHover(k) { setHover(k); },
      intro(done) {
        const end = camera.position.clone();
        camera.position.set(-5, 6.5, 8.5);
        controls.update();
        flyTo(end, controls.target.clone(), 1.8, done);
      },
      headPosition() { head.getWorldPosition(headWorld); return headWorld.clone().add(new T.Vector3(0.0, 0.42, 0)); },
      project(v) {
        projV.copy(v).project(camera);
        return { x: (projV.x * 0.5 + 0.5) * W, y: (-projV.y * 0.5 + 0.5) * H, ok: projV.z < 1 };
      },
      pinPosition(key) { const d = pinDefs.find((p) => p.key === key); return api.project(d.pos()); },
    };

    new ResizeObserver(resize).observe(container);
    resize();
    Weather.onChange(applyWeather);
    applyWeather();

    function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(clock3.getDelta(), 0.05);
      const t = clock3.elapsedTime;

      if (tween) {
        tween.t = (performance.now() - tween.start) / (tween.dur * 1000);   // heure réelle : durée constante, même à 10 images/s
        const k = tween.ease(Math.min(tween.t, 1));
        if (tween.via) {
          // courbe de Bézier quadratique : départ -> point de passage -> arrivée
          const a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
          camera.position.set(
            a * tween.p0.x + b * tween.via.x + c * tween.p1.x,
            a * tween.p0.y + b * tween.via.y + c * tween.p1.y,
            a * tween.p0.z + b * tween.via.z + c * tween.p1.z);
        } else camera.position.lerpVectors(tween.p0, tween.p1, k);
        controls.target.lerpVectors(tween.t0, tween.t1, k);
        if (tween.t >= 1) { const d = tween.done; tween = null; controls.enabled = !locked; applyLimits(); if (d) d(); }
      }
      // Veille : après un déplacement, la vue revient doucement en face de la bibliothèque
      if (!tween && springPose && performance.now() > springAt) {
        const k = Math.min(1, dt * 3.2);
        camera.position.lerp(springPose.pos, k);
        controls.target.lerp(springPose.target, k);
        if (camera.position.distanceToSquared(springPose.pos) < 1e-5) springAt = Infinity;
      }
      controls.update();
      if (!tween && controls.enabled && api.mode !== 'parcours') {
        const cp = camera.position;
        if (cp.x < -2.7 || cp.z < -2.3) { cp.x = Math.max(cp.x, -2.7); cp.z = Math.max(cp.z, -2.3); camera.lookAt(controls.target); }
      }
      if (!tween && api.mode !== 'parcours') {
        const c = controls.target.clone().clamp(minT, maxT);
        if (!c.equals(controls.target)) { camera.position.add(c.clone().sub(controls.target)); controls.target.copy(c); }
      }

      const dx = shift.tx - shift.x, dy = shift.ty - shift.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { shift.x += dx * 0.12; shift.y += dy * 0.12; applyView(); }

      // Baptiste
      head.rotation.y = Math.sin(t * 0.7) * 0.12;
      head.rotation.x = Math.sin(t * 1.3) * 0.03;
      who.rotation.y = 0.8 + Math.sin(t * 0.5) * 0.05;
      arms.forEach((a) => {
        const isWave = waving && a.side === -1;
        const rz = isWave ? -2.55 : a.side * 0.05, rx = isWave ? 0 : -0.25;
        a.shoulder.rotation.z += (rz - a.shoulder.rotation.z) * 0.12;
        a.shoulder.rotation.x += (rx - a.shoulder.rotation.x) * 0.12;
        const fx = isWave ? 0 : -1.3, fz = isWave ? Math.sin(t * 7) * 0.5 : 0;
        a.fore.rotation.x += (fx - a.fore.rotation.x) * 0.12;
        a.fore.rotation.z += (fz - a.fore.rotation.z) * 0.3;
      });
      ball.rotation.y = t * 0.6;
      ballG.position.y = 0.14 + (hoverKey === 'apropos' ? Math.abs(Math.sin(t * 6)) * 0.12 : 0);

      // Baptiste se pousse quand on regarde l'écran ou le parcours
      state.presence += (state.presenceT - state.presence) * Math.min(1, dt * 6);
      who.scale.setScalar(Math.max(0.001, state.presence));
      who.visible = state.presence > 0.03;

      // Armoire : les portes s'ouvrent
      state.doors += (state.doorsT - state.doors) * Math.min(1, dt * 3.2);
      const dAng = smooth(state.doors) * 1.75;
      doors[0].pivot.rotation.y = -dAng; doors[1].pivot.rotation.y = dAng;
      wardLight.intensity = smooth(state.doors) * 1.4;

      // Parcours : monde au-dessus des nuages
      state.world += (state.worldT - state.world) * Math.min(1, dt * 4);
      worldHemi.intensity = state.world * (0.5 + 0.4 * curDay);
      let anyPuff = false;
      puffs.forEach((p) => {
        p.s += (cloudsT - p.s) * Math.min(1, dt * p.rate);
        const on = p.s > 0.01;
        p.g.visible = on; if (on) { anyPuff = true; p.g.scale.setScalar(p.s * p.size); }
      });
      clouds.visible = anyPuff;
      if (world.visible) {
        wAnim.forEach((f) => f(t));
        wCards.forEach((c) => {
          c.card.position.y = c.base + Math.sin(t * 1.2 + c.i) * 0.08;
          const mt = c.card.material, want = level === 0 || level === c.i + 1 ? 1 : 0.1;
          mt.opacity += (want - mt.opacity) * Math.min(1, dt * 6);
        });
        seaClouds.forEach((g) => { g.position.x += dt * 0.5; if (g.position.x > 48) g.position.x -= 96; });
      }

      // Livres
      books.forEach((b) => {
        const dir = Math.sign(b.target - b.p);
        if (dir) b.p += dir * Math.min(Math.abs(b.target - b.p), dt / 1.7);
        const pull = smooth(b.p / 0.2), e = smooth((b.p - 0.2) / 0.4), open = smooth((b.p - 0.6) / 0.4);
        const sc = 1 + 1.55 * e;
        b.g.scale.setScalar(sc);
        b.g.rotation.y = (-Math.PI / 2) * e;
        const dispX = open * 0.12 * sc, dispY = 1.1, dispZ = 1.2;
        b.g.position.set(
          b.slot.x + (dispX - b.slot.x) * e,
          b.slot.y + (dispY - b.slot.y) * e,
          b.slot.z + pull * 0.26 + (dispZ - (b.slot.z + 0.26)) * e);
        b.hinge.rotation.y = -Math.PI * open;
      });

      // code qui s'écrit à l'écran du PC
      if (api.mode !== 'projets' && t - lastTyped > 0.09) {
        lastTyped = t;
        typed = (typed + 1) % 330;
        drawScreen(screenTex.ctx, screenTex.w, screenTex.h, typed > 280 ? 999 : typed);
        screenTex.tex.needsUpdate = true;
      }
      // ciel de la fenêtre (météo réelle)
      if (room.visible && t - lastSky > 0.04) {
        lastSky = t;
        winSky.frame(t * 1000);
        sky.tex.needsUpdate = true;
      }
      if (t - lastSlow > 1) { lastSlow = t; applyWeather(); }

      if (hoverPending && t - lastHover > 0.045) {
        const ev = hoverPending; hoverPending = null; lastHover = t;
        const k = pick(ev); setHover(k ? k.key : null);
      }

      // Mise en lumière de l'objet de la rubrique ouverte
      focus += ((focusKey ? 1 : 0) - focus) * Math.min(1, dt * 3);
      focusLight.intensity = focus * 1.7;
      ambient.intensity = lightBase.ambient * (1 - 0.4 * focus);
      sun.intensity = lightBase.sun * (1 - 0.5 * focus);
      lampLight.intensity = lightBase.lamp * (1 - 0.35 * focus);
      skyLight.intensity = lightBase.sky * (1 - 0.4 * focus);
      const lit = focusKey && byKey[focusKey] ? byKey[focusKey] : [];
      if (lit !== focusLit) { focusLit.forEach((m) => { if (m.material.emissive && !m.material.userData.glow) m.material.emissive.setHex(0); }); focusLit = lit; }
      if (hoverKey !== focusKey) {
        const k = focus * (0.07 + 0.04 * Math.sin(t * 2.2));
        lit.forEach((m) => { const mt = m.material; if (mt.emissive && !mt.userData.glow) mt.emissive.copy(mt.color).multiplyScalar(k); });
      }

      // Ombres recalculées une image sur trois (elles bougent peu), résolution adaptée à la vitesse de l'appareil
      if (renderer.shadowMap.enabled && (frameN++ % 3 === 0)) renderer.shadowMap.needsUpdate = true;
      adapt(dt);
      renderer.render(scene, camera);
      if (api.onFrame) api.onFrame();
    }
    who.updateMatrixWorld(true);
    head.getWorldPosition(headWorld);
    frame();

    return api;
  }

  window.Room = { create };
})();
