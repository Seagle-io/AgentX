---
pack: T047
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T047 — PT-4 sidecars JSON validés + relais de part d'upload borné en concurrence

> Seule source de vérité de l'agent T047. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online : refuser à l'écriture tout sidecar dont `json` n'est pas un objet/tableau JSON (PT-4), et plafonner le nombre de parts relayées en mémoire simultanément (429 au-delà, AVANT bufferisation du corps), avec tests, sans faire grossir `server.ts`.

## Definition of Done
- [ ] PUT `/api/projects/:id/:kind/:scope` : `json` = `'<img src=x onerror=alert(1)>'`, `'pas du json'`, `'"chaine"'`, `'42'`, `'null'` → 400 `{ error: 'invalid_json', … }` ; `'{"a":1}'` et `'[]'` → 200 (comportement actuel) ; non-string → 400 inchangé
- [ ] relais : avec `UPLOAD_RELAY_MAX_INFLIGHT=2` et `putMultipartPart` mocké lent, 3 PUT de part simultanés → 2×200, 1×429 avec en-tête `Retry-After` ; après fin des 2 → nouveau PUT 200 ; requête avortée par le client → slot rendu (compteur revient à 0)
- [ ] le 429 est rendu dans un hook `onRequest` de la route (avant le parseur octet-stream) : prouvé par test (corps > 1 Mo, mock du parseur non appelé ou `inflight()` jamais > max)
- [ ] `config.upload.relayMaxInflight` : défaut 4, entier borné 1..64 (hors bornes/invalide → 4) ; ligne dans `.env.production.example` avec commentaire mémoire (≈ max × RELAY_PART_BODY_LIMIT)
- [ ] tests : `api/test/sidecar-upload-t047.test.ts` NEUF ; KO sur HEAD prouvé (lancé avant édition de src)
- [ ] `git -C G diff --stat -- api/src/server.ts` : insertions ≤ suppressions ; typecheck 0 ; `npm --prefix api test` vert (≥ 690 + nouveaux)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | sidecar PUT :1078-1090 · relais :2585-2590 et :2700-2726 · imports en tête |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/sidecarJson.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/relayGate.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | AppConfig.upload :65-75 · loadConfig upload :210-220 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | 1 ligne + commentaire |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/sidecar-upload-t047.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp(extraEnv), login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/upload-direct.test.ts` | L | modèle initiate → uploadId → part relais |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/upload/directUpload.ts` | L | :55-62 retry 429/408/5xx (preuve client tolérant) |

## Contrats
```ts
// ═══ api/src/sidecarJson.ts (NEUF)
/** null si `v` est une chaîne JSON d'objet ou de tableau ; sinon corps d'erreur 400. */
export function sidecarJsonProblem(v: unknown): null | { error: 'bad_request' | 'invalid_json'; message: string };
//   typeof v !== 'string' → { error: 'bad_request', message: 'Champ `json` (string) requis.' }   (message ACTUEL server.ts:1086, inchangé)
//   JSON.parse lève, ou résultat null / non-objet → { error: 'invalid_json', message: 'Le champ `json` doit contenir un objet ou un tableau JSON.' }
// server.ts:1084-1087 ACTUEL :
//   const json = req.body?.json;
//   if (typeof json !== 'string') { return reply.code(400).send({ error: 'bad_request', message: 'Champ `json` (string) requis.' }); }
// CIBLE : const bad = sidecarJsonProblem(req.body?.json); if (bad) return reply.code(400).send(bad); const json = req.body!.json as string;
//   (stocker la chaîne d'origine telle quelle : 0 re-sérialisation)

// ═══ api/src/relayGate.ts (NEUF)
import type { FastifyReply, FastifyRequest } from 'fastify';
export interface RelayGate {
  onRequest(req: FastifyRequest, reply: FastifyReply): Promise<void>;  // inflight >= max → reply.code(429).header('Retry-After','2').send({ error: 'too_many_parts', message: 'Trop de parts en cours — nouvel essai automatique.' }) ; sinon inflight++ et marque la requête
  onResponse(req: FastifyRequest): Promise<void>;                     // rend le slot si la requête l'avait pris (idempotent)
  onRequestAbort(req: FastifyRequest): Promise<void>;                 // idem (client parti)
  inflight(): number;
}
export function createRelayGate(max: number): RelayGate;
//   marque par WeakSet<FastifyRequest> (pas de propriété ajoutée à req) ; jamais négatif
// server.ts route relais :2710-2713 : options { preHandler: requireAdmin, bodyLimit } → + onRequest, onResponse, onRequestAbort de la gate
//   gate créée 1× : const relayGate = createRelayGate(config.upload.relayMaxInflight) (à côté de RELAY_PART_BODY_LIMIT :2589)
//   NB : onRequest s'exécute AVANT auth et AVANT parsing → un anonyme peut consommer un slot ~1 RTT, puis requireAdmin 401 → onResponse le rend

// ═══ config.ts
//   AppConfig.upload : + relayMaxInflight: number;  /** parts relayées simultanées (mémoire) */
//   loadConfig : relayMaxInflight: intIn(env.UPLOAD_RELAY_MAX_INFLIGHT, 4, 1, 64)
function intIn(v: string | undefined, def: number, min: number, max: number): number; // n=Number(v) ; Number.isInteger(n) && n>=min && n<=max ? n : def
// RELAY_PART_BODY_LIMIT (server.ts:2589) = max(UPLOAD_PART_MIN_BYTES, ceil(maxBytes / floor(maxParts*0.9))) + 4 Mo — mémoire pire cas ≈ relayMaxInflight × cette valeur
```
Client : `web/src/upload/directUpload.ts:62` réessaie `status >= 500 || 429 || 408` avec backoff exp (6 tentatives/part) → le 429 est absorbé côté navigateur.

## Décisions actées
- PT-4 validé à l'écriture serveur en plus de l'échappement viewer (T008/T021) — synthèse audit §6
- plafond global (pas par utilisateur) : protège la mémoire du process — l'auth vient après parsing
- server.ts ne grossit pas — règle G 3

## Hors périmètre
- transport `direct` (présigné S3) ; route `/api/admin/projects` (multipart streamé) ; contenu sémantique des sidecars (schéma par kind)
- web/ (lecture seule) ; worker, e2e, infra hors `.env.production.example`
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean ; npm install ; docker

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; G HEAD `80fe49a`, arbre propre ; suite 77 fichiers 690 tests ; aucun autre agent actif
- regex à blanc sur HEAD : `rg -c "typeof json !== 'string'" api/src/server.ts` → 1
- règle G : fichier neuf ≤ 400 l, fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, rg, wc, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom ; jamais de nettoyage global.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T047
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
