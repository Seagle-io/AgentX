# Decisions — Seagle : vitesse, référencement, qualité

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-14 — URLs es/de/it = préfixe `/<l>` + chemin EN, dérivées d'une table unique `src/lib/site-routes.json` (T005)
- **Contexte** : nginx sans réécriture lisible → chaque URL = `dist/<route>/index.html` prérendu ; la langue doit sortir du chemin seul, avant `i18nReady` (T006).
- **Choix** : `/de/products`, `/de` (home), `/de/services/<slug>` ; fr/en inchangés ; table JSON unique lue par routes.ts, prerender.mjs, vite.config.js ; langue initiale = URL > localStorage > navigator ; URL partagée fr/en = contenu fr (hreflang sans `en`).
- **Écarté** : slugs traduits parce que +75 slugs, mapping ServiceDetail, traduction hors périmètre ; `?lng=` / sous-domaine parce que non prérendable en fichiers statiques / config nginx-DNS illisible.
- **Conséquence** : page neuve = 1 ligne JSON, 5 langues prérendues + sitemap + hreflang ; 109 pages prérendues (34 → 109) ; slugs anglais dans URLs de/es/it.
- **À revoir si** : besoin SEO prouvé de slugs locaux, ou 301 nginx devenues éditables dans le dépôt — passer à B coûte 75 redirections.

## 2026-10-14 — Tokens texte découplés des encres ASCII
- **Contexte** : `--th-text-md`/`--th-text-faint` = encres de tous les visuels ASCII (ascii-core.ts readInk) ; visuels intouchables.
- **Choix** : nouveaux `--th-copy-md`/`--th-copy-faint` (≥ 4.5:1) branchés sur `text-md`/`text-faint` ; encres ASCII inchangées.
- **Écarté** : relever les tokens existants — change les visuels ASCII.
- **Conséquence** : 2 familles de gris à maintenir.
- **À revoir si** : les visuels ASCII changent d'encre.

## 2026-10-14 — Échec de chargement au démarrage : un rechargement, puis HTML prérendu
- **Contexte** : chunk de langue ou de page indisponible → écran blanc ou boucle de rechargement (T018, T027).
- **Choix** : garde unique `reloaded:boot` (preload + langue), purgée au montage sur une autre adresse ; échec persistant → React non monté, `html.boot-failed` rend visibles les blocs figés à opacité 0.
- **Écarté** : purge sur `load` + 5 s — boucle si l'échec arrive après 5 s.
- **Conséquence** : au plus 1 rechargement par adresse et par session.
- **À revoir si** : error boundary par chunk ajoutée.
