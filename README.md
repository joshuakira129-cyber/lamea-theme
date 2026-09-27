# LAMEA — Thème Shopify Online Store 2.0

Thème sur-mesure pour **LAMEA**, marque de cadeaux émotionnels et personnalisés
construite autour d'un cadre numérique premium. Le thème est écrit en
Liquid/CSS/JS vanilla, sans framework ni étape de build, et respecte
l'architecture Shopify OS 2.0 (sections, blocks, section groups, theme
settings).

> Slogan : **« Désormais, votre amour prend vie »**

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installation de Shopify CLI](#2-installation-de-shopify-cli)
3. [Connexion à la boutique Shopify](#3-connexion-à-la-boutique-shopify)
4. [Lancer le thème en local](#4-lancer-le-thème-en-local)
5. [Workflow Git / branches](#5-workflow-git--branches)
6. [Déploiement (thème de développement → thème de production)](#6-déploiement)
7. [Structure du thème](#7-structure-du-thème)
8. [Remplacer les assets (images/vidéos placeholder)](#8-remplacer-les-assets-placeholder)
9. [Configurer le produit LAMEA](#9-configurer-le-produit-lamea)
10. [Upload de médias (photos/vidéos clients)](#10-upload-de-médias-photosvidéos-clients)
11. [Avis clients (reviews)](#11-avis-clients-reviews)
12. [Analytics & pixels](#12-analytics--pixels)
13. [Internationalisation (Shopify Markets)](#13-internationalisation-shopify-markets)
14. [Contrôle qualité avant mise en ligne](#14-contrôle-qualité-avant-mise-en-ligne)

---

## 1. Prérequis

- Un compte Shopify avec un thème "Online Store 2.0" compatible (n'importe
  quelle boutique récente).
- [Node.js](https://nodejs.org/) 18 ou supérieur (nécessaire pour Shopify CLI).
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) 3.x.
- Git.

## 2. Installation de Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

Vérifiez l'installation :

```bash
shopify version
```

## 3. Connexion à la boutique Shopify

Depuis la racine du thème (ce dossier) :

```bash
shopify auth logout
shopify theme dev --store=votre-boutique.myshopify.com
```

La première exécution ouvre votre navigateur pour vous authentifier. Une
fois connecté, `shopify theme dev` :

- crée un thème de développement temporaire sur la boutique ;
- démarre un serveur local avec rechargement à chaud ;
- affiche une URL de prévisualisation (`https://127.0.0.1:9292`) ainsi
  qu'une URL de prévisualisation Shopify partageable.

## 4. Lancer le thème en local

```bash
shopify theme dev --store=votre-boutique.myshopify.com
```

Commandes utiles :

```bash
# Vérifier la qualité du code (Liquid, JSON, accessibilité, performance)
shopify theme check

# Récupérer les changements faits depuis l'éditeur Shopify (thème existant)
shopify theme pull --theme=<theme_id>

# Envoyer les changements locaux vers un thème (sans le publier)
shopify theme push --unpublished --theme=<theme_id>

# Lister les thèmes de la boutique
shopify theme list
```

## 5. Workflow Git / branches

Workflow recommandé :

```
GitHub (branches de fonctionnalités)
   ↓  pull request + review
main
   ↓  shopify theme push --unpublished
Thème de développement Shopify (QA, preview client)
   ↓  shopify theme publish
Thème de production
```

Conventions :

- `main` : reflète toujours le thème actuellement en production.
- `feature/<nom>` : une branche par fonctionnalité ou section.
- Ne jamais pousser directement sur le thème publié en production : passez
  toujours par un thème non publié (`--unpublished`) pour la QA.

## 6. Déploiement

```bash
# 1. Pousser vers un thème de développement (non publié) pour validation
shopify theme push --unpublished --theme=<theme_id> --store=votre-boutique.myshopify.com

# 2. Une fois validé par l'équipe, publier ce thème en production
shopify theme publish --theme=<theme_id> --store=votre-boutique.myshopify.com
```

Toujours garder une sauvegarde du thème de production actif (Shopify en
conserve un historique dans **Boutique en ligne → Thèmes**) avant de
publier une nouvelle version.

## 7. Structure du thème

```
assets/       CSS et JS globaux (base.css, animations.css, global.js…)
              + CSS de composants partagés (component-*.css)
config/       Réglages du thème (Theme Settings) — settings_schema.json
layout/       theme.liquid (layout principal) et password.liquid
locales/      Traductions (fr.default.json = référence, en.default.json)
sections/     Sections Liquid réutilisables (header, hero, produit…)
snippets/     Fragments réutilisés par plusieurs sections
templates/    Templates JSON (accueil, produit, collection…) + customers/
```

Chaque section utilise `{% stylesheet %}` / `{% javascript %}` pour son CSS
et JS propres (bundlés automatiquement par Shopify), sauf les composants
réutilisés par plusieurs sections (carte produit, panier, upload…) qui
vivent dans `assets/component-*.css` pour éviter la duplication.

## 8. Remplacer les assets (placeholder)

Aucune image finale n'a été générée : le thème utilise des espaces
réservés clairement identifiés, visibles directement dans l'éditeur de
thème Shopify (texte affiché à la place de l'image) :

| Placeholder                        | Où le remplacer                                      |
|-------------------------------------|-------------------------------------------------------|
| `LAMEA_HERO_PLACEHOLDER`            | Section **Hero LAMEA** → réglage Image/Vidéo          |
| `LAMEA_PRODUCT_FRONT_PLACEHOLDER`   | Médias du produit (fiche produit Shopify admin)       |
| `LAMEA_PRODUCT_DEMO_PLACEHOLDER`    | Section **Démonstration produit**                     |
| `LAMEA_COUPLE_01/02_PLACEHOLDER`    | Sections **Comparaison souvenir** / **Storytelling produit** |
| `LAMEA_STORY_N_PLACEHOLDER`         | Section **Souvenirs animés** (blocs "Moment")         |
| `LAMEA_STEP_N_PLACEHOLDER`          | Section **Comment ça marche** (blocs "Étape")         |
| `LAMEA_UGC_N_PLACEHOLDER`           | Section **Vidéos & UGC** (blocs "Média")              |
| `LAMEA_OCCASION_N_PLACEHOLDER`      | Section **Occasions** (blocs "Occasion")              |
| `LAMEA_FINAL_CTA_PLACEHOLDER`       | Section **CTA final**                                 |
| `LAMEA_MEDIA_TEXT_PLACEHOLDER`      | Section **Média et texte**                            |

Tous les champs image utilisent des `image_picker`/`video` Shopify natifs :
remplacez-les directement depuis **Personnaliser le thème**, sans toucher
au code. Le logo et le favicon se règlent dans **Theme Settings → Logo**.

## 9. Configurer le produit LAMEA

⚠️ **Important** : les caractéristiques techniques précises du cadre
(dimensions exactes, capacité de stockage, connectique, formats vidéo
supportés, autonomie, etc.) n'ont pas pu être confirmées de manière fiable
au moment de la construction du thème et **n'ont donc pas été inventées**.

Le thème est conçu pour que ces informations soient ajoutées facilement,
sans toucher au code, via deux mécanismes :

1. **Fiche produit Shopify** : titre, prix, variantes (taille, couleur),
   images/vidéos — tout se configure normalement depuis
   **Produits → LAMEA** dans l'admin Shopify.
2. **Accordéons de la page produit** (section **Page produit**, blocs de
   type "Accordéon") : ajoutez ou modifiez librement les blocs
   "Caractéristiques techniques", "Livraison & retours", "Entretien" avec
   le contenu confirmé (dimensions, matériau, connectique USB-C/Wi-Fi,
   formats supportés, etc.) dès que vous l'aurez validé.

Aucune caractéristique n'est donc codée en dur dans le Liquid : tout passe
par les réglages de section ou la fiche produit native.

## 10. Upload de médias (photos/vidéos clients)

La personnalisation (le client ajoute ses propres photos/vidéos) est le
cœur de l'expérience LAMEA. L'architecture est volontairement séparée en
quatre couches (voir `snippets/product-upload.liquid`,
`assets/media-upload.js`) :

1. **UI** — la zone de glisser-déposer et la liste de fichiers
   (`snippets/product-upload.liquid`).
2. **Logique d'upload** — `assets/media-upload.js`.
3. **Stockage du fichier / URL** — deux modes, contrôlés par le réglage
   *Theme Settings → Produit → Fournisseur d'upload* :
   - **`none` (par défaut)** : les fichiers sont attachés directement à de
     vraies *line-item properties* Shopify de type fichier
     (`properties[Souvenir 1]`, `properties[Souvenir 2]`, …). Ce mode ne
     dépend d'aucun service externe, fonctionne même sans JavaScript, et
     les fichiers sont visibles/téléchargeables directement depuis la
     commande dans l'admin Shopify.
   - **Un autre fournisseur** (ex. `cloudinary`, `external-form`, ou tout
     nom de votre choix) : renseignez également *URL du service
     d'upload externe*. Chaque fichier est envoyé en `POST multipart` à
     cette URL, qui doit répondre `{ "url": "https://..." }`. Cette URL
     est alors stockée comme *line-item property* texte
     (`properties[Souvenir N]`). En cas d'échec de l'envoi, le widget
     revient automatiquement au mode natif (aucun souvenir n'est jamais
     perdu).
4. **Rattachement à la commande** — dans les deux cas, l'information
   apparaît côté marchand dans les détails de la commande (Shopify
   affiche nativement les *line-item properties*), et côté client dans le
   panier (`snippets/cart-item.liquid`).

Pour changer de fournisseur : **Theme Settings → Produit → Personnalisation
photos/vidéos**. Aucun redéploiement de code n'est nécessaire pour un
service qui respecte le contrat `{ "url": "..." }` ci-dessus.

## 11. Avis clients (reviews)

Aucun faux avis n'est affiché. Les étoiles (`snippets/star-rating.liquid`)
ne s'affichent que si :

1. *Theme Settings → Produit → Afficher les avis/étoiles* est activé, **et**
2. une app d'avis (Shopify Product Reviews, Judge.me, Loox, Okendo…) a
   rempli le metafield `product.metafields.reviews.rating`.

Si vous installez une app différente de "Product reviews" de Shopify,
adaptez les deux lignes `assign rating = ...` dans
`snippets/star-rating.liquid` pour pointer vers le metafield fourni par
votre app.

## 12. Analytics & pixels

Aucun pixel n'est codé en dur. Utilisez le gestionnaire natif Shopify :
**Paramètres → Applications et canaux de vente → Pixels client** pour
brancher Meta Pixel, TikTok Pixel, Google Ads, etc. Shopify Analytics et
les événements standards (`view_item`, `add_to_cart`, `begin_checkout`,
`purchase`) sont automatiquement déclenchés par le thème via l'Ajax Cart
API native — aucun double tracking n'est ajouté.

## 13. Internationalisation (Shopify Markets)

- `locales/fr.default.json` est la langue de référence (française).
- `locales/en.default.json` est fourni comme base pour l'anglais.
- Pour ajouter l'allemand ou l'italien : dupliquez `en.default.json` en
  `de.json` / `it.json`, traduisez les valeurs, puis activez la langue
  depuis **Paramètres → Langues**.
- Le thème n'a aucun texte principal codé en dur en dehors des fichiers de
  traduction et des réglages de section (donc modifiables sans toucher au
  Liquid).
- Compatible **Shopify Markets** (devises CHF/EUR/autres) : tous les prix
  utilisent le filtre natif `money`.

## 14. Contrôle qualité avant mise en ligne

```bash
shopify theme check
```

Cette commande vérifie automatiquement : Liquid/JSON valides, accessibilité
(labels, alt text, largeur/hauteur d'image), performance (préchargement,
lazy loading), et bonnes pratiques Shopify. Le thème passe `theme check`
sans erreur ni avertissement au moment de la livraison.

Checklist manuelle recommandée avant publication :

- [ ] Remplacer tous les placeholders `LAMEA_*_PLACEHOLDER` par les vrais
      visuels.
- [ ] Renseigner les vraies caractéristiques produit dans les accordéons.
- [ ] Vérifier prix, variantes et stock dans la fiche produit.
- [ ] Choisir un fournisseur d'upload si le mode natif ne suffit pas.
- [ ] Tester le tunnel d'achat complet (ajout panier → checkout) en mode
      aperçu.
- [ ] Tester à 320px, 375px, 390px, 430px, tablette et desktop.
- [ ] Connecter les pixels marketing depuis l'admin Shopify.
- [ ] Configurer les pages légales (CGV, confidentialité, mentions
      légales) dans **Boutique en ligne → Pages** puis les lier dans le
      footer.
