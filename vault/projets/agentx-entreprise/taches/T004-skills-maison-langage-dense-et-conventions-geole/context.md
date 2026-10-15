---
pack: T004
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T004 — Skills maison : langage dense et conventions Geolens

> Seule source de vérité de l'agent T004. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire 2 skills Claude Code, `.claude/skills/langage-dense/SKILL.md` et `.claude/skills/conventions-geolens/SKILL.md`, distillés des notes en L — préchargeables par un agent, ≤ 120 lignes chacun.

## Definition of Done
- [ ] `langage-dense/SKILL.md` : frontmatter `name: langage-dense` + `description` (déclencheur : écrire pack, result.md, prompt de dispatch AgentX) ; corps = règles de `LANGAGE.md` sans perte (abréviations, plafonds, format vérif)
- [ ] `conventions-geolens/SKILL.md` : frontmatter `name: conventions-geolens` + `description` (déclencheur : toute tâche sur un dépôt Geolens) ; sections : Outillage · Sécurité · Serveur de test · Banc/charge · Interdits
- [ ] chaque règle cite sa note source `[[nom-note]]` en fin de ligne
- [ ] section Interdits contient verbatim les 3 règles de « Contrats »
- [ ] `wc -l` des 2 SKILL.md ≤ 120 chacun (sortie collée)
- [ ] 0 fait inventé : toute ligne traçable à une note L ou à « Contrats »
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.claude/skills/langage-dense/SKILL.md` | E | à créer |
| `.claude/skills/conventions-geolens/SKILL.md` | E | à créer |
| `vault/_templates/LANGAGE.md` | L | source langage |
| `vault/connaissances/geolens-banc-preview-3d.md` | L | source |
| `vault/connaissances/geolens-route-tuile-charge.md` | L | source |
| `vault/connaissances/geolens-serveur-test.md` | L | source |
| `vault/connaissances/geolens-web-outillage.md` | L | source |
| `vault/connaissances/geolens-web-securite-carte.md` | L | source |
| `vault/connaissances/fastify-trustproxy-5-12.md` | L | source (API Geolens = Fastify) |
| `vault/connaissances/verif-conteneurs-jetables.md` | L | source vérif |

## Contrats
Format skill :
```
---
name: <nom-du-dossier>
description: <1-2 phrases : ce que c'est + QUAND le charger>
---
# <Titre>
<corps dense>
```
Règles à recopier verbatim dans Interdits de `conventions-geolens` :
```
- BDD du serveur de test (82.65.97.67:34580) : lecture/exploitation OK ; 0 DELETE/UPDATE/DROP/TRUNCATE, 0 migration, 0 seed, 0 restauration, 0 `docker compose down -v`.
- L'API lance `migrate()` au boot (ALTER TABLE ADD COLUMN) : tout déploiement API sur le serveur de test = analyser l'effet base AVANT ; préférer un déploiement web seul.
- Jamais de `git push`, jamais de migration lancée par un agent : passer la tâche en `bloque` avec la commande exacte.
```

## Décisions actées
- skills hors vault (`.claude/skills/`) : pas de wikilink obligatoire, mais `[[note]]` gardé comme renvoi — traçabilité
- corps en langage dense, pas de prose — lu par des agents
- notes sources intactes — le scribe ne les modifie pas ici

## Hors périmètre
- Modifier les notes `vault/connaissances/*`
- Skills pour Seagle/OrthoPro (T005)
- Toucher `.claude/agents/*`

## Environnement
- vault Obsidian ; skills = markdown + frontmatter YAML
- `wc`, `rg` dispo

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, `Bash(wc:*)`, `Bash(rg:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
- chemin — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : `description` exacte de chaque skill (à recopier dans les agents)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
