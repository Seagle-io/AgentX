---
pack: T005
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T005 — Skills maison : conventions Seagle, OrthoPro et front

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Écrire 2 skills Claude Code, `.claude/skills/conventions-seagle/SKILL.md` et `.claude/skills/conventions-orthopro/SKILL.md`, distillés des notes en L — préchargeables par un agent, ≤ 120 lignes chacun.

## Definition of Done
- [ ] `conventions-seagle/SKILL.md` : frontmatter `name: conventions-seagle` + `description` (déclencheur : toute tâche sur le site Seagle) ; sections : Outillage/build · i18n · Accessibilité/tokens · E2E · Pièges
- [ ] `conventions-orthopro/SKILL.md` : frontmatter `name: conventions-orthopro` + `description` (déclencheur : toute tâche OrthoPro ortho-back/ortho-front) ; sections : Dépôts · Outillage front · Dashboard/grille · Tests e2e · Interdits
- [ ] chaque règle cite sa note source `[[nom-note]]` en fin de ligne
- [ ] Interdits OrthoPro contient verbatim le bloc « Contrats »
- [ ] `wc -l` des 2 SKILL.md ≤ 120 chacun (sortie collée)
- [ ] 0 fait inventé : toute ligne traçable à une note L ou à « Contrats »
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.claude/skills/conventions-seagle/SKILL.md` | E | à créer |
| `.claude/skills/conventions-orthopro/SKILL.md` | E | à créer |
| `vault/connaissances/seagle-a11y-tokens-audit.md` | L | source |
| `vault/connaissances/seagle-e2e-check-dist.md` | L | source |
| `vault/connaissances/seagle-i18n-routes-5-langues.md` | L | source |
| `vault/connaissances/seagle-outillage-build.md` | L | source |
| `vault/connaissances/seagle-reload-chunk-prerendu.md` | L | source |
| `vault/connaissances/ortho-front-dashboard-carte.md` | L | source |
| `vault/connaissances/ortho-front-outillage.md` | L | source |
| `vault/connaissances/rgl-v2-api-reelle.md` | L | source (grille OrthoPro) |
| `vault/connaissances/autosave-debounce-historique.md` | L | source (dashboard) |
| `vault/connaissances/playwright-getbyrole-sous-chaine.md` | L | source e2e |

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
Faits OrthoPro (hors notes, à recopier verbatim dans Dépôts / Interdits) :
```
- Dépôts : ~/Documents/Workspace/OrthoPro/ortho-back (NestJS) · ~/Documents/Workspace/OrthoPro/ortho-front (Vite) ; branche `Ultime` ; pas de prod.
- Jamais de migration ni de `git push` sans accord explicite de l'humain (RULE.MD) : tâche en `bloque` + commande exacte.
- Front : réutiliser le kit UI du showcase, ne pas créer de composant parallèle.
```
Si une note L relève d'un autre projet que ce que son nom suggère : la ranger d'après son contenu, noter dans `## Écarts`.

## Décisions actées
- skills hors vault (`.claude/skills/`) ; `[[note]]` gardé comme renvoi — traçabilité
- corps en langage dense, pas de prose — lu par des agents
- notes sources intactes

## Hors périmètre
- Modifier les notes `vault/connaissances/*`
- Skills Geolens / langage (T004)
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
tache: T005
statut: fait | bloque
---
## Livré
- chemin — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : `description` exacte de chaque skill
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
