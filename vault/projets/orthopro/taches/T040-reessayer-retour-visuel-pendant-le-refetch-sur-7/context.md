---
pack: T040
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T040 — Réessayer : retour visuel

> Seule source de vérité de l'agent T040. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Sur les 7 widgets à états, donner un retour visuel au clic « Réessayer » (bouton désactivé + libellé « Nouvel essai… » tant qu'une des requêtes est `isFetching`) sans changer la machine d'état ; au passage migrer les hh:mm de `tomorrow-widget.tsx:18` et `free-slots-widget.tsx:21` vers `hhmm`.

## Definition of Done
- [ ] 7 boutons (useful-links.tsx:50, onboarding-widget.tsx:55, quick-reply-widget.tsx:44, kora-news-widget.tsx:41, tomorrow-widget.tsx:69, week-grid-widget.tsx:66, free-slots-widget.tsx:63) : `disabled={retrying}` + libellé `{retrying ? 'Nouvel essai…' : 'Réessayer'}` où `retrying = queries.some(q => q.isFetching)` (mêmes requêtes que celles passées à `widgetState`) ; variante Button harmonisée : `variant='outline' size='sm'` partout
- [ ] la `WidgetNote tone='error'` reste affichée pendant le nouvel essai (état `error` conservé par widgetState tant que `isError`) — citer
- [ ] tomorrow-widget.tsx:18 et free-slots-widget.tsx:21 : formateur hh:mm local → `hhmm` de `@/shared/lib/format/date` ; helper local supprimé
- [ ] 0 autre changement de JSX ; `rg -n "Nouvel essai" <7 fichiers>` → 7 hits (collé)
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.tsx` | E | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding-widget.tsx` | E | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply-widget.tsx` | E | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news-widget.tsx` | E | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/tomorrow-widget.tsx` | E | + hhmm L18 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/week-grid-widget.tsx` | E | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/free-slots-widget.tsx` | E | + hhmm L21 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-state.ts` | L | QueryLike |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/format/date.ts` | L | hhmm |

## Contrats
```ts
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export const widgetState: (queries: readonly QueryLike[], isEmpty: boolean) => 'loading' | 'error' | 'empty' | 'ready'
// react-query : q.isFetching est vrai pendant un refetch, q.isError reste vrai tant que le refetch n a pas réussi
// Button : import Button from "@/shared/ui/button/bouton" ; variant 'outline' | 'ghost' | … ; size 'sm'
// src/shared/lib/format/date.ts (commité) — .tsx : import { … } from "@/shared/lib/format/date" ; *.util.ts testé sous node : import RELATIF suffixé .ts (ex. ../../../../../shared/lib/format/date.ts)
export type DateLike = Date | string
export const shortDate = (d: DateLike): string       // fr-FR {day:numeric, month:short} → "5 oct."  (remplace aussi les 2-digit "05 oct." : voulu)
export const longDate = (d: DateLike): string        // fr-FR {weekday:long, day:numeric, month:long} → "lundi 5 octobre"
export const hhmm = (d: DateLike | number): string   // "09:05" ; number = minutes depuis minuit
export const capitalize = (s: string): string
export const plural = (n: number, singular: string, pluralForm = singular + "s"): string
// RÈGLE : sortie identique octet pour octet à l ancien appel (la lib est validée T014) sauf 2-digit → numeric ; XhMM ("9h05", next-appointment.util.ts:28) reste LOCAL ; format {day:numeric, month:long} (next-appointment.util.ts:47) reste LOCAL
// un *.util.ts ne doit importer ni .tsx ni react ni dashboard-widgets
```

## Décisions actées
- WidgetNote + Button du kit, 0 nouveau composant — RULE.MD
- `tomorrow.util.ts` → T038 (collision) ; ne pas toucher

## Hors périmètre
- tomorrow.util.ts, free-slots.util.ts ; machine d'état ; autres widgets

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser dans `## Écarts`.
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, npx eslint, node --test, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` ; KO HORS WL = à lister, pas à corriger
- lint : `npx eslint <fichiers WL>` seulement
- Si bloqué : statut `bloque`, une question précise dans `result.md`, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T040
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (test:unit, typecheck, eslint WL)
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
