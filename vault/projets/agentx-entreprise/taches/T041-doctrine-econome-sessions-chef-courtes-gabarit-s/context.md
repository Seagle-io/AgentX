---
pack: T041
projet: agentx-entreprise
role: scribe
cree: 2026-10-16
---

# Pack T041 — Doctrine économe : sessions chef courtes, gabarit sobre

> Seule source de vérité de l'agent T041. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Inscrire dans la doctrine les économies retenues par l'humain (étude syndicat T039) : sessions chef courtes avec passation par le vault (R1-R2), gabarit de pack sobre (R3, R5), définitions d'agents raccourcies (R7), choix du modèle et de l'effort par tâche.

## Definition of Done
- [ ] `.claude/skills/chef-de-projet/SKILL.md` : section « Économie » ≤ 15 lignes — 1 session chef par vague ou par projet ; au-delà de ~150k de contexte ou après une pause > 1 h : écrire la passation (`vault/projets/<slug>/todo.md` + `journal.md` à jour), dire à l'humain « `/clear` puis `/board` », reprendre par `agentx board` / `integrer` ; chaque tâche a `--modele`/`--effort` adaptés (tableau des défauts par rôle recopié de Contrats) et le chef les passe à l'appel `Agent` (`model`, `effort`)
- [ ] `CLAUDE.md` § Réflexes : 2 lignes (session courte + modèle/effort par tâche, passés à l'appel Agent) — cette ligne vaut instruction explicite de régler `effort` des agents
- [ ] `bin/terminal.py` `CONSIGNE_CHEF` : 1 phrase sur la session courte et la passation ; `python3 -m py_compile` rc 0 ; 1 hunk
- [ ] `vault/_templates/context.md` § Environnement : 2 lignes (R3 « appels d'outils indépendants groupés dans 1 message ; commandes de DoD chaînées en 1 Bash » ; R5 « sorties bornées : `| tail -n 40`, `rg -c` avant `rg -n`, Read `offset/limit` sur `chemin:L` ») ; § Budget inchangé
- [ ] R7 : les 6 définitions d'agents les plus longues de `.claude/agents/` raccourcies sans perdre une règle (interdits, langage dense, format de sortie) : `wc -l` avant/après collé, gain ≥ 25 % sur ces 6 ; chaque règle supprimée = doublon justifié (même règle dans `CLAUDE.md` ou le pack)
- [ ] `git diff --stat` collé ; `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.claude/skills/chef-de-projet/SKILL.md` | E | section Économie |
| `CLAUDE.md` | E | § Réflexes |
| `bin/terminal.py` | E | `CONSIGNE_CHEF` 1 phrase |
| `vault/_templates/context.md` | E | § Environnement 2 lignes |
| `.claude/agents/` | E | 6 définitions les plus longues (à mesurer par `wc -l`) |
| `vault/syndicat/2026-10-16-tokens.md` | L | revendications R1, R2, R3, R5, R7 |

## Contrats
Défauts modèle/effort par rôle (identiques à T040, en parallèle) :
```
eclaireur sonnet/low · architecte opus/high · designer sonnet/medium · implementeur sonnet/medium · testeur sonnet/medium
devops sonnet/medium · verificateur opus/high · relecteur sonnet/low · securite opus/high · evaluateur opus/medium
scribe sonnet/low · juriste opus/high · tresorier opus/medium · produit sonnet/medium · marketing sonnet/medium
rssi opus/high · syndicat sonnet/medium
```
Chiffres clés (T039) : chef 67 % du total ; 1663/2470 appels chef > 200k de contexte ; 34 reprises après pause > 1 h à 335k ; contexte initial des agents 7,8-13k tokens relus à chaque appel.

## Décisions actées
- choix humain 2026-10-16 : sessions chef courtes · gabarit économe · modèle et effort adaptés au besoin ; R4, R8, R9 écartés pour l'instant
- ajouts/complétions seulement dans SKILL.md et CLAUDE.md (pas de réécriture des règles existantes)

## Hors périmètre
- `roles.json`, `bin/vx.py`, `bin/garde_dispatch.py` (T040 en parallèle) ; `bin/dash.py`, `dash/*`

## Environnement
- `garde_bash` refuse tout Bash citant push/migrations : écrire avec Edit/Write ; nouveaux contenus d'agents visibles au prochain chargement des agents

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(wc:*)`, `Bash(python3 -c:*)`, `Bash(python3 -m py_compile:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T041
projet: agentx-entreprise
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
