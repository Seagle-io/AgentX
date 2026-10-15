---
tache: T021
projet: agentx-entreprise
statut: revue
---
## Livré
- roles.json:16-20 — 5 rôles après scribe, avant vault
- .claude/agents/juriste.md:1-57 — avis droit/fiscal sourcé, Légifrance/BOFiP
- .claude/agents/tresorier.md:1-58 — budget scripté, HT/TTC, 0 banque
- .claude/agents/produit.md:1-55 — spec vérifiable, RICE, 0 code
- .claude/agents/marketing.md:1-55 — messages → preuves, 0 faux avis
- .claude/agents/rssi.md:1-56 — risques/conformité, ≠ securite, 0 intrusion
- .claude/skills/chef-de-projet/SKILL.md:15,31-35,223 — « seize », 5 lignes, producteurs
- CLAUDE.md:74-85 — 16 rôles, 5 décrits, rssi≠securite, producteurs
- bin/terminal.py:43 — producteurs complétés
- .claude/agents/evaluateur.md:3 — producteurs complétés
- .claude/commands/dispatch.md:30 — producteurs complétés
## Vérifié comment
`python3 -c "…import roles;print(roles.erreur() or 'ok', len(roles.affectables()))"` → `ok 16`
`python3 couleurs.py roles.json` (distance RGB min vs tous les autres rôles, nouveaux inclus) →
```
juriste #94a3b8 min 70.6 vs testeur OK
tresorier #16a34a min 78.5 vs eclaireur OK
produit #0891b2 min 86.3 vs chef OK
marketing #ca8a04 min 77.8 vs implementeur OK
rssi #b91c1c min 99.8 vs verificateur OK
```
script : `rgb=int(c[i:i+2],16)` ; `min(math.dist(rgb(r),rgb(o)) for o≠r)` ; OK si ≥ 60
`rg -c "jamais" .claude/agents/{juriste,tresorier,produit,marketing,rssi}.md` → `juriste:3 tresorier:5 produit:5 marketing:4 rssi:3`
corps hors frontmatter (lignes) → `juriste 50 · tresorier 51 · produit 48 · marketing 48 · rssi 49`
`…roles.est_role_agentx(r) for r in [5 nouveaux,'inconnu']` → `[True, True, True, True, True, False]`
`python3 -m py_compile bin/terminal.py` → `rc=0`
`diff <snapshot avant T021> bin/terminal.py` → `43c43` (1 ligne, littéral producteurs)
`git diff -U0 bin/terminal.py | rg '^@@'` → 5 hunks : `-25`,`-27,3`,`-30,0`,`-48` préexistants (M au départ), `-39 +43` = T021
`./bin/agentx doctor` → `vault coherent.` `rc=0`
`python3 bin/dash.py --json | …` → `18 ['scribe', 'juriste', 'tresorier', 'produit', 'marketing', 'rssi', 'vault']`
`git diff --stat` (E) →
```
 .claude/agents/evaluateur.md           |  2 +-
 .claude/commands/dispatch.md           |  2 +-
 .claude/skills/chef-de-projet/SKILL.md |  9 +++++++--
 CLAUDE.md                              | 12 ++++++++----
 bin/terminal.py                        | 16 ++++++++++------   (dont 1 ligne T021, reste préexistant)
 roles.json                             |  5 +++++
```
+ 5 `??` `.claude/agents/{juriste,tresorier,produit,marketing,rssi}.md` ; 0 autre fichier touché (bin/dash.py, bin/sonnerie.py M avant T021)
## Écarts
- ∅ lecture hors WL
- DoD « git diff -U0 bin/terminal.py → 1 hunk » : 5 hunks — 4 préexistants hors T021 ; delta T021 = 1 ligne (diff vs snapshot)
- SKILL.md:223 liste producteurs Phase 6 aussi complétée — hors `:15-30`, même liste, sinon incohérente
- marketing.md § Langage : +1 ligne — contenu public en langue courante
## Pour la suite
- dash.js GLYPHES : objets `avis`, `budget`, `specs`, `contenus`, `risques` → glyphe `resultat` (tâche front)
- 5 agents visibles par Claude Code après redémarrage de session
- packs types pour rôles métier : livrable `vault/artefacts/<projet>/<TID>/` à créer, E dans WL
- bin/terminal.py : 4 hunks non commités d'une autre tâche — à attribuer avant commit
## Retour sur le pack
- Manquait: bin/terminal.py déjà modifié (M) → DoD « 1 hunk » invérifiable tel quel ; SKILL.md:218 liste producteurs non citée
- Inutile: ∅
