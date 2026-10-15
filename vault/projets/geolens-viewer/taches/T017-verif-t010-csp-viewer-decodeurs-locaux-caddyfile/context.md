---
pack: T017
projet: geolens-viewer
role: verificateur
cree: 2026-10-07
---

# Pack T017 — Vérif T010 : CSP viewer, décodeurs locaux, Caddyfile

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Tenter de réfuter la CSP stricte du viewer livrée par T010 : trouver ce qu'elle casse (script inline injecté au build, ressource externe, worker, wasm, iframe PDF) ou ce qu'elle laisse passer, et contrôler le Caddyfile contre le contrat ; `OK` ou `DÉFAUTS` avec repro ; 0 correction. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] A1-A8 : chacune OK/KO avec commande + sortie
- [ ] `npm --prefix web run build` relancé ; `web/dist/viewer.html` relu : chaque `<script>`, `<link rel=modulepreload>`, attribut `on*=` listé ; 0 inline attendu
- [ ] inventaire des origines chargées par le viewer : `rg -n "https?://" web/src/viewer -g '!**/__tests__/**' -g '!*.test.ts'` filtré aux appels réseau (fetch, setPath, src=, import()) → chacune autorisée ou bloquée par la CSP (liste)
- [ ] Caddy : `docker run --rm -v <G>/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile` → sortie collée, ou NV si image absente (1 essai de pull max)
- [ ] verdict `OK` | `DÉFAUTS` ; défaut = fichier:ligne + repro + attendu/obtenu + impact (casse / laisse passer)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (+ exécution). Écriture : `result.md` seulement.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | meta :16 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/index.html` | L | miroir |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/boot-web.ts` | L | idleLogout |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/loaders/TilesRendererLoader.ts` | L | :160-180 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/__tests__/csp.test.ts` | L | 5 cas |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | contrat |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | L | build multi-page, publicDir |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/nginx.conf` | L | sert /draco, /basis, type wasm |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/dist/viewer.html` | L | produit du build |

## Contrats
```
CSP attendue (viewer.html:16 = src/viewer/index.html:16) :
default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; worker-src 'self' blob:; frame-src blob:; object-src blob:; base-uri 'self'; form-action 'self'
Caddyfile attendu : @front not path /api/* → header defer {X-Content-Type-Options nosniff ; Referrer-Policy strict-origin-when-cross-origin ; CSP "frame-ancestors 'self'; base-uri 'self'; form-action 'self'"}
  @portail_doc not path /api/* /viewer.html /viewer /assets/* /draco/* /basis/* → Content-Security-Policy-Report-Only (portail) ; handle /api/* → api:4000 ; handle → web:80 ; 0 directive log
```
Affirmations à réfuter :
- A1 metas identiques octet pour octet, = contrat
- A2 0 script inline dans web/viewer.html ET dans web/dist/viewer.html (modulepreload polyfill vite ?)
- A3 `installIdleLogout()` appelé dans boot-web.ts (comportement de l'ancien inline conservé : appelé une fois, au chargement)
- A4 décodeurs : TilesRendererLoader.ts:169 `'/draco/'`, :177 `'/basis/'` ; dist/draco + dist/basis présents (5 fichiers) ; draco type 'js' toujours :172
- A5 0 référence unpkg hors tests ; 0 autre origine externe chargée par le viewer (sinon : bloquée par connect-src/script-src → défaut « casse »)
- A6 en-tête `frame-ancestors` côté Caddy présent ; le viewer servi sous /viewer.html n'a PAS la CSP Report-Only portail (matcher exclu)
- A7 nginx sert `.wasm` avec `application/wasm` (types nginx par défaut) — sinon instantiateStreaming échoue → défaut
- A8 `npm --prefix web test` vert ; `npm --prefix web run build:viewer-types` exit 0 (csp.test.ts importe node:fs)
Reste connu (à confirmer, pas défaut T010) : HSTS absent du contrat Caddy ; commentaires obsolètes viewer.html:8-12,:22, TilesRendererLoader.ts:167-168,175-176.

## Décisions actées
- style-src 'unsafe-inline' conservé — 82 style="" + templates JS
- schémas Electron retirés — 0 electron dans G
- portail en Report-Only — enforce = lot futur
- draco type 'js' conservé

## Hors périmètre
- corriger, éditer un fichier de G
- lancer la stack, un navigateur, docker compose up
- XSS (T016), api/
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules installé ; `npm --prefix web run build` ≈ 21 s, dist/ gitignoré
- docker présent, images caddy/nginx non garanties en cache
- G sous git, baseline 745d46f : `git -C G diff -- web/viewer.html web/src/viewer Caddyfile`
- d'autres agents écrivent dans api/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(npm --prefix web run build, npm --prefix web test, npm --prefix web run build:viewer-types, docker run caddy validate, rg, ls, git diff, git show), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T017
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- A1..A8 — OK | KO (≤ 8 mots)
## Défauts
- ∅ | Dn · fichier:ligne · repro · attendu / obtenu · impact casse | laisse passer
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
