---
pack: T013
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-13
---

# Pack T013 — Effets de bord runtime de la nouvelle API sur le serveur de test

> Seule source de vérité de l'agent T013. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dire si l'API de G (HEAD edb565f) démarre sur le serveur de test avec son env actuel, et lister toute écriture base/MinIO qu'elle ferait au boot ou périodiquement, hors DDL D4 ; rendre l'env minimal pour un boot sans écriture. Lecture seule.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online` · S = `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13` (copie locale du serveur, API du 22/09)

## Definition of Done
- [ ] Q1 : chaque `problems.push` de `productionProblems` (config.ts:324-347) → passe | échoue | inconnu, avec la valeur serveur qui décide (S/srv-env-non-secret.txt)
- [ ] Q1 : `rg -n "NODE_ENV" G/api/src` → chaque usage hors tests et son effet en prod
- [ ] Q2 : tableau des jobs boot + périodiques (sweepOrphans, pruneAnalyze, retention, autres trouvés) : déclencheur · cible (table/préfixe S3) · opération (SELECT/INSERT/UPDATE/DELETE/DeleteObject) · présent dans l'API S oui/non
- [ ] Q2 : retention.ts avec `RETENTION_MODE` absent (→ 'report' car base réelle, config.ts:220) : écriture base ou S3 effectuée ? oui/non + ligne ; idem `RETENTION_MODE=off` → scheduler démarré ? aucune requête ?
- [ ] Q3 : écritures base au boot hors migrate (server.ts:145-245) : seed (seedDemo), admin, autre → liste avec ligne
- [ ] Q4 : `users.session_version` (session.ts) : sessions/cookies existants encore valides après redéploiement ? oui/non + ligne
- [ ] bloc « env à ajouter » final : clés+valeurs (aucun secret) pour boot OK + 0 écriture hors D4 ; ce qui reste impossible par env seul, dit clairement
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/index.ts` | L | 17 l, loadProductionSafeConfig |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | :130-150, :200-320, :324-360 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/retention.ts` | L | 154 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :145-245 boot, :2460-2510 jobs |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/ingest/orphanSweep.ts` | L | 57 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/session.ts` | L | 70 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/Dockerfile` | L | ENV NODE_ENV |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/api/src/server.ts` | L | :2395-2440 jobs API serveur |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/srv-env-non-secret.txt` | L | valeurs env non secrètes + compose |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/srv-test-2026-10-13/srv-env-keys-et-ls.txt` | L | noms des clés .env |

## Contrats
```ts
// G/api/src/index.ts
const config = loadProductionSafeConfig();   // throw 'Configuration de production invalide — démarrage refusé' si problems ≠ ∅
const app = await buildServer({ config, logger: true });
// config.ts (extraits)
if (!cfg.cookieSecure) problems.push('COOKIE_SECURE désactivé : cookie de session hors HTTPS');
if (!cfg.webOrigin.startsWith('https://')) problems.push('WEB_ORIGIN doit commencer par https://');
const retentionModeMain = retentionMode(env.RETENTION_MODE) ?? (useMemDb ? 'off' : 'report');
// server.ts:2497-2505
void sweepOrphans(); // AU BOOT
const sweepTimer = setInterval(() => { void pruneAnalyze(); void sweepOrphans(); }, SWEEP_INTERVAL_MS);
startRetentionScheduler(app, { db, storage: app.storage, log: app.log, cfg: config.retention });
```
Serveur : `NODE_ENV=production` (Dockerfile) · `WEB_ORIGIN=http://82.65.97.67` · `COOKIE_SECURE=0` · site servi en http sur :34580.

## Décisions actées
- DDL D4 (4 ADD COLUMN + 2 CREATE INDEX) accepté — D11 ; tout le reste = à signaler
- BDD du serveur de test : 0 écriture destructive, 0 modification hors D4 (règle humain)
- HTTPS sur le serveur de test : hors lot, ne pas proposer de certificat

## Hors périmètre
- toute édition ; ssh ; accès base ; G/web, k6, Caddy (T014)
- proposer un patch de code : seulement nommer le point (fichier:ligne) si l'env ne suffit pas

## Environnement
- node 22, Postgres 16, MinIO ; API S = copie sans git du 22/09 ; `rg` dispo
- `.env` serveur : valeurs secrètes jamais copiées, seules les clés non secrètes sont en S

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg, sed -n, diff sur G et S), Write (result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T013
statut: fait | bloque
---
## Livré
- Q1..Q4 : faits chemin:ligne → conclusion
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : verdict boot, écritures hors D4, bloc env à ajouter. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
