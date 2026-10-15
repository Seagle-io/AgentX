---
pack: T011
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T011 — Widgets hors carte commune : météo, KPI, salutation, mascotte, forum

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Pour les 5 widgets qui n'utilisent pas `WidgetCard` (weather, kpi, greeting, mascot, forum) + tongue-twister : poser les tailles en modules ET rendre leur contenu fidèle à la carte (règles R1–R3) ; météo : les jours suivants ne s'étirent plus sur toute la largeur.

## Definition of Done
- [ ] chaque `grid: { … }` des widgets listés = ligne du tableau ci-dessous, **verbatim** (w, h, minW, minH, maxW, maxH)
- [ ] commentaire éventuel de taille en px/colonnes dans ces fichiers mis à jour (« sur 24 colonnes, en modules »)
- [ ] R1 racine des 5 widgets : `flex h-full flex-col overflow-hidden` + conteneur nommé `card` en `size` (comme `widget-card.tsx:48`) ⇒ `dash-low:` et `@container(max-height:…)` existants s'appliquent pareil, **seuils en px inchangés**
- [ ] R2 kpi (valeur), greeting (texte), mascot (`max-h-full object-contain`) : bloc principal `flex-1 items-center justify-center`
- [ ] R3 forum : corps remis dans le flux `min-h-0 flex-1 overflow-y-auto` (hors flux aujourd'hui)
- [ ] weather (`weather-widget.tsx:95,123,139`) : shell R1 ; « maintenant » `flex-1` centré ; jours `grid-cols-3 @[14rem]/card:grid-cols-4`, 4e jour `hidden @[14rem]/card:flex` ; `[@container(max-height:120px|150px)]` inchangés
- [ ] `npx eslint` sur les fichiers E → 0 erreur ; `npx tsc -b 2>&1 | grep -E "widget/(forum|greeting|kpi|mascot|tongue-twister|weather)/"` → ∅ ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → sortie collée (échecs hors tes fichiers : signale)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/weather/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/weather/weather-widget.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/dashboard-kpi.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum/dashboard-forum.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/greeting/dashboard-greeting.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/mascot/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/mascot/mascot.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tongue-twister/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/widget-card.tsx` | L | habillage commun, corps :60 |

## Contrats
```ts
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }  // inchangé, unités = modules
```
id | w h | minW minH | maxW maxH | base (mesure T003)
---|---|---|---|---
weather | 5 6 | 5 4 | 7 7 | F 160 ; w=minW (« trop large ») ; H données NV ≈212 (classes) → h6 ; minH 4 = 144 px ≥ 120 (extrêmes visibles) ; maxH 7
kpi-sessions | 6 3 | 5 3 | 8 5 | F 160;84
kpi-billing | 6 3 | 5 3 | 8 5 | F 160;84
kpi-patients | 6 3 | 5 3 | 8 5 | F 160;84
kpi-noshows | 7 3 | 7 3 | 9 5 | F 240;84
forum | 24 7 | 13 4 | 24 14 | L 480 ; H NV→anc. h7
greeting | 12 3 | 5 3 | 24 5 | bandeau 160;92 ; maxW 24 (anc. pleine largeur)
mascot | 6 5 | 5 3 | 8 7 | F 160;146
tongue-twister | 6 4 | 5 3 | 8 6 | F 160;130
```css
/* widget-card.tsx:48 — modèle du conteneur nommé (lire le fichier pour la classe exacte) */
/* 14rem = 224 px ≈ 4 jours × 44 px + gouttières */
```

## Décisions actées
- 24 colonnes, module carré, tailles calées sur le contenu mesuré (T003) — humain + architecte T004
- règles : minW=⌈(Lmin+16)/40⌉ ; h=⌈(H+16)/40⌉ ; F (contenu fixe) maxW=w+2, maxH=h+2 ; L (liste) maxW=24, maxH=max(2h,8) — T004
- `kpi/index.tsx` porte 4 widgets (kpi-sessions, kpi-billing, kpi-patients, kpi-noshows) : 4 `grid`
- météo : w = minW = 5 (« trop large » signalé par l'humain)
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
tache: T011
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
