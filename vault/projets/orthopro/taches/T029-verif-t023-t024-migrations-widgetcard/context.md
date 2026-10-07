---
pack: T029
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T029 — Vérif T023+T024 (WidgetCard)

> Seule source de vérité de l'agent T029. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter les migrations WidgetCard de today, forecast, activity-year, worklists et l'ajout `tour?` : iso-fonctionnalité par lecture du `git diff HEAD`, formats de date identiques octet pour octet (sonde), sélecteurs e2e/tour conservés.

## Definition of Done
- [ ] `git diff HEAD --stat` des 5 fichiers collé ; `npx eslint` 5 fichiers ; `npm run test:unit` ; `npm run typecheck` (KO hors WL d'autres lots en cours : lister, HP) — sorties collées
- [ ] `widget-card.tsx` : `tour?` → `data-tour={tour}` sur la `<section>` racine ; aucune autre prop modifiée (diff collé)
- [ ] today : `data-tour='dash-today'` présent dans le rendu (via prop) ; lister chaque élément JSX supprimé/ajouté hors shell (diff) ; mutations, liens, `WidgetFooterLink`, états L/E/V intacts → citer lignes
- [ ] sonde `today/dates.probe.test.ts` (créer, lancer, supprimer, `git status` collé) : pour 10 dates (minuit, 23:59, 1er du mois, dimanche), `hhmm(d)` ≡ ancien `timeLabel` (recopier l'ancienne implémentation depuis `git show HEAD:…/today-widget.tsx` L23) ; `longDate(d)` ≡ ancien L118 ; `plural(n,'restant')` ≡ ancien L119 pour n ∈ {0,1,2}
- [ ] worklists : `shortDate` → `5 oct.` vs ancien `05 oct.` = changement VOULU (ne pas compter défaut) ; `hue` et `count` passés ; 9 branches vides toujours rendues (citer)
- [ ] activity-year : toolbar et total dans `actions` ; requête année et navigation inchangées (citer) ; 2 `plural` ≡ anciens pluriels
- [ ] forecast : corps identique au diff près du shell ; `icon='money-bag'` = icône de la fiche index.tsx:5
- [ ] régression croisée : `rg -n "data-tour" src/modules/dashboard` → `dash-today` et `dash-grid` toujours présents
- [ ] verdict `OK` | `DÉFAUTS` (pertes visuelles hover/état vide worklists déjà connues : HP)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | tour |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/dates.probe.test.ts` | E | sonde, supprimer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forecast/previsionnel-card.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forecast/index.tsx` | L | icône |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-year.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/worklists/dashboard-worklists.tsx` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | lib |

## Contrats
```ts
export const WidgetCard = ({ icon, emoji, title, hue, count, actions, footer, children, bodyClassName, tour }: { …; tour?: string })
export const shortDate = (d: DateLike): string ; export const longDate = (d: DateLike): string ; export const hhmm = (d: DateLike | number): string ; export const plural = (n: number, singular: string, pluralForm = singular + 's'): string
// ancien code : git show HEAD:src/modules/dashboard/components/widget/today/today-widget.tsx (L23 timeLabel, L118 date longue, L119 pluriel) ; idem worklists L73, activity-year L19
// déclaré T023 : today-widget.tsx:19-20,107-122 ; previsionnel-card.tsx:5,22,59 ; widget-card.tsx:22-23,32-33
// déclaré T024 : activity-year.tsx:7-8,21,46-58,102 ; dashboard-worklists.tsx:1,8-9,53-66,82
/// <reference types="node" /> · node:test · node:assert/strict · import relatif .ts (../../../../../../shared/lib/format/date.ts)
```

## Décisions actées
- shortDate numérique voulu ; pertes hover/état vide worklists connues (recette humaine) — HP
- typecheck rouge hors WL (grid.tsx, daily-anecdote) = lots en cours — HP

## Hors périmètre
- corriger ; visuel navigateur ; activity-chart.tsx

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Grep, Glob, Bash(npm run, npx, node, rg, git show, git diff, git status, rm sonde), Write (sonde + result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T029
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Comportements modifiés hors shell
- ∅ | fichier — avant / après
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
