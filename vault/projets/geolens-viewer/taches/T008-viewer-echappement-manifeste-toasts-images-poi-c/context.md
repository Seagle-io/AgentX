---
pack: T008
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T008 — Viewer : échappement manifeste, toasts, images POI (C1, M2, m13)

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Fermer les XSS stockées du viewer : échapper chaque champ de `project.json` injecté en HTML (9 sites), les 5 toasts à texte non maîtrisé, et n'accepter comme image de POI que `data:image/(png|jpeg);base64,…`, via un module NEUF `web/src/viewer/ui/safeHtml.ts`. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `ui/safeHtml.ts` NEUF = contrat verbatim (2 fonctions), 0 import
- [ ] `ui/safeHtml.test.ts` NEUF : 8 cas listés, verts
- [ ] `main.ts` : sites :4822, :4858-4863, :4934, :4936, :4937, :4942 échappés via `escapeHTML` (déjà dans main.ts:465) ; toasts :5824, :5845, :7172, :7176, :7188 → argument échappé ; :874 src filtré `isSafeImageDataUrl` ; `wc -l` main.ts ≤ 9404 + 3
- [ ] `ui/homeCinematic.ts:348-350` : name/id, client, date, description échappés (import safeHtml)
- [ ] `services/photoInspector/PhotoInspectorMode.ts:712` : photo.filename échappé (import safeHtml)
- [ ] `core/POIManager.ts:437-446` restorePOIs : screenshotDataUrl non sûr → undefined ; photos[] filtrées
- [ ] `ui/poiPanel.ts:96-98` et `~:85-92` (photos) : src filtré + échappé
- [ ] `core/ReportGenerator.ts:788` : src filtré
- [ ] `npm --prefix web run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix web test` → verts, compte collé (base ≈ 1665)
- [ ] `git -C G diff --stat` collé : 0 fichier hors WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Chemins relatifs à G/web/src/viewer/.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | E | plages :460-470, :535-550, :870-880, :4815-4945, :5820-5850, :7168-7192 seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/homeCinematic.ts` | E | :340-355 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/services/photoInspector/PhotoInspectorMode.ts` | E | :705-715 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/POIManager.ts` | E | :50-56, :430-450 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/poiPanel.ts` | E | :80-100 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/ReportGenerator.ts` | E | :780-795 |

## Contrats
```ts
// ═══ ui/safeHtml.ts (NEUF) — 0 import, fonctions pures
/** Échappe & < > " ' ; null/undefined → '' ; non-string → String(x). Corps = copie de main.ts:465. */
export function escapeHtml(str: unknown): string;
/** true ssi /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/ ; tout le reste (javascript:, svg+xml, http:, '"') → false */
export function isSafeImageDataUrl(v: unknown): v is string;

// ═══ existant main.ts:465 (garder tel quel, l'utiliser dans main.ts)
export function escapeHTML(str: string): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// existant main.ts:541 — signature INCHANGÉE (461 appelants, certains passent du HTML voulu)
export function showToast(message: string, type: ToastType = 'info', durationMs: number = 3500): void
// POIManager.ts:53-54 : screenshotDataUrl?: string ; photos: string[]  (format réel = canvas.toDataURL, POIManager.ts:294)
```
Sites (T003, recouper par rg avant édition) :
- main.ts:4934 `data-filename="${d.filename}"` · :4936 `data-deliverable-id="${d.id}"` · :4937 `${d.name}` · :4942 `${d.description}` · :4822 branding.companyName dans alt + src brandingLogoDataUrl (→ isSafeImageDataUrl) · :4858-4863 stats label/value + `${acq.x}` (→ escapeHTML(String(...)))
- main.ts:5824, :7172, :7188 `${loaded.name} charge avec succes` → escapeHTML(loaded.name) · :5845, :7176 err.message → escapeHTML
- homeCinematic.ts:348 proj.name ?? proj.id · :349 proj.client, proj.date · :350 proj.description
- PhotoInspectorMode.ts:712 photo.filename dans spinner.innerHTML
- poiPanel.ts:96-98 `src="${poi.screenshotDataUrl}"` · ~:85-92 `src="'+dataUrl+'"` (photos)
- ReportGenerator.ts:788 src brut (alt déjà this.esc)

Cas safeHtml.test.ts :
- escapeHtml(`<img src=x onerror=1>`) ∌ `<` · `"` → `&quot;` · `'` → `&#39;` · null → '' · 42 → '42'
- isSafeImageDataUrl : `data:image/png;base64,AAA=` true · `data:image/jpeg;base64,AA` true · `x" onerror="1` false · `javascript:alert(1)` false · `data:image/svg+xml;base64,AA` false · `data:image/png;base64,AA"><script>` false

## Décisions actées
- showToast reste innerHTML — appelants HTML voulus non audités
- échappement au site d'appel, pas dans le sink
- main.ts garde son escapeHTML — 0 import vers main.ts
- safeHtml.ts sans dépendance — testable en env node
- image POI non sûre → retirée, pas d'erreur — restauration tolérante

## Hors périmètre
- les ~150 autres innerHTML du viewer ; savedViews/reportEngine/doc-engine (escapers existants)
- install.ts, HttpBackend.ts (T009 en parallèle) ; viewer.html, CSP, TilesRendererLoader (T010 en parallèle)
- refactor de main.ts, renommage, formatage
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules installé ; vitest env node, 0 jsdom/happy-dom → tester fonctions pures seulement ; NE PAS importer main.ts dans un test
- `npm --prefix web test` (vitest run) ; `npm --prefix web run typecheck` (tsc --noEmit)
- G sous git : baseline 745d46f ; T009 et T010 écrivent dans web/ en parallèle (fichiers disjoints)
- main.ts 9404 l, monolithe gelé : modifications = appels de helper

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web test, npm --prefix web run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
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
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
