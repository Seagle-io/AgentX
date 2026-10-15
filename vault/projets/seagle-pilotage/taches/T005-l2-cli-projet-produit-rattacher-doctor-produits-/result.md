---
tache: T005
projet: seagle-pilotage
statut: bloque
---
## Livré
- bin/vx.py:L30 — `import produits`
- bin/vx.py:L217-L233 — `_exiger_produit` die 2 + clés ; `--produit` validé avant mkdir, `{{PRODUIT}}`
- bin/vx.py:L247-L276 — `cmd_rattacher` (ecrire_frontmatter, produit après depot, idempotent, journal) · `cmd_publier` (absent → die 3)
- bin/vx.py:L878-L890 — doctor : erreur registre, `verifier` actifs, produit absent/inconnu
- bin/vx.py:L962-L973 — parser `projet --produit`, `rattacher`, `publier`
- bin/agentx:L43-L45 — aide : projet --produit, rattacher, publier
- vault/_templates/brief.md:L7 — `produit: {{PRODUIT}}`
- migration vrai vault : NON lancée — BLQ ci-dessous
## Vérifié comment
`python3 -m py_compile bin/vx.py` → rc=0
banc `projet zz-essai --produit inconnu` → `vx: erreur: produit inconnu : inconnu (cles : kora, geolens, agentx, seagle)` rc=2 ; `ls vault/projets` → absent
banc `projet avec --produit kora` → rc=0, brief L7 `produit: kora$` ; `projet sans` → L7 `produit: $`
banc `doctor` → `x projet sans : produit absent` (+2 `produit kora|geolens : env … absent`, banc sans vault réel) rc=2
banc `rattacher sans seagle` ×2 → `sans : ∅ -> seagle` / `sans : deja rattache a seagle (0 changement)` rc=0 ; journal `rattaché à seagle`
banc `rattacher sans zz` → rc=2 liste clés ; `rattacher zz kora` → `projet inconnu : zz` rc=1
banc sans bin/publier.py : `agentx publier kora --json` → `vx: erreur: bin/publier.py absent : porte de publication pas encore livree` rc=3
vrai (publier.py T006 présent) : `agentx publier seagle` → `seagle : entreprise, porte produit seulement` rc=2 ; `publier zz` → rc=2
`./bin/agentx help | grep` → L18 `projet … [--produit <cle>]` · L19 `rattacher <projet> <cle>` · L20 `publier <cle> …`
vrai `./bin/agentx doctor | grep -c "produit absent\|produit inconnu"` → 11 (migration non faite)
`git diff --stat -- bin/vx.py bin/agentx vault/_templates/brief.md` → `agentx 4 ++- · vx.py 63 +++ · brief.md 1 + · 3 files, 66 insertions(+), 2 deletions(-)`
banc, copie des vrais briefs puis `rattacher <s> kora`, `diff vrai banc` :
```
dashboard-grille : objectif:$ → objectif: $ · depot:$ → depot: $ · +produit · ligne vide après --- supprimée
seagle-pilotage  : titre: "Seagle : …" → titre: Seagle : … (guillemets perdus) · +produit · ligne vide supprimée
orthopro, agentx-entreprise : +produit · ligne vide après --- supprimée
```
cause : bin/vx.py `ecrire_frontmatter` (L141-L149) écrit `f"{cle}: {val}"` sans guillemets ; `lire_frontmatter` lstrip("-\n") du corps → ligne vide perdue (même effet sur tout task.md via `set`)
## Écarts
- ∅ lecture hors WL
- banc : `bin/publier.py` (T006) apparu en cours → 2e banc sans `cp -r bin` (vx, produits, roles, rh, agentx seuls)
- `rattacher` n'appelle pas `cmd_index` — écrirait vault/INDEX.md hors WL
- DoD « 11 fichiers » : seagle-pilotage non suivi par git → `git diff --stat` en montrera 10 au mieux
## Pour la suite
- BLQ : la DoD exige « par ecrire_frontmatter » ET « 1 ligne chacun » au diff, or ecrire_frontmatter supprime la ligne vide sous `---` des 11 briefs, ajoute un espace final aux clés vides (dashboard-grille) et retire les guillemets du titre de seagle-pilotage : faut-il (a) accepter ces effets et lancer la migration telle quelle, ou (b) autoriser une retouche de `ecrire_frontmatter`/`lire_frontmatter` (préserver ligne vide, `cle:` sans espace, guillemets si `: `) avant migration ?
- après réponse : `./bin/agentx rattacher <slug> <cle>` ×11 (table C0) + 3 commandes DoD L2 ; le code est prêt
- vrai `./bin/agentx doctor | grep "^x produit"` → ∅ (verifier 4 produits OK)
## Retour sur le pack
- Manquait: comportement de `ecrire_frontmatter` (ligne vide, guillemets, valeurs vides) face à « 1 ligne chacun » ; seagle-pilotage non suivi par git
- Inutile: ∅
