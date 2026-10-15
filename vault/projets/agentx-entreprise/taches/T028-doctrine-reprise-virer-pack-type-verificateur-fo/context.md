---
pack: T028
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T028 — Doctrine : reprise = virer, pack type vérificateur, format par rôle

> Seule source de vérité de l'agent T028. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Appliquer à la doctrine du chef les revendications R2, R4, R5 du syndicat : toute reprise passe par `virer` (renvois enfin comptés), pack type du vérificateur, comptes rendus courts par rôle (carte et contrat dans une note à part).

## Definition of Done
- [ ] R2 `SKILL.md` phase Évaluation et remplacement + `CLAUDE.md` règle 4 + `bin/terminal.py` `CONSIGNE_CHEF` : 1 ligne chacun — « reprendre une tâche (DÉFAUTS, BLQ, pack amendé) = `virer` puis remplaçante ; jamais relancer ni re-messager un agent avec un pack modifié en place » ; `python3 -m py_compile bin/terminal.py` rc 0 ; `git diff -U0 bin/terminal.py` → 1 hunk dans `CONSIGNE_CHEF`
- [ ] R4 `vault/_templates/pack-verificateur.md` neuf : pack type (mêmes sections que `_templates/context.md`) pré-rempli pour le rôle : WL obligatoire = `result.md` de la tâche vérifiée + helpers de test/seed + scripts de banc ; § Environnement = paramètres des runs de référence + interception `/api/term/*` si salle ; outils lecture libres (`rg`, `wc`, `diff`, `sed -n`, `git diff|status|show`, `python3 -c`) ; format DÉFAUTS ; `python3 bin/vx.py pack-lint` sur une copie remplie dans `.cache/T028/` → OK (sortie collée)
- [ ] R4 `SKILL.md` Phase 3 : 1 ligne « vérificateur → partir de `_templates/pack-verificateur.md` »
- [ ] R5 `.claude/agents/eclaireur.md` : carte longue → `taches/<TID>/carte.md` (Obsidian), `result.md` ≤ 60 lignes avec lien `[[carte]]` ; `.claude/agents/architecte.md` : contrat → `vault/projets/<slug>/contrat.md` (déjà la pratique), `result.md` ≤ 60 lignes ; `_templates/context.md` § Format de sortie : rappel « result.md ≤ 60 lignes de corps ; détail long → note à part liée »
- [ ] `_templates/context.md` § Format de sortie : frontmatter du result.md exemple gagne `projet: {{PROJET}}` (sonnerie, règle 1 — T004 agentx-immeuble)
- [ ] 0 règle existante réécrite (ajouts/complétions seulement) ; `git diff --stat` des fichiers E collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.claude/skills/chef-de-projet/SKILL.md` | E | phase 3, phase Évaluation et remplacement |
| `CLAUDE.md` | E | règle 4 |
| `bin/terminal.py` | E | `CONSIGNE_CHEF` 1 ligne |
| `vault/_templates/context.md` | E | § Format de sortie `:76-95` |
| `vault/_templates/pack-verificateur.md` | E | neuf |
| `.claude/agents/eclaireur.md` | E | format de sortie |
| `.claude/agents/architecte.md` | E | format de sortie |
| `.claude/agents/verificateur.md` | L | méthode actuelle (pour le pack type) |
| `vault/syndicat/2026-10-15-tous.md` | L | R2, R4, R5 verbatim (chiffres, sources) |
| `.cache/T028/` | E | copie remplie pour pack-lint |

## Contrats
Revendications (syndicat, extraits) :
```
R2 Renvois invisibles : virer 0/279 (RH 0 %) mais 9 tâches reprises par message ou pack amendé en place — op/journal.md:47,99,109,177,202 ss/journal.md:49,71,108 → toute reprise passe par virer
R4 Pack type verificateur : hors WL 70 % (moy 1,71 vs 0,63 implementeur), 5/8 dépassements de budget, Manquait 100 % → WL obligatoire = result.md de la tâche vérifiée + helpers de test/seed + scripts de banc ; Environnement = paramètres des runs de référence ; rg libre en lecture (rôle sans édition)
R5 Format de sortie par rôle : result > 60 lignes 56/271 ; eclaireur 27/33 (méd 93), architecte 11/14 (méd 134) → carte/contrat dans note séparée, result ≤ 60
```
Sections obligatoires d'un pack (pack-lint) : Mission · Definition of Done · Fichiers autorisés · Contrats · Décisions actées · Hors périmètre · Environnement · Budget · Format de sortie.

## Décisions actées
- revendications R2, R4, R5 acceptées par l'humain 2026-10-15 ; R6-R10 refusées pour l'instant : ne pas les introduire
- le scaffold de pack recopiera `env.md` en tête de § Environnement (T026) : ne pas renommer les titres de section du gabarit

## Hors périmètre
- `bin/vx.py` (T026), `vault/projets/*/env.md` et `_templates/env.md` (T027)
- autres agents `.claude/agents/*`

## Environnement
- `garde_bash` refuse tout Bash citant push/migrations : écrire avec Write/Edit, jamais heredoc
- `bin/terminal.py` : `CONSIGNE_CHEF` vient d'être réécrite (immeuble, T004) puis complétée (`:43`, T021) ; ajouter, ne rien retirer
- arbre partagé : T026, T027 en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(wc:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`, `Bash(cp:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T028
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
