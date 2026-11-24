# Portfolio – Baptiste Didier

Portfolio de Baptiste Didier, étudiant en 3e année de BUT Informatique (parcours Réalisation d'applications) à l'IUT Nord Franche-Comté.

**Site en ligne :** https://bdidier1.github.io/Portfolio_BUT3/

## Contenu

Le contenu suit les attentes du cours « Portfolio – book » :

- **À propos** : présentation courte, qualités, centres d'intérêt, formation en bref
- **Projets** : le stage de 2e année chez EzDEV en premier (avec les captures du rapport de stage), puis sept projets principaux (ParkTracker, GP Explorer, CutLocal, AUTO YTB, Caisse Twirling, PuissanceX, Boutique de câbles) et une liste « Autres projets » plus discrète (Clip2EP, Unity FPS, Pauvocodeur, Topaz Local, site SFR, BAMM) ; pour chacun : contexte (dates, cadre, équipe), objectif, fonctionnalités, rôle, défi, technologies, captures et lien vers le code
- **Compétences** : techniques (langages, frameworks, données, tests, outils, gestion de projet) et personnelles
- **Parcours** : formation et expériences
- **Veille** : sources, sujets suivis et notes de veille rédigées (Python 3.13, WebCodecs, assistants de code IA)
- **Contact** : message d'accueil, formulaire, email, téléphone, GitHub, LinkedIn, mention sur les données personnelles
- **CV** téléchargeable en PDF (`cv/DIDIER_Baptiste_CV.pdf`)

## Technologies

Site statique codé à la main : HTML, CSS et JavaScript, hébergé sur GitHub Pages. Deux vues, avec un bouton en haut à droite pour passer de l'une à l'autre :

- **Chambre 3D** (Three.js, fichiers dans `js/vendor/`, sans CDN) : chaque objet ouvre une rubrique.
- **Vue classique** (`?vue=classique`) : le même contenu sur une page simple, au style iOS (police système d'Apple, thème clair ou sombre automatique).

`js/boot.js` choisit la vue au démarrage : la vue classique est **toujours utilisée sur téléphone** (plus simple à lire), et s'affiche d'office si la connexion est lente (mode économie de données, 2G), si l'appareil est très modeste, si WebGL est absent ou calculé sans carte graphique ; la 3D (≈ 1 Mo) n'est alors pas téléchargée. Les projets se filtrent par catégorie (stages, universitaires, personnels, automatisation) et s'ouvrent dans une fiche au premier plan. Une politique de sécurité du contenu (CSP) limite les scripts au site lui-même. Le formulaire de contact passe par FormSubmit.

## Construire le site (minification)

Le site sert des fichiers minifiés, construits à partir des sources lisibles :

| Sources (à modifier) | Fichier servi (généré) |
|---|---|
| `css/style.css` + `css/classic.css` | `css/site.min.css` |
| `js/boot.js`, `js/main.js`, `js/room.js`, `js/weather.js` | `js/*.min.js` |

Après chaque modification d'un fichier CSS ou JS :

```bash
npm install      # la première fois seulement (installe esbuild)
npm run build
```

Le script met aussi à jour le numéro de version (`?v=…`) dans `index.html`, pour que les navigateurs rechargent les fichiers modifiés. Pensez à publier les fichiers `.min` générés avec les sources.

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

Dans chaque section, des boutons sous le titre permettent de passer à la section précédente ou suivante. Le bouton à flèches à gauche de l'écran ouvre un menu latéral avec toutes les sections et un lien vers la **version classique** (`?vue=classique`) : tout le contenu sur une page, sans 3D. Cette version (fond clair, menu fixe à gauche, détails des projets dépliables) s'affiche aussi automatiquement si WebGL n'est pas disponible. Quand une rubrique est ouverte, son objet est mis en lumière et le reste de la chambre s'assombrit.

Le ciel (fond de page et fenêtre de la chambre) suit la météo réelle de Belfort, via Open-Meteo (sans clé).

## Structure

```
index.html        page principale (chambre 3D, vue classique et contenu des rubriques)
merci.html        page affichée après l'envoi du formulaire
404.html          page d'erreur
favicon.svg       logo « B » (+ img/apple-touch-icon.png, img/icon-192.png)
css/style.css     styles de la chambre 3D et éléments communs (source)
css/classic.css   styles de la vue classique (source)
css/site.min.css  les deux feuilles réunies et minifiées (généré)
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
