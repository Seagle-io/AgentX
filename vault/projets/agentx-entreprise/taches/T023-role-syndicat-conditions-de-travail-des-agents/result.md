---
tache: T023
projet: agentx-entreprise
statut: revue
---
## Livré
- roles.json:21 — entrée `syndicat` entre rssi et vault, `#65a30d`
- .claude/agents/syndicat.md:1-73 — agent neuf, ossature evaluateur, sources/indicateurs/règles verbatim
- .claude/commands/syndicat.md:1-18 — `/syndicat` : injecte personnel, crée tâche puis dispatch
- .claude/skills/chef-de-projet/SKILL.md:15 — titre « Les dix-sept rôles »
- .claude/skills/chef-de-projet/SKILL.md:37 — ligne `syndicat` au tableau
- .claude/skills/chef-de-projet/SKILL.md:245 — Capitalisation : syndicat après 2 vagues / renvoi ≥ 50 %
- CLAUDE.md:70-71 — `/syndicat [projet]` au § Commandes
- CLAUDE.md:75,83-86 — « 17 rôles », syndicat ≠ scribe ≠ evaluateur
## Vérifié comment
- `python3 -c "…roles.erreur();roles.est_role_agentx('syndicat')"` → `''` · `True`
- distance RGB `#65a30d` vs 17 autres → `min dist 99.7` (≥ 60)
- ordre roles.json → `['rssi', 'syndicat', 'vault']`
- `./bin/agentx doctor; echo rc=$?` → `vault coherent.` · `rc=0`
- `python3 bin/vx.py personnel --json` → clés `['perimetre','projets','archives','taches','roles','modeles']` ; `"taches": 277`, `"projets": 9` ; entrée `{'cle': 'syndicat', 'taches': 0, …, 'taux_renvoi': None}`
- `rg -c "^## Retour sur le pack" vault/projets/*/taches/*/result.md | wc -l` → `262`
- `rg -c "personnel|integrer|pack-lint|Retour sur le pack|journal.md|remplacee_par|charge|autonomie|qualité|flux|répétition|défend l'agent|∅ donnée|gain attendu|tags: \[syndicat\]" .claude/agents/syndicat.md` → `19`
- `wc -l .claude/agents/syndicat.md` → `73` (≤ 80)
- `git diff --stat -- roles.json CLAUDE.md .claude/skills/chef-de-projet/SKILL.md` →
```
 .claude/skills/chef-de-projet/SKILL.md | 11 +++++++++--
 CLAUDE.md                              | 17 ++++++++++++-----
 roles.json                             |  6 ++++++
 3 files changed, 27 insertions(+), 7 deletions(-)
```
  dont T023 seul : roles +1 · SKILL +3/-1 · CLAUDE +6/-3 (reste = diff préexistant T021, non commité)
- `git status --short` → `?? .claude/agents/syndicat.md` · `?? .claude/commands/syndicat.md` ; 0 autre fichier touché
## Écarts
- ∅
- couleur choisie `#65a30d` (contrat `#……`) — distance max parmi 11 candidats
## Pour la suite
- dash : glyphe `cahier` absent → T010 agentx-immeuble (hors périmètre)
- `vault/syndicat/` n'existe pas : créé au 1er livrable ; vérifier que `doctor`/index l'ignorent
- agent visible après redémarrage de session ; 1er lancement = tâche suivante
- `/syndicat tous` : tâche créée dans le projet courant — à trancher si projet dédié
## Retour sur le pack
- Manquait: `git diff --stat` inclut le diff préexistant non commité des fichiers E — base de comparaison absente | Inutile: ∅
