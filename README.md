# Portfolio – Baptiste Didier

Portfolio de Baptiste Didier, étudiant en 3e année de BUT Informatique (parcours Réalisation d'applications) à l'IUT Nord Franche-Comté.

**Site en ligne :** https://bdidier1.github.io/Portfolio_BUT3/

## Contenu

Le contenu suit les attentes du cours « Portfolio – book » :

- **À propos** : présentation courte, qualités, centres d'intérêt, formation en bref
- **Projets** : stage de 2e année chez EzDev en premier, puis ParkTracker (mon application publiée sur l'App Store et Google Play), GP Explorer, PuissanceX, Unity FPS et Pauvocodeur, et deux projets plus courts (site SFR, boutique BAMM) ; pour chacun : contexte (dates, cadre, équipe), objectif, fonctionnalités, rôle ou défi quand il est connu, technologies, lien vers le code GitHub
- **Compétences** : techniques (langages, frameworks, données, tests, outils, gestion de projet) et personnelles
- **Parcours** : formation et expériences
- **Veille** : Stack Overflow, GitHub, Reddit, Discord
- **Contact** : message d'accueil, formulaire, email, téléphone, GitHub, mention sur les données personnelles
- **CV** téléchargeable en PDF (`cv/DIDIER_Baptiste_CV.pdf`)

## Technologies

Site statique codé à la main : HTML, CSS et JavaScript, hébergé sur GitHub Pages. Deux vues, avec un bouton en haut à droite pour passer de l'une à l'autre :

- **Chambre 3D** (Three.js, fichiers dans `js/vendor/`, sans CDN) : chaque objet ouvre une rubrique.
- **Vue classique** (`?vue=classique`) : le même contenu sur une page simple, au style iOS (police système d'Apple, thème clair ou sombre automatique).

`js/boot.js` choisit la vue au démarrage : la vue classique s'affiche d'office si la connexion est lente (mode économie de données, 2G), si l'appareil est très modeste ou si WebGL est absent, et la 3D (≈ 1 Mo) n'est alors pas téléchargée. Les projets se filtrent par catégorie (stages, universitaires, personnels, automatisation) et s'ouvrent dans une fiche au premier plan. Une politique de sécurité du contenu (CSP) limite les scripts au site lui-même. Le formulaire de contact passe par FormSubmit.

## Objets de la chambre

| Objet | Rubrique |
|---|---|
| Baptiste (sur sa chaise) et ballon de foot | À propos : bulle de pensée qui sort de sa tête |
| Ordinateur | Projets : un vrai navigateur HTML posé sur l'écran 3D (cliquable, défilable), avec un onglet par projet (dont le stage EzDev) |
| Armoire | Compétences : les portes s'ouvrent sur une vitrine éclairée (une étagère par catégorie, une tuile par logo), et une fenêtre détaille les compétences avec les projets associés |
| Lit | Parcours : plongée dans l'écran du portable, flash, descente à travers les nuages, puis un monde avec un bâtiment 3D par étape (lycée, IUT, Auchan, EzDev, futur), niveau par niveau |
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
css/style.css     styles de la chambre 3D et éléments communs
css/classic.css   styles de la vue classique (iOS)
js/boot.js        choix de la vue et chargement de la 3D à la demande
js/main.js        interface : rubriques, fiches projets, catégories, menus
js/room.js        scène 3D
js/weather.js     météo de Belfort et ciel
js/vendor/        Three.js et OrbitControls
cv/DIDIER_Baptiste_CV.pdf   mon CV (PDF)
img/projets/      captures des projets (img/projets/mini/ : vignettes)
```
