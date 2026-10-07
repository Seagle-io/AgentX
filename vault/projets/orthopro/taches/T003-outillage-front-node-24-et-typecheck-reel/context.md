---
pack: T003
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T003 — Outillage front : node 24 + typecheck réel

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `npm run typecheck` réellement vérifiant et `npm run test:unit` reproductible (node 24 déclaré), dans `ortho-front/package.json`, `tsconfig*.json`, `.nvmrc`.

## Definition of Done
- [ ] `.nvmrc` créé = `24` ; `package.json` `engines.node` = `">=24"`
- [ ] `npm run typecheck` couvre `src` (tsconfig.app.json) ET `e2e` (tsconfig.e2e.json) ET `vite.config.ts` ; durée > 2 s
- [ ] preuve : injecter `const x: number = 'a'` dans `src/main.tsx`, typecheck KO avec l'erreur TS2322 collée, puis retirer, typecheck OK — les deux sorties brutes dans result
- [ ] `npm run test:unit` → `# pass 243` (ou plus) `# fail 0` sous node 24, sortie collée
- [ ] `npm run lint` → 0 erreur, sortie collée
- [ ] `README.md` : 3 lignes max ajoutées (node 24 via nvm, commandes test)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/package.json` | E | scripts, engines |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/.nvmrc` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.json` | E | références |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.app.json` | E | si besoin |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.node.json` | E | si besoin |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/tsconfig.e2e.json` | E | si besoin |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/README.md` | E | 3 lignes |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/main.tsx` | E | injection temporaire, rendre identique |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/Makefile` | L | cibles existantes |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/CLAUDE.md` | L | conventions locales |

## Contrats
```
état : tsconfig.json = { "files": [], "references": [app, node] } ; app/node/e2e : noEmit true
actuel : "typecheck": "tsc --noEmit -p ."  → 0,5 s, ne vérifie rien
cible acceptée : "typecheck": "tsc -b --noEmit" (TS ≥ 5.6) OU "tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.e2e.json --noEmit && tsc -p tsconfig.node.json --noEmit"
"test:unit": "node --test 'src/**/*.test.ts'"  — ne pas changer le glob
```

## Décisions actées
- node 24 obligatoire — test:unit KO node 22, decisions.md#2026-10-05
- pas de vitest côté front — runner node:test conservé
- pas de nouvelle dépendance — `npm install` interdit

## Hors périmètre
- corriger les erreurs TS que le typecheck réel révélerait : les LISTER dans `## Pour la suite` (fichier:ligne:code), ne pas toucher
- scripts e2e, playwright.config.ts, Dockerfile, CI

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, node, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node` — node 22 système KO sur `.ts`
- Interdit : `git commit`, `git push`, `npm install`, migration — le chef commit par lot
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, lint) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
