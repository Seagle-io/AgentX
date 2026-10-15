---
tache: T009
statut: fait
---
## Livré
- widget/revenue/index.tsx:L8 — grid 9 6 / 7 3 / 24 12
- widget/unpaid-invoices/index.tsx:L7 — grid 9 8 / 7 4 / 24 16
- widget/transmissions/index.tsx:L7 — grid 9 7 / 7 4 / 24 14
- widget/recent-documents/index.tsx:L7 — grid 9 8 / 7 4 / 24 16
- widget/unread-messages/index.tsx:L7 — grid 9 7 / 7 4 / 24 14
- widget/quick-reply/index.tsx:L7 — grid 9 12 / 7 6 / 24 24
- widget/contact-code/index.tsx:L7 — grid 7 6 / 7 3 / 9 8
- widget/forum-notifications/index.tsx:L6 — grid 6 8 / 5 4 / 24 16
- widget/achievements/index.tsx:L6 — grid 7 6 / 7 3 / 9 8
- widget/kora-news/index.tsx:L6 — grid 6 8 / 5 4 / 24 16
- widget/licence/index.tsx:L6 — grid 7 6 / 7 3 / 9 8
- widget/onboarding/index.tsx:L6 — grid 6 10 / 5 5 / 8 12
(racine: ~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/)
## Vérifié comment
grep -n "grid:" 12 fichiers → 12 lignes = tableau pack, verbatim
npx eslint 12 fichiers → (vide) ; exit=0
npx tsc -b | grep -E "widget/(achievements|…|unread-messages)/" → ∅ ; grep exit=1
npx tsc -b | grep -c "error TS" → 0
npm run test:unit → ℹ tests 426 · pass 426 · fail 0 · cancelled 0 · skipped 0
## Écarts
- ∅ lecture hors WL
- DoD 2 sans objet — grep "colonne|px|taille" → ∅ commentaire de taille
## Pour la suite
- 7 widgets NV (facturation/documents/messagerie) : tailles déduites famille, à mesurer quand modules dispo
- tsc global 0 erreur au moment du run → T007 compatible ou déjà livré
## Retour sur le pack
- Manquait: ∅
- Inutile: DoD 2 (aucun commentaire de taille dans ces fichiers)
