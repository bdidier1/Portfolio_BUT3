// Génère cv/DIDIER_Baptiste_CV.pdf et img/cv.webp à partir de tools/cv/cv.html (Playwright + Chromium).
const { chromium } = require('playwright');
const root = require('path').resolve(__dirname, '../..') + '/';
(async () => {
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2.4 });
await p.goto('file://' + root + 'tools/cv/cv.html');
await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: root + 'cv/DIDIER_Baptiste_CV.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
await p.screenshot({ path: root + "tools/cv/cv.png" });
await b.close();
})();
