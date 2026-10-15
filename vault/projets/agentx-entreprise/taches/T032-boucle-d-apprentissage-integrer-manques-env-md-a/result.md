---
tache: T032
projet: agentx-entreprise
statut: revue
---
## Livré
- bin/vx.py:L243-L255 — `_blocs_code` : fences ``` et ~~~, fermeture même délimiteur
- bin/vx.py:L267-L276 — fiche env : code intact, ligne vide avant `**X**`
- bin/vx.py:L602-L606 — `\bcompte` ; outil += make -n/syntaxe/git show ; contrat += forme de/semantique
- bin/vx.py:L619,L626 — `_manques_result` : ligne `∅…` ignorée
- bin/vx.py:L728-L732 — pack-lint : ✗ `bloc de code non ferme (L<n>)`, titres via `_blocs_code`
## Vérifié comment
TID figés avant modif (`pret|en-cours|revue`, vrai vault) : `agentx-entreprise T032 · agentx-immeuble T011 T012 T014` → avant 0 ✗ rc 0 ×4 ; après `OK — pack dispatchable.` rc 0 ×4
banc `.cache/banc-T032`, forge copiée de banc-T031 → pack-lint avant(T030) / après :
`T001 OK/OK · T002 x titre hors gabarit : ## Notes libres (=) · T003 x section dupliquee : ## Contrats + desordre (=) · T004 x desordre (=) · T005 OK/OK · T008 OK/OK`
`T009 avant OK rc=0 → après x bloc de code non ferme (L60) rc=2`
`T007 avant x titre hors gabarit : ## Faux titre tilde → après OK — pack dispatchable. rc=0`
`T006 avant rc=2 → après x bloc de code non ferme (L98) + 5 x titre hors gabarit rc=2`
`_blocs_code(["a","~~~","```","## x","~~~","## y"])` → `([F,T,T,T,T,F], None)` ; `["a","~~~bash","## x","```"]` → `(…, 2)`
6 vraies fiches (`vx tache "essai T032"`) → titres hors code `10` = `# Pack` + 9 sections dans l'ordre (ex. orthopro `54:## Environnement | 123:## Budget | 131:## Format de sortie`) ; `**X**` 8 / précédés d'une ligne vide 8, ×6 ; pack-lint → seul `x le pack contient encore des marqueurs a remplir`
fiche forgée (```bash avec `# commentaire`, ligne vide, `## pas un titre` ; ~~~ avec `## tilde dedans`) → recopiés verbatim, titres hors code `10`, non ferme `None`
tout le vault, `cmd_pack_lint` avant(T030)/après sur 281 packs → `packs 281`, 0 différence de ✗
manques, `random.seed(31)` ; `random.sample(pop, 15)`, pop = T030 `_manques_result`, 257 lignes (hors T031/result.md, postérieur) = même tirage que T031 :
| # | ligne | avant | après | attendue |
|---|---|---|---|---|
| 1 | forme de `personnel.modeles[]` | contrat | contrat | contrat |
| 2 | `.gitignore` ignore `.env.*` | environnement | environnement | environnement |
| 3 | code statut exact PUT OK | contrat | contrat | contrat |
| 4 | ∅ · Inutile: ∅ (plages…) | autre | ignorée | ignorée |
| 5 | ∅ (make -n à autoriser…) | autre | ignorée | ignorée — commence par ∅ |
| 6 | preuve d'attribution des 4 hunks | baseline | baseline | baseline |
| 7 | chemins health.ts/config.ts… | autre | autre | coordonnee? KO strict |
| 8 | chemin `seed-data/…` + commande démarrage | environnement | environnement | environnement |
| 9 | `make -n` … image k6 uid | environnement | environnement | environnement — 1er motif décrit |
| 10 | `set revue\|fait` … glob bash | autre | autre | outil? KO strict |
| 11 | syntaxe `vx.py set` · `git show` | autre | outil | outil |
| 12 | BASE env de boot S3 non recopié | coordonnee | coordonnee | environnement KO |
| 13 | format réel Invoice ; décompte réel | environnement | contrat | contrat |
| 14 | imports relatifs `.ts` ; base tests réelle | autre | autre | baseline KO |
| 15 | la forme de `shouldAutoRefine` | autre | contrat | contrat |
→ mal classées : avant 5/15 (T031) ; après 4/15 strict (#7 #10 #12 #14), 2/15 hors ambiguës ≤ 4/15
`./bin/agentx manques --json` → `250` (avant 257+1 T031)
`./bin/agentx integrer --projet orthopro | rg -Ic "^   -- Retour sur le pack"` → `42`
`python3 -m py_compile bin/vx.py; echo py=$?` → `py=0` ; `./bin/agentx doctor` → `vault coherent.` `doctor=0`
`git diff --stat -- bin/vx.py` → `bin/vx.py | 144 ++…--- 1 file changed, 138 insertions(+), 6 deletions(-)` (T026+T030 = 124 ; delta T032 = 7 hunks ci-dessus)
## Écarts
- ∅ lecture hors WL
- `git status` : `dash/dash.js` modifié — pas par T032 (T011 en cours)
## Pour la suite
- T006 : fence sans info-string fermée par ```` ```markdown ```` → L signalée = 98, pas 38 (toggle simple, ≠ CommonMark)
- `section manquante` teste le texte brut : titre masqué par un bloc fermé à tort non détecté
- manques #12/#14 : lignes multi-faits ; « env » / « base tests » sans motif
- `∅ (make -n …)` désormais ignoré : suggestion perdue, à écrire hors `∅`
- bug `lire_frontmatter` (corps commençant par `- `) toujours ouvert
## Retour sur le pack
- Manquait: méthode du tirage T031 (population, exclusion T031/result.md) | Inutile: ∅
