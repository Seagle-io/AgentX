---
pack: T003
projet: geolens-charge-3d
role: eclaireur
cree: 2026-10-12
---

# Pack T003 — Lister les DDL de migrate() et leur risque

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Lister chaque DDL que `migrate()` (G/api/src/schema.ts:223) jouera au redémarrage de l'API du serveur de test, avec son risque pour une base réelle → l'humain valide la liste avant redéploiement ; 0 écriture, 0 exécution.

G = `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online`

## Definition of Done
- [ ] tableau 1 ligne/DDL : `schema.ts:L` · DDL verbatim (≤ 1 ligne, tronqué `…`) · idempotent (IF NOT EXISTS / no-op) oui/non · nature (ADD COLUMN / CREATE TABLE / CREATE INDEX / ALTER … DROP NOT NULL / UPDATE / DELETE / DROP / autre) · verrou de table (ACCESS EXCLUSIVE ? durée ≈ instantané / réécriture de table)
- [ ] compter et nommer tout DDL ou DML destructif : DROP, DELETE, TRUNCATE, UPDATE de masse, ALTER TYPE, SET NOT NULL sur colonne peuplée → `∅` explicite si aucun
- [ ] backfills (UPDATE/INSERT … SELECT) dans migrate*, migratePackEntitlements :281, migrateProjectProvenance :256 : table, condition WHERE, lignes touchées (borne)
- [ ] comportement en cas d'échec d'un DDL : toléré (try/catch) ou boot arrêté ? `schema.ts:L`
- [ ] diff avec la version du serveur : `ssh -p 34522 geo-test@82.65.97.67 'cat ~/geolens-web/api/src/schema.ts'` → 1 seule connexion ; DDL présents dans G et absents du serveur = « nouveaux » ; si ssh KO → NV, tous traités comme nouveaux
- [ ] verdict 1 ligne : « 0 perte de données possible » ou liste des DDL à risque
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture seule (seul `result.md` écrit).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | 308 l, migrate :223-308 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | Db.query, :72 rollback |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | :150-170 appel migrate au boot |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userLayers.ts` | L | :70-110 index « comme migrate() » |

## Contrats
```
server.ts:159  await migrate(db);
schema.ts:223  export async function migrate(db: Db): Promise<void> {
schema.ts:242    await migratePackEntitlements(db);
schema.ts:243    await migrateProjectProvenance(db);
schema.ts:256  export async function migrateProjectProvenance(db: Db): Promise<void> {
schema.ts:281  export async function migratePackEntitlements(db: Db): Promise<void> {
```
`rg -n "migrate\w*\(" api/src` : seuls appelants = server.ts:159 + schema.ts:242-243.

## Décisions actées
- redéploiement API accordé APRÈS validation de cette liste par l'humain — D1
- base du serveur de test = données réelles : 0 écriture destructive — D25 geolens-viewer

## Hors périmètre
- serveur de test : AUCUNE commande autre que le `cat` de schema.ts ci-dessus ; 0 psql, 0 docker, 0 lecture de `.env`, 0 affichage d'identifiant
- toute édition de G, tout commit
- proposer une refonte des migrations

## Environnement
- ssh : hôte `[82.65.97.67]:34522` déjà dans known_hosts ; connexions rapprochées → port coupé → 1 seule tentative, `-o BatchMode=yes -o ConnectTimeout=15`
- serveur `~/geolens-web` = copie sans git, plus ancienne que G
- G : git local master, HEAD da5fced

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Bash(rg:*, wc:*, ssh: la seule commande ci-dessus, diff), Write (result.md seul)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 100 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Livré
- tableau DDL · destructifs · backfills · échec · diff serveur · verdict
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
