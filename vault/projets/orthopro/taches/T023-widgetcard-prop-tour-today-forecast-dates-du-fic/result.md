---
tache: T023
statut: fait
---
## Livré
- `ortho-front/src/modules/dashboard/components/widget/widget-card.tsx:22-23,32-33` — prop `tour?: string` → `data-tour={tour}` ; autres props intactes
- `ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx:19-20` — imports `hhmm, longDate, plural` + `WidgetCard, WidgetFooterLink`
- `today-widget.tsx` — `timeLabel` supprimé, 5 appels → `hhmm(iso)`
- `today-widget.tsx:107-118` — racine `<WidgetCard icon='calendar' title='Agenda du jour' tour='dash-today' bodyClassName='flex flex-col' footer={<WidgetFooterLink icon='calendar' …>}>`
- `today-widget.tsx:121-122` — `longDate(now)` (source ne capitalisait pas) · `plural(remaining, 'restant')`
- `ortho-front/src/modules/dashboard/components/widget/forecast/previsionnel-card.tsx:5,22,59` — racine `<WidgetCard icon='money-bag' title='Prévisionnel par type' bodyClassName='flex flex-col p-4'>` ; sous-titre « 30 prochains jours » + corps inchangés
- mutations, liens, loading/erreur, AppointmentDialog : inchangés (dedent seul)

## Vérifié comment
```
rg -n "rounded-card border border-border bg-bg-panel|data-tour|timeLabel" <3 WL>
→ widget-card.tsx:33 data-tour={tour} · widget-card.tsx:35 (shell WidgetCard) · today/forecast : 0 hit
npx eslint <3 WL> → (vide) rc=0
npm run typecheck → 1 erreur HORS WL : src/modules/dashboard/components/grid.tsx(88,7) TS6133 'cellTestAttrs' never read — fichier ` M` par un autre agent, 0 erreur sur les 3 WL
npm run test:unit → tests 348 · pass 348 · fail 0
git diff --stat →
 previsionnel-card.tsx |   6 +-
 today-widget.tsx      | 262 ++++++++++-----------  (dedent 1 tab du corps)
 widget-card.tsx       |   5 +-
 3 files changed, 135 insertions(+), 138 deletions(-)
```
- `hhmm` vs `toLocaleTimeString fr-FR 2-digit` : pad 24 h identique — NV runtime (lib validée selon pack)

## Écarts
- lecture hors WL : `src/modules/dashboard/components/forecast/index.tsx` déjà en WL (L) → icône `money-bag` repris de la fiche
- lecture hors WL : `src/shared/lib/utils.ts` (4 l.) — vérifier `cn` = twMerge pour `bodyClassName` → pas d'écart de style
- icône forecast non spécifiée dans le pack → `money-bag` (= fiche `index.tsx:5`)
- DoD typecheck « 0 » : 0 sur WL ; 1 KO préexistant hors WL (`grid.tsx:88`, arbre partagé), non corrigé

## Pour la suite
- `grid.tsx:88` `cellTestAttrs` non lu → typecheck rouge ; appartient à l'agent qui modifie `grid.tsx` (T024 ?)
- forecast : titre passe de `text-base` (h4 custom) à l'en-tête standard `text-sm` WidgetCard — visuel à valider une fois
- today : body WidgetCard a `overflow-y-auto` + liste interne `overflow-y-auto` → un seul scroll effectif (liste), vérif. visuelle rapide conseillée
- Playwright `data-tour='dash-today'` : porté par la `<section>` WidgetCard, sélecteur inchangé

## Retour sur le pack
- Manquait : icône `IconType` cible pour forecast ; padding corps attendu (`p-5` source vs `p-4` défaut WidgetCard)
- Inutile : `revenue-widget.tsx` (1 grep suffit), `today-rail.util.ts`
