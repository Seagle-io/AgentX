---
tache: T010
statut: fait
---
## Livré
- widget/feedback/index.tsx:L6 — grid 9 6 / 9 3 / 11 8
- widget/clock/index.tsx:L6 — grid 6 4 / 5 3 / 8 6
- widget/pomodoro/index.tsx:L8 — grid 6 5 / 5 3 / 8 7
- widget/shortcuts/index.tsx:L7-L8 — grid 7 5 / 7 3 / 9 7 ; commentaire modules
- widget/age-calculator/index.tsx:L7-L8 — grid 7 7 / 7 4 / 9 9 ; commentaire minW
- widget/calculator/index.tsx:L6 — grid 6 5 / 5 5 / 8 7
- widget/month-calendar/index.tsx:L6 — grid 6 7 / 5 7 / 8 9
- widget/useful-links/index.tsx:L7 — grid 9 11 / 9 6 / 24 22
- widget/daily-game/index.tsx:L7 — grid 9 3 / 9 3 / 11 5
- widget/daily-quote/index.tsx:L7 — grid 6 4 / 5 3 / 8 6
- widget/word-of-day/index.tsx:L7 — grid 13 6 / 13 3 / 15 8
- widget/daily-anecdote/index.tsx:L8 — grid 6 5 / 5 3 / 8 7
(racine : ~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/)
## Vérifié comment
- `npx eslint <12 fichiers E>` → ∅ ; `echo $?` → `eslint exit 0`
- `npx tsc -b 2>&1 | grep -E "widget/(…12 ids…)/"` → ∅ ; `npx tsc -b; echo $?` → `tsc exit 0` ; `grep -c "error TS"` → `0`
- `npm run test:unit | tail` → `ℹ tests 426 · ℹ pass 426 · ℹ fail 0 · ℹ skipped 0`
- `grep -n "grid:"` sur 12 fichiers → 12 lignes = tableau T004 verbatim
## Écarts
- ∅ lecture hors WL
- outils : édition via `sed -i` (Bash), pas Edit — mode auto impose Bash
- shortcuts:L7 ancien commentaire « minH 4 : … pas un seul bouton » remplacé par « Sur 24 colonnes, en modules (T004). » — minH 3 contredit l'ancienne justification, rendu NV
- age-calculator:L7 ancien « 8 rangées au moins » → justification déplacée sur minW 7 (dates empilées si plus étroit) — minH 4 rendu NV
## Pour la suite
- minH 3 (shortcuts, feedback, word-of-day, pomodoro…) : rendu réel NV à module 24–48 px → vérif visuelle conseillée
- daily-game h 3 (ancien h 14) : chute forte, vérifier contenu iframe/lien tient
- layouts persistés en ancienne unité (12 col ?) : migration = T007/dashboard-layout.util, hors périmètre
## Retour sur le pack
- Manquait: texte attendu des commentaires existants contredits par nouvelles tailles (shortcuts, age-calculator)
- Inutile: ∅
