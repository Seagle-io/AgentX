---
tache: T033
projet: agentx-entreprise
statut: fait
evalue: T032
verdict: retenir
---
## Verdict
retenir — 8/8 cases DoD T032 re-jouées OK
## DoD
DoD T032, re-jouée sur `.cache/banc-T033` (forges copiées de banc-T031 ; avant = `banc-T031/bin/vx.py` = T030, copié en `bin/vx_avant.py`) :
- [x] motif 1 levé — `pack-lint T009 --projet forge` → `x bloc de code non ferme (L60)` rc 2 (avant `OK — pack dispatchable.`) ; T007 `~~~` → avant `x titre hors gabarit : ## Faux titre tilde` → après `OK — pack dispatchable.` rc 0 ; T006 → `x bloc de code non ferme (L98)` + 5 `x titre hors gabarit` rc 2
- [x] motif 2 levé — `random.seed(31)` ; `random.sample` sur 257 lignes T030 `_manques_result` (T031+T032 result exclus) → mêmes 15 lignes que T031/T032 ; après : ignorées #4 #5 ; mal classées #7 #10 #12 #14 = 4/15 ≤ 4/15 (tableau ci-dessous)
- [x] corrections minimales — `categorie_manque` : `décompte réel→autre` · `compte de test→environnement` · `make -n/syntaxe/git show→outil` · `forme de/sémantique→contrat` ; `_manques_result("- Manquait: ∅ · Inutile: ∅ (plages)")` → `[]`
- [x] `_avec_fiche_env` — projet `fichecode` (orthopro env.md + ```` ```bash ```` avec `# commentaire`, ligne vide, `## pas un titre` ; `~~~` + `## tilde dedans`) → `H1=1 H2=9 ordre9=True gras=9 vide_avant=9 code_fiche=9 verbatim=True ouvert=None`
- [x] non-régression — 6 fiches → `H1=1 H2=9 ordre9=True gras=8 vide_avant=8` ×6, lint `x le pack contient encore des marqueurs a remplir` seul ×6 ; forges T001/T002/T003/T004/T005/T008 avant = après ; `integrer --projet orthopro | grep -c "^   -- Retour sur le pack"` → `42` ; vrai vault `pret|en-cours|revue` → `packs 5 avec nouveau x 0` (entreprise T032 T033, immeuble T011 T012 T014, rc 0/0)
- [x] py_compile + doctor — `py=0` · `vault coherent.` `doctor=0`
- [x] git diff stat — `bin/vx.py | 144 … 1 file changed, 138 insertions(+), 6 deletions(-)` ; hunks T032 = `_blocs_code` · `_avec_fiche_env` · regex · `∅` · pack-lint ; `dash/*` modifiés = T011 en cours, déclaré en Écarts T032
- [x] result.md T032 — frontmatter tache/projet/statut revue ; 5 sections exactes ; 51 lignes corps ≤ 60 ; Pour la suite 5 lignes
DoD T033 :
- [x] DoD T032 recopiée, re-jouée sur banc-T033 — ci-dessus
- [x] 2 motifs T030 levés — fence ```` ``` ```` T009 et `~~~` T013 → ✗ ; seed 31 → 4/15 ; tableau collé
- [x] 3 packs forgés neufs — T011 ```` ```markdown ```` + ```` ```bash ```` imbriqué + `## Annexe etrangere` → `x titre hors gabarit : ## Annexe etrangere` rc 2 OK ; T012 idem en ```` ```` ```` → même ✗ rc 2 OK ; T013 `~~~bash` jamais fermé L65 + `## Notes tilde` + `## Mission` → `x bloc de code non ferme (L65)` rc 2 OK ; T014 sain 4 blocs (``` ×2, `~~~` avec `## pas un titre`, ```` ```markdown ````) → `OK — pack dispatchable.` rc 0 OK ; T015 témoin imbriqué sans étranger → OK rc 0
- [x] non-régression — 6 fiches 1 H1 + 9 sections ; orthopro `42` ; vrai vault 0 nouveau ✗ (282 packs, 0 différence)
- [x] verdict cohérent — 0 `[ ]` ⇒ retenir, Motif ∅
- [x] result.md — ce fichier
## Motif
∅
## Vérifié comment
banc : commande du pack T033 ; `cp -r ../banc-T031/vault/projets vault/` ; `cp vault/projets/*/env.md` réels (diff -q vide)
`.cache/banc-T033/scripts/tirage.py` (import `vx_avant` + `bin/vx.py`, VAULT réel, lecture seule) → `pop 257` :
| # | ligne (début) | avant | après | attendue (6 mots) |
|---|---|---|---|---|
| 1 | forme de `personnel.modeles[]` | contrat | contrat | contrat OK |
| 2 | `.gitignore` ignore `.env.*` | environnement | environnement | environnement OK |
| 3 | unités ; code statut PUT ; `API_URL` | contrat | contrat | contrat OK |
| 4 | ∅ · Inutile: ∅ (plages…) | autre | ignorée | ignorée — rien ne manquait OK |
| 5 | ∅ (make -n à autoriser…) | autre | ignorée | ignorée — ligne `∅…` par définition OK |
| 6 | preuve d'attribution des 4 hunks | baseline | baseline | baseline OK |
| 7 | chemins health.ts/config.ts… | autre | autre | coordonnee — chemins de fichiers manquants KO |
| 8 | `seed-data/…` + démarrage API | environnement | environnement | environnement OK |
| 9 | `make -n` … image k6 uid | environnement | environnement | environnement — image avant outil en ordre OK |
| 10 | `set revue\|fait` … glob bash | autre | autre | outil — comportement CLI et glob bash KO |
| 11 | syntaxe `vx.py set` · `git show` | autre | outil | outil OK |
| 12 | BASE env de boot S3 (:12-15) | coordonnee | coordonnee | environnement — variable de boot non recopiée KO |
| 13 | format réel Invoice ; décompte | environnement | contrat | contrat — format de type en tête OK |
| 14 | imports relatifs `.ts` ; base tests | autre | autre | environnement — règle runtime node, base tests KO |
| 15 | la forme de `shouldAutoRefine` | autre | contrat | contrat OK |
→ 4/15 mal classées = 27 % ; seuil ≤ 4/15 atteint pile
`scripts/vrai.py pret en-cours revue` → `packs 5 avec nouveau x 0` ; `scripts/vrai.py` → `packs 282 avec nouveau x 0`
`scripts/forge.py` → T011-T015 dans `forge/` ; `pack-lint T0xx --projet forge` → sorties ci-dessus
`scripts/fiches.py` → `vx tache "essai T033"` ×6 + `fichecode` ; titres comptés hors code via `_blocs_code`
## Écarts
- ∅ lecture hors WL
- scripts de vérif dans `.cache/banc-T033/scripts/` (banc E)
## Pour la suite
- `_blocs_code` ≠ CommonMark : ```` ```bash ```` ferme un bloc ``` ; ```` ```` ```` fermé par ``` → `["````markdown","```text","## Exemple","```","````"]` → `[T,T,F,T,T]` : `## Exemple` exposé, faux ✗ possible
- T006 : `## Etranger apres` L63 masqué par parité ; ✗ global tenu par `non ferme (L98)` seul, L signalée ≠ L38 réelle
- manques : seuil tenu pile 4/15 ; #7 chemins→coordonnee, #10 glob/CLI→outil, #12 `env de boot`→environnement, #14 `node`/`base tests` sans motif
- `∅ (suggestion…)` désormais perdu : gabarit `result.md` → `Manquait: ∅` seul, suggestion en Pour la suite
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
