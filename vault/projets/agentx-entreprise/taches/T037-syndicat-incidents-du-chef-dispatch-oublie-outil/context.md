---
pack: T037
projet: agentx-entreprise
role: syndicat
cree: 2026-10-16
---

# Pack T037 — Syndicat : incidents du chef (dispatch oublié, outils non portables)

> Seule source de vérité de l'agent T037. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Instruire 2 incidents remontés par l'humain le 2026-10-16 — le chef a oublié de lancer des agents après avoir préparé leurs tâches, et un outil a été livré non portable (chemins personnels, GPU obligatoire, scripts hors du dépôt publié) — mesurer leur fréquence dans tout le vault, imputer (chef, pack, gabarit, mécanique) et rendre des revendications chiffrées dans un cahier daté.

## Definition of Done
- [ ] `vault/syndicat/2026-10-16-incidents-chef.md` (Obsidian, `tags: [syndicat]`, `perimetre: tous`) : sections `## Incidents` · `## Mesure` · `## Imputation` · `## Revendications` · `## Sans donnée`
- [ ] Mesure 1 « préparé mais pas lancé » : dans tous les `journal.md`, tâches passées `en-cours` puis restées sans `result.md` ni événement agent > 15 min (sources : journaux + `run/evenements.jsonl` + mtime des result.md) ; liste projet/TID/durée, total ; cas connus à retrouver : agentx-voix T009, seagle-pilotage T007
- [ ] Mesure 2 « livré non portable » : `git ls-files bin dash outils .claude docs | xargs grep -lE "/home/[a-z]+/"` + shebangs absolus + dépendances matérielles forcées (`cuda`, `device=`) → liste, et pour chaque cas la tâche qui l'a livré (journal) et si son pack exigeait la portabilité
- [ ] Imputation par incident : chef (oubli d'action) · pack (exigence absente) · gabarit · mécanique absente — avec la source
- [ ] 3 à 6 revendications, chacune : constat chiffré · source · correction · gain · coût ; confronter aux corrections DÉJÀ lancées (agentx-entreprise T036 : dispatch mécanisé + doctor chemins perso ; agentx-voix T012 : voix portable) — dire ce qui reste non couvert
- [ ] 0 édition hors ce fichier et ton `result.md`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/syndicat/2026-10-16-incidents-chef.md` | E | livrable (neuf) |
| `vault/projets/*/journal.md` | L | transitions de statut, dates |
| `vault/projets/*/taches/*/task.md` | L | via `rg` (statut, role) |
| `run/evenements.jsonl` | L | rendus d'agents (hook SubagentStop) |
| `vault/syndicat/2026-10-15-tous.md` | L | 1er cahier (ne pas répéter) |
| `vault/projets/agentx-entreprise/taches/T036-dispatch-mecanise-et-chemins-personnels-detectes/context.md` | L | correction mécanique lancée |
| `vault/projets/agentx-voix/taches/T012-voix-portable-sans-chemin-personnel-repli-cpu-in/context.md` | L | correction voix lancée |

## Contrats
Incidents (humain, 2026-10-16) :
```
1. « La doc de Sylvain, je ne sais pas où elle est » → le chef avait écrit le pack et passé agentx-voix T009 en-cours sans lancer l'agent (00:20 → relancé 01:05 sur relance humaine) ; même oubli sur seagle-pilotage T007
2. guide de Sylvain : bin/parle et bin/dictee ont des shebangs /home/jdrac/… ; dictee force CUDA ; les 3 scripts voix ne sont pas dans la branche publiée → installation impossible chez Sylvain
humain : « fais en sorte que cette problématique ne se reproduise jamais (fais remonter cette info au syndicat) (ne pas oublier de lancer une tâche !) »
```

## Décisions actées
- tu proposes, le chef décide ; 0 donnée inventée ; échec du pack ou du chef imputé au pack ou au chef, jamais à l'agent

## Hors périmètre
- code ; juger les livrables ; répéter le cahier du 2026-10-15

## Environnement
- `rg -I` (rg 14 : `-h` = aide) ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (livrable + result.md), `Bash(python3 -c:*)`, `Bash(rg:*)`, `Bash(git ls-files:*)`, `Bash(git log:*)`, `Bash(grep:*)`, `Bash(wc:*)`, `Bash(stat:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T037
projet: agentx-entreprise
statut: fait | bloque
---
## Livré
- vault/syndicat/2026-10-16-incidents-chef.md — n incidents mesurés, n revendications
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : revendications non couvertes par T036 / T012
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
