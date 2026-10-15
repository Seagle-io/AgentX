---
pack: T057
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T057 — D15-R : rétention planifiée (audit 12 mois, comptes 3 ans, livrables fin de contrat + 1 an)

> Seule source de vérité de l'agent T057. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer `api/src/retention.ts` (3 purges + passe + planificateur in-process), sa configuration dans `config.ts` (modes off|report|enforce, durées, plafonds, garde prod) et l'appel du planificateur dans `server.ts`, avec garde-fous : défaut non destructif (`report`), livrables jamais en `enforce` sans clé dédiée, exclusions plateforme, plafonds par passe, journalisation avant suppression. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `config.ts` : `AppConfig.retention` + parsing + règle productionProblems (contrat)
- [ ] `api/src/retention.ts` NEUF = contrat verbatim
- [ ] `server.ts` : import + `startRetentionScheduler(app, { db, storage: app.storage, log: app.log, cfg: config.retention });` juste après le bloc `sweepTimer` / `addHook('onClose', … clearInterval(sweepTimer) …)` (~:2426-2430) ; 0 autre ligne
- [ ] `.env.production.example` : bloc RETENTION commenté (contrat)
- [ ] server.ts ~:463 `const LEGAL_DOCS_VERSION = '2026-06-29';` → `'2026-10-08'` (politique de confidentialité réécrite le 2026-10-08, T058) — seule autre ligne server.ts autorisée
- [ ] `api/test/retention.test.ts` + `api/test/retention-config.test.ts` NEUFS : cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts — sorties collées
- [ ] `git -C G diff --stat -- api .env.production.example` + `git -C G status --short api` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/retention.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | AppConfig :8-100 ; intIn :146 ; loadConfig ; productionProblems :272-296 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | imports + ~:2426-2430 (ancre `const sweepTimer`) + ~:463 LEGAL_DOCS_VERSION |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | + bloc RETENTION |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/retention.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/retention-config.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/erasure.ts` | L | eraseUser, EraseError (T054) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/projectTeardown.ts` | L | teardownProject, ProjectRef (T053) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/repo.ts` | L | getPlatformOrgIds, audit |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/prod-guard.test.ts` | L | modèle productionProblems (GEOLENS_ENV=production) |

## Contrats
```ts
// ═══ config.ts
// AppConfig + :
retention: { mode: RetentionMode; deliverablesMode: RetentionMode; auditDays: number; accountInactiveDays: number;
  deliverableGraceDays: number; maxUsersPerPass: number; maxProjectsPerPass: number; intervalMs: number };
// RetentionMode = 'off' | 'report' | 'enforce' (déclaré dans config.ts, ré-exporté/importé par retention.ts — éviter l'import circulaire)
// RETENTION_MODE absent/invalide → useMemDb ? 'off' : 'report'
// RETENTION_DELIVERABLES_MODE absent/invalide → mode === 'off' ? 'off' : 'report'   (JAMAIS 'enforce' hérité)
// intIn(v, def, min, max) existant :146 : RETENTION_AUDIT_DAYS (365, 30, 3650) · RETENTION_ACCOUNT_INACTIVE_DAYS (1095, 365, 3650) · RETENTION_DELIVERABLE_GRACE_DAYS (365, 30, 3650)
//   RETENTION_MAX_USERS_PER_PASS (20, 1, 500) · RETENTION_MAX_PROJECTS_PER_PASS (3, 1, 50) · RETENTION_INTERVAL_HOURS (24, 1, 168) × 3_600_000 → intervalMs
// productionProblems (:272) : RETENTION_MODE ou RETENTION_DELIVERABLES_MODE non vide ∉ {off,report,enforce} → push('RETENTION_MODE / RETENTION_DELIVERABLES_MODE invalide (off | report | enforce)')

// ═══ api/src/retention.ts (NEUF)
export type PurgeKind = 'audit' | 'accounts' | 'deliverables';
export interface RetentionDeps { db: Db; storage: StorageDriver; log: Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>; cfg: AppConfig['retention']; now?: () => Date }
export interface PurgeReport { purge: PurgeKind; mode: RetentionMode; cutoff: string; candidates: number; acted: number; ids: string[]; capped: boolean; errors: number }
export async function purgeAuditLog(d: RetentionDeps): Promise<PurgeReport>;
//   mode = cfg.mode ; cutoff = now − auditDays j (calcul JS, ISO ; 0 SQL `interval`) ; report : SELECT id FROM audit_log WHERE created_at < $1 → candidates ; enforce : DELETE FROM audit_log WHERE created_at < $1 → acted = rowCount ; ids = []
export async function purgeInactiveAccounts(d: RetentionDeps): Promise<PurgeReport>;
//   mode = cfg.mode ; cutoff = now − accountInactiveDays j ; SELECT id, org_id, last_login, created_at FROM users WHERE is_platform_admin = false
//   candidat ⇔ (last_login ?? created_at) < cutoff ET org_id ∉ await getPlatformOrgIds(db) ; tri plus ancien d'abord ; slice(0, maxUsersPerPass) → capped si tronqué ; ids = retenus
//   enforce : eraseUser(db, id) un par un ; EraseError / erreur SQL → errors++, log.error, continue ; acted = succès
export async function purgeExpiredDeliverables(d: RetentionDeps): Promise<PurgeReport>;
//   mode = cfg.deliverablesMode ; cutoff = now − deliverableGraceDays j
//   SELECT id FROM organizations WHERE contract_end_at IS NOT NULL AND contract_end_at < $1 ; − getPlatformOrgIds
//   par org : SELECT id, org_id, storage_prefix, name FROM projects WHERE org_id = $1 ORDER BY created_at ASC ; cumul, slice(0, maxProjectsPerPass) → capped
//   enforce : AVANT chaque suppression log.warn({ retention: 'deliverables', projectId, name, orgId, storagePrefix, cutoff }) puis teardownProject(db, storage, log, proj) ; échec → errors++ (continue)
//   jamais : projet org_id NULL, org secondaire via project_orgs (seul projects.org_id compte), org plateforme
export async function runRetentionPass(d: RetentionDeps): Promise<PurgeReport[]>;
//   ordre audit → accounts → deliverables ; purge dont le mode vaut 'off' → sautée ; try/catch par purge (log.error), JAMAIS throw
//   par purge exécutée : await audit(db, null, `retention_${purge}`, JSON.stringify({ mode, cutoff, candidates, acted, ids: ids.slice(0, 50), capped, errors }))
export const RETENTION_FIRST_DELAY_MS = 10 * 60 * 1000;
export function startRetentionScheduler(app: FastifyInstance, d: RetentionDeps): void;
//   cfg.mode === 'off' ET cfg.deliverablesMode === 'off' → return (0 timer) ; garde `running` anti-chevauchement
//   const t1 = setTimeout(tick, RETENTION_FIRST_DELAY_MS); t1.unref() ; const t2 = setInterval(tick, cfg.intervalMs); t2.unref() ; app.addHook('onClose', async () => { clearTimeout(t1); clearInterval(t2); })
// modules livrés : eraseUser(db, userId) / EraseError (erasure.ts) ; teardownProject(db, storage, log, { id, org_id, storage_prefix }) (projectTeardown.ts) ; getPlatformOrgIds(db) (repo.ts) ; audit(db, user|null, action, detail?) (repo.ts)
// server.ts ~:2426-2430 modèle : const sweepTimer = setInterval(...); sweepTimer.unref(); app.addHook('onClose', async () => { clearInterval(sweepTimer); });
```
```dotenv
# .env.production.example — bloc à ajouter
# Rétention RGPD (politique de confidentialité) : off | report (journalise, ne supprime rien) | enforce (supprime)
RETENTION_MODE=report                    # journaux d'audit > 12 mois, comptes inactifs > 3 ans
RETENTION_DELIVERABLES_MODE=report       # livrables > fin de contrat + 1 an — enforce = suppression DÉFINITIVE, décision humaine
# RETENTION_AUDIT_DAYS=365  RETENTION_ACCOUNT_INACTIVE_DAYS=1095  RETENTION_DELIVERABLE_GRACE_DAYS=365
```
Cas de test (now injecté via `d.now`) :
- retention.test : audit report → 0 supprimé, candidates = N vieux · audit enforce → lignes < cutoff supprimées, récentes conservées · comptes : last_login il y a 4 ans → candidat ; last_login NULL + created_at vieux → candidat ; récent → non · admin plateforme et membre de l'org plateforme → jamais · cap maxUsersPerPass=1 sur 3 candidats → acted 1, capped true · comptes enforce → eraseUser effectif (users absent) · livrables : org rival contract_end_at il y a 2 ans + 1 projet : deliverablesMode report → projet intact, candidates 1 ; enforce → projet supprimé + log.warn appelé avant (spy) · org plateforme datée → jamais ; projet org_id NULL → jamais · cap projets · une ligne audit `retention_<purge>` par purge exécutée · tous modes off → runRetentionPass ne crée aucune ligne audit
- retention-config.test : défaut sous pg-mem → mode 'off', deliverablesMode 'off' · DATABASE_URL posé (USE_MEM_DB=0) → 'report'/'report' · RETENTION_MODE=enforce seul → deliverablesMode 'report' · RETENTION_MODE='abc' + GEOLENS_ENV=production → productionProblems contient le message · startRetentionScheduler avec 2 modes off → 0 timer (spy setTimeout/setInterval ou retour immédiat)

## Décisions actées
- défaut report (prod) / off (pg-mem) ; enforce livrables = clé dédiée, jamais héritée — decisions.md D17
- exclusions : admin plateforme + toute org d'un admin plateforme ; projets orphelins jamais ; plafonds par passe
- timer in-process, 1 seule instance API (compose scaleway) — à revoir si > 1 réplique
- 1er passage enforce = point de non-retour → décision humaine (ce lot n'active rien)

## Hors périmètre
- activer enforce où que ce soit (défauts = contrat) ; console Scaleway ; DEPLOYMENT.md
- erasure.ts, projectTeardown.ts, routes (livrés) — défaut trouvé → BLQ avec repro
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem (comparaison TIMESTAMPTZ < param ISO : à prouver par les tests) ; `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals)
- G sous git ; HEAD = commit T056 ; SEUL écrivain de server.ts et config.ts ; arbre propre au départ

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T057
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
