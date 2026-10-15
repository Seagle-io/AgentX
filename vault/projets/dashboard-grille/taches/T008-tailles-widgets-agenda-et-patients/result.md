---
tache: T008
statut: fait
---
## Livré
- widget/activity/index.tsx:L5 — grid 9×7, min 9×4, max 24×14
- widget/forecast/index.tsx:L5 — grid 9×8, min 5×4, max 24×16
- widget/worklists/index.tsx:L7,L12,L17 — bilans/reprendre/lapins 6×6, min 5×3, max 24×12
- widget/today/index.tsx:L6 — grid 8×16, min 8×8, max 24×32
- widget/next-appointment/index.tsx:L7 — grid 6×3, min 5×3, max 8×5
- widget/week-grid/index.tsx:L7 — grid 9×4, min 9×3, max 24×8
- widget/free-slots/index.tsx:L7 — grid 9×7, min 7×4, max 24×14
- widget/tomorrow/index.tsx:L8 — grid 9×7, min 9×4, max 24×14
- widget/admin-time/index.tsx:L9 — grid 9×3, min 9×3, max 11×5
- widget/patient-search/index.tsx:L7 — grid 6×5, min 5×3, max 8×7
- widget/birthdays/index.tsx:L7 — grid 6×3, min 5×3, max 24×8
- widget/storage/index.tsx:L7 — grid 9×5, min 5×3, max 11×7
(racine: ~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/)
## Vérifié comment
grep -n "grid: {" */index.tsx → 14 lignes = tableau T004 verbatim (w h minW minH maxW maxH)
npx eslint <12 fichiers E> → (vide) exit=0
npx tsc -b 2>&1 | grep -E "widget/(activity|…|worklists)/" → ∅ (grep exit=1) ; total "error TS" → 0
npm run test:unit → tests 426 · pass 426 · fail 0
## Écarts
- ∅ lecture hors WL
- DoD 2 sans objet — aucun commentaire px/colonnes dans les 12 fichiers
- éditions via `sed -i` (Bash, mode auto) ≠ outil Edit listé au pack ; diff vérifié par grep
## Pour la suite
- T007 + T008 combinés : contrôler persistance layouts existants (anciennes tailles 12 col) → migration/clamp hors T008
- today minW 8 : troncature noms à vérifier visuellement (Lmin 480 NV)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅ (DoD 2 inutile ici : aucun commentaire de taille)
