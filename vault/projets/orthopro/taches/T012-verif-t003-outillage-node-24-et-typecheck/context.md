---
pack: T012
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T012 — Vérif T003 (outillage)

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter le lot T003 : prouver que `npm run typecheck` détecte une erreur dans `src`, dans `e2e` ET dans `vite.config.ts`, que `test:unit` tourne sous node 24, et que les fichiers livrés sont bien ceux déclarés.

## Definition of Done
- [ ] `cat .nvmrc` → `24` ; `rg -n '"engines"' -A2 package.json` collé ; `rg -n '"typecheck"' package.json` collé
- [ ] 3 injections successives (chacune : injecter, `npm run typecheck`, coller 1re ligne d'erreur + exit code, restaurer, `git diff --stat <fichier>` vide) : `src/main.tsx` (`const x: number = 'a'`), `e2e/support/session.ts` (idem), `vite.config.ts` (idem)
- [ ] `npm run typecheck` sans injection → exit 0 OU liste des erreurs attribuées à un autre lot (T005/T007 en cours) — ne pas les compter contre T003
- [ ] `node --version` sous PATH nvm → v24.x ; `npm run test:unit` → ligne `# pass/# fail` collée
- [ ] `git diff README.md` → ≤ 3 lignes ajoutées, exactes
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/package.json` | L | scripts, engines |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/.nvmrc` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/README.md` | L | 3 lignes |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.json` | L | références |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.app.json` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.e2e.json` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.node.json` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/main.tsx` | E | injection temporaire, restaurer à l'identique |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/e2e/support/session.ts` | E | injection temporaire, restaurer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/vite.config.ts` | E | injection temporaire, restaurer |

## Contrats
```
déclaré T003 : typecheck = "tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.e2e.json --noEmit && tsc -p tsconfig.node.json --noEmit" ; durée 22 s ; engines ">=24" ; .nvmrc "24"
avant : "tsc --noEmit -p ." → 0,5 s, 0 vérification
restauration = Edit inverse (retirer la ligne injectée), PAS git checkout
```

## Décisions actées
- lint global rouge (816, préexistant) — HP, ne pas rapporter
- erreurs TS venant de fichiers d'autres lots en cours — HP

## Hors périmètre
- corriger ; `tsc -b` du build ; CI ; Dockerfile

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git status, git diff), Write (result.md + sonde temporaire si prévue)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d autres agents écrivent en même temps
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T012
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
