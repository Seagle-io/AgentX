---
pack: T002
projet: geolens-viewer
role: eclaireur
cree: 2026-10-07
---

# Pack T002 — Reco API sécurité : PT-1 à PT-7, relais upload, audit npm

> Seule source de vérité de l'agent T002. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Pour chaque faille API ci-dessous, confirmer dans le code de G la coordonnée de l'audit et rendre le correctif minimal + son test de non-régression, sans rien modifier. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] PT-1 rate-limit global derrière proxy : enregistrement plugin, `trustProxy`, keyGenerator, limites login/tuiles — coordonnées
- [ ] PT-2 session survit au reset/changement mdp : émission JWT (claims exacts), vérif par requête (lookup user existant ?), routes reset/changement mdp
- [ ] PT-3 jeton de tuile ignore suspension org ; PT-7 jeton en query string, fenêtre réelle 24-48 h vs TTL configuré : génération, vérification, config TTL
- [ ] PT-4 sidecar accepté sans validation (AXES1 m4, server.ts:1087) : route, schéma absent, consommateur
- [ ] PT-5 énumération emails inter-org (409) ; PT-6 mdp 6 caractères à la création vs 8 ailleurs : toutes les constantes de longueur (rg)
- [ ] relais de part d'upload : route, buffer 80 Mo, absence de sémaphore (AXES1 M5)
- [ ] email d'invitation non borné (nodemailer addressparser) : schéma de la route
- [ ] `npm --prefix api audit --omit=dev` : paquets vulnérables, version corrective non majeure dispo oui/non
- [ ] chaque constat : tests existants qui couvrent la zone (`rg -l` dans G/api/test)
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. server.ts : sections ciblées par rg + `sed -n` (≤ 80 l par plage).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/RAPPORT_PENTEST.txt` | L | PT-1..PT-7, 109 l |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/RAPPORT_REVUE_AXES1.txt` | L | L188-215 pôle api |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/RAPPORT_REVUE_AXES2.txt` | L | L138-200 rôles, isolation |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/RAPPORT_REVUE_AXES3.txt` | L | L244-330 dépendances |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | routes, plages ciblées |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/auth.ts` | L | JWT |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tokens.ts` | L | jetons |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/tenancy.ts` | L | contrôle d'accès |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/config.ts` | L | TTL, rate-limit |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/upload.ts` | L | relais de part, plages ciblées |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/mailer.ts` | L | invitation |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/package.json` | L | versions |

## Contrats
```
règles G : toute route → requireAuth + tenancy.ts ; process.env seulement dans api/src/config.ts ; entrée validée par schéma ; fix = test non-régression ; route = test 401 + autre-org
monolithe gelé : api/src/server.ts (3387 l) → correctif = nouveau module + appel, pas de croissance
audit AXES1 coordonnées : C1 rate-limit · M3 sessions · M5 relais part · m4 server.ts:1087 sidecar
```

## Décisions actées
- lecture seule — reco avant contrat
- pas de montée majeure de dépendance — choix humain
- modèle de partage inter-org HP — décision produit non tranchée

## Hors périmètre
- modifier un fichier ; lancer `npm audit fix`, `npm install`
- worker, viewer, infra (autres éclaireurs)
- suppression d'organisation en 500, garde dernier admin, vignette, RGPD

## Environnement
- node v22.22.1 ; node_modules api+web installés ; e2e : non installé
- base verte 2026-10-07 : typecheck OK · lint 0 err · api 571 tests · web 1665 tests
- G sans `.git` : pas de `git diff` ; copie de référence AgentX/.cache/geolens-baseline-2026-10-07
- shell humain fish : utiliser `bash -c` si syntaxe POSIX

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc, find, sed -n, head, npm audit --omit=dev --json)
- rg/wc/find/sed -n ciblé libres sur G/api, G/web/src, G/worker, G/scripts, G/e2e : localiser, pas de lecture intégrale hors WL
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T002
statut: fait | bloque
---
## Constats
- ID-audit · chemin:L1-L2 — mécanisme ≤ 12 mots — confirmé | ≠ audit (préciser)
## Correctif minimal
- ID-audit · fichiers E (chemins exacts) · changement ≤ 20 mots · test de non-régression (fichier test + cas)
## Contrats
```
signatures/types/config existants à recopier dans les packs d'implémentation, verbatim
```
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : lots à fichiers disjoints, collisions entre lots
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
