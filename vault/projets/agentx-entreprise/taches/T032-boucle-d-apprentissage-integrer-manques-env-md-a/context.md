---
pack: T032
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
remplace: T030
---

# Pack T032 — pack-lint robuste aux blocs de code, catégories manques justes (remplace T030, 2e renvoi)

> Seule source de vérité de l'agent T032. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger dans `bin/vx.py` les 2 défauts du renvoi de T030 (pack-lint trompé par un bloc de code non fermé ; `manques` mal classés à 33 %), sans régresser ce que T030 a livré et qui est validé (fiche env.md recopiée en 9 sections, lint titre étranger/doublon/ordre, `integrer` + Retour sur le pack).

## Definition of Done
- [ ] motif 1 levé : `cmd_pack_lint` — bloc ```` ``` ```` ou `~~~` ouvert non refermé en fin de pack → ✗ `bloc de code non ferme (L<n>)` ; `~~~` reconnu comme délimiteur au même titre que ```` ``` ```` ; prouvé sur les packs forgés de `.cache/banc-T031/` (T009 : ```` ```bash ```` non fermé L60 + `## Notes etrangeres` + `## Mission` dupliqué → ✗ ; T007 : `~~~` → plus de faux ✗) ; sorties collées
- [ ] motif 2 levé : `random.seed(31)` + 15 lignes tirées comme T031 → ≤ 4/15 mal classées (tableau ligne · catégorie obtenue · attendue collé) ; mêmes 15 lignes avant/après
- [ ] « mauvaise catégorie » = définition Contrats ; corrections minimales : `\bcompte` ; outil += `make -n|syntaxe|git show` ; contrat += `forme de|semantique` ; ligne qui commence par `∅` (ex. `∅ · Inutile …`) = vide, ignorée
- [ ] `_avec_fiche_env` : contenu des blocs de code de la fiche laissé intact (pas de démotion `##` dedans) ; ligne vide avant chaque `**X**`
- [ ] non-régression : 6 vraies fiches → scaffold = 1 H1 + 9 sections dans l'ordre ; packs forgés T031 (étranger, doublon, ordre, sain) → mêmes verdicts que T030 ; `integrer --projet orthopro | rg -c "^   -- Retour sur le pack"` → ≥ 1 ; packs `pret|en-cours|revue` du vrai vault (TID figés et listés au début) → aucun nouveau ✗
- [ ] `python3 -m py_compile bin/vx.py` rc 0 ; `./bin/agentx doctor` rc 0
- [ ] `git diff --stat -- bin/vx.py` collé (base HEAD 48a6888 ; T026+T030 déjà dans l'arbre) ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `PACK_SECTIONS :44-54` · `_avec_fiche_env :252-259` · `MANQUES_CATEGORIES :581-600` · `_manques_result` · `cmd_pack_lint :706-725` |
| `vault/projets/agentx-entreprise/taches/T031-evaluer-t030/result.md` | L | verdict détaillé, lignes mal classées |
| `.cache/banc-T031/` | L | packs forgés T001-T009, projets avec les 6 fiches |
| `vault/projets/orthopro/env.md` | L | vraie fiche |
| `.cache/banc-T032/` | E | ton banc |

## Contrats
Motif du 2e renvoi (T031, verbatim) :
```
pack-lint : bloc de code non fermé masque les titres suivants, OK dispatchable sur pack à titre étranger et Mission dupliquée ; manques 5/15 mal classés soit 33 %, ex décompte→compte
random.seed(31) → 5/15 = 33 % > 30 % (#4 « ∅ · Inutile » extrait comme Manquait, #5/#11 → autre ≠ outil, #13 « décompte »→« compte » environnement, #15 → autre ≠ contrat)
~~~ non reconnu → faux ✗ (T007)
```
Pistes de l'évaluateur (à appliquer) :
```
cmd_pack_lint : if code: ✗ bloc non fermé après la boucle ; reconnaître ~~~
MANQUES_CATEGORIES : \bcompte ; outil += make -n|syntaxe|git show ; contrat += forme de|semantique
_manques_result : une ligne qui commence par ∅ = vide
_avec_fiche_env : laisser intact le contenu des blocs ``` de la fiche ; ligne vide avant **X**
```
Mauvaise catégorie = (a) ligne vide ou `∅…` retenue comme Manquait, ou (b) catégorie obtenue ≠ catégorie du 1er motif de la liste ordonnée que la ligne décrit vraiment (juge humain, justifié en 6 mots). Ordre des 9 sections : Mission · Definition of Done · Fichiers autorisés · Contrats · Décisions actées · Hors périmètre · Environnement · Budget · Format de sortie.

## Décisions actées
- 2e renvoi sur la même chaîne (T026 → T030 → T032) : modèle opus — règle du chef
- ne pas assouplir le lint pour faire passer un pack existant : lister en Écarts
- orthopro T042 (bloquée, pack antérieur au gabarit) : son ✗ « section manquante Environnement » est attendu

## Hors périmètre
- éditer `env.md`, `dash/*` (T011 en cours), `bin/agentx`
- bug `lire_frontmatter` (corps commençant par `- `) : Pour la suite seulement

## Environnement
- banc : `B=.cache/banc-T032; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; packs forgés : copier depuis `.cache/banc-T031/vault/projets/` ; recopier ton `bin/vx.py` dans `$B/bin/` avant chaque essai
- `rg -h` = aide en rg 14 : utiliser `-I` ; `garde_bash` refuse les commandes citant push/migrations
- permissions : `rm` hors `.cache/` peut déclencher une demande — rester dans ton banc

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T032)`, `Bash(git diff:*)`, `Bash(./bin/agentx:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T032
projet: agentx-entreprise
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
