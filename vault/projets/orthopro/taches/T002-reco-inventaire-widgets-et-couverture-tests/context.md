---
pack: T002
projet: orthopro
role: eclaireur
cree: 2026-10-05
---

# Pack T002 — Reco inventaire widgets + couverture tests

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Inventorier les 42 dossiers de `ortho-front/src/modules/dashboard/components/widget/*/` : pour chacun, source de données, états chargement/erreur/vide, test unitaire OUI/NON, défauts — produire un tableau par widget et un classement des 10 widgets à améliorer en priorité.

## Definition of Done
- [ ] tableau 1 ligne par dossier widget (42 lignes) : `dossier | fichiers | données (ctx.data.* / fetch propre / statique) | loading | error | empty | test util | settings`
- [ ] widgets sans aucun `*.test.ts` listés (commande + sortie brute)
- [ ] widgets faisant un fetch propre (`rg -n "fetch\(|useQuery|api/" widget/`) listés avec coordonnée
- [ ] top 10 à améliorer, chaque ligne : `dossier — défaut (≤ 12 mots) — sévérité H/M/B — coordonnée`
- [ ] fonctions `*.util.ts` exportées non couvertes par leur `*.util.test.ts` : liste `fichier:fonction` (comparer `export function` vs noms dans le test)
- [ ] duplication inter-widgets ≥ 3 cas avec coordonnées (formatage dates, euros, états vides…)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/types.ts` | L | contrat fiche widget |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | enveloppe commune |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/today-widget.tsx` | L | widget données-ctx type |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/weather/weather-widget.tsx` | L | widget fetch-propre type |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/revenue-widget.tsx` | L | widget argent + settings |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/revenue.util.ts` | L | util couvert, échantillon |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/revenue.util.test.ts` | L | pattern test |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock-widget.tsx` | L | widget sans test |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum/dashboard-forum.tsx` | L | widget lourd |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-widget.tsx` | L | widget chart/perf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding-widget.tsx` | L | widget état vide |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/unpaid-invoices/unpaid-invoices-widget.tsx` | L | widget liste |

## Contrats
```
// types.ts — contrat connu (vérifier, recopier le reste dans result)
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }
export type WidgetContext = { data: DashboardSummary; days: ActivityDay[]; todaySlots: TodaySlot[] | null; firstName: string; displayEuros: (value: number) => string; hideMoney: boolean; toggleHideMoney: () => void; navigate: NavigateFunction; … }
test runner : node --test 'src/**/*.test.ts'  (node:test + node:assert, pas vitest)
```

## Décisions actées
- périmètre vague = qualité widgets existants — decisions.md#2026-10-05
- HP nouveaux widgets — reporté
- front : réutiliser kit UI showcase, ne pas recréer — RULE.MD

## Hors périmètre
- modifier un fichier
- `dashboard-page.tsx`, `grid.tsx`, `edit/*`, `src/api/*` — couvert par T001
- proposer de nouveaux widgets
- `git push`, migrations, `npm install`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc, head, node --test) — cwd /home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget
- Les 30 autres dossiers widget : scan rg/ls/wc/head -n 30 uniquement, pas de Read intégral — ne compte pas comme lecture hors WL. Inventaire par grep : rg -n "export const|loading|isLoading|error|empty|length === 0|fetch\(|useQuery"
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Inventaire
tableau 42 lignes (colonnes de la DoD 1)
## Top 10
- dossier — défaut — H/M/B — chemin:L
## Non couvert
- fichier.util.ts:fonction
## Duplication
- motif — chemin:L, chemin:L, chemin:L
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
