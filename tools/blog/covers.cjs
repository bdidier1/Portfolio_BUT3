// Génère les illustrations des articles du blog : node tools/blog/covers.cjs (puis conversion en webp)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(__dirname, 'covers.html'));
  await p.evaluate(() => document.fonts.ready);
  for (const id of ['ia', 'web', 'python', 'perf']) await p.locator('#' + id).screenshot({ path: path.resolve(__dirname, '../../img/blog/' + id + '.png') });
  await b.close();
})();
