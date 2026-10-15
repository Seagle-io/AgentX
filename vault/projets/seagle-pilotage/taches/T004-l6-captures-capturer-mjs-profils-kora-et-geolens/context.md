---
pack: T004
projet: seagle-pilotage
role: devops
cree: 2026-10-16
---

# Pack T004 — L6 captures : capturer.mjs + profils kora et geolens

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire l'outil qui refait les captures d'écran produit pour les sites — `outils/captures/capturer.mjs` + profils `kora.mjs` et `geolens.mjs` — à la lettre de `contrat.md` §C6, prouvé en mode `--essai` (noms prévus == fichiers existants) sans lancer les produits.

## Definition of Done
- [ ] `outils/captures/capturer.mjs <cle> --base <url> --sortie <dir> [--essai] [--ecrans a,b]` : lit `produits.json` (registre T003 en parallèle : si absent au démarrage, lire le bloc §C1 recopié dans `.cache/T004/produits.json` et le dire en Écarts) ; Playwright résolu par `createRequire(<site.depot>/package.json)` puis `depots[].chemin` ; introuvable → exit 3 ; 0 `npm install`
- [ ] profil `kora.mjs` : 13 écrans (agenda, bilan, bilan-detail, bilan-trames, dashboard, documents, exercise-edit, exercises, forum, my-day, patient-detail, patient-suivi, settings) avec route réelle lue dans `W/OrthoPro/ortho-front/src/app/router.tsx` et `src/modules/*/routes.tsx` (route introuvable → `null` + Écart) ; thèmes `dark`, `light` ; tailles `1280×800 dpr1` et `2400×1500` (mesurées : `dark-agenda-1280.webp` = 1280×800, `-2400` = 2400×1500 ; trancher dpr 1.875 vs viewport 2400, le dire) ; `nom = ${theme}-${ecran}-${suffixe}.webp` ; `connexion(page, env)` = comptes de démonstration de `vault/projets/orthopro/env.md` (variables, jamais de valeur en dur) ; `theme(page, t)`
- [ ] profil `geolens.mjs` : 7 écrans `vue-{coupe,courbes,mesure,protections,solaire,surete,zone}` (routes : lire le viewer `W/Geolens/geolens-web-feat-viewer-online/web/src`, sinon `null` + Écart) ; `themes: [null]` ; taille mesurée sur les 7 fichiers existants ; base = stack locale SEULEMENT (jamais l'URL du serveur de test)
- [ ] `node outils/captures/capturer.mjs kora --essai` → liste des noms ; `diff` avec `ls W/seagle-website/public/kora/{dark,light}-*` → ∅ (collé) ; idem `geolens --essai` vs `ls W/Geolens-website/public/images/logiciel/vue-*.webp` → ∅
- [ ] conversion webp : `sharp` (résolu comme Playwright) sinon `cwebp` sinon `python3 -c PIL` ; aucun → exit 3 ; vérifié : quel convertisseur est trouvé sur cette machine (sortie collée)
- [ ] `--essai` et toute exécution : 0 écriture dans les dépôts produits ou sites (`git -C <d> status --porcelain` avant == après, collé) ; sortie seulement sous `--sortie`
- [ ] `node --check` ×3 rc 0 ; `git status --short` → `outils/captures/*` seuls (+ result.md)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `outils/captures/capturer.mjs` | E | neuf |
| `outils/captures/kora.mjs` | E | neuf |
| `outils/captures/geolens.mjs` | E | neuf |
| `vault/projets/seagle-pilotage/contrat.md` | L | **§C1 L40-77 (entrées kora, geolens) · §C6 L249-273 · DoD L6 L327 : contrat verbatim** |
| `vault/projets/orthopro/env.md` | L | lancement Kora, comptes de démo (variables) |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/app/router.tsx` | L | routes Kora |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/` | L | `*/routes.tsx` seulement |
| `~/Documents/Workspace/seagle-website/public/kora/` | L | listing + tailles |
| `~/Documents/Workspace/Geolens-website/public/images/logiciel/` | L | listing + tailles |
| `~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/` | L | routes du viewer (rg seulement) |
| `.cache/T004/` | E | essais |

## Contrats
`contrat.md` §C6 = contrat. Rappel :
```
outils/captures/capturer.mjs <cle> --base <url> --sortie <dir> [--essai] [--ecrans a,b]
outils/captures/<cle>.mjs → export default { ecrans:{<nom>:<route>}, themes:['dark','light']|[null],
  tailles:[{suffixe:'1280',largeur:1280,hauteur:int,dpr:1},{suffixe:'2400',…}], nom:(theme,ecran,suffixe)=>string,
  async connexion(page, env){}, async theme(page, t){} }
--essai : 0 navigateur, imprime les noms prévus ; == git ls-tree des captures hors game-*, vidéos, posters (manuels)
```
Modèle de résolution (seagle-website/scripts/og-images.mjs) : `import { createRequire } from 'node:module'; const require = createRequire(<site.depot> + '/package.json'); const { chromium } = require('playwright');`
Captures Kora manuelles exclues : `game-{memory,puzzle,rime}-*`, `kora-games.{mp4,webm}`, `kora-games-poster.webp`.

## Décisions actées
- ce lot n'exécute AUCUNE vraie capture (produits non lancés) : outil + `--essai` seulement ; les vraies captures = tâches créées par `publier --taches` (designer)
- branche du site : créée plus tard par l'agent de capture via `git worktree`, jamais ici ; jamais de push
- Geolens : jamais l'URL du serveur de test ; Kora : jamais de migration, données de démo seulement

## Hors périmètre
- `produits.json`, `bin/*` (T003 en parallèle) ; lancer Kora, Geolens ou un site ; installer un paquet

## Environnement
- `W` = `~/Documents/Workspace` ; node v22 ; Playwright présent dans `W/seagle-website/node_modules` (1.62.0), navigateurs `~/.cache/ms-playwright`
- `rg -h` = aide en rg 14 : utiliser `-I`, exclure `node_modules` ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3:*)`, `Bash(ls:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(git -C:*)` (lecture), `Bash(mkdir:*)`, `Bash(which:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T004
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison | route introuvable: écran
## Pour la suite
- ≤ 5 lignes : commande exacte d'une vraie capture Kora (produit lancé par l'humain)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
