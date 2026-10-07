---
pack: T008
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T008 — États erreur : free-slots, week-grid, tomorrow, useful-links

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter l'état d'erreur (`WidgetNote tone='error'` + « Réessayer ») et, où il manque, le chargement (`Spinner`) aux widgets `free-slots`, `week-grid`, `tomorrow` (queries `['agenda-settings']`+`['agenda-availability']`) et `useful-links` (query L31 sans état).

## Definition of Done
- [ ] free-slots (`free-slots-widget.tsx:37-39`), week-grid (`week-grid-widget.tsx:27-29`), tomorrow (`tomorrow-widget.tsx:30-34`) : une query `isError` → erreur + Réessayer (refetch de toutes) ; `isLoading` → Spinner ; vide → `WidgetNote` existante
- [ ] useful-links (`useful-links.tsx:31`) : `isLoading` → Spinner ; `isError` → erreur + Réessayer ; vide inchangé
- [ ] fonction pure `widgetState` par dossier dans `<nom>.util.ts` (useful-links : créer `useful-links.util.ts`) + test ≥ 4 cas chacun
- [ ] 0 `<Text>` ad hoc pour un état ; `rg -n "WidgetNote|Spinner" <4 fichiers>` collé
- [ ] `npm run test:unit` → `# fail 0` ; `npm run typecheck`, `npm run lint` → sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots-widget.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots.util.ts` | E | widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots.util.test.ts` | E | compléter |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid-widget.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid.util.ts` | E | widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid.util.test.ts` | E | compléter |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow-widget.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.ts` | E | widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow.util.test.ts` | E | compléter |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.util.ts` | E | créer : widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.util.test.ts` | E | créer |


## Contrats
```ts
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
WidgetCard props : { icon: IconType; emoji?; title: ReactNode; hue?; count?; actions?: ReactNode; footer?: ReactNode; children; bodyClassName? }
// CIBLE util pur, même contrat que T007 (copie locale par dossier, pas de module partagé cette vague) :
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export const widgetState = (queries: QueryLike[], isEmpty: boolean): 'loading' | 'error' | 'empty' | 'ready'
// ordre : error > loading > empty > ready
// non couverts à couvrir au passage : free-slots.util.ts:workRanges, week-grid.util.ts:fills (≥ 2 cas chacun)
// pattern test existant (revenue.util.test.ts:1-5)
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts obligatoire
// runner : "test:unit": "node --test 'src/**/*.test.ts'"  (node 24 ; 243 tests verts au départ)
```

## Décisions actées
- `WidgetNote` + `Spinner` existants, 0 nouveau composant, copie locale de `widgetState` — fusion en vague 3 si identique
- « Réessayer » = `Button` du kit variante discrète

## Hors périmètre
- quick-reply, kora-news, onboarding (T007) ; formats de date (T006) ; dédoublonner les queries agenda ×3 — vague 3 ; settings des widgets

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, node, rg, git diff, git status) — cwd ortho-front
- Lecture tolérée hors WL (0 écart) : src/shared/ui/spinner/spinner.tsx (export default Spinner), src/shared/ui/button/bouton.tsx (export default Button), widget-card.tsx (contrat recopié ci-dessus)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node` — node 22 système KO sur `.ts`
- Interdit : `git commit`, `git push`, `npm install`, migration — le chef commit par lot
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T008
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, lint) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
