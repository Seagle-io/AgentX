---
tache: T012
statut: fait
verdict: OK
---
## Vérifié comment
- `od -c .nvmrc` → `2 4 \n`
- `rg -n '"engines"' -A2 package.json` → `6: "engines": {` · `7: "node": ">=24"`
- `rg -n '"typecheck"' package.json` → `13: "typecheck": "tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.e2e.json --noEmit && tsc -p tsconfig.node.json --noEmit"` = contrat
- `time npm run typecheck` (sans injection) → exit=0 · real 0m22,863s
- injection = `printf "const x: number = 'a' // T012-PROBE\n" >> f` ; restauration = `sed -i '/\/\/ T012-PROBE$/d'` ; md5 avant = après ×3
- `src/main.tsx` → `src/main.tsx(62,7): error TS2322: Type 'string' is not assignable to type 'number'.` exit=2 · restored-identical · `git diff --stat` → ∅
- `e2e/support/session.ts` → `e2e/support/session.ts(10,7): error TS2322: ...` exit=2 · restored-identical · diffstat ∅
- `vite.config.ts` → `vite.config.ts(34,7): error TS2322: ...` exit=2 · restored-identical · diffstat ∅
- ancien script `npx tsc --noEmit -p . --listFilesOnly | wc -l` → `0` — confirme 0 vérification avant
- `tsc -p tsconfig.{app,e2e,node}.json --listFilesOnly | grep -v node_modules | wc -l` → app 1358 · e2e 31 · node 1
- `rg --files -g '*.ts' -g '*.tsx' -g '!node_modules' | grep -v '^src/\|^e2e/'` → `playwright.config.ts` (e2e) · `vite.config.ts` (node) — 0 fichier TS orphelin
- `node --version` (PATH nvm) → v24.15.0
- `npm run test:unit` → `ℹ tests 352 · ℹ pass 350 · ℹ fail 2` exit=1
- 2 fail = `src/modules/dashboard/components/widget/clock/clock.probe.test.ts:28,29` (P11, P12) — `??` non suivi, sonde autre lot, apparue pendant T012 → HP T003
- `git diff --numstat README.md package.json` → `4 0 README.md` · `4 1 package.json`
- README +4 = 1 vide séparateur + `## Outillage` + 1 vide + 1 ligne texte → 2 lignes non vides ; contenu exact :
  `Node 24 requis (`nvm use` lit `.nvmrc`). `npm run typecheck` (src + e2e + vite.config), `npm run lint`, `npm run test:unit`.`
- package.json diff = engines (3 l.) + typecheck (1 l.) seulement ; `.nvmrc` `??` nouveau
## Défauts
- ∅
## Écarts
- ∅ lecture hors WL ; `git diff --numstat`/`git status` lus sur l'arbre entier (commandes autorisées)
- README +4 lignes au numstat vs DoD « ≤ 3 » — 1 ligne vide avant titre, markdown requis ; non compté défaut
## Pour la suite
- `typecheck` chaîné `&&` : erreur dans src → e2e et vite.config non vérifiés ce run-là (exit ≠0 quand même)
- `npm config get engine-strict` → false ; `/usr/bin/node` = v22.22.1 → engines `>=24` non bloquant hors nvm
- `tsconfig.json` références app + node, ∅ e2e → `tsc -b` (build) ne couvre pas e2e — HP T003
- `clock.probe.test.ts` (non suivi) fait échouer `test:unit` (2 fail) → à supprimer/assumer par son lot
- `test:unit` glob `src/**/*.test.ts` ; 0 `*.test.tsx` aujourd'hui → futur .tsx ignoré silencieusement
## Retour sur le pack
- Manquait: DoD README « ≤ 3 lignes » ambigu (vides comptées ?) ; injection sans Edit → préciser `printf >>` + `sed -i` marqueur
- Inutile: tsconfig.json en WL (1 lecture, utile seulement pour note `tsc -b`)
