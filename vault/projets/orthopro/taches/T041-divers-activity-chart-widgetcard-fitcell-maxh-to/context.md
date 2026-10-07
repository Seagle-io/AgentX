---
pack: T041
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T041 — Divers : activity-chart, fitCell, toast action

> Seule source de vérité de l'agent T041. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trois corrections indépendantes : (1) `activity-chart.tsx` sous `WidgetCard` (dernier shell recopié) ; (2) `fitCell` borne la hauteur via `boundsOf` (3e chemin de bornes supprimé) ; (3) `toast.tsx` reçoit `action?: { label: string; onClick: () => void }` et le toast « Widget retiré » de la page l'utilise pour un vrai bouton Annuler.

## Definition of Done
- [ ] (1) activity-chart.tsx:69 `<section className='@container/chart …rounded-card…'>` → `<WidgetCard icon=… title='Activité' actions={toolbar} bodyClassName='@container/chart …'>` ; sous-titre « Séances par jour… » conservé dans le corps ; `rg -n "rounded-card border border-border bg-bg-panel" /home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget` → 0 hit sur un shell racine (kpi/greeting/mascot/weather exclus : citer leurs hits comme voulus)
- [ ] (2) dashboard-layout.util.ts:51-60 `fitCell` : `const b = boundsOf(grid)` (import relatif `.ts` depuis `./components/edit/layout-ops.core.ts`) ; `w = clamp(round(w), b.minW, b.maxW)`, `h = clamp(round(h), b.minH, b.maxH)` ; plus de `?? Infinity` ; test : cellule chargée h=200 sans maxH → 60 ; w=20 → 12
- [ ] (3) toast.tsx : `ToastItem.action?: { label: string; onClick: () => void }` ; rendu = `Button variant='ghost' size='sm'` dans le toast, ferme le toast au clic ; dashboard-page.tsx toast « Widget retiré » → `action: { label: 'Annuler', onClick: history.undo }`, description « Ctrl+Z… » retirée
- [ ] import circulaire ? `dashboard-layout.util.ts` → `layout-ops.core.ts` → (`dashboard-layout.util.ts` pour LayoutCell ?) : si cycle, déplacer `boundsOf` consommé via type-only import ou noter BLQ
- [ ] `npm run test:unit` → fail 0 ; `npm run typecheck` → 0 ; `npx eslint` WL → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-chart.tsx` | E | (1) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/activity-widget.tsx` | L | parent |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | contrat |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.ts` | E | (2) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-layout.util.test.ts` | E | (2) +2 cas |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/edit/layout-ops.core.ts` | L | boundsOf |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/toast/toast.tsx` | E | (3) |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/dashboard-page.tsx` | E | (3) toast Widget retiré uniquement |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/ui/button/bouton.tsx` | L | Button |

## Contrats
```ts
export const WidgetCard = ({ icon, emoji, title, hue, count, actions, footer, children, bodyClassName, tour }: { icon: IconType; emoji?: string; title: ReactNode; hue?: string; count?: number; actions?: ReactNode; footer?: ReactNode; children: ReactNode; bodyClassName?: string; tour?: string })
export const boundsOf: (grid: WidgetGrid | undefined) => { minW: number; minH: number; maxW: number; maxH: number }  // 1,1,12,60
// fitCell actuel (util.ts:51-60) : w = clamp(round(cell.w), minW, min(maxW ?? GRID_COLS, GRID_COLS)) ; h = … maxH ?? Infinity
// toast.tsx : type ToastVariant = 'default'|'success'|'error'|'warning' ; type ToastItem = { id; variant?; title: string; description?: string } ; useToast() → { addToast }
// page : toast « Widget retiré · Ctrl + Z pour le remettre » (rg "Widget retiré" dashboard-page.tsx)
```

## Décisions actées
- WidgetCard partout sauf A/B — T010 ; activity-chart n'est ni A ni B
- kit UI étendu d'une prop (toast action) : accepté, 0 nouveau composant

## Hors périmètre
- autres widgets ; grid.tsx ; edit/* ; autres toasts

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
tache: T041
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
