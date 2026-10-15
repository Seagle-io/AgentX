---
pack: T072
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T072 — API : nodemailer 10 + npm audit fix (prod), tests verts (D23)

> Seule source de vérité de l'agent T072. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Fermer les vulnérabilités npm restantes de G/api : monter nodemailer en ^10.0.16 puis lancer `npm audit fix` sans `--force`, adapter `api/src/mailer.ts` seulement si l'API de nodemailer 10 l'exige, prouver suite verte ; en cas d'échec non corrigeable dans `mailer.ts`, revenir à l'état de départ (package.json/lock du commit HEAD) et BLQ. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] AVANT : `npm --prefix api audit --omit=dev` → résumé collé (attendu 4 high : @fastify/busboy, fast-uri, find-my-way, nodemailer)
- [ ] commande 1, telle quelle (cwd G) : `npm --prefix api install nodemailer@^10.0.16` → fin de sortie collée
- [ ] commande 2, telle quelle : `npm --prefix api audit fix --omit=dev` (JAMAIS `--force`) → fin de sortie collée
- [ ] APRÈS : `npm --prefix api audit --omit=dev` → résumé collé ; versions `node -p` de nodemailer, fastify, find-my-way, fast-uri, @fastify/busboy collées
- [ ] `mailer.ts` : 0 modification si typecheck + tests passent ; sinon adaptation minimale documentée (changement d'API nodemailer 10, citer la note de version)
- [ ] `npm --prefix api run typecheck` → exit 0 ; `npm --prefix api test` → tous verts (base 96 fichiers / 824 tests) — sorties collées
- [ ] `git -C G diff --stat -- api` collé : package.json, package-lock.json (+ mailer.ts éventuellement)
- [ ] retour arrière si échec : `git -C G show HEAD:api/package.json > api/package.json`, idem lock, puis `npm --prefix api ci` — et statut `bloque` avec la sortie de l'échec
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package.json` | E | via npm seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package-lock.json` | E | via npm seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/mailer.ts` | E | 63 l, adaptation si nécessaire |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/admin-console.test.ts` | L | utilise un mailer capturé (pas nodemailer réel) |

## Contrats
```ts
// mailer.ts:44-50 — import paresseux, seul point de contact avec nodemailer
let transportP: Promise<import('nodemailer').Transporter> | null = null;
const getTransport = async (): Promise<import('nodemailer').Transporter> => {
  transportP = import('nodemailer').then((nm) => nm.default.createTransport({ … }));
// mailer.ts:58-62 : sendMail({ from, to, subject, html, text })
// les tests api utilisent un Mailer factice (captureMailer) → nodemailer réel non exercé par les tests : vérifier au moins l'import + createTransport (node -e) après montée
```
```
état au 2026-10-08 (T024) : nodemailer 9.1.1 vulnérable ≤ 10.0.8 (correctif 10.0.9+) ; transitifs @fastify/busboy 3.2.0, fast-uri 3.1.2, find-my-way 9.6.0 (fixAvailable selon npm)
dernière version : nodemailer 10.0.16 (npm view)
vérification minimale nodemailer 10 :
  node -e "import('nodemailer').then(nm=>{const t=nm.default.createTransport({jsonTransport:true});return t.sendMail({from:'a@x.fr',to:'b@x.fr',subject:'s',text:'t'})}).then(i=>console.log('OK',typeof i.message))"   (cwd api)
```

## Décisions actées
- D23 : accord humain pour nodemailer 10 + audit fix (sans --force) ; garde = suite verte, sinon retour arrière
- D8 n'autorisait que la commande fastify/nodemailer 9 : remplacé par D23 pour CES 2 commandes uniquement

## Hors périmètre
- toute autre commande npm (`audit fix --force`, `update`, autre paquet) ; web/ (jspdf, maplibre-gl hors lot)
- modifier un test ; si un test casse à cause d'une dépendance → retour arrière + BLQ avec nom + sortie
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; registre npm joignable ; api/node_modules présent
- G sous git HEAD 07a7a3b, arbre propre ; T071 (lecture seule) en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix api install nodemailer@^10.0.16, npm --prefix api audit fix --omit=dev, npm --prefix api audit --omit=dev, npm --prefix api ci, npm --prefix api test, npm --prefix api run typecheck, node -p, node -e, git show, git diff, git status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T072
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
