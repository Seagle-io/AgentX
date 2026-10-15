---
tache: T052
statut: fait
---
## Livré
- web/src/api.ts:120 — Organization + `contractEndAt?: string | null`
- web/src/pages/Admin.tsx:142 — saved += 'contract'
- web/src/pages/Admin.tsx:148-159 — état contractEnd synchro org + saveContract PATCH
- web/src/pages/Admin.tsx:259-267 — bloc date + Enregistrer/Effacer avant logo
- web/src/pages/Account.tsx:35-51 — downloadExport : GET → Blob → geolens-export-AAAA-MM-JJ.json
- web/src/pages/Account.tsx:78-88 — carte « Mes données » + busy + erreur
## Vérifié comment
`npm --prefix web run typecheck` → `tsc --noEmit -p tsconfig.json` · exit=0
`npm --prefix web run lint` →
```
Admin.tsx 389:6 warning React Hook useEffect has missing dependencies: 'loadOverview' and 'reload' react-hooks/exhaustive-deps
✖ 1 problem (0 errors, 1 warning)
```
`npm --prefix web test` → `Test Files 176 passed (176) · Tests 1691 passed (1691)`
`git diff --stat -- web` →
```
 web/src/api.ts            |  2 +-
 web/src/pages/Account.tsx | 28 ++++++++++++++++++++++++++++
 web/src/pages/Admin.tsx   | 23 ++++++++++++++++++++++-
 3 files changed, 51 insertions(+), 2 deletions(-)
```
navigateur NV — routes API non livrées (attendu pack)
## Écarts
- ∅
## Pour la suite
- warning lint Admin.tsx:389 préexistant (ex-:367), hors diff T052
- date export = `toISOString().slice(0,10)` → UTC, ≠ date locale avant 2h (Paris)
- « Effacer » désactivé si `org.contractEndAt` absent → dépend GET orgs renvoyant contractEndAt
- erreur 400 platform_org → onError=flashErr affiche ApiError.message (message serveur)
- vérif navigateur PATCH contract + GET /api/me/export après lots API
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
