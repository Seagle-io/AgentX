---
pack: T008
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T008 — Tailles widgets agenda et patients

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Poser les tailles en modules (24 col) des widgets agenda/patients dans leur `index.tsx`, d'après le tableau T004.

## Definition of Done
- [ ] chaque `grid: { … }` des widgets listés = ligne du tableau ci-dessous, **verbatim** (w, h, minW, minH, maxW, maxH)
- [ ] commentaire éventuel de taille en px/colonnes dans ces fichiers mis à jour (« sur 24 colonnes, en modules »)
- [ ] `npx eslint` sur les fichiers E → 0 erreur ; `npx tsc -b 2>&1 | grep -E "widget/(activity|admin-time|birthdays|forecast|free-slots|next-appointment|patient-search|storage|today|tomorrow|week-grid|worklists)/"` → ∅ ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → sortie collée (échecs hors tes fichiers : signale)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/activity/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forecast/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/worklists/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/today/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/next-appointment/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/week-grid/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/free-slots/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tomorrow/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/admin-time/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/patient-search/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/birthdays/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/storage/index.tsx` | E | grid / mise en page |

## Contrats
```ts
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }  // inchangé, unités = modules
```
id | w h | minW minH | maxW maxH | base (mesure T003)
---|---|---|---|---
activity | 9 7 | 9 4 | 24 14 | L 320;264@320
forecast | 9 8 | 5 4 | 24 16 | L 160 reflow 123→103 ⇒ w9 ; vide→anc. h8
bilans | 6 6 | 5 3 | 24 12 | L 160;vide→anc. h6
reprendre | 6 6 | 5 3 | 24 12 | L 160;vide→anc. h6
lapins | 6 6 | 5 3 | 24 12 | L 160;vide→anc. h6
today | 8 16 | 8 8 | 24 32 | L rail = anc. 4/12×2 ; Lmin 480 T003 NV toléré (troncature noms) ; h aligné DEFAULT
next-appointment | 6 3 | 5 3 | 8 5 | F 160;87
week-grid | 9 4 | 9 3 | 24 8 | L 320;128
free-slots | 9 7 | 7 4 | 24 14 | L 240 reflow ⇒ w9 ; 242@320
tomorrow | 9 7 | 9 4 | 24 14 | L 320;247
admin-time | 9 3 | 9 3 | 11 5 | F 320;87
patient-search | 6 5 | 5 3 | 8 7 | F 160;165
birthdays | 6 3 | 5 3 | 24 8 | L 160;102
storage | 9 5 | 5 3 | 11 7 | F 160 reflow 280→183 ⇒ w9 ; 183@320

## Décisions actées
- 24 colonnes, module carré, tailles calées sur le contenu mesuré (T003) — humain + architecte T004
- règles : minW=⌈(Lmin+16)/40⌉ ; h=⌈(H+16)/40⌉ ; F (contenu fixe) maxW=w+2, maxH=h+2 ; L (liste) maxW=24, maxH=max(2h,8) — T004
- `worklists/index.tsx` porte 3 widgets (bilans, reprendre, lapins) : 3 `grid` à poser
- `today` minW 8 = rail, troncature des noms acceptée
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
tache: T008
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
