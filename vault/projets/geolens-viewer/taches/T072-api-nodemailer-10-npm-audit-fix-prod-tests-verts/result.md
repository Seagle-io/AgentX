---
tache: T072
statut: fait
---
## Livré
- G/api/package.json — nodemailer ^9.1.1 → ^10.0.16
- G/api/package-lock.json — nodemailer 10.0.16 + 3 transitifs corrigés (+16 −19)
- G/api/src/mailer.ts — 0 modification (typecheck + smoke OK)
## Vérifié comment
- AVANT `npm --prefix api audit --omit=dev` → `4 high severity vulnerabilities` (@fastify/busboy, fast-uri ≤3.1.7, find-my-way ≤9.6.0, nodemailer ≤10.0.8)
- cmd 1 `npm --prefix api install nodemailer@^10.0.16` → `changed 1 package, and audited 223 packages in 1s` · exit 0
- cmd 2 `npm --prefix api audit fix --omit=dev` → `changed 3 packages, and audited 131 packages in 882ms` · `found 0 vulnerabilities` · exit 0
- effet de bord cmd 2 : devDeps élaguées de node_modules (∅ vitest/tsc dans .bin) → `npm --prefix api ci` → `added 222 packages, and audited 223 packages in 2s` · vitest + tsc revenus
- APRÈS `npm --prefix api audit --omit=dev` → `found 0 vulnerabilities`
- versions → nodemailer 10.0.16 · fastify 5.12.5 · find-my-way 9.9.0 · fast-uri 3.1.8 · @fastify/busboy 3.2.2
- smoke `node -e "import('nodemailer')…createTransport({jsonTransport:true})…sendMail"` (cwd api) → `OK string`
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · EXIT 0
- `npm --prefix api test` → `Test Files 96 passed (96)` · `Tests 824 passed (824)` · EXIT 0
- `git diff --stat -- api` → `api/package-lock.json | 33 +++---` · `api/package.json | 2 +-` · `2 files changed, 16 insertions(+), 19 deletions(-)`
- `git status --short` → ` M api/package-lock.json` · ` M api/package.json` (∅ autre)
## Écarts
- ∅ lecture hors WL
- `npm --prefix api ci` lancé hors cas retour arrière — restaurer devDeps élaguées par audit fix --omit=dev (commande dans liste outils)
## Pour la suite
- `npm audit fix --omit=dev` élague les devDeps de node_modules → toujours enchaîner `npm ci` avant tests
- audit complet (dev inclus) après ci : 11 vulnérabilités (4 moderate, 5 high, 2 critical) — hors lot, non traité
- api prod : 0 vulnérabilité ; changements non commités (D5) — commit à faire par l'humain/chef
## Retour sur le pack
- Manquait: effet `--omit=dev` sur node_modules (prune devDeps) + `npm ci` prévu explicitement après cmd 2 | Inutile: test/admin-console.test.ts (non lu)
