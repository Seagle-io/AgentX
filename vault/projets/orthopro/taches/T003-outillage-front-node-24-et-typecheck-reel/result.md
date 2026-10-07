---
tache: T003
statut: fait
---
## Livré
- `ortho-front/.nvmrc:1` — créé, `24`
- `ortho-front/package.json:6-8` — `engines.node: ">=24"`
- `ortho-front/package.json:13` — `typecheck` = `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.e2e.json --noEmit && tsc -p tsconfig.node.json --noEmit` (chaîne, pas `-b` : cache tsbuildinfo → < 2 s en 2e passe)
- `ortho-front/README.md:34-36` — section Outillage, 3 lignes
- `ortho-front/src/main.tsx` — injection puis restauration, `git diff` = ∅
- tsconfig*.json — inchangés

## Vérifié comment
PATH node v24.15.0, cwd ortho-front.
`time npm run typecheck` → `real 0m22,432s`, exit 0
Injection `const x: number = 'a'` fin de `src/main.tsx` → `npm run typecheck` :
```
src/main.tsx(62,7): error TS2322: Type 'string' is not assignable to type 'number'.
src/main.tsx(62,7): error TS6133: 'x' is declared but its value is never read.
EXIT=2
```
Restauration → `npm run typecheck` → `EXIT=0`, `git status --short src/main.tsx` → ∅
`npm run test:unit` →
```
ℹ tests 300
ℹ pass 300
ℹ fail 0
EXIT=0
```
`npm run lint` →
```
✖ 816 problems (755 errors, 61 warnings)
  746 errors and 0 warnings potentially fixable with the `--fix` option.
```
exit 1 — répartition : 559 @stylistic/indent · 111 @stylistic/quotes · 76 @stylistic/jsx-quotes · 52 react-refresh/only-export-components · 10 react-hooks/exhaustive-deps · 5 no-unused-expressions · 2 no-mixed-spaces-and-tabs · 1 tailwindcss/no-arbitrary-value ; 44 fichiers `src/shared`, 19 `src/modules`

## Écarts
- DoD 5 non cochée — lint 755 erreurs préexistantes, fichiers hors WL, aucune touchée par T003
- arbre de travail modifié en parallèle pendant T003 (34-35 fichiers `M` non commités, dashboard) : runs test:unit successifs 249/252 → 284/285 → 300/300 ; dernier run = 300/300
- lectures hors WL : ∅ (CLAUDE.md, Makefile = L)

## Pour la suite
- lint KO 755 err : 746 auto-fixables (`eslint . --fix` sur indent/quotes/jsx-quotes) ; reste 9 manuels : 5 no-unused-expressions, 2 no-mixed-spaces-and-tabs, 1 tailwind no-arbitrary-value, exhaustive-deps ×10 (warn→err selon config) — tâche dédiée
- fragilité test:unit : alias `@/shared` non résolu par node:test (vu sur `src/modules/dashboard/components/widget/clock/clock.util.ts` → `ERR_MODULE_NOT_FOUND`, corrigé entre-temps hors T003) ; tout `.util.ts` testé important `@/` casse `test:unit` → règle à écrire (imports relatifs dans les utils testés) ou loader
- `build` = `tsc -b` ignore `tsconfig.e2e.json` (non référencé dans `tsconfig.json`) ; `typecheck` le couvre — ajouter la référence si on veut `tsc -b --noEmit` plus tard (impose `composite`)
- erreurs TS révélées par le typecheck réel : ∅

## Retour sur le pack
- Manquait: avertir que l'arbre `ortho-front` est modifié en parallèle (résultats test:unit non stables) ; état lint attendu (KO 755 préexistant → DoD 5 non atteignable sans toucher hors WL)
- Inutile: ∅
