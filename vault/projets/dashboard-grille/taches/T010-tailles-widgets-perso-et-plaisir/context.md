---
pack: T010
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T010 — Tailles widgets perso et plaisir

> Seule source de vérité de l'agent T010. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Poser les tailles en modules (24 col) des widgets perso/plaisir dans leur `index.tsx`, d'après le tableau T004.

## Definition of Done
- [ ] chaque `grid: { … }` des widgets listés = ligne du tableau ci-dessous, **verbatim** (w, h, minW, minH, maxW, maxH)
- [ ] commentaire éventuel de taille en px/colonnes dans ces fichiers mis à jour (« sur 24 colonnes, en modules »)
- [ ] `npx eslint` sur les fichiers E → 0 erreur ; `npx tsc -b 2>&1 | grep -E "widget/(age-calculator|calculator|clock|daily-anecdote|daily-game|daily-quote|feedback|month-calendar|pomodoro|shortcuts|useful-links|word-of-day)/"` → ∅ ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → sortie collée (échecs hors tes fichiers : signale)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/feedback/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/pomodoro/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/age-calculator/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/calculator/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/month-calendar/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-game/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-quote/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/word-of-day/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-anecdote/index.tsx` | E | grid / mise en page |

## Contrats
```ts
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }  // inchangé, unités = modules
```
id | w h | minW minH | maxW maxH | base (mesure T003)
---|---|---|---|---
feedback | 9 6 | 9 3 | 11 8 | F 320;214
clock | 6 4 | 5 3 | 8 6 | F 160;113
pomodoro | 6 5 | 5 3 | 8 7 | F 160;145
shortcuts | 7 5 | 7 3 | 9 7 | F 240;169
age-calculator | 7 7 | 7 4 | 9 9 | F 240;258
calculator | 6 5 | 5 5 | 8 7 | F 160;178 ; minH=h (clavier indivisible)
month-calendar | 6 7 | 5 7 | 8 9 | F 160;232 ; minH=h (grille 7 col indivisible)
useful-links | 9 11 | 9 6 | 24 22 | L 320;406
daily-game | 9 3 | 9 3 | 11 5 | F 320;89
daily-quote | 6 4 | 5 3 | 8 6 | F 160;121
word-of-day | 13 6 | 13 3 | 15 8 | F 480;209@480
daily-anecdote | 6 5 | 5 3 | 8 7 | F 160;182

## Décisions actées
- 24 colonnes, module carré, tailles calées sur le contenu mesuré (T003) — humain + architecte T004
- règles : minW=⌈(Lmin+16)/40⌉ ; h=⌈(H+16)/40⌉ ; F (contenu fixe) maxW=w+2, maxH=h+2 ; L (liste) maxW=24, maxH=max(2h,8) — T004
- `calculator`, `month-calendar` : minH = h (contenu indivisible)
## Hors périmètre
- `grid.constants.ts`, `grid.tsx`, `dashboard-widgets.tsx`, `dashboard-layout.util.ts` (T007) ; autres widgets (autres lots) ; back.
- Refactor du contenu des widgets au-delà de la DoD.

## Environnement
- grille cible 24 col, module carré 24–48 px (T004) ; le cœur (T007) change `grid.constants.ts` et `grid.tsx` **en parallèle** : n'y touche pas
- tailles en **modules** ; px à module 24 = 40n − 16 (w5 = 184 px, w9 = 344 px)
- node 24 : `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH` ; `rg` absent → Grep
- `npx tsc -b` peut casser hors de tes fichiers tant que T007 n'est pas livré : vérifie seulement l'absence d'erreur **dans tes fichiers**

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(npx tsc:*)`, `Bash(npx eslint:*)`, `Bash(npm run test:unit:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T010
statut: fait | bloque
---
## Livré
- chemin:L — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
