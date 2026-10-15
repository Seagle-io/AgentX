---
pack: T060
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T060 — Correctifs D15 : id effacé dans l'audit d'autrui, emails tiers dans l'export, bornes date contrat, LIKE échappé

> Seule source de vérité de l'agent T060. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les défauts techniques du vérificateur T059 : (D3) l'effacement remplace aussi l'id de l'utilisateur effacé dans le `detail` d'audit d'autrui, (LIKE) recherche insensible aux caractères spéciaux `\ % _`, (D2) l'export masque les emails de tiers présents dans le `detail` de ses propres lignes d'audit, (date) borne l'année de fin de contrat, (texte) retire « Nom » de la page Confidentialité ; tests neufs. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] erasure.ts étape 7 = contrat (email ET userId, motif LIKE échappé)
- [ ] userExport.ts : detail des lignes auditLog passé par `maskThirdPartyEmails` (contrat)
- [ ] server.ts route contrat : année hors [2000, 2200] → 400 bad_request (même message) ; 0 autre ligne
- [ ] Confidentialite.tsx:51 : « Nom, adresse e-mail professionnelle » → « Adresse e-mail professionnelle »
- [ ] `api/test/d15-fixes.test.ts` NEUF : 6 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 88 / 763) ; `npm --prefix web run typecheck` → exit 0 — sorties collées
- [ ] `git -C G diff --stat` collé : 4 fichiers + 1 test neuf
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/erasure.ts` | E | étape 7 :81-90 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/userExport.ts` | E | auditLog :48-51 + mapping |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | route `/api/admin/organizations/:id/contract` validation ~:1899-1903 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Confidentialite.tsx` | E | :51 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/d15-fixes.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/erasure-unit.test.ts` | L | modèle fixtures effacement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/user-export-unit.test.ts` | L | modèle fixtures export |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |

## Contrats
```ts
// ═══ erasure.ts étape 7 ACTUELLE (:81-90)
const cited = await tx.query<{ id: string; detail: string | null }>('SELECT id, detail FROM audit_log WHERE detail LIKE $1', ['%' + email + '%']);
for (const row of cited.rows) { if (!row.detail || !row.detail.includes(email)) continue;
  await tx.query('UPDATE audit_log SET detail = $2 WHERE id = $1', [row.id, row.detail.split(email).join(ERASED_LABEL)]); auditScrubbed++; }
// → CIBLE : pour chaque needle ∈ [email, userId] :
//   motif = '%' + likeEscape(needle) + '%' ; SQL `… WHERE detail LIKE $1 ESCAPE '\'` (si pg-mem refuse ESCAPE : sans ESCAPE + filtre JS includes, comportement identique sur ces données ; le noter)
//   filtre JS exact detail.includes(needle) ; detail = detail.split(needle).join(ERASED_LABEL) ; 1 UPDATE par ligne modifiée (cumul email puis id sur la même ligne)
//   auditScrubbed = nombre de lignes distinctes modifiées
function likeEscape(s: string): string;   // remplace \ par \\, % par \%, _ par \_
// sources de l'id dans detail d'autrui : grant_access `"<userId> -> <projet>"` (server.ts ~:1717, ~:1740), delete_user JSON { userId } (~:1520), retention_accounts ids (retention.ts:126)
// NB : la ligne 'delete_user' écrite APRÈS eraseUser par la route conserve { userId } — c'est la trace de l'action, voulue (id technique pseudonyme) : NE PAS la modifier

// ═══ userExport.ts — CIBLE
/** remplace toute adresse email ≠ ownEmail (insensible à la casse) par '[adresse masquée]' ; null → null */
export function maskThirdPartyEmails(detail: string | null, ownEmail: string): string | null;
//   regex email : /[^\s"'<>(),;:]+@[^\s"'<>(),;:]+\.[^\s"'<>(),;:]+/g
// auditLog[i].detail = maskThirdPartyEmails(row.detail, user.email)
// fuite constatée T059 : admin fait reset-password d'un membre → audit de l'admin detail = email du membre → export de l'admin contenait cet email

// ═══ server.ts route contrat — après le calcul de `valid`, ajouter : année = Number(d.slice(0, 4)) ∉ [2000, 2200] → invalide (même 400)
// constat T059 : '0000-01-01' → 200 sous pg-mem, 500 probable sur Postgres (pas d'an 0)
```
Cas d15-fixes.test.ts :
- grant_access d'un membre X par l'admin (route existante d'accès projet) puis eraseUser(X) → `SELECT count(*) FROM audit_log WHERE action = 'grant_access' AND detail LIKE '%<id X>%'` → 0 ; detail contient '[utilisateur supprimé]'
- email avec `%` et `_` (`a%b_c@x.fr`, inséré en SQL direct) cité dans un audit d'autrui + un autre email `axbyc@x.fr` cité ailleurs → eraseUser du premier : seule sa ligne est modifiée
- likeEscape('a\\b%c_d') → 'a\\\\b\\%c\\_d'
- maskThirdPartyEmails('reset membre@x.fr par admin@x.fr', 'admin@x.fr') → 'reset [adresse masquée] par admin@x.fr' ; casse : 'ADMIN@x.fr' conservé pour ownEmail 'admin@x.fr' ; null → null
- export de l'admin après reset-password d'un membre (route admin existante) → JSON ∌ email du membre
- PATCH contrat '0000-01-01' → 400 ; '1999-12-31' → 400 ; '2026-12-31' → 200

## Décisions actées
- id technique remplacé comme l'email dans l'audit d'autrui ; trace 'delete_user' { userId } conservée (preuve de l'action)
- export : données d'autrui masquées, pas supprimées — la ligne reste la sienne
- années de contrat 2000-2200

## Hors périmètre
- modes de rétention par défaut, texte des durées (décision humaine en cours) ; organizations.contact_email
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem (ESCAPE en LIKE : à prouver par le test) ; `npm --prefix api test` ; typecheck api (noUnusedLocals) et web
- G sous git, HEAD f42728b, arbre propre ; seul agent sur G

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npm --prefix web run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T060
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
