---
pack: T012
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
remplace: T005
---

# Pack T012 — L2 CLI : frontmatter fidèle puis migration des projets (remplace T005, bloquée)

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `ecrire_frontmatter` / `lire_frontmatter` de `bin/vx.py` fidèles au YAML Obsidian (motif du blocage de T005), puis rattacher les 11 projets à leur produit par `agentx rattacher` — le code CLI de T005 (`--produit`, `rattacher`, `publier`, doctor) est déjà dans l'arbre et conservé.

## Definition of Done
- [ ] motif T005 levé, sur banc (`.cache/seagle-T012/`, copies des 11 vrais briefs) : `rattacher` → `diff` de chaque brief = EXACTEMENT 1 ligne ajoutée `produit: <cle>` (collé ×11) : ligne vide sous `---` conservée, `cle:` vide écrit sans espace final, valeur contenant `: ` ou commençant par `"`, `'`, `[`, `{`, `#`, `&`, `*`, `!`, `|`, `>`, `%`, `@` → entre guillemets doubles (échappés) ; valeur déjà entre guillemets relue SANS les guillemets par `lire_frontmatter`
- [ ] aller-retour : pour les 11 briefs ET 30 `task.md` tirés au hasard du vrai vault, `ecrire_frontmatter(lire_frontmatter(f))` dans une copie → octets identiques (`cmp`), sortie collée ; écart → corriger, pas assouplir
- [ ] non-régression : `vx set`, `tache`, `virer`, `retenir` sur banc → frontmatter valide ; `python3 -c "import yaml"` absent → vérifier la validité YAML des 11 briefs migrés avec un mini-contrôle : chaque ligne `cle: valeur` dont la valeur contient `: ` est quotée (rg collé)
- [ ] migration du VRAI vault : `./bin/agentx rattacher <slug> <cle>` ×11 (table Contrats) → 3 commandes « DoD L2 » de `contrat.md:320-325` → sorties collées (`['agentx', 'geolens', 'kora', 'seagle']`) ; `git diff -- vault/projets/*/brief.md` → +1 ligne par brief suivi (collé)
- [ ] `./bin/agentx doctor` → 0 « produit absent|inconnu » ; `python3 -m py_compile bin/vx.py` rc 0
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `lire_frontmatter :~85-140`, `ecrire_frontmatter :~141-149` (+ code T005 déjà présent, ne pas le réécrire) |
| `vault/projets/seagle-pilotage/taches/T005-l2-cli-projet-produit-rattacher-doctor-produits-/result.md` | L | ce que T005 a livré et constaté |
| `vault/projets/seagle-pilotage/contrat.md` | L | §C0 migration L32-37 · §C4 L196-205 · DoD L2 L320-325 |
| `vault/projets/*/brief.md` | E | via `agentx rattacher` UNIQUEMENT |
| `.cache/seagle-T012/` | E | banc |

## Contrats
Motif du blocage de T005 (verbatim) :
```
ecrire_frontmatter supprime la ligne vide sous `---` des 11 briefs, ajoute un espace final aux clés vides de dashboard-grille et retire les guillemets du titre de seagle-pilotage
cause : ecrire_frontmatter (vx.py L141-149) ne met jamais de guillemets ; le lstrip de lire_frontmatter supprime la ligne vide
```
Tranché par le chef : option (b) — corriger les 2 fonctions (Obsidian exige un YAML valide : `titre: Seagle : piloter …` sans guillemets est invalide).
Migration (§C0) :
```
agentx-entreprise, agentx-immeuble, agentx-voix            → agentx
geolens-viewer, geolens-preview-3d, geolens-charge-3d      → geolens
orthopro, dashboard-grille, dashboard-direct (clos)        → kora
seagle-site, seagle-pilotage                               → seagle
```

## Décisions actées
- frontmatter jamais édité à la main : CLI seule ; `agentx-voix` : rattaché à agentx, 0 autre changement (ses tâches tournent en parallèle)
- aucun changement de format des task.md existants (aller-retour à l'octet près)

## Hors périmètre
- `bin/publier.py`, `bin/produits.py`, `bin/dash.py` (agentx-voix T002 l'édite en parallèle), `dash/*`

## Environnement
- banc : `B=.cache/seagle-T012; rm -rf $B; mkdir -p $B/vault/projets $B/.claude; cp -r bin dash roles.json produits.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis copier les 11 dossiers `vault/projets/<slug>/` à migrer (brief, journal) ; recopier ton `bin/vx.py` avant chaque essai
- `garde_bash` refuse push/migrations (le mot « migration » dans une commande Bash aussi : écrire « rattachement ») ; `rg -h` = aide, utiliser `-I`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(./bin/agentx:*)`, `Bash(rg:*)`, `Bash(cp:*)`, `Bash(cmp:*)`, `Bash(diff:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T012)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T012
projet: seagle-pilotage
statut: revue | bloque
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
