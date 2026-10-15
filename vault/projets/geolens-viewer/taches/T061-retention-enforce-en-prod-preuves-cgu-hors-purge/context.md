---
pack: T061
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T061 — Rétention enforce en prod, preuves CGU hors purge, effacement sans LIKE (D18)

> Seule source de vérité de l'agent T061. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Appliquer D18 dans G : (1) `.env.production.example` passe `RETENTION_MODE=enforce` (livrables restent `report`), (2) la purge d'audit 12 mois n'efface jamais les lignes `accept_invite`, (3) l'effacement ne passe plus par `LIKE` (incompatible `\` sous Postgres) mais par sélection des `detail` non NULL + filtre JS exact, `likeEscape` retiré, (4) la page Confidentialité mentionne la conservation des preuves d'acceptation. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `.env.production.example:52` → `RETENTION_MODE=enforce` + commentaire contrat ; ligne `RETENTION_DELIVERABLES_MODE=report` inchangée
- [ ] retention.ts purgeAuditLog : les 2 requêtes (:39, :42) excluent `action = 'accept_invite'` (contrat)
- [ ] erasure.ts étape 7 : 0 `LIKE` ; `likeEscape` supprimé ; `rg -n "LIKE|likeEscape" api/src/erasure.ts` → ∅
- [ ] d15-fixes.test.ts : le cas `likeEscape` (seul usage, test créé par T060 dans ce projet) supprimé — seule modification autorisée de ce fichier
- [ ] Confidentialite.tsx tableau « 6. Durées » : + 1 ligne contrat après la ligne Journaux
- [ ] `api/test/d18-retention.test.ts` NEUF : 4 cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 89 / 769) ; `npm --prefix web run typecheck` → exit 0 — sorties collées
- [ ] `git -C G diff --stat` collé : 5 fichiers + 1 test neuf
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | E | :50-54 bloc RETENTION |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/retention.ts` | E | purgeAuditLog :35-45 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/erasure.ts` | E | étape 7 :80-95, likeEscape :104-108 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/d15-fixes.test.ts` | E | retirer le seul cas likeEscape |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Confidentialite.tsx` | E | tableau :104-108 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/d18-retention.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/retention.test.ts` | L | modèle deps (now injecté, cfg) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/erasure-unit.test.ts` | L | modèle fixtures |

## Contrats
```ts
// ═══ retention.ts purgeAuditLog ACTUEL (:39, :42)
acted = (await d.db.query('DELETE FROM audit_log WHERE created_at < $1', [cutoff])).rowCount;
candidates = (await d.db.query('SELECT id FROM audit_log WHERE created_at < $1', [cutoff])).rows.length;
// → CIBLE : `… WHERE created_at < $1 AND action <> 'accept_invite'` sur les 2 (preuve CGU conservée tant que le compte existe ; l'effacement la pseudonymise déjà : étape 6 met user_id/ip/user_agent/detail à NULL)

// ═══ erasure.ts étape 7 ACTUELLE (:82-93) : pour needle ∈ [email, userId] : SELECT id, detail FROM audit_log WHERE detail LIKE '%needle%' + filtre JS includes
// → CIBLE : 1 seule requête `SELECT id, detail FROM audit_log WHERE detail IS NOT NULL` (dans la tx) ;
//   par ligne : d2 = detail ; pour needle ∈ [email, userId] si d2.includes(needle) → d2 = d2.split(needle).join(ERASED_LABEL) ;
//   d2 !== detail → UPDATE audit_log SET detail = $2 WHERE id = $1 ; auditScrubbed = nb de lignes modifiées
//   commentaire : « 0 LIKE : Postgres traite \ comme échappement par défaut, pg-mem refuse ESCAPE (D18) ; volume borné par la purge 12 mois »
// supprimer export function likeEscape (:104-108) + son cas dans d15-fixes.test.ts
```
```dotenv
# .env.production.example:52 — CIBLE
RETENTION_MODE=enforce                   # supprime chaque jour : journaux d'audit > 12 mois (hors preuves d'acceptation CGU), comptes sans connexion > 3 ans
```
```jsx
{/* Confidentialite.tsx — ligne ajoutée après la ligne « Journaux de connexion / audit » */}
<tr><td>Preuve d'acceptation des CGU (date, version, adresse IP)</td><td>Durée du compte, puis pseudonymisée à sa suppression</td></tr>
```
Cas d18-retention.test.ts (now injecté) :
- audit enforce : 3 lignes vieilles de 800 j dont 1 `accept_invite` → 2 supprimées, la ligne accept_invite reste
- audit report : candidates exclut accept_invite
- eraseUser d'un user dont l'email contient `\` (`a\b@x.fr`, inséré en SQL direct) cité dans le detail d'un audit d'autrui → detail ∌ email, contient '[utilisateur supprimé]'
- eraseUser : ligne accept_invite de l'user → user_id/detail/ip NULL (pseudonymisée)

## Décisions actées
- D18 : enforce journaux + comptes en prod ; livrables report ; preuves CGU hors purge ; 0 LIKE dans l'effacement

## Hors périmètre
- livrables enforce ; config.ts (défauts du code inchangés : off pg-mem / report DB réelle — le .env de prod décide)
- autres tests existants ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api vitest + pg-mem ; `npm --prefix api test` ; typecheck api (noUnusedLocals) et web
- G sous git, HEAD 341b4a1, arbre propre ; seul agent sur G

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npm --prefix web run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T061
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
