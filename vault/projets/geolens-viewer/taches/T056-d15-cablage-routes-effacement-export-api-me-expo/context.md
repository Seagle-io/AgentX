---
pack: T056
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T056 — D15-câblage : routes effacement, export /api/me/export, fin de contrat

> Seule source de vérité de l'agent T056. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Brancher dans `api/src/server.ts` les modules livrés : (E) route `DELETE /api/admin/users/:id` → `eraseUser` ; (X) route NEUVE `GET /api/me/export` → `buildUserExport` ; (C) route NEUVE `PATCH /api/admin/organizations/:id/contract` + `contractEndAt` dans `GET /api/admin/organizations` ; avec tests de route. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] E, X, C câblés selon contrats ; `git diff -- api/src/server.ts` ne touche QUE : imports, route DELETE user, insertion export avant `// ── Auth`, GET organizations, insertion route contract après le PATCH organizations/:id
- [ ] `api/test/user-erasure-route.test.ts`, `api/test/me-export.test.ts`, `api/test/org-contract.test.ts` NEUFS : cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base ≥ 80 fichiers / 716 tests + T053-T055) — sorties collées
- [ ] `git -C G diff --stat -- api` + `git -C G status --short api` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | imports ; ~:292 ; ~:1517-1532 ; ~:1820-1843 ; après PATCH ~:1873-1888 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/user-erasure-route.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/me-export.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/org-contract.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/erasure.ts` | L | contrat T054 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userExport.ts` | L | contrat T055 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | getPlatformOrgIds, audit |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/admin-console.test.ts` | L | modèle env(), captureMailer, admin plateforme vs rival |

## Contrats
```ts
// modules (livrés) :
export async function eraseUser(db: Db, userId: string): Promise<EraseCounts>;   // erasure.ts ; EraseError(code: 'not_found' | 'last_platform_admin')
export async function buildUserExport(db: Db, userId: string, now?: Date): Promise<UserExportV1 | null>;  // userExport.ts
export function exportFilename(now: Date): string;                               // 'geolens-export-YYYY-MM-DD.json'
export async function getPlatformOrgIds(db: Db): Promise<Set<string>>;           // repo.ts

// ═══ E — route DELETE /api/admin/users/:id ACTUELLE (~:1517-1532)
//   const target = await resolveTargetUser(admin, req.params.id, reply); if (!target) return;
//   if (target.id === admin.userId) return 400 « Vous ne pouvez pas supprimer votre propre compte. »   (INCHANGÉ)
//   await db.query('DELETE FROM auth_tokens …') ; ('DELETE FROM project_access …') ; ('DELETE FROM users …') ; await audit(db, admin, 'delete_user', target.email) ; return { ok: true }
// → CIBLE : let counts; try { counts = await eraseUser(db, target.id); } catch (e) {
//     if (e instanceof EraseError && e.code === 'last_platform_admin') return reply.code(409).send({ error: 'last_platform_admin', message: 'Impossible de supprimer le dernier administrateur plateforme.' });
//     if (e instanceof EraseError && e.code === 'not_found') return reply.code(404).send({ error: 'not_found', message: 'Utilisateur introuvable dans votre organisation.' });
//     app.log.error(e); return reply.code(500).send({ error: 'delete_failed', message: 'Échec de la suppression de l’utilisateur.' }); }
//   await audit(db, admin, 'delete_user', JSON.stringify({ userId: target.id, orgId: target.org_id, ...counts }));   // 0 email
//   return { ok: true } ; réécrire le commentaire au-dessus (« sans transaction » → effacement complet erasure.ts, D17)

// ═══ X — insérer AVANT la ligne `// ── Auth ───…` (~:292)
app.get('/api/me/export', { preHandler: requireAuth, config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (req, reply) => {
  // u = req.sessionUser! ; data = await buildUserExport(db, u.userId) ; null → 404 { error: 'not_found', message: 'Utilisateur introuvable.' }
  // await audit(db, u, 'export_me') ; reply.header('Content-Type', 'application/json; charset=utf-8')
  //   .header('Content-Disposition', `attachment; filename="${exportFilename(new Date())}"`).header('Cache-Control', 'no-store') ; return data
});

// ═══ C — GET /api/admin/organizations (~:1820) : ajouter contract_end_at au SELECT de orgsR et à son type ;
//   item : contractEndAt: toIsoDate(o.contract_end_at)   — helper local : (v: unknown) => v == null ? null : (v instanceof Date ? v : new Date(String(v))).toISOString().slice(0, 10)
// C — route NEUVE, insérée juste APRÈS le PATCH '/api/admin/organizations/:id' (~:1873-1888) :
app.patch<{ Params: { id: string }; Body: { contractEndAt?: string | null } }>('/api/admin/organizations/:id/contract', { preHandler: requirePlatformAdmin }, async (req, reply) => {
  // d = req.body?.contractEndAt ; valide ⇔ d === null OU (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T00:00:00.000Z`).toISOString().slice(0, 10) === d)
  //   sinon 400 { error: 'bad_request', message: 'Champ `contractEndAt` : date AAAA-MM-JJ ou null.' }
  // org absente → 404 { error: 'not_found', message: 'Organisation introuvable.' }
  // d !== null && (await getPlatformOrgIds(db)).has(id) → 400 { error: 'platform_org', message: 'Pas de fin de contrat pour l’organisation GeoLens.' }
  // UPDATE organizations SET contract_end_at = $1 WHERE id = $2   ($1 = d ? `${d}T00:00:00.000Z` : null)
  // await audit(db, admin, 'org_contract_end', `${id} -> ${d ?? 'null'}`) ; return { ok: true, organization: { id, contractEndAt: d } }
});
```
Cas de test :
- user-erasure-route : org_admin supprime un membre de son org (avec accès projet + audit le citant) → 200 ; ligne audit 'delete_user' detail JSON sans l'email ; `audit_log.detail LIKE '%email%'` → 0 · admin supprime lui-même → 400 · org_admin rival sur membre d'une autre org → 404 · 409 : un org_admin (non plateforme) de l'org démo supprime l'admin démo, seul admin plateforme → 409 last_platform_admin, compte intact (si resolveTargetUser l'interdit avant : constater le statut obtenu et le noter)
- me-export : membre connecté → 200, Content-Disposition `attachment; filename="geolens-export-YYYY-MM-DD.json"`, Cache-Control no-store, corps format 'geolens-user-export', ∌ password_hash/token_hash/session_version ; auditLog = moi seul ; anonyme → 401 ; ligne audit 'export_me' ; `makeTestApp({ RATE_LIMIT: '1' })` → 6ᵉ appel dans l'heure → 429
- org-contract : admin plateforme PATCH org rival '2026-12-31' → 200 ; GET /api/admin/organizations → contractEndAt '2026-12-31' ; null → efface ; '2026-13-40' → 400 ; org_admin → 403 ; org inconnue → 404 ; org de l'admin plateforme → 400 platform_org ; audit 'org_contract_end'

## Décisions actées
- effacement complet + audit sans email — decisions.md D17
- export 5/h, attachment, no-store ; fin de contrat = admin plateforme seul — D17
- logique dans les modules, server.ts = appels

## Hors périmètre
- erasure.ts, userExport.ts, projectTeardown.ts (livrés : ne pas modifier ; défaut trouvé → BLQ avec repro)
- rétention (lot suivant) ; web (livré T052)
- modifier un test existant ; si un test existant casse (ex. assertion sur detail 'delete_user' = email) → BLQ avec nom:ligne + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals) ; rate-limit actif seulement avec RATE_LIMIT=1
- G sous git ; HEAD = commits T053-T055 ; SEUL écrivain de server.ts ; arbre propre au départ

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T056
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
