// Construit les fichiers minifiés servis par le site (npm run build).
// Les sources restent lisibles et modifiables :
//   css/style.css + css/classic.css  ->  css/site.min.css   (un seul fichier, une seule requête)
//   js/boot.js, main.js, room.js, weather.js  ->  js/*.min.js
// Le numéro de version (?v=...) est recalculé à partir du contenu : le navigateur
// recharge un fichier seulement quand il a changé.
import { transform } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const write = (p, s) => writeFile(new URL(p, root), s);

const JS = ['boot', 'main', 'room', 'weather'];
const sources = [await read('css/style.css'), await read('css/classic.css'), ...(await Promise.all(JS.map((n) => read(`js/${n}.js`))))];
const version = createHash('sha1').update(sources.join('\n')).digest('hex').slice(0, 8);

// CSS : les deux feuilles réunies et minifiées
const css = await transform(sources[0] + '\n' + sources[1], { loader: 'css', minify: true, target: ['chrome100', 'firefox100', 'safari15'] });
await write('css/site.min.css', css.code);

// JS : chaque script minifié séparément (la 3D n'est chargée que si elle est utilisée)
for (const [i, n] of JS.entries()) {
  let code = sources[2 + i];
  if (n === 'boot') code = code.replace(/var V = '\?v=[^']*';/, `var V = '?v=${version}';`);
  const out = await transform(code, { loader: 'js', minify: true, target: 'es2019' });
  await write(`js/${n}.min.js`, out.code);
}

// index.html : nouvelles versions des fichiers construits
const html = (await read('index.html')).replace(/((?:site\.min\.css|boot\.min\.js|main\.min\.js)\?v=)[\w]+/g, `$1${version}`);
await write('index.html', html);
console.log('Construit (version ' + version + ') : css/site.min.css, ' + JS.map((n) => `js/${n}.min.js`).join(', '));
