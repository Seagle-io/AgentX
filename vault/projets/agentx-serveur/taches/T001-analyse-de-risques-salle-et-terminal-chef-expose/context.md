---
pack: T001
projet: agentx-serveur
role: rssi
cree: 2026-10-16
---

# Pack T001 — Analyse de risques : salle et terminal chef exposés sur un serveur

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre l'analyse de risques du passage d'AgentX en local (127.0.0.1, 1 utilisateur) à un serveur distant partagé par 2 comptes (Julien, Sylvain), chacun avec son terminal web relié à une session Claude Code chef qui a la main sur le serveur et les dépôts — et les exigences de sécurité que le contrat (T002, en parallèle) et le déploiement devront respecter.

## Definition of Done
- [ ] livrable `vault/projets/agentx-serveur/risques.md` (Obsidian, `tags: [risques]`) : actifs (code des produits, secrets `.env`, BDD de test, vault, clés SSH/GitHub, session Claude et son quota, serveur) ; menaces ; tableau risque · actif · menace · vraisemblance (1-4) · impact (1-4) · mesure · résiduel
- [ ] risques couverts au minimum : vol de session / jeton de la salle ; terminal web = exécution de code à distance ; un compte qui pilote le chef de l'autre ; agent qui sort de son périmètre (push, migration, BDD de test Geolens — règles actuelles : `bin/garde_bash.py`) ; fuite de secrets dans le vault, les logs, les captures ; dépendance à GitHub OAuth (révocation, compte compromis) ; tunnel SSH (clés, port forwarding, `AllowTcpForwarding`) ; exposition accidentelle d'un port (7777, 7790…) sur Internet ; prompt injection via contenu du vault ou des dépôts ; journalisation et traçabilité (qui a demandé quoi) ; conformité RGPD (données patients Kora : jamais sur ce serveur sans décision)
- [ ] mesures existantes constatées dans le code, coordonnées : garde `Host` local + jeton `X-AgentX-Jeton` (`bin/dash.py`), socket unix du terminal (`bin/terminal.py:164-321`), `garde_bash`, `garde_dispatch` — chacune : ce qu'elle protège en local, ce qu'elle ne protège plus en distant
- [ ] exigences numérotées `EX-01…` (≤ 20), chacune vérifiable (commande ou test), classées bloquant / recommandé, à recopier telles quelles dans le contrat et le pack devops
- [ ] 0 test d'intrusion, 0 accès à un système réel, 0 secret recopié (chemin + nom de variable seulement)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-serveur/risques.md` | E | livrable (neuf) |
| `vault/projets/agentx-serveur/decisions.md` | L | cadrage humain |
| `bin/dash.py` | L | garde HTTP, jeton, routes `/api/run`, `/api/term/*`, `/api/voix/*` |
| `bin/terminal.py` | L | session chef, socket unix, démon |
| `bin/garde_bash.py` | L | commandes refusées aux agents |
| `bin/garde_dispatch.py` | L | garde des appels Agent |
| `.claude/settings.json` | L | hooks, permissions |
| `CLAUDE.md` | L | règles du système |

## Contrats
Cadrage humain (decisions.md) : 1 session chef par compte (Julien, Sylvain) sur un même vault ; accès = tunnel SSH + compte GitHub de l'organisation Seagle-io ; serveur distant à venir (non choisi).
Données sensibles connues : Kora (orthophonie) = données de santé — `vault/projets/orthopro/env.md` ; BDD serveur de test Geolens intouchable.

## Décisions actées
- tu proposes, le chef et l'humain décident ; 0 édition de code
- 0 test d'intrusion, 0 accès réseau à un système réel

## Hors périmètre
- choisir l'hébergeur ; écrire le contrat (T002) ou le déploiement (devops, plus tard)

## Environnement
- WebSearch/WebFetch autorisés pour citer des références (OWASP, ANSSI, GitHub OAuth docs) : URL + date
- `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`risques.md`, `result.md`), WebSearch, WebFetch
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T001
projet: agentx-serveur
statut: revue | bloque
---
## Livré
- vault/projets/agentx-serveur/risques.md — n risques, n exigences
## Vérifié comment
lectures et références (chemin:L, URL + date)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : exigences bloquantes, verbatim
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
