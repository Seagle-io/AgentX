---
tache: T028
projet: agentx-entreprise
statut: fait
---
## Livré
- bin/terminal.py:48 — CONSIGNE_CHEF +1 ligne reprise=virer
- CLAUDE.md:98-102 — règle 4 complétée reprise=virer
- .claude/skills/chef-de-projet/SKILL.md Phase 6 — +1 ligne reprise=virer
- .claude/skills/chef-de-projet/SKILL.md Phase 3 — +1 ligne vérificateur → pack-verificateur.md
- vault/_templates/pack-verificateur.md — neuf, 9 sections, WL/Env/DÉFAUTS pré-remplis
- vault/_templates/context.md § Format de sortie — +projet: {{PROJET}}, rappel ≤ 60 lignes + note liée
- .claude/agents/eclaireur.md — carte longue → taches/<TID>/carte.md, result ≤ 60, `[[carte]]` (plafond 150 déplacé sur carte.md)
- .claude/agents/architecte.md — contrat → projets/<slug>/contrat.md, result ≤ 60, lien `[[contrat]]`
## Vérifié comment
python3 -m py_compile bin/terminal.py → rc=0
git diff -U0 bin/terminal.py → hunk de T028 = `@@ -43,0 +48 @@` dans CONSIGNE_CHEF ; 5 autres hunks préexistants (T004/T021, arbre non commité)
pack-lint sur copie remplie .cache/T028/context.md (via _trouver_tache patché, tâche hors vault) → `80 lignes, ~903 tokens, 6 fichier(s) en whitelist · ~ chemin introuvable : result.md (x2, warn) · OK — pack dispatchable.`
git diff --stat (fichiers E) → architecte.md 6, eclaireur.md 3, SKILL.md 14, CLAUDE.md 21, terminal.py 17, context.md 3 (cumul arbre non commité, pas seulement T028)
python3 bin/vx.py index → index ecrit : vault/INDEX.md (9 projet(s))
python3 bin/vx.py doctor → vault coherent.
## Écarts
- eclaireur.md: ligne « Plafond dur 150 lignes de result.md » réécrite (pas seulement ajout) — contredisait R5 ; 150 conservé pour carte.md
- pack-lint ne lint que des tâches du vault : copie lintée par appel Python direct, pas CLI
## Pour la suite
- pack-lint CLI sans option `--fichier` : lint d'un gabarit exige un hack ; ajouter si récurrent
- warn « result.md introuvable » : le gabarit pack-verificateur cite `result.md` en backticks dans § WL (prose) ; remplacer par chemin complet au remplissage
- scaffold T026 : recopie env.md en tête § Environnement ; titres de section inchangés
## Retour sur le pack
- Manquait: commande/méthode pour linter un gabarit hors vault ; sens exact de « ajouts seulement » vs ligne plafond 150 eclaireur
- Inutile: ∅
