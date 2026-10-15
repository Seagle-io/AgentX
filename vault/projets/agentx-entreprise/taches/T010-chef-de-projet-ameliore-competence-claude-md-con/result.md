---
tache: T010
statut: fait
---
## Livré
- .claude/skills/chef-de-projet/SKILL.md — 11 rôles, Skills, Leçons (8 lignes)
- .claude/skills/chef-de-projet/SKILL.md — phase 6 Évaluation et remplacement ; capitalisation → phase 7
- CLAUDE.md — 11 rôles, `/rh`, virer/retenir/personnel, règle 4 mécanisée
- bin/terminal.py:39-43 — CONSIGNE_CHEF : boucle évaluer/retenir/virer, personnel
- .claude/commands/dispatch.md — prompt dense ; étape 5 revue → evaluateur
- .claude/commands/rh.md — neuf, 19 lignes, injecte `personnel`
- .claude/agents/evaluateur.md — result.md = §C6 verbatim (retenir|virer)
- vault/_templates/context.md — § Environnement + leçons L1, L2
## Vérifié comment
python3 -c "import ast;ast.parse(open('bin/terminal.py').read())" → rc=0
git diff -U0 bin/terminal.py → @@ -38,0 +39,5 @@ (dans :24-45)
rg -n "retenu|vire\b|Grille DoD|Correctifs du pack" .claude/agents/evaluateur.md → ∅ (rc 1)
git diff --stat (6 chemins suivis) → evaluateur.md 41 · dispatch.md 24 · SKILL.md 63 · CLAUDE.md 19 · terminal.py 5 · context.md 2 ; 6 files, 110+/44-
rh.md non suivi (??) : wc -l → 19
## Écarts
- ∅
- SKILL.md : phase 5 `set fait` inchangée (non revue→retenir) ; phases renumérotées 6→7
## Pour la suite
- SKILL.md phase 5 : l'exemple `set --statut fait` contredit « seul retenir → fait » pour producteurs ; à nuancer
- CLAUDE.md : page-liste blanche `set` ne couvre pas virer/retenir ; aligner après L2
- agents relecteur/securite/testeur/designer/devops : T-suivant si absents (L7 redémarrage)
## Retour sur le pack
- Manquait: §C6 n'a pas `## Pour la suite` en contenu (correctifs) — j'y ai placé les correctifs du pack
- Inutile: ∅
