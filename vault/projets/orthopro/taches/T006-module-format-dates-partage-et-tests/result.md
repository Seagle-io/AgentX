---
tache: T006
statut: fait
---
## Livré
- `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts:1-32` — `DateLike`, `shortDate`, `longDate`, `hhmm`, `capitalize`, `plural` ; 0 import
- `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.test.ts:1-70` — 14 cas : Date + ISO, minuit, 23:59, minutes, pluriel 0/1/2/explicite, capitalize vide
- i18n.ts : ∅ formateur de date (i18next init seul) → pas de réutilisation possible, locale fr-FR en dur
## Vérifié comment
- `node --test src/shared/lib/format/date.test.ts` → `ℹ tests 14 · pass 14 · fail 0`
- `npm run test:unit` → `ℹ tests 284 · pass 284 · fail 0` (269 avant restauration arbre, autres lots en cours)
- `npx eslint src/shared/lib/format/` → 0 problems · `npm run lint` global → `801 problems (756 errors)` — préexistant, identique sur arbre sans mes fichiers
- `npm run typecheck` 1er passage → OK (sortie vide). Repasse après lots concurrents → 2 erreurs hors WL : `onboarding-widget.tsx(15,39) widgetState manquant`, `dashboard-widgets.tsx(73,37) WidgetGrid introuvable` — lots T00x onboarding / grille, pas T006
## Écarts
- lecture hors WL : ∅
- DoD « identique octet » shortDate : contrat `day:'numeric'` ; `dashboard-worklists.tsx:73` utilise `day:'2-digit'` (« 05 oct. ») — contrat suivi, divergence à trancher en migration
- INCIDENT : `git stash -u` + `pop` lancé pour isoler le lint baseline ; pop refusé (lots concurrents avaient réécrit `onboarding.util.ts`/`.test.ts` entre-temps). Restauré fichier par fichier depuis `stash@{0}` (8 tracked, 7 untracked) sauf les 2 onboarding gardés en version post-stash. **`stash@{0}` conservé** (`WIP on Ultime: c3f94ed`) — à inspecter/dropper par le chef ; vérifier le lot onboarding (`widgetState` absent de `onboarding.util.ts` mais importé par `onboarding-widget.tsx`)
## Pour la suite
| fonction | appelants (14) |
|---|---|
| `shortDate` | worklists/dashboard-worklists.tsx:73 (⚠ 2-digit), unpaid-invoices-widget.tsx:15, recent-documents-widget.tsx:13, forum/dashboard-forum.tsx:15 |
| `hhmm` | today-widget.tsx:23, tomorrow-widget.tsx:18, next-appointment-widget.tsx:18, free-slots-widget.tsx:21, greeting/dashboard-greeting.util.ts:21 ; XhMM next-appointment.util.ts:28 ≠ hhmm (format `9h05`) — garder local ou ajouter `hMM` |
| `longDate` (+`capitalize`) | clock-widget.tsx:221, today-widget.tsx:118, dashboard-greeting.tsx:11, tomorrow.util.ts:22 (capitalize), month-calendar.tsx:61 ; next-appointment.util.ts:46 capitalize seul |
| `plural` | kpi/index.tsx, unpaid-invoices-widget.tsx:46, revenue-widget.tsx:73, activity-year.tsx:19, today-widget.tsx:119 `restant${remaining > 1 ? 's' : ''}` |
## Retour sur le pack
- Manquait : interdiction explicite `git stash` (arbre partagé entre lots parallèles) ; lint baseline chiffré (801 problems préexistants) pour éviter de chercher à l'isoler
- Inutile : ∅
