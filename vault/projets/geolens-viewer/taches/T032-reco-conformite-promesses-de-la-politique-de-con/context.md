---
pack: T032
projet: geolens-viewer
role: eclaireur
cree: 2026-10-07
---

# Pack T032 — Reco conformité : promesses de la politique de confidentialité vs système réel

> Seule source de vérité de l'agent T032. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Lister CHAQUE engagement vérifiable de `web/src/pages/Confidentialite.tsx` (et des clauses données de `CGU.tsx`), et pour chacun établir l'état réel dans le code et le déploiement cible (Scaleway managé) avec preuve, puis proposer les 2 options « aligner le texte » / « implémenter » avec leur coût ; 0 modification. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] tableau exhaustif : 1 ligne par promesse (citation ≤ 15 mots + `Confidentialite.tsx:L`) — thèmes au moins : hébergeur/localisation, chiffrement en transit, chiffrement au repos, réseau privé, sauvegardes, durée compte (3 ans), durée journaux (12 mois), droits (accès, rectification, effacement, portabilité, opposition), sous-traitants, contact/DPO, cookies, sécurité mdp
- [ ] pour chaque promesse : état `tenue` | `partielle` | `non tenue` | `NV (hors code : console hébergeur)` + preuve (`chemin:L` ou commande + sortie)
- [ ] pour chaque promesse non tenue/partielle : option A « aligner le texte » (formulation ≤ 20 mots) · option B « implémenter » (fichiers à toucher, ≤ 15 mots, taille S/M/L)
- [ ] recoupement avec l'audit : AXES4 P-M1 effacement incomplet, P-M2 portabilité, P-M3 rétention, O-m2 IP d'audit, synthèse :233-242 — confirmé / ≠ (le code a changé depuis : T007-T030)
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. Recherche `rg` libre sur G/api/src, G/web/src/pages, G/docker-compose*.yml, G/DEPLOYMENT.md, G/.env.production.example (localiser, pas lire en entier hors WL).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Confidentialite.tsx` | L | 141 l, source des promesses |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/CGU.tsx` | L | 103 l, clauses données |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/schema.ts` | L | tables users, audit_log (:130-137), annexes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/server.ts` | L | plages rg : suppression user (~:1519-1533), audit(), exports |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/DEPLOYMENT.md` | L | §5, §5 quinquies sauvegarde, §6 RGPD |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/docker-compose.scaleway.yml` | L | cible prod |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | DB sslmode, S3, SMTP |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/RAPPORT_REVUE_AXES4.txt` | L | 82 l, constats P-*/O-* |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/SYNTHESE_AUDIT.txt` | L | :226-250 seulement |

## Contrats
```
Constats audit 28/09 à recouper (lignes du code de l'époque, décalées depuis) :
- synthèse :233 — page annonce : hébergement Scaleway chiffré, compte 3 ans, journaux 12 mois, chiffrement au repos, réseau privé, sauvegardes auto → inexistants dans le déploiement
- AXES4 P-M1 — effacement incomplet : email en clair dans audit_log, couches privées et tables annexes non purgées (server.ts:1519-1533 époque)
- AXES4 P-M2 — 0 route d'accès/portabilité (/api/me/export ∅)
- AXES4 P-M3 — 0 purge audit_log 12 mois, 0 traitement comptes inactifs 3 ans (users.last_login existe)
- AXES4 O-m2 — audit_log sans IP ni agent (IP seulement à l'acceptation CGU)
Changements depuis l'audit (projet AgentX, commits 745d46f..6e22e8c) :
- sessions révocables, jetons tuile 8-12 h, journaux sans jeton (logRedact), rotation journaux Docker 10m×5
- DEPLOYMENT.md §5 quinquies : sauvegarde = outils managés Scaleway (PostgreSQL auto, versioning bucket à activer), runbook jamais joué
- cible prod décidée : docker-compose.scaleway.yml (PostgreSQL + Object Storage managés Scaleway)
```

## Décisions actées
- cible = Scaleway managé — decisions.md D2
- reco seulement, l'humain tranche aligner/implémenter par promesse
- ce qui se règle dans la console Scaleway (chiffrement au repos, rétention sauvegardes) = `NV (hors code)`, pas `non tenue`

## Hors périmètre
- modifier un fichier ; rédiger la nouvelle politique ; avis juridique
- sécurité applicative déjà traitée (XSS, sessions, rate-limit)
- push, remote, PR, commit

## Environnement
- G sous git, HEAD 6e22e8c ; `git -C G log --oneline -6` donne l'historique du projet
- api : vitest + pg-mem ; rien à exécuter ici

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, git log, git show), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T032
statut: fait | bloque
---
## Promesses
| # | Promesse (citation, :L) | État | Preuve | A — aligner le texte | B — implémenter (fichiers, taille) |
## Recoupement audit
- ID · confirmé | ≠ (préciser)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : lots B possibles à fichiers disjoints, ce qui exige une action console Scaleway
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
