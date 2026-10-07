---
pack: T007
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T007 — États L/E/V : quick-reply, kora-news, onboarding

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Donner à `quick-reply`, `kora-news`, `onboarding` trois états explicites et distincts — chargement (`Spinner`), erreur (`WidgetNote tone='error'` + « Réessayer »), vide (`WidgetNote`) — en corrigeant l'erreur affichée comme vide dans quick-reply.

## Definition of Done
- [ ] quick-reply (`quick-reply-widget.tsx:22-38`) : `practitioners.isError || patients.isError` → `WidgetNote tone='error'` « Messagerie indisponible » + bouton « Réessayer » (`refetch` des 2 queries) ; « Aucune conversation à reprendre » UNIQUEMENT si les 2 queries sont `isSuccess` et vides
- [ ] kora-news (`kora-news-widget.tsx:18-35`) : `isLoading` → `Spinner` centré ; `isError` → erreur + Réessayer ; « Aucune annonce » seulement si `isSuccess`
- [ ] onboarding (`onboarding-widget.tsx:27-29`) : les 3 queries → `isLoading` global = Spinner ; une `isError` → erreur + Réessayer ; étapes à `null` (donnée absente) rendues « — » ou masquées, jamais confondues avec « non fait »
- [ ] 0 `<Text>` ad hoc pour un état : `WidgetNote`/`Spinner` uniquement ; `rg -n "WidgetNote|Spinner" <3 fichiers>` collé
- [ ] pour chaque widget : fonction pure `widgetState(q1, q2, …) : 'loading' | 'error' | 'empty' | 'ready'` dans `<nom>.util.ts` (créer si absent) + test ≥ 4 cas (chaque état) — c'est ce qui rend la DoD vérifiable sous node
- [ ] `npm run test:unit` → `# fail 0` ; `npm run typecheck`, `npm run lint` → sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply-widget.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.ts` | E | créer : widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/quick-reply.util.test.ts` | E | créer |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news-widget.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news.util.ts` | E | ajouter widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/kora-news.util.test.ts` | E | compléter |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding-widget.tsx` | E | états |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.ts` | E | ajouter widgetState |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/onboarding.util.test.ts` | E | compléter |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | WidgetCard/WidgetNote/WidgetFooterLink |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/spinner/spinner.tsx` | L | `export default Spinner` |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/button/bouton.tsx` | L | bouton Réessayer, import par défaut |

## Contrats
```ts
export const WidgetNote = ({ tone = 'muted', children }: { tone?: 'muted' | 'error'; children: ReactNode })
export const WidgetFooterLink = ({ icon, children, onClick }: { icon?: IconType; children: ReactNode; onClick: () => void })
WidgetCard props : { icon: IconType; emoji?; title: ReactNode; hue?; count?; actions?: ReactNode; footer?: ReactNode; children; bodyClassName? }
// quick-reply-widget.tsx:22-27 actuel
const practitioners = useQuery({ queryKey: ['messaging', 'conversations', 'practitioner'], queryFn: () => listConversations('practitioner') })
const patients = useQuery({ queryKey: ['messaging', 'conversations', 'patient'], queryFn: () => listConversations('patient') })
const isLoading = practitioners.isLoading || patients.isLoading
// :36-37 actuel (bug) : {!isLoading && !conversation && <WidgetNote>Aucune conversation à reprendre.</WidgetNote>}
// CIBLE util pur (testable sans React) :
export type QueryLike = { isLoading: boolean; isError: boolean; isSuccess: boolean }
export const widgetState = (queries: QueryLike[], isEmpty: boolean): 'loading' | 'error' | 'empty' | 'ready'
// ordre : error > loading > empty > ready
// pattern test existant (revenue.util.test.ts:1-5)
/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fn } from './x.util.ts'   // suffixe .ts obligatoire
// runner : "test:unit": "node --test 'src/**/*.test.ts'"  (node 24 ; 243 tests verts au départ)
```

## Décisions actées
- `WidgetNote` + `Spinner` existants, 0 nouveau composant, 0 hook partagé — decisions.md#2026-10-05
- « Réessayer » = `Button` du kit variante discrète, dans le corps sous la note

## Hors périmètre
- autres widgets ; `widget-card.tsx` (lecture) ; textes autres que les 3 états ; migration WidgetCard ; formats de date

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm run, node, rg, git diff, git status) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` avant tout `npm`/`node` — node 22 système KO sur `.ts`
- Interdit : `git commit`, `git push`, `npm install`, migration — le chef commit par lot
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T007
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
