// Génère img/chambre-3d.webp : image de la chambre affichée à la place de la 3D quand le rendu est logiciel.
// Usage : (serveur local sur le port 8124) node tools/poster.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await p.goto('http://localhost:8124/?vue=3d');
  await p.waitForTimeout(800);
  await p.mouse.click(800, 450);               // premier geste : lance la vraie 3D
  await p.waitForSelector('#scene canvas', { timeout: 30000 });
  await p.waitForTimeout(9000);                 // fin de l'introduction
  await p.addStyleTag({ content: 'body > *:not(#scene):not(#sky){visibility:hidden!important} #scene{left:0!important}' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: process.argv[2] || 'poster.png' });
  await b.close();
})();
