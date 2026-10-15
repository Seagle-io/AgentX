---
tache: T060
statut: fait
---
## Livré
- api/src/erasure.ts:L7 — doc : email et id retirés
- api/src/erasure.ts:L81-L93 — étape 7 : needles [email, userId], Set lignes distinctes
- api/src/erasure.ts:L104-L108 — `likeEscape` exporté (non appelé en prod)
- api/src/userExport.ts:L7 — doc : emails tiers masqués
- api/src/userExport.ts:L86 — detail audit → `maskThirdPartyEmails(r.detail, u.email)`
- api/src/userExport.ts:L99-L106 — `EMAIL_RE` + `maskThirdPartyEmails` (contrat)
- api/src/server.ts:L1903-L1904 — année ∉ [2000, 2200] → 400 identique
- web/src/pages/Confidentialite.tsx:L51 — « Nom, » retiré
- api/test/d15-fixes.test.ts:L1-L113 — NEUF, 6 cas du pack
## Vérifié comment
- `npx vitest run test/d15-fixes.test.ts test/erasure-unit.test.ts test/user-export-unit.test.ts` → `Test Files  3 passed (3)` / `Tests  18 passed (18)`
- `npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` ; `api exit=0`
- `npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` ; `web exit=0`
- `npm --prefix api test` → `Test Files  89 passed (89)` / `Tests  769 passed (769)` (base 88/763 + 1/6)
- `git diff --stat` →
```
 api/src/erasure.ts                | 29 +++++++++++++++++++----------
 api/src/server.ts                 |  3 ++-
 api/src/userExport.ts             | 12 +++++++++++-
 web/src/pages/Confidentialite.tsx |  2 +-
 4 files changed, 33 insertions(+), 13 deletions(-)
?? api/test/d15-fixes.test.ts
```
## Écarts
- pg-mem refuse `LIKE $1 ESCAPE '\'` → `Syntax error … Unexpected string token: "\\"` (12 tests KO, seed noflag)
- 2e essai : motif `likeEscape` sans ESCAPE (échappement \ par défaut de Postgres) → pg-mem ne l'applique pas → `auditScrubbed` 0 ≠ 1 (erasure-unit:119 + d15:63 KO)
- → repli prévu par le contrat : motif brut `'%' + needle + '%'` + filtre JS `includes` ; sur-sélection seule, 0 ligne manquée ; noté erasure.ts:L81-L82
- conséquence : `likeEscape` livré + testé (cas 3) mais appelé nulle part en prod — DoD 1 « motif LIKE échappé » non tenue telle quelle
- server.ts : borne ajoutée DANS l'expression `valid` (pas une ligne séparée) — même 400, 1 ligne ajoutée
- 0 lecture hors WL
## Pour la suite
- `likeEscape` mort en prod : soit le supprimer (avec le cas 3), soit filtrer en SQL par `strpos(detail, $1) > 0` si pg-mem l'accepte (exact, sans échappement)
- needle userId : remplacement par sous-chaîne ; ids courts non-UUID pourraient toucher un detail voisin — NV sur données réelles
- export : masquage par regex sur `detail` seul ; ip/userAgent intacts (les siens)
- `delete_user` { userId } écrit après eraseUser : conservé, non testé ici
## Retour sur le pack
- Manquait: route reset-password (server.ts:1452) et export (`/api/me/export` :278) non citées ; pg-mem ignore aussi l'échappement \ par défaut, pas seulement ESCAPE
- Inutile: ∅
