---
pack: T030
projet: geolens-charge-3d
role: scribe
cree: 2026-10-13
---

# Pack T030 — Capitaliser charge-3d : notes serveur de test et route tuile

> Seule source de vérité de l'agent T030. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Transformer les comptes rendus T013-T029 (extraits fournis) en notes atomiques réutilisables : mettre à jour la note du serveur de test, créer une note « route tuile GeoLens : charge et cache », et proposer les corrections de gabarit issues des « Retour sur le pack ».

## Definition of Done
- [ ] `vault/connaissances/geolens-serveur-test.md` mis à jour (≤ 80 l, mêmes sections + ajouts) : hairpin KO (hôte et réseau docker) → k6 `TILE_ORIGIN_PUBLIC/INTERNAL` ; k6 `BASE_URL=http://api:4000`, `PER=10` (générateur colocalisé = goulot, D18) ; quota tuile 500000 pendant mesure puis 5000 ; Caddy `@s3_presigne` (bloc + 403 vérifiés) ; jamais `GEOLENS_ENV=production` (boot refusé en http) ; `RETENTION_MODE=off` ; Caddy modifié = humain (classifieur) ; API redéployée = G 03a7bcb ; Cache Storage inactif en http
- [ ] `vault/connaissances/geolens-route-tuile-charge.md` créé (≤ 60 l, frontmatter titre/resume/source/cree/tags comme les notes existantes) : coûts CPU mesurés (T020 : SDK presign 554 µs/302, SigV4 direct 7-34 µs, Fastify 209 µs) ; cache droits 30 s (D16/D17) ; SigV4 direct = égalité octet pour octet + repli SDK (D20, D23 cas limites) ; cache viewer (D22) clé/purge/plafond ; tableau des mesures M0-M4 condensé ; pièges (pool pg 10, k6 corps, horloge monotone)
- [ ] `vault/connaissances/INDEX` : ∅ (pas d'index à toucher) — lier les 2 notes entre elles en `[[wikilink]]`
- [ ] propositions de gabarit : ≤ 8 lignes dans result.md « Pour la suite », chacune = manque récurrent (≥ 2 occurrences dans les Retours) + ligne à ajouter à `vault/_templates/context.md` (section visée) ; NE PAS éditer le gabarit
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/charge3d-capitalisation.md` | L | extraits integrer T013-T029 + Retours sur le pack (392 l) |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-serveur-test.md` | E | note existante |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-route-tuile-charge.md` | E | nouvelle note |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-charge-3d/mesures.md` | L | tableau M0-M4 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/geolens-charge-3d/decisions.md` | L | D12-D23 |
| `/home/jdrac/Documents/Workspace/AgentX/vault/_templates/context.md` | L | sections du gabarit |

## Contrats
Frontmatter des notes de connaissances (modèle geolens-serveur-test.md) :
```yaml
---
titre: …
resume: …   # 1 ligne
source: geolens-charge-3d T0xx, Dxx
cree: 2026-10-13
tags: [note, geolens, …]
---
```
Règles vault : Markdown + YAML, `[[wikilink]]`, pas de HTML, pas de section vide, pas de récit ; ce qui n'aide pas un futur pack n'entre pas.

## Décisions actées
- notes = faits réutilisables (commandes, coordonnées, chiffres, pièges), pas l'historique du projet
- valeurs secrètes jamais écrites (aucune clé, aucun mot de passe, aucun contenu de .env)

## Hors périmètre
- tout autre fichier du vault (brief, plan, tâches, gabarits) ; dépôt G ; ssh
- `bin/vx.py` (aucune commande d'écriture du vault)

## Environnement
- vault Obsidian ; notes existantes : geolens-serveur-test, geolens-web-outillage, geolens-web-securite-carte, verif-conteneurs-jetables, fastify-trustproxy-5-12

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (2 notes WL, result.md)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T030
statut: fait | bloque
---
## Livré
- chemin — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 8 lignes : propositions de gabarit (section · ligne à ajouter · occurrences). Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
