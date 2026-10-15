---
pack: T021
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T021 — Correctifs XSS viewer : sinks restants (D1-D3 T016 + restes)

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Fermer les 10 sinks HTML encore alimentés par le manifeste, un POI restauré ou une photo, trouvés par le vérificateur T016, avec les helpers existants (`escapeHtml`/`escapeHTML`/`isSafeImageDataUrl`) et un helper NEUF `oneOf` ; 0 refactor. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, V = G/web/src/viewer.

## Definition of Done
- [ ] S1-S10 corrigés (liste Contrats), chacun cité fichier:ligne dans result.md
- [ ] `ui/safeHtml.ts` : + `oneOf` (contrat) ; `ui/safeHtml.test.ts` : + 4 cas oneOf, verts
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web run build:viewer-types` → exit 0 (sorties collées)
- [ ] `npm --prefix web test` → verts, compte collé (base 176 fichiers / 1683 tests)
- [ ] `wc -l V/main.ts` ≤ 9405 + 2
- [ ] `git -C G diff --stat -- web/src/viewer` collé : seuls fichiers WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.ts` | E | + oneOf |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.test.ts` | E | + 4 cas |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/services/photoInspector/PhotoInspectorMode.ts` | E | :350-362, :760-772 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/homeCinematic.ts` | E | :438-458 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/poiPanel.ts` | E | :1-20 imports, :105-125 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/POIManager.ts` | E | :1-15 imports, :25-35 type, :436-452 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | E | :4925-4945, :7188-7196, :8630-8640 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | E | :150-160 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/homeData.ts` | L | :96-200 source s.value, c.subtitle |

## Contrats
```ts
// ui/safeHtml.ts existant (T008)
export function escapeHtml(str: unknown): string;               // & < > " ' ; null → ''
export function isSafeImageDataUrl(v: unknown): v is string;    // ^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+=*$
// + NEUF
/** v si v ∈ allowed (égalité stricte), sinon fallback */
export function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T;
// main.ts:465 escapeHTML(str) existant — dans main.ts utiliser celui-ci
// POIManager.ts:30 priority: POIPriority ; valeurs utilisées : 'critical' | 'important' | 'info' (défaut 'info' :270)
```
Sinks (lignes au 2026-10-07, recouper par lecture) :
- S1 PhotoInspectorMode.ts:358 `${this.photos[i].filename}` → escapeHtml
- S2 PhotoInspectorMode.ts:769 `${f}` → escapeHtml (le src :768 est déjà encodeURIComponent, inchangé)
- S3 homeCinematic.ts:443-444 `${s.value}`, `${s.label}` → escapeHtml
- S4 homeCinematic.ts:454-455 `${c.title}`, `${c.subtitle}` → escapeHtml (`${ICONS[c.kind]}` = SVG constant, inchangé)
- S5 poiPanel.ts:112,:119 `${poi.priority}` (class + test) → `const prio = oneOf(poi.priority, ['critical','important','info'] as const, 'info')` puis `${prio}`
- S6 poiPanel.ts:121-122 `data-poi-vis="${poi.id}"`, `data-poi-del="${poi.id}"` → escapeHTML/escapeHtml(poi.id) (sélection par dataset inchangée : valeur décodée = id)
- S7 POIManager.ts:444 restorePOIs `...p` → ajouter `priority: oneOf(p.priority, ['critical','important','info'] as const, 'info')` dans l'objet `data`
- S8 main.ts:4935-4936,4940-4941 `data-type="${d.type}"`, class `${d.type}`, `${label}`, `${metaParts.join(' · ')}` → escapeHTML sur chacun
- S9 main.ts:7193 toast `${(err as Error).message}` → escapeHTML
- S10 main.ts:8636,8638 `data-type="${d.type}"`, class `${d.type}` → escapeHTML
- S11 install.ts:158 `detail.orgLogo.startsWith('data:image/png')` → `isSafeImageDataUrl(detail.orgLogo)` (import depuis '../ui/safeHtml')
Cas oneOf : 'critical' → 'critical' · '"><img>' → 'info' · undefined → 'info' · 42 → 'info'

## Décisions actées
- échappement au site d'appel ; showToast inchangé — appelants HTML voulus
- priority hors liste → 'info', POI conservé — restauration tolérante
- id POI échappé, pas filtré — id sert de clé
- orgLogo : même règle que les autres images — png|jpeg base64

## Hors périmètre
- main.ts:7444-7448 libellés de classes LAS (constantes) ; PhotoInspectorMode.ts:689 src __glrPhotoUrl
- ReportGenerator.ts (police Google Fonts : lot séparé) ; reportEngine
- vite.config.ts, csp.test.ts, viewer.html, TilesRendererLoader.ts (T022 en parallèle)
- refactor, renommage, formatage
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; vitest env node, 0 jsdom ; NE PAS importer main.ts ni POIManager.ts dans un test
- `npm --prefix web test` ; `npm --prefix web run typecheck` ; `npm --prefix web run build:viewer-types` ; ciblé `npx --prefix web vitest run --root web src/viewer/ui/safeHtml.test.ts`
- G sous git, baseline 745d46f ; T022 écrit web/vite.config.ts, web/viewer.html, src/viewer/__tests__/csp.test.ts en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web test, npm --prefix web run typecheck, npm --prefix web run build:viewer-types, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T021
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
