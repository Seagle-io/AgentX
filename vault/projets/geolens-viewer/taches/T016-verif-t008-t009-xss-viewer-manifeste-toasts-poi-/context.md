---
pack: T016
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T016 — Vérif T008+T009 : XSS viewer (manifeste, toasts, POI, install, jeton)

> Seule source de vérité de l'agent T016. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter les correctifs XSS du viewer livrés par T008 (échappement manifeste/toasts/POI) et T009 (install.ts, jeton limité à l'origine) : trouver un champ de `project.json`, de POI ou d'URL qui atteint encore un sink HTML non échappé dans les fichiers livrés ; `OK` ou `DÉFAUTS` avec repro ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, V = G/web/src/viewer.

## Definition of Done
- [ ] A1-A9 : chacune OK/KO avec commande + sortie ou coordonnée lue
- [ ] chaque sink `innerHTML`/`insertAdjacentHTML`/attribut `src=`/`data-*=` des plages livrées relu : liste des interpolations restantes non échappées dont la source est le manifeste, un POI ou l'URL (fichier:ligne + source)
- [ ] ≥ 4 contre-exemples écrits en test jetable HORS G (dossier `mktemp -d`, importer safeHtml.ts / HttpBackend.ts par chemin absolu, `npx --prefix <G>/web vitest run --root <tmp>`) ou en `node -e` : `data:image/png;base64,AA==\"` · `DATA:IMAGE/PNG;base64,AA` · URL `https://portail.test.evil.test/...` · `//evil.test/api/projects/p/storage/x` · `https://portail.test:444/...`
- [ ] `npm --prefix web test` et `npm --prefix web run typecheck` relancés : sorties collées
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu + gravité (exploitable oui/non)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution). Écriture : `result.md` + dossier jetable hors G.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.ts` | L | helpers T008 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/safeHtml.test.ts` | L | cas couverts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | L | :160-170, :535-550, :870-880, :4815-4945, :5820-5850, :7168-7200 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/homeCinematic.ts` | L | :340-355 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/services/photoInspector/PhotoInspectorMode.ts` | L | :705-715 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/POIManager.ts` | L | :430-450 restore |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/ui/poiPanel.ts` | L | :80-100 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/ReportGenerator.ts` | L | :780-795 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | L | 155 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | makeSignUrl :45-70 |

## Contrats
```ts
// T008 — ui/safeHtml.ts
export function escapeHtml(str: unknown): string;   // & < > " ' ; null/undefined → ''
export function isSafeImageDataUrl(v: unknown): v is string;  // /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/
// main.ts:465 escapeHTML(str) existant, utilisé dans main.ts
// T009 — HttpBackend.ts makeSignUrl : token ajouté ssi u.origin === new URL(ctx.apiBase).origin ET pathname contient /api/projects/ et /storage/
// T009 — install.ts fail(message, detail?) : message/detail via createElement + textContent ; lien retour via insertAdjacentHTML constant ; apiBase = `${origin}/api/projects/${encodeURIComponent(projectId)}`
```
Affirmations à réfuter :
- A1 main.ts:4935-4943 : d.id, d.filename, d.name, d.description échappés
- A2 main.ts:4821-4823 : logo seulement si data URL sûre ; alt échappé
- A3 main.ts:4861,4863 : label/value stats échappés
- A4 toasts main.ts:5825,7173,7189 (loaded.name) et :5846,7177 (err.message) échappés
- A5 homeCinematic.ts:347-351 name/id, client, date, description échappés ; PhotoInspectorMode.ts:713 filename échappé
- A6 POIManager.ts:446-448 : screenshot non sûr → undefined, photos[] filtrées à la restauration ; poiPanel.ts:97, main.ts:875, ReportGenerator.ts:789 : src seulement si sûr
- A7 install.ts : 0 donnée (projectId, String(e), HTTP status) en innerHTML
- A8 makeSignUrl : 0 token vers une autre origine (sous-domaine, port, schéma, URL protocol-relative)
- A9 tests web : 176 fichiers / 1683 tests verts ; typecheck exit 0
Restes déjà connus (à confirmer, ne pas compter comme défaut des lots) : main.ts:7193 toast drop err.message ; main.ts:4935-4937 `d.type` + metaParts (resolution, gsdCm) non échappés ; :5846 messages loader à `<br>` voulu désormais littéraux.

## Décisions actées
- showToast reste innerHTML, échappement aux sites d'appel — appelants HTML voulus
- images POI : png|jpeg base64 seulement — format canvas.toDataURL
- 0 jsdom → contre-exemples par fonctions pures ou lecture

## Hors périmètre
- corriger, éditer un fichier de G, ajouter un test dans G
- les ~150 autres innerHTML du viewer hors plages livrées (les citer en 1 ligne si vus, sans audit)
- CSP, viewer.html, Caddyfile (T017)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules installé ; vitest env node, 0 jsdom ; ne JAMAIS importer main.ts dans un test
- `npm --prefix web test` ; `npm --prefix web run typecheck` ; ciblé : `npx --prefix web vitest run --root web <chemin>`
- G sous git, baseline 745d46f : `git -C G diff -- web/src/viewer` montre les changements livrés
- d'autres agents écrivent dans api/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm --prefix web test, npm --prefix web run typecheck, npx vitest, node -e, mktemp, rg, git diff, git show), Write (result.md + dossier jetable hors G)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T016
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A1..A9 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro · attendu / obtenu · exploitable oui/non
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
