---
pack: T048
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T048 — Relais de part : admin vérifié avant la prise de slot (anti-saturation anonyme)

> Seule source de vérité de l'agent T048. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, route relais de part (`server.ts:2711`) : exécuter `requireAdmin` en `onRequest` AVANT `relayGate.onRequest`, pour qu'une requête non authentifiée ou non admin ne prenne jamais de slot, avec test HTTP réel ; 0 autre changement de comportement.

## Definition of Done
- [ ] options de la route : `onRequest: [requireAdmin, relayGate.onRequest]`, `preHandler: requireAdmin` retiré (auth faite 1 seule fois) ; `onResponse` / `onRequestAbort` inchangés
- [ ] test HTTP réel (`app.listen`, modèle du test T047) : `UPLOAD_RELAY_MAX_INFLIGHT=1` ; 3 requêtes anonymes avec `Content-Length: 2 Mo` et corps partiel tenues ouvertes → chacune 401 immédiat, `relayGate.inflight()` / sonde admin → 200 (slot jamais pris) ; idem cookie membre non admin → 403 sans slot
- [ ] test : admin valide → comportement T047 inchangé (2 parallèles avec max 1 → [200, 429])
- [ ] test : session révoquée (sv) → 401 sans slot (requireAuth lit la DB : prouve que l'auth DB tourne bien en onRequest)
- [ ] tests T047 (`api/test/sidecar-upload-t047.test.ts`) toujours verts ; KO du nouveau test sur HEAD prouvé
- [ ] `git -C G diff --stat -- api/src/server.ts` : insertions ≤ suppressions ; typecheck 0 ; `npm --prefix api test` vert (≥ 704 + nouveaux)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | route relais :2708-2716 seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/relay-auth-t048.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/relayGate.ts` | L | gate T047 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | L | requireAuth :85-92, requireAdmin :95-101 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/sidecar-upload-t047.test.ts` | L | modèle HTTP réel, corps partiel, login, initiate |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |

## Contrats
```ts
// server.ts:2711-2713 ACTUEL
'/api/admin/projects/upload/:uploadId/part/:partNumber',
{ preHandler: requireAdmin, bodyLimit: RELAY_PART_BODY_LIMIT, onRequest: relayGate.onRequest, onResponse: relayGate.onResponse, onRequestAbort: relayGate.onRequestAbort },
// CIBLE
{ onRequest: [requireAdmin, relayGate.onRequest], bodyLimit: RELAY_PART_BODY_LIMIT, onResponse: relayGate.onResponse, onRequestAbort: relayGate.onRequestAbort },

// auth.ts — fonctions async (request, reply) : envoient 401/403 via `await reply.code(..).send(..)` et renvoient void
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void>; // jwtVerify (cookie) + validateSession(DB) → request.sessionUser
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>; // requireAuth puis role === 'org_admin' sinon 403
// cookies parsés par le plugin cookie en onRequest GLOBAL → s'exécute avant les hooks onRequest de route (ordre Fastify : global puis route)
// Fastify : un hook async qui a envoyé la réponse arrête la chaîne si `reply.sent` — À PROUVER par le test (relayGate ne doit pas être appelé après un 401)
// relayGate.ts (T047) : onRequest(req, reply) prend 1 slot (WeakSet) ou 429 ; onResponse/onRequestAbort rendent le slot ; inflight()
// Si la chaîne ne s'arrête pas après le 401 : relayGate.onRequest doit sortir tôt si reply.sent (1 ligne dans relayGate.ts → alors relayGate.ts passe en E, le noter dans Écarts)
```

## Décisions actées
- auth avant slot : un anonyme ne doit consommer aucune ressource du relais — T047 Pour la suite
- plafond global conservé (T047) ; admin authentifié lent = risque interne accepté
- server.ts ne grossit pas — règle G 3

## Hors périmètre
- autres routes ; rate-limit ; transport direct ; web/
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean ; npm install ; docker

## Environnement
- node v22.22.1 ; fastify 5.12.5 ; api/node_modules ; vitest + pg-mem ; G HEAD `652409f`, arbre propre ; suite 78 fichiers 704 tests ; aucun autre agent actif
- onRequestAbort n'est simulé que via `app.listen` + socket réel (inject ne le déclenche pas) — T047

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, rg, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom ; jamais de nettoyage global.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T048
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
