---
tache: T029
statut: fait
verdict: OK
---
## Vérifié comment
cwd `ortho-front`, node v24.15.0, D=`src/modules/dashboard/components/widget`
- `git diff HEAD --stat` 5 fichiers → activity-year 34, previsionnel-card 6, today-widget 262, widget-card 5, dashboard-worklists 38 ; `5 files changed, 170 insertions(+), 175 deletions(-)`
- `git diff -w HEAD --stat` today → `21 insertions(+), 27 deletions(-)` (reste = réindentation)
- `npx eslint` 5 fichiers → ∅ sortie, `exit=0`
- `npm run test:unit` → `tests 380 · pass 380 · fail 0` exit 0
- `npm run typecheck` → `tsc app && e2e && node` exit 0 (KO HP attendu hors WL → ∅, déjà vert)
- widget-card diff → +`tour?: string` L22-23, +`tour` destructuré L31, +`data-tour={tour}` L33 sur `<section>` racine ; 0 autre ligne
- today diff -w hors shell → seuls `timeLabel`→`hhmm`, L118→`longDate`, L119→`plural` ; `tour='dash-today'` today-widget.tsx:110
- today intacts → `grep -cE "navigate\(|startSession|setEditDraft"` HEAD 9 / now 9 ; L113 footer agenda, L145/147/153 L/E/V, L161 edit, L171/208/233 navigate, L227-228 startSession, L249 AppointmentDialog
- footer → `WidgetFooterLink icon='calendar'` L113-116 ; classes ≡ ancien bouton moins `shrink-0 border-t` portés par wrapper widget-card.tsx:48
- sonde `today/dates.probe.test.ts` × TZ {Europe/Paris, UTC, America/New_York, Pacific/Kiritimati, Asia/Kolkata} → `✔ hhmm ≡ timeLabel · ✔ longDate ≡ ancien L118 · ✔ plural restant/séance · pass 4 fail 0` ×5
  - 10 dates locales (00:00, 23:59, 1er nov, dim 4 oct, 1er janv, 29 fév, DST 29/03 03:00, DST 25/10 02:30, 23:59:59.999, 14/07) + 10 ISO (Z, +01:00, sans TZ, date seule, epoch, 2099)
  - plural n ∈ {0,1,2,-1,1.5,1000,NaN} ≡ `restant${n>1?'s':''}` et `séance${…}`
  - `node -e` → timeLabel minuit `"00:00"` (pas `24:00`)
  - shortDate → `"5 oct."` vs ancien `"05 oct."` (voulu) ; mois sans point `"29 mars"` ≡
- `rm` sonde ; `git status --short …/today/` → ` M …/today-widget.tsx` seul
- worklists → `hue={hue}` L55, `count={count}` L56, vide = message L60 + body `hidden` L63 ; carte toujours rendue L76/L113/L131 ; 7 branches lignes L77/85/94/114/117/120/132 inchangées
- activity-year → toolbar + total dans `actions` L49-57 ; `useQuery` L34-37 ≡ HEAD ; navigate L84 ≡ ; plural L21 + L54 ≡ anciens (sonde `séance`)
- forecast → diff -w `3+/3-` = shell seul ; `icon='money-bag'` previsionnel-card.tsx:22 ≡ index.tsx:5
- `rg -n "data-tour" src/modules/dashboard` → dashboard-page.tsx:354 `dash-grid`, tab-bar.tsx:64, widget-card.tsx:33 `{tour}` ; `dash-today` via prop today-widget.tsx:110 ; ancres module-tours.ts:27/29 inchangées
- diff 5 fichiers `data-testid|aria-label|role=` → 0 perte ; `rg` e2e → 0 sélecteur widget dashboard
## Défauts
- ∅
## Comportements modifiés hors shell
- today-widget.tsx:174,178,190,192 — date invalide : avant `"Invalid Date"` / après `"NaN:NaN"` (sonde `hhmm('')`) — API typée string, non atteignable normalement
- dashboard-worklists.tsx:82 — `05 oct.` / `5 oct.` — voulu
- today-widget.tsx body — avant wrapper sans overflow / après `overflow-y-auto` (widget-card.tsx:47) + liste interne scroll ; double scroll seulement si en-tête > hauteur carte
- activity-year.tsx:51 — toolbar : avant `ml-auto self-center` / après dans `actions` (`gap-1 items-center`)
## Écarts
- lecture hors WL: `git status --short` arbre — contexte diff
- lecture hors WL: `rg dash-today|dash-grid` (module-tours.ts, dashboard-page.tsx) + `rg` e2e — sélecteurs tour/e2e
- lecture hors WL: `rg .dash-hue src/index.css` L1434-1438 — classe ajoutée today/forecast/activity, ne fixe que `--hue`
## Pour la suite
- worklists vide : en-tête garde `border-b` (widget-card.tsx:37) + body `hidden` → filet sous en-tête ; pastille ✓ perd `bg-success/10 text-success` ; hover bordure perdu — HP connu, recette humaine
- activity-year : total `text-2xl` dans en-tête `py-3` → en-tête plus haut que les autres cartes — visuel NV
- `hhmm` : garde `isNaN` éventuelle si API renvoie date vide — hypothèse
## Retour sur le pack
- Manquait: typecheck déjà vert (pack annonçait KO grid.tsx/daily-anecdote) ; « 9 branches vides » non défini — compté 3 cartes + 7 branches lignes
- Inutile: ∅
