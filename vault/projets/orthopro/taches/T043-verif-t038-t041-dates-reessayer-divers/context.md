---
pack: T043
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T043 — Vérif T038-T041

> Seule source de vérité de l'agent T043. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter 4 lots : (a) migration dates sur 10 fichiers = sortie identique à l'ancien code sauf 2-digit→numeric (sonde HEAD vs lib) ; (b) « Réessayer » : `retrying` lit exactement les requêtes passées à `widgetState` sur 7 widgets ; (c) activity-chart sous WidgetCard sans perte, `fitCell` borné par `boundsOf`, toast `action` câblé ; (d) aucune ligne de JSX modifiée hors de ce qui est déclaré.

## Definition of Done
- [ ] `npm run test:unit`, `npm run typecheck`, `npx eslint src/modules/dashboard src/shared/ui/toast` (0 erreur) — collés
- [ ] (a) sonde `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/t043.probe.test.ts` (créer, lancer, supprimer, `git status` collé) : recopier depuis `git show HEAD:<fichier>` les anciens helpers supprimés (timeLabel today/tomorrow/next-appointment/free-slots/greeting, dayLabel recent, shortDay unpaid, date longue greeting/tomorrow.util/month-calendar, pluriels inline unpaid/revenue/clock.moreLabel) et comparer à `hhmm/longDate/shortDate/capitalize/plural` sur 12 dates (minuit, 23:59, DST, 1er du mois, dimanche) × TZ Europe/Paris ; attendu : identique sauf `shortDate` (« 5 oct. » vs « 05 oct. », voulu) ; coller n cas / n égaux / écarts listés
- [ ] (a) unpaid : ancien `${iso.slice(0,10)}T00:00:00` vs lib `new Date(iso)` — sonde sur `'2026-10-05T23:30:00Z'` en Europe/Paris : même jour ? si non → DÉFAUT (régression de jour)
- [ ] (b) pour les 7 widgets : `retrying = […].some(q => q.isFetching)` porte sur la même liste que `widgetState([…])` — tableau `widget | queries widgetState (L) | queries retrying (L) | égal ?` ; Button `outline sm disabled={retrying}` + libellé « Nouvel essai… » — citer
- [ ] (c) activity-chart : `git diff HEAD -- activity-chart.tsx` → hors shell, seuls déplacements du sous-titre/total ; hover/tooltip/axes inchangés (citer les lignes du SVG intactes) ; `fitCell` : `node --test dashboard-layout.util.test.ts` + lecture L51-60 (0 `Infinity`, 0 `GRID_COLS` local) ; toast : `action` rendu, `onClose` après `onClick` ; page L~299 passe `history.undo`
- [ ] (d) `git diff HEAD --stat` des 22 fichiers modifiés collé ; pour chaque .tsx : lignes `+/-` classées import | appel lib | retrying/Button | WidgetCard | AUTRE ; AUTRE = DÉFAUT à citer
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture par `git diff HEAD -- <chemin>` et `git show HEAD:<chemin>` (sorties de commande) pour tous les fichiers modifiés de `src/modules/dashboard` et `src/shared/ui/toast` ; Read direct limité à :
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/t043.probe.test.ts` | E | sonde, supprimer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | lib |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | L | fitCell |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-chart.tsx` | L | (c) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | L | (c) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.ts` | L | QueryLike |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow-widget.tsx` | L | (b) cas avec requête conditionnelle |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply-widget.tsx` | L | (b) idem |

## Contrats
```ts
export const shortDate = (d: DateLike): string ; longDate ; hhmm(d | minutes) ; capitalize ; plural(n, s, p?)
export const boundsOf: (grid: WidgetGrid | undefined) => { minW; minH; maxW; maxH }  // 1,1,12,60
// toast.tsx : ToastItem.action?: { label: string; onClick: () => void }
// déclaré T038 : tomorrow.util.ts:23 ; next-appointment-widget.tsx:54 ; next-appointment.util.ts:47 ; dashboard-greeting.tsx:38 ; dashboard-greeting.util.ts ; month-calendar.tsx:53,62 (WEEKDAYS noms complets, key={d})
// déclaré T039 : unpaid-invoices-widget.tsx:44,58 ; recent-documents-widget.tsx:56 ; revenue-widget.tsx:74 ; clock.util.ts:2,32,90 (export { longDate }, moreLabel → plural)
// déclaré T040 : 7 widgets retrying + Button outline sm ; tomorrow:54 hhmm ; free-slots:55 hhmm
// déclaré T041 : activity-chart.tsx:7,70-73,173 ; dashboard-layout.util.ts:4,51-60 ; toast.tsx:5,14-15,52-54 ; dashboard-page.tsx:299
// HEAD = b8993dd (état avant vague 3b)
/// <reference types="node" /> · node:test · node:assert/strict · imports relatifs .ts · TZ=Europe/Paris node --test …
```

## Décisions actées
- 2-digit → numeric voulu ; XhMM, {day,month:long}, {weekday:long}, {month:long,year} restent locaux
- forum/dashboard-forum.tsx:18 shell : à trancher plus tard — HP

## Hors périmètre
- corriger ; e2e (T042 bloquée) ; visuel

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser (les `git diff/show` ne comptent pas).
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git diff, git show, git status, rm sonde), Write (sonde + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T043
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute (sonde : n cas, n égaux, écarts)
## Retrying
| widget | widgetState | retrying | égal |
## Diff .tsx
| fichier | +/- | classes | AUTRE |
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
