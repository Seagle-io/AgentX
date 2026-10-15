---
pack: T014
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-13
---

# Pack T014 — Compatibilité front et k6 du serveur avec la nouvelle API

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dire si le front déployé sur le serveur de test (sources du 22/09 en S/web) et le script k6 de G fonctionnent contre l'API de G (HEAD edb565f) sans redéployer le front ; sinon lister les ruptures, avec coordonnées. Lecture seule.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` · S = `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13` (copie locale du serveur)

## Definition of Done
- [ ] routes : `rg -n "app\.(get|post|put|patch|delete)" S/api/src/server.ts G/api/src/server.ts` → routes supprimées, renommées ou méthode changée dans G (tableau)
- [ ] appels du front S : `rg -n "fetch\(|api(Get|Post|Put|Patch|Delete)?\(" S/web/src --glob '!**/__tests__/**'` → chaque endpoint appelé existe dans G (méthode + chemin) ; ruptures listées
- [ ] login/session : `diff S/web/src/api.ts G/web/src/api.ts` + session.ts → le login du front S marche-t-il (cookie, en-têtes, CSRF éventuel) ? oui/non + ligne
- [ ] tuiles : chemin `tilesetUrl?token=` (G server.ts:617) consommé par S/web/src/viewer/backend/HttpBackend.ts → format de jeton, nom du paramètre, propagation aux tuiles enfants inchangés ? oui/non + ligne
- [ ] k6 : G/tools/load/viewer-navigation.js (login, récupération de tilesetUrl :190-205, tuiles :215-240) compatible avec G API ? différences avec S/k6-viewer-navigation.srv.js qui touchent l'API
- [ ] verdict : front S utilisable avec API G oui/non ; si non → ruptures minimales, et si redéployer le front de G (HEAD, hors fichiers sales) les corrige
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/api/src/server.ts` | L | routes API serveur (rg) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | routes G (rg), :600-640, :725-830 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | cookie / session_version |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tileAuth.ts` | L | 43 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/web/src/api.ts` | L | client HTTP front S |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/api.ts` | L | client HTTP front G (diff) |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/web/src/auth.tsx` | L | login front S |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/web/src/viewer/backend/HttpBackend.ts` | L | URL tuiles |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/web/src/viewer/backend/install.ts` | L | jeton du viewer |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/viewer-navigation.js` | L | 297 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/k6-viewer-navigation.srv.js` | L | k6 du 09/10 |

## Contrats
```ts
// G server.ts:616-617 — URL signée du tileset
const token = signTileToken(config, { p: project.id, u: user.userId, exp });
const tilesetUrl = `/api/projects/${project.id}/storage/${project.tileset_path}?token=${encodeURIComponent(token)}`;
// G server.ts:743-745 — route tuile
const payload = verifyTileToken(config, req.query.token);
if (!payload || payload.p !== req.params.id) { … }
```
```js
// G tools/load/viewer-navigation.js
const tileKey = (url) => url.replace(/[?&]token=[^&]*$/, '');
const token = decodeURIComponent(tilesetUrl.split('token=')[1]);   // :198
```
Fait : S/api et S/web = déployés ensemble (cohérents entre eux) ; G/api = 99 fichiers de test verts avec G/web.

## Décisions actées
- `rg` sur S/web/src autorisé comme recherche (pas une lecture de fichier hors WL)
- rupture d'en-tête CSP / Caddy : hors lot (T004/D5 l'ont traité)

## Hors périmètre
- toute édition ; ssh ; base ; jobs et config de prod de l'API (T013)
- G/web au-delà de api.ts : les fichiers sales de G/web (TilesRendererLoader.ts, qualityHud.ts, errorTargetRefine*) ne comptent pas

## Environnement
- `rg`, `diff` dispo ; S = copie sans git (22/09) ; G HEAD edb565f
- l'API de S tourne aujourd'hui sur http://82.65.97.67:34580 ; le front S y est servi par nginx (bundle déjà construit)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg, diff, sed -n sur G et S), Write (result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T014
statut: fait | bloque
---
## Livré
- rupture n : endpoint/fichier:ligne · effet visible · gravité | ∅
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : verdict front S, verdict k6, redéploiement front nécessaire oui/non. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
