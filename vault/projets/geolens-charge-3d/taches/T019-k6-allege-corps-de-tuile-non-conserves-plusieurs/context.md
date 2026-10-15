---
pack: T019
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T019 — k6 allégé : corps de tuile non conservés, plusieurs VUs par conteneur

> Seule source de vérité de l'agent T019. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réduire le CPU du générateur k6 colocalisé (≈ 245 % / 400 à 30 VUs, machine 0 % idle) : ne plus conserver les corps des tuiles et des GET S3, et permettre N VUs par conteneur ; mêmes métriques, mêmes noms de tags.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] viewer-navigation.js : requêtes `storage/tile`, `storage/tile-revisit` et `s3/tile` avec `responseType: 'none'` ; `storage/tileset` inchangé (JSON lu)
- [ ] octets : `tile_bytes` / `s3_bytes` = `Number(r.headers['Content-Length'] || 0)` (corps absent) ; 1 ligne de doc : « octets = Content-Length, 0 si chunked »
- [ ] Makefile : `PER ?= 1` (VUs par conteneur) ; `run` lance `VUS/PER` conteneurs `k6-u1..k6-uN` avec `-e VUS=$(PER)` ; `check` échoue si `VUS % PER ≠ 0` (message clair) ; `PER=1` → commandes identiques à aujourd'hui sauf `-e VUS=1`→`-e VUS=$(PER)`
- [ ] `report` : ligne « utilisateurs » = `$(VUS)` (pas le nombre de fichiers) ; agrégats p95 inchangés (tous les u*.json / csv)
- [ ] en-tête d'usage Makefile : 1 ligne `make run VUS=30 PER=10` ; doc Variables du .js inchangée hors octets
- [ ] `docker run --rm -v G/tools/load:/s grafana/k6:0.54.0 inspect /s/viewer-navigation.js` avec `-e PROJECT_ID=x -e USERS=a:b` (et `-e SCENARIO=redirect`) → exit 0
- [ ] `make -n run VUS=30 PER=10 PROJECT_ID=x USERS=a:b` → 3 `docker run` avec `-e VUS=10` ; `make -n check VUS=30 PER=7 …` → échec ; sorties collées (sans `~/.env.k6` : `HOME=/tmp/x`)
- [ ] test local stub (scratchpad, python ≤ 25 l) : 1 route 200 avec corps 100 Ko + Content-Length, 1 route 302 → 2ᵉ route ; script k6 jetable qui fait `http.get(…, { responseType: 'none' })` → `r.body` null et Content-Length lu ; sortie collée
- [ ] `git -C G status --short -- tools/load/` → 2 fichiers ; diff ≤ 40 lignes
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/viewer-navigation.js` | E | :248-280 params/batch/octets |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/tools/load/Makefile` | E | :1-30 vars, :33-64 check/run, :76-110 report |

## Contrats
```js
// viewer-navigation.js actuel (après T015)
  const params = (u) => {
    if (revisit) return { headers: { 'If-None-Match': seen[tileKey(u)].etag }, tags: { name: 'storage/tile-revisit' } };
    if (SCENARIO === 'redirect') return { redirects: 0, tags: { name: 'storage/tile' } };
    return { tags: { name: 'storage/tile' } };
  };
      if (r.status === 200 || r.status === 206) {
        tileBytes.add(r.body ? r.body.length : Number(r.headers['Content-Length'] || 0));
        if (SCENARIO === 'revisit' && r.headers['Etag']) seen[tileKey(lot[j])] = { url: lot[j], etag: r.headers['Etag'] };
        const t = s3Request(r.headers['Location']);
        s3.push(['GET', t.url, null, { headers: t.headers, jar: new http.CookieJar(), tags: { name: 's3/tile' } }]);
        if (r.status === 200 || r.status === 206) s3Bytes.add(r.body ? r.body.length : Number(r.headers['Content-Length'] || 0));
// sessions : const session = data.sessions[(__VU - 1) % data.sessions.length];  (__VU local au conteneur : OK)
```
```make
# Makefile actuel (extraits)
VUS        ?= 3
	@for i in $$(seq 1 $(VUS)); do \
	   docker run -d --name k6-u$$i --network $(NETWORK) --user $$(id -u):$$(id -g) \
	     … -e VUS=1 -e DURATION=$(DURATION) /test.js >/dev/null; \
	@for i in $$(seq 1 $(VUS)); do docker wait k6-u$$i >/dev/null; done
	@for i in $$(seq 1 $(VUS)); do docker logs k6-u$$i > $(OUT)/u$$i.log 2>&1; done
```
k6 0.54 : `responseType: 'none'` → corps lu puis jeté, `r.body` = null ; en-têtes disponibles.

## Décisions actées
- D18 : k6 colocalisé = goulot de mesure ; la machine de test n'a que 4 vCPU
- quota tuile par compte (500000 pendant mesures) : 1 IP par conteneur n'est plus requis
- revisit garde l'ETag depuis l'en-tête : corps inutile

## Hors périmètre
- copc-ranges.js ; s3Request, setup(), seuils, handleSummary (hors octets)
- toute exécution contre 82.65.97.67 ; ssh
- commit (le chef commite)

## Environnement
- image locale `grafana/k6:0.54.0` (docker) ; pas de binaire k6 ; HEAD G = 0ab700f
- arbre G sale hors tools/load (web/…, RAPPORT_*) : ne pas toucher
- scratchpad : `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/77c6e015-6b70-40db-8cea-11f69afa68f0/scratchpad`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (scratchpad), Bash(docker run grafana/k6:0.54.0, python3, make -n, git -C G status/diff)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: T019
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
