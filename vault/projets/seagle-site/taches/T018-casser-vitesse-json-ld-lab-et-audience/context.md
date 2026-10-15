---
pack: T018
projet: seagle-site
role: verificateur
cree: 2026-10-14
---

# Pack T018 — Casser vitesse, JSON-LD, /lab et audience

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer les livrables T006 (langues à la demande), T007 (vidéos AgentX), T008 (JSON-LD), T009+T017 (/lab), T011 (audience) sur le build final prérendu (:4173) → verdict OK ou liste de défauts reproductibles.

## Definition of Done
- [ ] chaque ligne « Vérifié comment » des 5 result.md rejouée sur :4173 → OK/KO
- [ ] T006 : chunk d'entrée de `dist/index.html` ≤ 470 000 o brut ; HTML prérendu de `/de/products`, `/en`… contient le texte traduit (pas de FR ni de clé brute) ; langue absente / localStorage corrompu (`i18nextLng=xx`, `=""`) → page rendue, 0 `pageerror` ; réseau coupé sur le chunk de locale (`page.route` abort) → comportement observé
- [ ] T007 : /agentx 390×844 → 0 o vidéo ; onglets rapides (3 clics < 1 s) → 1 seule vidéo joue ; reduced-motion → 0 o
- [ ] T008 : 6 pages, JSON-LD dans le **HTML prérendu** (curl, pas navigateur) parse OK ; 1 seul `script#page-jsonld` après hydratation (navigation client entre 2 pages → pas de JSON-LD périmé de la page précédente) ; /carrieres → 0
- [ ] /lab : prérendu (`dist/lab/index.html` existe, h1 présent), `/de/lab` OK, 4 liens 200 ; pages tableaux : nav à 3 cartes intacte
- [ ] T011 : `rg -c seagle-analytics dist` → 0 ; aucune requête tierce hors polices sur 5 pages
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T006-traductions-chargees-a-la-demande/result.md` | L | affirmations T006 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T007-videos-agentx-lancees-a-l-arrivee-a-l-ecran/result.md` | L | affirmations T007 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T008-json-ld-des-pages-qui-n-en-ont-pas/result.md` | L | affirmations T008 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T009-activer-lab-avec-les-quatre-tableaux/result.md` | L | affirmations T009 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T017-mise-en-page-de-lab-grille-22-alignee/result.md` | L | affirmations T017 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T011-mesure-d-audience-preparee-inactive/result.md` | L | affirmations T011 |
| `~/Documents/Workspace/seagle-website/src/lib/i18n.ts` | L | backend, i18nReady |
| `~/Documents/Workspace/seagle-website/src/pages/AgentX/index.tsx` | L | RoomVideo L34-60 |
| `~/Documents/Workspace/seagle-website/src/hooks/useJsonLd.ts` | L | 1 script par page |
| `~/Documents/Workspace/seagle-website/src/lib/analytics.ts` | L | 20 l. |
| `~/Documents/Workspace/seagle-website/dist/` | L | build final (curl, rg, ls) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T018/` | E | scripts de repro, sorties |

## Contrats
Chunk d'entrée avant projet : 924 268 o / 308 490 o gzip ; T006 déclare 461 313 / 150 901.
`useJsonLd(schema)` : un `<script id="page-jsonld">`, retiré au démontage.

## Décisions actées
- visuels ASCII et design hors critique — décision humain
- défaut = entrée concrète → sortie observée ≠ attendue + repro ; 0 remarque de style

## Hors périmètre
- URLs /de /es /it en profondeur (T019) ; accessibilité, e2e (T020)
- corriger quoi que ce soit

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` ; build complet frais (`npm run build`, 109 pages prérendues, fait par le chef après T016) servi par `vite preview` sur **http://localhost:4173** — partagé, lecture seule, ne pas l'arrêter ni rebuilder
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]`
- scripts de repro dans ton dossier artefact ; jamais d'écriture dans le dépôt ; jamais `npm run build` ; builds annexes éventuels : `npx vite build --outDir <ton artefact>/dist` + preview sur ton port
- arbre partagé, non commité : jamais `git stash/checkout/reset/clean/commit`

## Budget
- Lectures hors whitelist : **5 maximum** (marge de contre-exemple), journalisées dans `## Écarts`.
- Outils : Read, Grep, Glob, Bash (node, rg, curl, git diff), Write (result.md + artefact seulement). Aucune édition du dépôt.
- Si bloqué : statut `bloque`, **une** question précise, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 80 lignes, sections exactes :

```markdown
---
tache: T018
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- [D1..Dn] gravité (G1 casse un usage · G2 régression/contrat KO · G3 mineur) — entrée/état → sortie observée ≠ attendue — chemin:Lx — repro: commande
- affirmations des result.md rejouées : OK/KO une ligne chacune
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : défauts à recopier dans un pack de correction
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
