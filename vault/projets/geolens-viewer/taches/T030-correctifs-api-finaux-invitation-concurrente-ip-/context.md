---
pack: T030
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T030 — Correctifs API finaux : invitation concurrente, IP d'audit, entrées robustes, jeton reset atomique (D1-D6 T028)

> Seule source de vérité de l'agent T030. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 6 défauts du vérificateur T028 dans G/api : invitation concurrente → 409 (pas 500), IP d'audit = `req.ip`, `normalizeEmail` robuste (non-string, caractères de contrôle/invisibles), mdp compté en points de code, `TRUST_PROXY` validé sans dépendance (rejette 0.0.0.0/0 et préfixes trop larges), jeton reset/invite consommé atomiquement. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] D1-D6 corrigés selon contrats ; chacun cité fichier:ligne dans result.md
- [ ] `api/test/final-fixes.test.ts` NEUF : 1 cas par défaut + cas listés, verts
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 72 fichiers / 622 tests) — sorties collées
- [ ] `git -C G diff --stat` (HEAD e5abacb = tout l'antérieur) collé : seuls fichiers WL E
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | E | :455-470 reset · :480-500 accept-invite · :1555-1575 invitations ; 0 autre ligne |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/emailSchema.ts` | E | 17 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/passwordPolicy.ts` | E | 14 l |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | E | proxyList :138-148 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tokens.ts` | E | + claimToken après :57-59 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/final-fixes.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/input-policy.test.ts` | L | modèle (inject, captureMailer, RATE_LIMIT) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/helpers.ts` | L | makeTestApp, login |

## Contrats
```ts
// ═══ D1 — server.ts ~:1564 invitations, ACTUEL (non protégé ; course → 500)
await db.query('INSERT INTO users (id, org_id, email, password_hash, role, status) VALUES ($1,$2,$3,$4,$5,$6)', [id, targetOrgId, email, '', role, 'pending']);
// → try { …INSERT… } catch (e) { if (isUniqueViolation(e)) return reply.code(409).send(EMAIL_UNAVAILABLE); throw e; }
// isUniqueViolation existe server.ts:269 ; modèle identique server.ts:1401 (création admin)

// ═══ D3 — server.ts ~:496-497 accept-invite, ACTUEL (XFF brut, contourne trustProxy)
const xff = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
const clientIp = (xff.split(',')[0] || '').trim() || req.ip || '?';
// → const clientIp = req.ip || '?';   (+ commentaire : req.ip honore TRUST_PROXY, D10)

// ═══ D6 — tokens.ts, NEUF à côté de consumeToken (:57-59 inchangé)
/** Consomme le jeton ssi encore libre ; true = ce appel l'a obtenu. */
export async function claimToken(db: Db, tokenId: string): Promise<boolean>; // UPDATE auth_tokens SET used_at = now() WHERE id = $1 AND used_at IS NULL → rowCount === 1
// server.ts reset-password (~:463-465) et accept-invite (~:492-494) : après findValidToken,
//   if (!(await claimToken(db, valid.tokenId))) return reply.code(400).send(<même corps invalid_token que la ligne précédente>);
//   PUIS setPasswordAndRevoke(...) ; supprimer l'appel consumeToken(db, valid.tokenId) devenu redondant sur ces 2 routes

// ═══ D2 — emailSchema.ts normalizeEmail, CIBLE
// typeof v !== 'string' → null ; puis trim + toLowerCase ; null si vide, > EMAIL_MAX, ≠ EMAIL_RE,
//   ou contient /[\u0000-\u001f\u007f ​-‏ - ⁠﻿]/ (contrôle, espaces/zéro-largeur)
export function normalizeEmail(v: unknown): string | null;

// ═══ D5 — passwordPolicy.ts : longueur = [...pw].length (points de code), bornes inchangées 8..256

// ═══ D4 — config.ts proxyList, CIBLE — 0 dépendance (node:net seulement ; @fastify/proxy-addr = transitif, NE PAS importer)
import { isIP } from 'node:net';
// entrée valide ⇔ ∈ {loopback, linklocal, uniquelocal}
//   OU isIP(e) ≠ 0
//   OU e = ip/p avec isIP(ip) = 4 ET entier 8 ≤ p ≤ 32, ou isIP(ip) = 6 ET entier 16 ≤ p ≤ 128
// ≥ 1 entrée invalide → false (fail-closed) ; liste vide → false
function proxyList(v: string | undefined): string[] | false;
```
Cas final-fixes.test.ts :
- D1 : `Promise.all` 2 POST /api/admin/invitations même email (mailer capturé) → statuts {201, 409}, 0 × 500 ; 409 body === EMAIL_UNAVAILABLE
- D3 : accept-invite sans TRUST_PROXY, header `x-forwarded-for: 6.6.6.6` → ligne audit ∌ `6.6.6.6` (lire audit_log via app.db)
- D2 : POST /api/auth/forgot-password `{ email: { toString: 1 } }` → 200 (même corps que email inconnu) ; normalizeEmail('a​@b.fr') → null ; normalizeEmail('a@b.fr\u0000') → null ; normalizeEmail(42) → null ; normalizeEmail(' A@B.fr ') → 'a@b.fr'
- D5 : passwordProblem('😀'.repeat(4)) → message ; '😀'.repeat(8) → null
- D4 : loadConfig TRUST_PROXY : '0.0.0.0/0' → false · '999.1.1.1' → false · '10.0.0.0/99' → false · ':' → false · '0.0.0.0/1,128.0.0.0/1' → false · '10.0.0.0/8,uniquelocal' → liste · '::1' → ['::1']
- D6 : `Promise.all` 2 POST /api/auth/reset-password même token, mdp différents → statuts {200, 400}

## Décisions actées
- 0 nouvelle dépendance — node:net suffit
- préfixe min /8 (v4), /16 (v6) — refuse « tout faire confiance »
- jeton réclamé AVANT écriture du mdp — usage unique atomique
- nodemailer 10.x, audit fix transitifs : HP — décision humaine (D8, D10)

## Hors périmètre
- package.json / lock / npm ; Caddyfile ; web/
- autres routes ; consumeToken (gardé pour les autres appelants)
- modifier un test existant ; si un test existant casse → BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules (fastify 5.12.5) ; vitest + pg-mem (UPDATE … rowCount OK, RETURNING OK)
- `npm --prefix api test` ; `npm --prefix api run typecheck` (noUnusedLocals) ; ciblé `npx --prefix api vitest run --root api test/final-fixes.test.ts`
- G sous git : HEAD e5abacb, arbre propre au départ ; seul agent sur G

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix api test, npm --prefix api run typecheck, npx vitest, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T030
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
