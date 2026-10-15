---
pack: T029
projet: geolens-charge-3d
role: implementeur
cree: 2026-10-13
---

# Pack T029 — Correctif T028 : purge robuste, plafond avant lecture, TTL monotone du cache viewer

> Seule source de vérité de l'agent T029. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 4 défauts T028 de `tileCache.ts` sans changer son contrat public : housekeeping qui s'arrête au 1er `delete` rejeté, corps > 64 Mio lu en entier avant rejet, TTL accepté si horloge reculée, manifeste mutable encodé (`%70roject.json`) stocké ; tests de non-régression repris de la repro T028.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] D1 housekeep (:102-125) : 1ʳᵉ boucle → `try { if (await cs.delete(k)) dead.push(k); } catch { /* clé suivante */ }` par clé ; idem boucle LRU ; test : delete rejette sur 1 cache d'un autre compte → tous les autres caches d'autres comptes supprimés
- [ ] D2 store / fetchData : `Content-Length` présent et > TILE_CACHE_MAX_ENTRY_BYTES → pas de clone, skipped++ ; sinon lecture du clone en flux (`clone.body.getReader()`) avec compteur, abandon (cancel) dès > 64 Mio, skipped++ ; blob construit depuis les morceaux lus ; tests : CL 100 Mio → 0 clone (spy `res.clone`) ; sans CL, flux 65 Mio → skipped, 0 put
- [ ] D3 TTL (:173) : `const age = Date.now() - Number(cachedAt)` ; frais ssi `Number.isFinite(age) && age >= 0 && age < TILE_CACHE_TTL_MS` ; sinon périmé (delete + refetch) ; test « horloge reculée » de T028 → refetch
- [ ] D4 tileCacheKey (:69-81) : `MUTABLE_RE.test(rel)` OU `MUTABLE_RE.test(safeDecode(rel))` → null (`safeDecode` = decodeURIComponent en try, échec → null renvoyé) ; tests `%70roject.json`, `multi%2Dpack.json`, `%E0%A4%A` (décodage invalide) → null
- [ ] contrat public (exports, signatures, constantes) inchangé ; `tileCache.test.ts` existant vert sans modification ; ≤ 280 l au total
- [ ] `npm --prefix web test -- tileCache` vert ; `npm --prefix web run typecheck` exit 0 ; `npm --prefix web test` → synthèse collée (base 182 fichiers / 1745 tests)
- [ ] `git -C G status --short -- web/src/viewer/backend/` → tileCache.ts + tileCache.test.ts seulement
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/tileCache.ts` | E | :66-81 clé, :102-150 housekeep/store, :160-195 fetchData |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/tileCache.test.ts` | E | + cas D1-D4 (harnais existant) |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/wt-charge3d-T026/web/src/viewer/backend/__tests__/verif-t028-tileCache.test.ts` | L | repro T028 (housekeep delete rejeté, horloge reculée) |

## Contrats
```ts
// actuel :102-110
async function housekeep(cs: CacheStorage, scope: string, projectId: string, name: string): Promise<void> {
  try {
    const own = `${TILE_CACHE_PREFIX}${scope}/`; const project = `${own}${projectId}/`; const dead: string[] = [];
    for (const k of await cs.keys()) {
      if (k === name || !k.startsWith(PURGE_PREFIX)) continue;
      if ((!k.startsWith(own) || k.startsWith(project)) && await cs.delete(k)) dead.push(k);
    }
// actuel store :129-140
async function store(c: Cache, key: string, clone: Response, signal?: AbortSignal | null): Promise<void> {
    const blob = await clone.blob();
    if (blob.size > TILE_CACHE_MAX_ENTRY_BYTES || signal?.aborted) { stats.skipped++; return; }
    const ct = clone.headers.get('Content-Type') ?? 'application/octet-stream';
    await c.put(key, new Response(blob, { status: 200, headers: { 'Content-Type': ct, [CACHED_AT]: String(Date.now()) } }));
// actuel fetchData :172-176
      if (hit) {
        if (Date.now() - Number(hit.headers.get(CACHED_AT)) < TILE_CACHE_TTL_MS) { stats.hits++; return hit; }
        void c.delete(key).catch(() => false);
      }
// actuel clé :77-78
    const rel = u.pathname.slice(base.length);
    if (!rel || MUTABLE_RE.test(rel)) return null;
```
Repro T028 : 256 Mio sans garde → pic +1024 Mio (direct +768) ; horloge +365 j puis +40 j → hit ; `%70roject.json` → clé non null.

## Décisions actées
- D22/D23 : confidentialité > gain ; en cas de doute, ne pas stocker ; store jamais attendu par fetchData
- abort pendant lecture du corps → skipped (pas writable=false) — comportement T026 conservé

## Hors périmètre
- install.ts, auth.tsx, idleLogout.ts, TilesRendererLoader.ts, api/
- `W/` : lecture seule ; commit (le chef commite)

## Environnement
- web : vitest env node, globals simulés (vi.stubGlobal) ; Node 22 : `ReadableStream`, `Response.body.getReader()` natifs ; HEAD G = 3f3708e
- arbre G sale (autre mission) : TilesRendererLoader.ts, qualityHud.ts, errorTargetRefine* — ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix web test|run typecheck, npx vitest, git -C G diff/status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T029
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
