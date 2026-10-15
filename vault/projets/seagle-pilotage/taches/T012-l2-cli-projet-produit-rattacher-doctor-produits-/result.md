---
tache: T012
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/vx.py:L90-L95 — lire_frontmatter délègue à `_frontmatter`
- bin/vx.py:L98-L141 — corps = après ligne `---` (ligne vide gardée) ; `"…"` dé-échappé ; lignes brutes par clé
- bin/vx.py:L153-L158 — `_scalaire` : guillemets doubles si `: ` ou 1er car. réservé
- bin/vx.py:L161-L173 — clé inchangée → ligne d'origine recopiée ; vide → `cle:` ; corps tel quel
- vault/projets/*/brief.md ×11 — `produit: <cle>` via `agentx rattacher` (table C0)
## Vérifié comment
`python3 -m py_compile bin/vx.py` → `py_compile rc=0`
aller-retour `ecrire_frontmatter(lire_frontmatter(f))` sur copie, `filecmp.cmp(shallow=False)` (seed 12) → `briefs 11 KO []` · `tirage30 30 KO []` · `tous task.md 311 KO []`
banc `rattacher` ×11 puis `diff vrai banc` → 11× `6a7|7a8` `> produit: <cle>` seul (agentx×3, geolens×3, kora×3, seagle×2)
banc `lire_frontmatter(seagle-pilotage)["titre"]` → `'Seagle : piloter Geolens, Kora et l\'entreprise depuis l\'immeuble'` (sans guillemets)
banc écriture/relecture `k` ∈ {`a: b`,`"x`,`'x`,`[x`,`{x`,`#x`,`&x`,`*x`,`!x`,`|x`,`>x`,`%x`,`@x`,`a: "q" \\ z`} → `k: "…"` échappé, relu == valeur ×14 ; `""` → `'k:'` ; ligne vide sous `---` → gardée
banc non-régression : `tache "Essai banc : aller-retour"` → T014 · `set --statut en-cours --note "note : avec deux-points"` · `set revue` · `retenir --sans-eval` · `virer --motif "banc : essai virer"` → T015 ; T014 fm : `note: "note : avec deux-points"` · `motif: "banc : essai virer"` · ligne vide sous `---` gardée ; T015 `titre: "Essai banc : aller-retour"`, relu `Essai banc : aller-retour`
mini-contrôle YAML `rg -I -n '^[A-Za-z0-9_-]+: [^"].*: ' briefs` → 6 lignes `titre:` non quotées, PRÉEXISTANTES (agentx-immeuble, dashboard-grille, agentx-entreprise, geolens-preview-3d, dashboard-direct, seagle-site) → KO, voir Écarts
vrai : `agentx rattacher <slug> <cle>` ×11 → `<slug> : ∅ -> <cle>` ×11 ; 11 briefs == banc (diff)
vrai `./bin/agentx doctor | rg -c "produit absent|produit inconnu"` → ∅ (rc=1, 0 ligne) ; doctor → `vault coherent.`
vrai `./bin/agentx projet zz-essai --produit inconnu` → `vx: erreur: produit inconnu : inconnu (cles : kora, geolens, agentx, seagle)` rc=2 ; `zz-essai` existe → False
vrai DoD L2 `sorted({…produit…})` → `['agentx', 'geolens', 'kora', 'seagle']`
`git diff -U0 -- 'vault/projets/*/brief.md'` → `+produit: agentx`×3 `+produit: geolens`×3 `+produit: kora`×3 `+produit: seagle`×1 · `10 files changed, 10 insertions(+)` (seagle-pilotage non suivi)
## Écarts
- ∅ lecture hors WL
- DoD 3 mini-contrôle KO sur 6 titres préexistants non quotés (YAML invalide) : contradictoire avec DoD 1 « EXACTEMENT 1 ligne » et DoD 2 « aller-retour 11 briefs à l'octet » → tranché pour DoD 1+2 (explicites) : ecrire_frontmatter ne réécrit que les valeurs modifiées ; rattachement compatible avec une normalisation ultérieure
- 215 lignes `cle: valeur` non quotées contenant `: ` dans le vault (task.md + briefs) : quoter à l'écriture aurait cassé l'aller-retour → préservation ligne brute
- outils hors liste du pack lancés en lecture seule : `cd`, `ls`, `awk`, `sed -n`
## Pour la suite
- Q chef : quoter les 6 `titre:` préexistants des briefs (normalisation, diff -1/+1 chacun) ? aucune commande CLI ne réécrit un titre aujourd'hui
- gabarits `vault/_templates/task.md` / `brief.md` : `titre: {{TITRE}}` non quoté → tout titre avec `: ` reste YAML invalide (T014 banc)
- bin/vx.py:~L327 commentaire `_avec_fiche_env` (« lstrip mange le - ») désormais caduc ; regex locale gardée
- listes inline : éléments avec `, ` ou guillemets non échappés (hors contrat)
- banc `.cache/seagle-T012/` laissé en place
## Retour sur le pack
- Manquait: 6 briefs ont déjà `titre: X : Y` non quoté → DoD 1/2 vs DoD 3 incompatibles ; 215 lignes de ce type dans les task.md
- Inutile: ∅
