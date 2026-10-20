---
pack: {{ID}}
projet: {{PROJET}}
role: implementeur
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type implementeur : le chef écrit Mission, DoD spécifiques, WL, Contrats ; le reste est constant.

## Mission
TODO-PACK — 1 phrase : quoi changer, où (`chemin`).

## Definition of Done
- [ ] TODO-PACK — une case par fichier E : symbole, signature, comportement, `chemin:L`
- [ ] lint, tsc, tests, build : sorties brutes collées (commandes exactes du projet : TODO-PACK ; front tsc = `npx tsc -p tsconfig.app.json --noEmit`)
- [ ] frontières : `rg -n "<imports/valeurs interdits>" <E>` → ∅ (sortie collée)
- [ ] `wc -l` de chaque fichier E < 400 ; fonctions ≤ 60 lignes
- [ ] `git diff --stat -- <E>` collé (aucun fichier hors E) ou `NV — raison`
- [ ] tests : ≥ N `it` ajoutés, cas listés ; base de tests sur HEAD = N (borne ≥ si autres lots en parallèle)
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (fichier E) | E | modifié |
| `TODO-PACK` (test E) | E | test ajouté |
| `TODO-PACK` (contrat/type consommé) | L | signature |
| `TODO-PACK` (idiome à calquer) | L | convention |

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
```
TODO-PACK (signatures consommées/produites verbatim, `chemin:L`)
imports réels du module cible recopiés verbatim (`import vx` ≠ `from vx import (…)` ; ×2 : T130 T189)
```

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- refactor non demandé, renommage, fichiers L, mineurs non listés
- services, serveurs ; manque dans un fichier L ⇒ `bloque` avec le symbole voulu
- autres lots en parallèle : ne pas lire ni toucher leurs dossiers
- TODO-PACK

## Environnement
- service: <nom> → <url> — à activer si le pack en dépend : TODO-PACK ou ∅
- serveur fourni par le chef (`./bin/agentx env up <svc>`) ; agent : n'en lance aucun ; injoignable ⇒ `bloque`
- racine / `cd` / versions exactes des runs de référence : TODO-PACK
- arbre partagé : formater uniquement les chemins E ; lint global rouge par un autre lot ⇒ coller le lint ciblé (`npx biome check <E>`)
- baseline collée au pack : `git status --short <WL>` + `wc -l`/hunks des fichiers E déjà `M` (×3 : T033 T037 T051) ; erreurs lint/test préexistantes hors WL listées (×2 : T182 T185)
- base de tests / versions sur HEAD : TODO-PACK
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées
- fichiers E déjà modifiés non commités ⇒ lister TES lignes (plages) ; `git diff --stat` global ≠ écart
- banc lancé par l'agent : `env -u AGENTX_TID` (×2 : T203 T250) ; DoD « git status collé » ⇒ `git status:*` dans Outils autorisés (×3 : T235 T238 T244)
- WL front : `<zone>/tests/README.md` en E si un test est ajouté (×2 : T230 T236)
- front : 0 build par l'agent ; chef : `npm run build` puis `make invariants`
- mesure : `git diff --stat -- <chemins E de ta WL>` et `git diff -U0 -- <chemins E de ta WL> | rg -c '^[+-][^+-]'` — SES fichiers seulement ; arbre partagé : un diff global compte le travail d'autrui (≠ écart)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Glob, Bash(npm run lint, npm run test, npm run build, npx:*, node:*, rg:*, wc:*, ls:*, git status:*, git diff:*)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack — **écrit avec l'outil Write** (un rendu seulement affiché est perdu) — dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: revue | bloque
---
## Livré
- `chemin:L1-L2` — fait
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
