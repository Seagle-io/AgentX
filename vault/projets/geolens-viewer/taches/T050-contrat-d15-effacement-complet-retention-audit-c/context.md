---
pack: T050
projet: geolens-viewer
role: architecte
cree: 2026-10-08
---

# Pack T050 — Contrat D15 : effacement complet, rétention (audit, comptes, livrables), IP d'audit, export

> Seule source de vérité de l'agent T050. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher et écrire dans `result.md` les contrats exécutables des 5 lots D15 — effacement complet d'un utilisateur, IP + user-agent dans l'audit, rétention planifiée (audit 12 mois, comptes inactifs 3 ans, livrables fin de contrat + 1 an), export `GET /api/me/export`, saisie de la fin de contrat — avec garde-fous de suppression et ordre d'édition de `server.ts` ; 0 ligne de code de prod. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] E (effacement) : signature TS d'un module NEUF + liste exhaustive table → action (DELETE / UPDATE NULL / pseudonymiser) pour TOUTES les tables qui référencent un user (schema.ts + userLayers.ts), en 1 transaction ; route DELETE admin users (server.ts ~:1515) branchée dessus
- [ ] A (audit IP/UA) : colonnes + DDL (ALTER idempotent, migrate() au boot) + mécanisme qui renseigne IP/UA SANS modifier les ~51 appels `audit(...)` (ex. contexte requête AsyncLocalStorage posé par hook onRequest) — trancher, justifier ; IP = `req.ip` (honore TRUST_PROXY) ; UA tronqué
- [ ] R (rétention) : module NEUF, 3 purges, signatures ; règle d'inactivité exacte (last_login, sinon created_at ; exclusions : admin plateforme, org de l'admin plateforme ?) ; planification (modèle sweepTimer server.ts:2445-2447 : setInterval + unref + onClose) ; config `RETENTION_MODE=off|report|enforce` (défaut ?) + clés de durée ; chaque purge auditée ; borne par passe
- [ ] R livrables : DDL `organizations.contract_end_at` (type, nullable) ; purge = projets de l'org dont contract_end_at + 1 an < now → réutiliser le chemin de suppression de projet existant (route DELETE /api/admin/projects/:id ~:2930 : identifier la fonction à extraire) ; garde-fous : mode report par défaut, jamais l'org de l'admin plateforme, log détaillé avant suppression, plafond N projets/passe
- [ ] C (fin de contrat) : contrat de saisie — route (PATCH /api/admin/organizations/:id ~:1871/:1889 étendue ou neuve) + champ admin web (Admin.tsx : coordonnée de la section organisations)
- [ ] X (export) : `GET /api/me/export` : forme JSON exacte (champs par table), exclusions (password_hash, token_hash), Content-Disposition, rate-limit ; bouton dans Account.tsx (coordonnée)
- [ ] ordre server.ts : tableau lot → plages → rang ; lots à fichiers disjoints parallélisables signalés
- [ ] cas de test nommés par lot (fichier + cas), recopiables dans un pack
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule sur G. Écriture : `result.md` seul.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | 10 tables, audit_log :134-146, migrate() |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userLayers.ts` | L | project_layers :55-85 (owner_user_id, published_by) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | audit() :139-152, getUserById |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | plages ≤ 80 l : 300-330, 1460-1540, 1860-1900, 2160-2180, 2430-2450, 2920-2960 + rg |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/storage.ts` | L | deletePrefix :130, :244, :462 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | AppConfig, posInt/proxyList, garde prod |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Admin.tsx` | L | section organisations (rg) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Account.tsx` | L | page Mon compte (T049) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Confidentialite.tsx` | L | :91-125 promesses |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-viewer/taches/T032-reco-conformite-promesses-de-la-politique-de-con/result.md` | L | 27 promesses, lots |

## Contrats
```ts
// existant
// repo.ts:139
export async function audit(db: Db, user: SessionUser | null, action: string, detail?: string): Promise<void>
//   INSERT INTO audit_log (id, user_id, org_id, action, detail) ; erreurs avalées (try/catch)
// storage.ts:130 (interface Storage)
deletePrefix(prefix: string): Promise<void>;
// server.ts:2445-2447 — modèle de planification
const sweepTimer = setInterval(() => { void pruneAnalyze(); void sweepOrphans(); }, SWEEP_INTERVAL_MS);
sweepTimer.unref();
app.addHook('onClose', async () => { clearInterval(sweepTimer); });
// session.ts (T007) : setPasswordAndRevoke, checkUserAccess ; auth : request.sessionUser ; req.ip honore TRUST_PROXY (D10)
```
```
faits T032 (lignes au 2026-10-07, recouper par rg) :
- route DELETE /api/admin/users/:id server.ts:1516-1530 : DELETE auth_tokens, project_access, users ; audit 'delete_user' avec target.email
- restes après suppression : audit_log.detail contient des emails (server.ts:418, 1410, 1528, 1588) ; project_layers.owner_user_id / published_by (userLayers.ts:58-69) ; report_artifacts.created_by (schema.ts:205, sans FK)
- audit_log(id, user_id, org_id, action, detail, created_at) sans ip/ua ; IP seulement dans detail accept_invite
- users.last_login écrit au login (server.ts ~:311), jamais exploité
- 0 purge audit_log, 0 job comptes, 0 date de fin de contrat (projects/organizations)
- promesses : compte « relation + 3 ans » C:105 · livrables « contrat + 1 an » C:106 · journaux 12 mois C:107 · IP C:56 · droits accès/portabilité/effacement C:113
```

## Décisions actées
- D15 : implémenter #11, #12, #13, #14, #16-17, #19 ; #18 rectification = sur demande (texte)
- DDL par migrate() au boot, ALTER idempotent, 0 commande humaine — modèle D6 (session_version)
- logique dans modules NEUFS, server.ts = appels — monolithe gelé (~3400 l)
- 0 nouvelle dépendance npm
- suppression de données clients : défaut non destructif (report) — choix humain explicite pour enforce
- 0 push, 0 remote — D5 ; commits locaux par le chef — D9

## Hors périmètre
- écrire/modifier un fichier de G ; lancer quoi que ce soit (pas de Bash)
- rectification outillée (PATCH /api/me) ; registre des traitements ; actions console Scaleway
- rédiger le texte de la politique (lot texte séparé, après les lots code)
- push, remote, PR, commit

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; suite api ≥ 629 tests verts ; G sous git HEAD 003e284
- pg-mem : UPDATE … RETURNING OK ; transactions : vérifier le pattern existant (rg "BEGIN|transaction" api/src)
- un seul processus API en prod (compose scaleway : 1 service api) → timer in-process acceptable, à confirmer

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep (sur G/api/src, G/api/test, G/web/src/pages), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T050
statut: fait | bloque
---
## Décisions
- choix — raison ≤ 8 mots — option écartée
## Contrats
```
E · A · R · C · X — signatures TS, DDL, SQL clés, config, routes — verbatim
```
## Ordre server.ts
| rang | lot | plages | parallèle avec |
## Tests par lot
- lot · fichier test · cas
## Vérifié comment
- lecture chemin:L1-L2 → fait
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
