# Portfolio – Baptiste Didier

Portfolio de Baptiste Didier, étudiant en 3e année de BUT Informatique (parcours Réalisation d'applications) à l'IUT Nord Franche-Comté.

**Site en ligne :** https://bdidier1.github.io/Portfolio_BUT3/

## Contenu

Le contenu suit les attentes du cours « Portfolio – book » :

- **À propos** : présentation courte, qualités, centres d'intérêt, formation en bref
- **Projets** : le stage de 2e année chez EzDEV en premier (avec les captures du rapport de stage), puis sept projets détaillés (ParkTracker, GP Explorer, CutLocal, AUTO YTB, PuissanceX, Boutique de câbles, Pauvocodeur) ; pour chacun : contexte (dates, cadre, équipe), objectif, fonctionnalités, fonctionnement technique, rôle, défi, chiffres clés, technologies, captures et lien vers le code ou le site
- **Compétences** : techniques (langages, frameworks, données, tests, outils, gestion de projet) et personnelles
- **Parcours** : formation et expériences
- **Veille** : un vrai blog (liste « Tous les articles » avec illustration, résumé, auteur, date et mots-clés, puis les articles complets avec leurs sources) : lecture 4K fluide, assistants de code IA, WebCodecs, Python 3.13 ; puis mes sources et les sujets suivis. Illustrations générées par `node tools/blog/covers.cjs`
- **Contact** : message d'accueil, formulaire, email, téléphone, GitHub, LinkedIn, mention sur les données personnelles
- **CV** téléchargeable en PDF (`cv/DIDIER_Baptiste_CV.pdf`)

## Technologies

Site statique codé à la main : HTML, CSS et JavaScript, hébergé sur GitHub Pages. Deux vues, avec un bouton en haut à droite pour passer de l'une à l'autre :

- **Chambre 3D** (Three.js, fichiers dans `js/vendor/`, sans CDN) : chaque objet ouvre une rubrique.
- **Vue classique** (`?vue=classique`) : le même contenu sur une seule page à faire défiler.

Les deux vues partagent **la même barre de navigation**, à gauche : mon nom, les sept rubriques, le CV à télécharger et mes liens avec leurs logos (GitHub, LinkedIn, e-mail), dessinés comme des caractères, de la couleur du texte. Une **languette au milieu de son bord** l'ouvre ou la ferme quand on veut (la flèche se retourne), et l'état est retenu d'une visite à l'autre. En 3D, un clic sur une rubrique emmène la caméra jusqu'à l'objet correspondant ; dans la vue classique, il fait défiler la page. Sur petit écran, la barre devient un menu burger en haut de page. **En haut à droite** : le bouton « Vue 3D » / « Vue classique » et, dans la chambre, « Revenir à la chambre ».

**Police : Ubuntu partout**, dans les deux vues, y compris sur les textures dessinées dans la chambre 3D. Les quatre fichiers (400, 500, 700 et italique, 47 Ko au total, réduits aux caractères utilisés) sont dans `fonts/` : aucune requête vers un serveur de polices externe.

**Images des projets** : chaque image d'une fiche est cliquable (ou activable au clavier) et s'ouvre en grand dans une visionneuse. Zoom à la molette, aux boutons + et −, par double clic ou double toucher, ou en pinçant ; on déplace l'image en la faisant glisser ; flèches ou boutons pour passer d'une image à l'autre ; Échap ou un clic à côté pour fermer.

**Démarrage** : la chambre 3D s'ouvre en priorité, barre latérale **fermée** (elle s'ouvre avec la languette et l'état est retenu). Si l'appareil manque de performance (téléphone, connexion lente, appareil modeste, WebGL absent ou logiciel, ou moins de ~24 images/s même à résolution minimale), le site passe à la vue classique, barre **ouverte**. Liens directs : `?vue=3d#contact`, `?vue=classique#projets`, `#cv`… (rubriques : apropos, projets, competences, parcours, veille, cv, contact) ; les écritures approchantes (`?vue=3d/contact`, `?vue=3dcontact`, `%23`) sont reconnues et réécrites proprement.

**CV** (même charte que la vue classique : fond sombre, titres `#`, accent vert) : `tools/cv/cv.html` (source) → `cv/DIDIER_Baptiste_CV.pdf` et `img/cv.webp` via `node tools/cv/build.cjs` (Playwright).

`js/boot.js` choisit la vue au démarrage : la vue classique est **toujours utilisée sur téléphone** (plus simple à lire), et s'affiche d'office si la connexion est lente (mode économie de données, 2G), si l'appareil est très modeste, si WebGL est absent ou calculé sans carte graphique, ou si la fenêtre fait moins de 900 px de large (la barre latérale a besoin de place) ; la 3D (≈ 1 Mo) n'est alors pas téléchargée. Les projets se filtrent par catégorie (stages, universitaires, personnels, automatisation) et s'ouvrent dans une fiche au premier plan. La vue classique s'affiche dès la lecture du HTML, sans écran de chargement : le CSS et le script de démarrage sont intégrés à la page. Une politique de sécurité du contenu (CSP) limite les scripts au site lui-même et au script de démarrage, identifié par son empreinte SHA-256. Le formulaire de contact passe par FormSubmit.

## Construire le site (minification)

Le site sert des fichiers minifiés, construits à partir des sources lisibles :

| Sources (à modifier) | Fichier servi (généré) |
|---|---|
| `css/style.css` + `css/classic.css` | intégrés directement dans `index.html` (`css/site.min.css` n'est qu'un fichier intermédiaire, non versionné) |
| `js/boot.js` | intégré dans `index.html`, autorisé par son empreinte dans la CSP (`js/boot.min.js` intermédiaire, non versionné) |
| `js/main.js`, `js/room.js`, `js/weather.js` | `js/*.min.js` |

Après chaque modification d'un fichier CSS ou JS :

```bash
npm install      # la première fois seulement (installe esbuild)
npm run build
```

Le script met aussi à jour le numéro de version (`?v=…`) dans `index.html`, pour que les navigateurs rechargent les fichiers modifiés. Pensez à publier les fichiers `.min` générés avec les sources.

**Transitions** : la caméra se déplace en 0,7 s environ (1,8 s pour le Parcours, qui traverse les nuages). Les durées suivent l'horloge et non le nombre d'images affichées, donc elles restent les mêmes sur un ordinateur lent ; si on enchaîne les clics, la dernière demande l'emporte et la caméra repart de sa position du moment. Si l'ordinateur affiche moins de 28 images par seconde pendant 3 s, un mode allégé retire les flous et les ombres coûteux (classe `lite`).

Résultat mesuré avec Lighthouse (le moteur de PageSpeed Insights) : 100 en performance, accessibilité et bonnes pratiques, sur mobile comme sur ordinateur.

## Objets de la chambre

| Objet | Rubrique |
|---|---|
| Baptiste (sur sa chaise) et ballon de foot | À propos : bulle de pensée qui sort de sa tête |
| Ordinateur | Projets : un vrai navigateur HTML posé sur l'écran 3D (cliquable, défilable), avec un onglet par projet (dont le stage EzDEV) |
| Armoire | Compétences : les portes s'ouvrent sur une vitrine éclairée (une étagère par catégorie, une tuile par logo), et une fenêtre détaille les compétences avec les projets associés |
| Lit | Parcours : plongée dans l'écran du portable, flash, descente à travers les nuages, puis un monde avec un bâtiment 3D par étape (lycée, IUT, Auchan, EzDEV, futur), niveau par niveau |
| Bibliothèque | Veille : livres Stack Overflow, GitHub, Reddit, Discord à sortir et ouvrir ; la vue bouge un peu puis revient en face |
| Téléphone | Contact |
| Cadre au mur | Le CV, identique au PDF (`img/cv.webp` est généré depuis `cv/DIDIER_Baptiste_CV.pdf`), affiché en grand dans une fenêtre, avec téléchargement |
| Réveil | Heure et météo de Belfort en direct (cliquable pour zoomer, sans étiquette) |

Dans chaque section, des boutons sous le titre permettent de passer à la section précédente ou suivante, la barre de gauche indique la rubrique ouverte, et le bouton « Revenir à la chambre » (vert, même forme que le bouton de vue) est présent dans toutes les rubriques. Quand une rubrique est ouverte, son objet est mis en lumière et le reste de la chambre s'assombrit.

Le ciel (fond de page et fenêtre de la chambre) suit la météo réelle de Belfort, via Open-Meteo (sans clé).

## Structure

```
index.html        page principale (chambre 3D, vue classique et contenu des rubriques)
merci.html        page affichée après l'envoi du formulaire
404.html          page d'erreur
favicon.svg       logo « B » (+ img/apple-touch-icon.png, img/icon-192.png)
css/style.css     styles de la chambre 3D et éléments communs (source)
css/classic.css   styles de la vue classique (source)
fonts/            police Ubuntu (4 fichiers woff2, réduits aux caractères du site)
css/site.min.css  les deux feuilles réunies et minifiées, intégrées dans index.html (généré)
css/simple.css    pages 404 et « message envoyé »
js/boot.js        choix de la vue et chargement de la 3D à la demande
js/main.js        interface : rubriques, fiches projets, catégories, menus
js/room.js        scène 3D
js/weather.js     météo de Belfort et ciel
js/*.min.js       scripts minifiés (générés)
js/vendor/        Three.js et OrbitControls
tools/build.mjs   construction des fichiers minifiés (npm run build)
img/logos/        logos des compétences (hébergés sur le site)
cv/DIDIER_Baptiste_CV.pdf   mon CV (PDF)

 

img/projets/      captures des projets (img/projets/mini/ : vignettes)
```
