---
pack: T009
projet: dashboard-grille
role: implementeur
cree: 2026-10-08
---

# Pack T009 — Tailles widgets facturation, documents, forum, compte

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Poser les tailles en modules (24 col) des widgets facturation/documents/messagerie/forum/compte dans leur `index.tsx`, d'après le tableau T004.

## Definition of Done
- [ ] chaque `grid: { … }` des widgets listés = ligne du tableau ci-dessous, **verbatim** (w, h, minW, minH, maxW, maxH)
- [ ] commentaire éventuel de taille en px/colonnes dans ces fichiers mis à jour (« sur 24 colonnes, en modules »)
- [ ] `npx eslint` sur les fichiers E → 0 erreur ; `npx tsc -b 2>&1 | grep -E "widget/(achievements|contact-code|forum-notifications|kora-news|licence|onboarding|quick-reply|recent-documents|revenue|transmissions|unpaid-invoices|unread-messages)/"` → ∅ ; `PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:unit` → sortie collée (échecs hors tes fichiers : signale)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/revenue/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/unpaid-invoices/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/transmissions/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/recent-documents/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/unread-messages/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/quick-reply/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/contact-code/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum-notifications/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/achievements/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kora-news/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/licence/index.tsx` | E | grid / mise en page |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/onboarding/index.tsx` | E | grid / mise en page |

## Contrats
```ts
export type WidgetGrid = { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }  // inchangé, unités = modules
```
id | w h | minW minH | maxW maxH | base (mesure T003)
---|---|---|---|---
revenue | 9 6 | 7 3 | 24 12 | L NV facturation (graphe @sm) ; anc. h6
unpaid-invoices | 9 8 | 7 4 | 24 16 | L NV facturation ; anc. h8
transmissions | 9 7 | 7 4 | 24 14 | L NV facturation ; anc. h7
recent-documents | 9 8 | 7 4 | 24 16 | L NV documents ; anc. h8
unread-messages | 9 7 | 7 4 | 24 14 | L NV messagerie ; anc. h7
quick-reply | 9 12 | 7 6 | 24 24 | L NV messagerie ; anc. h12
contact-code | 7 6 | 7 3 | 9 8 | F NV messagerie ; Lmin 240 famille ; anc. h6
forum-notifications | 6 8 | 5 4 | 24 16 | L 160;vide→anc. h8
achievements | 7 6 | 7 3 | 9 8 | F 240;195
kora-news | 6 8 | 5 4 | 24 16 | L 160;vide→anc. h8
licence | 7 6 | 7 3 | 9 8 | F >480 = `truncate max-w-24` voulu ⇒ Lmin 240 (T002 scroll-x @160 seul) ;197
onboarding | 6 10 | 5 5 | 8 12 | F 160 ; erreur→anc. h10

## Décisions actées
- 24 colonnes, module carré, tailles calées sur le contenu mesuré (T003) — humain + architecte T004
- règles : minW=⌈(Lmin+16)/40⌉ ; h=⌈(H+16)/40⌉ ; F (contenu fixe) maxW=w+2, maxH=h+2 ; L (liste) maxW=24, maxH=max(2h,8) — T004
- 7 widgets non mesurés (modules absents du compte de test) : tailles déduites de leur famille par T004, à poser telles quelles
- `licence` : `truncate` voulu, Lmin 240
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
tache: T009
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
