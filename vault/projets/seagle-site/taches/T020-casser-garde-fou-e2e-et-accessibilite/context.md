---
pack: T020
projet: seagle-site
role: verificateur
cree: 2026-10-14
---

# Pack T020 — Casser garde-fou, e2e et accessibilité

> Seule source de vérité de l'agent T020. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de faire échouer T010 (check-dist + e2e), T012 (clavier) et T013 (formulaires, contrastes, animations) → verdict OK ou défauts reproductibles.

## Definition of Done
- [ ] chaque ligne « Vérifié comment » des 3 result.md rejouée → OK/KO
- [ ] check-dist : faux négatifs (`http://127.0.0.1:3001`, `HTTP://LOCALHOST`, `//localhost:3001` sans schéma, `localhost:3001` dans un .html prérendu, `0.0.0.0`) sur un dossier factice dans ton artefact → liste de ce qui passe à travers ; `node scripts/check-dist.mjs` sur `dist/` final → « dist OK »
- [ ] e2e : `BASE=http://localhost:4173 npm run test:e2e` → sortie brute ; test qui ne teste rien ? (casser une page à la main dans une copie de `dist` servie sur ton port → l'e2e doit échouer)
- [ ] clavier sur build final : sous-menus Entrée/Échap, tiroir mobile fermé 0 focusable, Échap sélecteur, lien d'évitement 1er Tab → cible `#main` ; sur `/de` aussi
- [ ] formulaires : /rendez-vous champs nommés, jours/créneaux nommés + `aria-pressed`, erreurs `role=alert` ; /contact idem ; focus visible
- [ ] contrastes : `--th-copy-*`, `--th-text-lo` ≥ 4.5 clair et sombre (ratio recalculé) ; `--th-text-md/faint` = valeurs HEAD (`git diff HEAD -- src/style.css`) ; visuels ASCII inchangés (canvas reduced-motion identiques à un build HEAD : `git stash` INTERDIT → comparer aux captures `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/ascii-avant-*`)
- [ ] reduced-motion : 0 animation CSS infinie sur 15 pages ; sans préférence : marquee tourne
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T010-garde-fou-de-build-et-suite-e2e/result.md` | L | affirmations T010 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T012-accessibilite-clavier-du-menu-du-tiroir-et-du-se/result.md` | L | affirmations T012 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T013-accessibilite-des-formulaires-contrastes-et-anim/result.md` | L | affirmations T013 |
| `~/Documents/Workspace/seagle-website/scripts/check-dist.mjs` | L | |
| `~/Documents/Workspace/seagle-website/e2e/run.mjs` | L | |
| `~/Documents/Workspace/seagle-website/src/style.css` | L | tokens |
| `~/Documents/Workspace/seagle-website/src/components/ui/mega-menu.tsx` | L | |
| `~/Documents/Workspace/seagle-website/src/components/Header/header.tsx` | L | |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T012/audit.mjs` | L | audit BASE env |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T013/` | L | captures avant, verif-*.mjs |
| `~/Documents/Workspace/seagle-website/dist/` | L | build final |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T020/` | E | scripts de repro, dossiers factices |

## Contrats
Cible WCAG 2.2 AA (4.5:1). Encres ASCII = `--th-text-md`/`--th-text-faint` (lues par `src/components/kit/ascii-core.ts:66-67`), découplées des textes `--th-copy-*`.

## Décisions actées
- visuels ASCII intouchables ; check-dist en `--warn` dans `npm run build`, bloquant en `check:dist` et CI
- défaut = entrée concrète → sortie observée ≠ attendue + repro

## Hors périmètre
- URLs (T019) ; vitesse, JSON-LD (T018)
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
tache: T020
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
