---
pack: T043
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T043 — Correctifs API finaux : verrou from-upload, GEOLENS_ENV normalisé, admin atomique, valeurs d'exemple

> Seule source de vérité de l'agent T043. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger T041 D1-D3 + 2 trous de la garde (R1 entropie, R2/R3 valeurs d'exemple) dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online, chacun avec un test de non-régression qui échoue sur HEAD, sans faire grossir `server.ts`.

## Definition of Done
- [ ] D1 server.ts from-upload : les 6 champs texte lus via `bodyStr` AVANT `entry.publishing = true` (:2811) ; test : analyze puis from-upload `{uploadId, ondulation:49, name:{a:1}}` → 2xx (champ ignoré) ou 400, jamais 500 ; puis même uploadId `name:'ok'` → jamais 409 already_publishing dû au 1ᵉʳ appel ; `equipment:123`, `crs:{toString:1}` → jamais 500
- [ ] `rg -n "req\.body\?\.[a-zA-Z]+ \?\? ''" api/src/server.ts` → ∅ (testé à blanc sur HEAD : 6 hits :2822-2834)
- [ ] D2 config.ts : `GEOLENS_ENV` `Production`, `' production'`, `PRODUCTION` → garde active (≥ 1 problème avec config de dev)
- [ ] D3 create-platform-admin.ts : 2 appels concurrents même email + org neuve → 1 succès, 1 `Error('email déjà utilisé')`, exactement 1 org créée ; email pris (séquentiel) → même message, 0 org créée
- [ ] R1 : secret de ≥ 32 car. avec < 10 caractères distincts (`'a'×32`, `'ab'×20`) → problème ; `openssl rand -hex 48` (96 hex) → OK
- [ ] R2 : `DATABASE_URL` d'exemple (`postgresql://USER:PASSWORD@HOTE:5432/geolens?sslmode=require`) → problème ; R3 : `S3_BUCKET=__X__` → problème
- [ ] tests dans `api/test/prod-guard.test.ts` (ajouts) et `api/test/hardening-t043.test.ts` (NEUF, D1) ; KO sur HEAD prouvé (lancés avant édition de src)
- [ ] `git -C G diff --stat -- api/src/server.ts` : insertions ≤ suppressions + 0 ; `npm --prefix api run typecheck` exit 0 ; `npm --prefix api test` vert (≥ 667 + nouveaux)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | from-upload :2780-2840 seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | productionProblems :257-294 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/scripts/create-platform-admin.ts` | E | createPlatformAdmin :22-42 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/prod-guard.test.ts` | E | ajouts R1, R2, R3, D2, D3 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/hardening-t043.test.ts` | E | NEUF, D1 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/bodyField.ts` | L | bodyStr |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/db.ts` | L | transaction :16-21, :34, :73 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/hardening-t037.test.ts` | L | modèle de test HTTP |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/upload-direct.test.ts` | L | modèle analyze → uploadId → from-upload, MINI_TILESET |

## Contrats
```ts
// bodyField.ts : export function bodyStr(v: unknown): string  // typeof v === 'string' ? v : ''
// db.ts:21 : transaction<T>(fn: (tx: Pick<Db, 'query'>) => Promise<T>): Promise<T>   // BEGIN/COMMIT, ROLLBACK si fn lève ; pg-mem OK
// server.ts:270 (à recopier dans le script, pas d'import de server.ts) :
const isUniqueViolation = (e: unknown): boolean => {
  const err = e as { code?: string; message?: string };
  return err?.code === '23505' || /unique|duplicate/i.test(err?.message ?? '');
};
// pg-mem : ON CONFLICT non fiable (repo.ts:45, seed.ts:16) → ne pas l'utiliser
// schema.ts:57 : users.email TEXT NOT NULL UNIQUE ; organizations.name sans unicité (pas de migration)

// ═══ D1 — server.ts from-upload, ACTUEL :2811 puis :2822-2834
entry.publishing = true;               // :2811
const formName = (req.body?.name ?? '').trim();
description: (req.body?.description ?? '').trim() || undefined,
interventionDate: (req.body?.interventionDate ?? '').trim() || undefined,
equipment: (req.body?.equipment ?? '').trim() || undefined,
coordinateSystem: (req.body?.crs ?? '')?.toString().trim() || null,
model: (req.body?.geoidModel ?? '').trim() || 'RAF20',
// CIBLE : 1 lecture bodyStr par champ placée avant :2811 (aucun await entre garde et verrou conservé), expressions remplacées sur place

// ═══ D2 — config.ts:262
// ACTUEL : if (env.GEOLENS_ENV !== 'production') return [];
// CIBLE  : if (env.GEOLENS_ENV?.trim().toLowerCase() !== 'production') return [];   // = worker/geolens_worker/secret.py:30

// ═══ R1/R2/R3 — config.ts productionProblems
// R1 + : new Set(s).size < 10
// R2 + : /USER:PASSWORD@|@HOTE[:/]/.test(cfg.databaseUrl ?? '')
// R3 + : PLACEHOLDER_RE.test(env.S3_BUCKET?.trim() ?? '')

// ═══ D3 — createPlatformAdmin : contrôles e/nom inchangés, puis
return db.transaction(async (tx) => {
  // SELECT org par nom ; absente → INSERT org ; INSERT user ; isUniqueViolation → throw new Error('email déjà utilisé') (ROLLBACK → org annulée)
});
// pré-contrôle SELECT 1 FROM users WHERE email : conservé ou retiré, message identique dans tous les cas
// 2 emails différents + même org neuve en concurrence → 2 orgs homonymes : HP (pas d'unicité de nom sans migration), constater seulement
```

## Décisions actées
- garde GEOLENS_ENV=production, normalisée comme le worker — decisions.md D12
- server.ts ne grossit pas — règle G 3 ; 0 migration — HP sans accord humain

## Hors périmètre
- unicité de organizations.name (migration) ; autres routes de server.ts ; :2136 query.search
- web/, worker/, e2e/, infra
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean ; npm install

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; G HEAD `2cda47a`, arbre propre ; suite 75 fichiers 667 tests
- en parallèle : T042 (vérificateur docker, image déjà construite, port 4100) — 0 fichier commun ; ne pas lancer docker
- règle G : fonction ≤ 60 l, 0 `any`, 0 `@ts-ignore`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npx --prefix api vitest run --root api, npm --prefix api test, npm --prefix api run typecheck, rg, wc, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T043
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
