---
pack: T015
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T015 — Lot B : k6 suit la redirection via caddy interne, Host public

> Seule source de vérité de l'agent T015. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans le scénario `redirect` du k6 de G, suivre le 302 de tuile en réécrivant l'origine publique de `Location` vers une origine interne, avec l'en-tête `Host` = hôte public (signature SigV4 intacte) ; 0 changement pour navigation/revisit et quand les 2 variables sont absentes.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] viewer-navigation.js : env `TILE_ORIGIN_PUBLIC` + `TILE_ORIGIN_INTERNAL` (les 2 ou aucun, sinon throw au chargement) ; fonction exportée `s3Request(loc)` → `{ url, headers }`
- [ ] :255 utilise `s3Request(r.headers['Location'])` ; `jar` vide et tag `s3/tile` conservés
- [ ] variables absentes → `url = absolute(loc)`, `headers = {}` (comportement actuel octet pour octet)
- [ ] Location qui ne commence pas par `TILE_ORIGIN_PUBLIC` → inchangée, sans Host forcé
- [ ] Makefile : `-e TILE_ORIGIN_PUBLIC="$(TILE_ORIGIN_PUBLIC)" -e TILE_ORIGIN_INTERNAL="$(TILE_ORIGIN_INTERNAL)"` passés au conteneur, défauts vides (`?=`) ; en-tête d'usage du Makefile + bloc « Variables » du .js : 1 ligne chacun
- [ ] test local : script k6 jetable dans le scratchpad qui importe `s3Request` → 4 cas (absentes, préfixe public avec chemin+query, autre origine, origine publique avec slash final dans l'env) → sortie `docker run --rm --network host -v …:/s grafana/k6:0.54.0 run …` collée, 0 check rouge
- [ ] test Host : stub `python3 -m http.server`-like (≤ 20 l, scratchpad) qui renvoie le Host reçu ; un `http.get(url, { headers })` k6 produit `Host: 82.65.97.67:34580` → sortie collée
- [ ] `docker run --rm -v G/tools/load:/s grafana/k6:0.54.0 inspect /s/viewer-navigation.js` avec `-e PROJECT_ID=x -e USERS=a:b` → exit 0
- [ ] `git -C G status --short -- tools/load/` → seulement les 2 fichiers ; diff ≤ 40 lignes
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/viewer-navigation.js` | E | :24-40 doc, :47 BASE, :121 absolute, :236-262 redirect |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/Makefile` | E | :1-25 vars, :39-44 docker run |

## Contrats
```js
// :47 / :121 actuels
const BASE = (__ENV.BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
function absolute(url) { return /^https?:\/\//i.test(url) ? url : BASE + url; }
// :253-255 actuel
        tile302.add(1);
        // URL présignée : jar vide → aucun cookie de session envoyé au stockage.
        s3.push(['GET', absolute(r.headers['Location']), null, { jar: new http.CookieJar(), tags: { name: 's3/tile' } }]);
```
Cible :
```js
const ORIGIN_PUBLIC = (__ENV.TILE_ORIGIN_PUBLIC || '').replace(/\/+$/, '');
const ORIGIN_INTERNAL = (__ENV.TILE_ORIGIN_INTERNAL || '').replace(/\/+$/, '');
/** Location signée → requête joignable depuis le réseau docker. Host = hôte public : SigV4 le signe. */
export function s3Request(loc) { /* … */ return { url, headers }; }
s3.push(['GET', t.url, null, { headers: t.headers, jar: new http.CookieJar(), tags: { name: 's3/tile' } }]);
```
Valeurs serveur de test : `TILE_ORIGIN_PUBLIC=http://82.65.97.67:34580` · `TILE_ORIGIN_INTERNAL=http://caddy:80` → Host `82.65.97.67:34580` (hôte+port de l'origine publique, `new URL` absent dans k6 : parser par regex).
Constat chef 13/10 : depuis le réseau docker, `http://82.65.97.67:34580/` → timeout (hairpin KO) ; `http://caddy:80/api/health` + `Host: 82.65.97.67:34580` → 200.

## Décisions actées
- MinIO valide SigV4 avec Host public ; Caddy ne réécrit pas Host — D5
- k6 seul change ; API, Caddy, viewer : 0 modif — T004 lot B
- k6 0.54 : en-tête `Host` dans `headers` surcharge l'hôte de l'URL

## Hors périmètre
- copc-ranges.js, scénarios navigation/revisit, seuils, handleSummary
- toute exécution contre le serveur 82.65.97.67 ; ssh
- commit (le chef commite)

## Environnement
- image locale `grafana/k6:0.54.0` (docker) ; pas de binaire k6 ; k6 = goja ES2015+, pas de `URL` global
- arbre G sale hors tools/load (web/…, RAPPORT_*) : ne pas toucher ; HEAD edb565f
- scratchpad : `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/77c6e015-6b70-40db-8cea-11f69afa68f0/scratchpad`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (scratchpad), Bash(docker run grafana/k6:0.54.0, python3, git -C G status/diff)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T015
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
