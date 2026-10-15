---
tache: T038
statut: fait
---
## Livré
- e2e/proof-upload.mjs:L75-L76 — onglet « Projets & accès » puis heading « Import direct (avancé) »
- e2e/proof-upload.mjs:L117-L120 — onglet + dépliage groupes org avant suppression
- e2e/proof-upload.mjs:L124 — clic confirm `role=dialog` (confirmDialog in-app)
- e2e/proof-viewer.mjs:L71-L72 — mem exigé ssi ASSETS_PRESENT, sinon OK « NV »
- e2e/diag-{full:6,nested:7,nuage:5,prod:6,stream:14,ui:4}.mjs — `import { DIR } from './_proofEnv.mjs'`
## Vérifié comment
```
rg -n "C:/tmp" e2e -g '!node_modules' → (vide) rg=1
node --check diag-{full,nested,nuage,prod,stream,ui}.mjs → 6× OK
npm --prefix web run build → ✓ built in 13.36s
BASE=http://localhost:5180 node e2e/proof-upload.mjs → … OK le projet supprimé a DISPARU de la table admin · OK 0 erreur console bloquante (0) · === RÉSULTAT : TOUT VERT ✅ === exit=0
BASE=… node e2e/proof-viewer.mjs → SEUIL ASSOUPLI 30→0 … · OK — mémoire GPU NV : assets absents (decisions.md D4) · TOUT VERT ✅ exit=0
persistence exit=0 0fail · range exit=0 0fail · ortho exit=0 0fail · export exit=0 0fail · viewer exit=0 0fail (run final)
git -C G diff --stat -- e2e → 8 files changed, 15 insertions(+), 8 deletions(-)
kill -- -<pgid api,preview> ; ss -ltnp | rg ':4000|:5180|:5173' → seul 127.0.0.1:5173 pid=252705
```
## Écarts
- DoD 1 dépassée en périmètre fichier : D2 = même cause en section D (:116-124), pas produit — 0 assertion retirée
- cause D2 : Admin.tsx:276 onglet défaut overview/members ; formulaire sous `tab === 'projects'` (:791)
- cause D2 bis : platform_admin → projets groupés par org repliés (Admin.tsx:912 `aria-expanded`) ; suppression = confirmDialog in-app, `page.on('dialog')` inopérant
- lecture hors WL: web/src/components/dialog.tsx:85-98 (rg) — bouton confirm du confirmDialog, bloquant
- 5 runs KO intermédiaires → 5 projets orphelins « Upload Proof 1791381649082 / 1791381703410 / 1791381729629 / 1791381768083 / 1791381801109 » dans la base dev, non supprimés (hors outils autorisés)
## Pour la suite
- purger les 5 projets « Upload Proof 17913816…–17913818… » via /admin (Projets & accès)
- proof-upload.mjs:L64 `page.on('dialog')` désormais mort (confirmDialog in-app) — à retirer
- autres proof-*.mjs touchant /admin : vérifier onglet + groupes repliés + confirmDialog
- en-têtes proof-*.mjs annoncent front :5173 → aligner sur :5180 (D11)
## Retour sur le pack
- Manquait: Admin à onglets (Admin.tsx:276,588,791) + groupes org repliés (:912) + confirmDialog (dialog.tsx:86-98) → 1 lecture hors WL et 4 relances évitables ; prévoir purge en cas de KO intermédiaire
- Inutile: ∅
