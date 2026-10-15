---
pack: T076
projet: geolens-viewer
role: verificateur
cree: 2026-10-09
---

# Pack T076 — Mesure navigateur headless C2/C3 sur le serveur de test (ouverture + navigation 5 min)

> Seule source de vérité de l'agent T076. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire un script de mesure Chromium headless (playwright-core, 0 dépendance nouvelle) qui ouvre le projet de test du serveur 82.65.97.67:34580 avec le cache désactivé et relève tuiles / Mo / tuiles distinctes / mémoire dans 2 scénarios (ouverture sans interaction 180 s ; navigation 5 min revenant sur les mêmes zones), puis l'exécuter sur le front ACTUELLEMENT déployé (variante `apres`) ; le script doit être relançable tel quel par le chef pour la variante `avant`. 0 modification du serveur, de G ou de la base. S = /tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/2e7b366b-45a7-450b-b9df-37aa6f7ce759/scratchpad/mesure-nav.

## Definition of Done
- [ ] `S/measure.mjs` : `node S/measure.mjs <label>` (label ∈ apres|avant) → écrit `S/<label>-open-1.json`, `S/<label>-open-2.json`, `S/<label>-nav.json` + affiche un résumé ; contrat ci-dessous
- [ ] exécuté avec `apres` : 2 ouvertures + 1 navigation ; résumés collés
- [ ] contrôle de cohérence : au moins 1 requête de tuile binaire par ouverture ; `window.__glrTileMem` lu (sinon le dire) ; 0 erreur 401/403 sur les tuiles
- [ ] identifiants : lus depuis `S/.env.k6` (PROJECT_ID, USERS="email:pass[;…]", premier compte) — JAMAIS affichés, loggés, écrits dans un JSON, dans result.md ou dans le vault ; le cookie de session non plus
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Écriture seulement dans S (script + JSON) et result.md ; lecture du reste.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/2e7b366b-45a7-450b-b9df-37aa6f7ce759/scratchpad/mesure-nav/measure.mjs` | E | NEUF |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/2e7b366b-45a7-450b-b9df-37aa6f7ce759/scratchpad/mesure-nav/.env.k6` | L | identifiants (600), ne jamais afficher |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/e2e/proof-viewer.mjs` | L | modèle : lancement chromium (args swiftshader), login, attente du canvas |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | `window.__glrTileMem` (~:670-680), `[tile-mem]` |

## Contrats
```
import { chromium } from '<G>/e2e/node_modules/playwright-core/index.mjs' (ou createRequire) — G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online
lancement : chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] }) ; viewport 1600×900
BASE = http://82.65.97.67:34580 ; login : POST BASE/api/auth/login JSON { email, password } (context.request) → cookie glx_session posé dans le contexte
viewer : BASE/viewer.html?project=<PROJECT_ID> ; attendre le canvas (modèle proof-viewer.mjs)
cache : CDP `Network.enable` + `Network.setCacheDisabled({ cacheDisabled: true })` sur la page (nouveau contexte par scénario)
comptage (CDP) : requête « tuile » = URL contenant `/storage/` ET extension ∈ b3dm|pnts|i3dm|cmpt|glb|bin|ktx2|jpg|jpeg|png|webp (hors .json) ; octets = Σ encodedDataLength (Network.loadingFinished) ; statut par requête (Network.responseReceived)
échantillon toutes les 1 s : t, tuilesReq (cumul), tuilesDistinctes (URL sans query), Mo (cumul), jsonReq, err4xx/5xx, tileMem = window.__glrTileMem ?? null, heapMB = performance.memory?.usedJSHeapSize/2^20
scénario open (×2) : 0 interaction pendant 180 s ; repères dérivés : 
  - « palier 1 » = 1er instant après le 1er pic où aucune nouvelle tuile n'arrive pendant ≥ 2 s (tuiles, Mo, t)
  - « stable » = dernier instant où une tuile arrive + 10 s sans nouvelle tuile, ou 180 s (tuiles, Mo, t)
scénario nav (×1) : 300 s ; cycle répété jusqu'à 300 s : drag orbite +300 px (centre canvas, bouton gauche) → attente 8 s → drag −300 px (retour) → 8 s → molette zoom avant 5 crans → 8 s → zoom arrière 5 crans → 8 s ; relevé final : tuilesReq, tuilesDistinctes, ratio = tuilesReq / tuilesDistinctes, Mo, heapMB max, tileMem final
JSON : { label, scenario, run, startedAt, samples[], reperes{} } ; résumé console : 1 ligne par scénario
```
```
référence humaine (k6/observations du 08/10, front ancien) : ouverture ≈ 2 500 tuiles / 600 Mo ; navigation standard 17 680 requêtes pour 4 558 tuiles (≈ 3,9×)
attendu après C2/C3 : < 800 tuiles et < 100 Mo au palier 1 ; ratio navigation ≈ 1,2×
modèle de test : 4 558 tuiles (preset standard par défaut)
```

## Décisions actées
- D25 : BDD du serveur de test intouchable — le login (ligne d'audit applicative) est un usage normal ; 0 autre écriture
- mesure headless : tuiles/Mo fiables, mémoire GPU non représentative (swiftshader) — le dire dans result.md
- l'humain a autorisé l'usage du compte de ~/.env.k6

## Hors périmètre
- ssh, docker, toute action sur le serveur ; modifier G ; afficher ou recopier un identifiant
- push, remote, PR, commit

## Environnement
- node v22.22.1 ; playwright-core dans G/e2e/node_modules ; chromium en cache ~/.cache/ms-playwright (1228, 1234)
- serveur joignable : portail 200, viewer.html 200 ; rate-limit tuiles 5000/min (API ancienne, clé IP) — un scénario reste sous ce seuil, ne pas lancer 2 scénarios en parallèle
- durée totale ≈ 2×180 s + 300 s + démarrages

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (S et result.md), Bash(node, ls)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T076
statut: fait | bloque
---
## Mesures (apres)
| scénario | run | palier 1 (t, tuiles, Mo) | stable (t, tuiles, Mo) | distinctes | ratio | heap max |
## Vérifié comment
commande → sortie brute (sans identifiant)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes (comment relancer pour `avant`)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
