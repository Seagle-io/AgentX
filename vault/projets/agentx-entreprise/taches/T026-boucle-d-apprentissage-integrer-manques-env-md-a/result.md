---
tache: T026
projet: agentx-entreprise
statut: revue
---
## Livré
- bin/vx.py:242-256 — `_avec_fiche_env` : env.md en tête § Environnement
- bin/vx.py:281-285 — `cmd_tache` passe le pack par `_avec_fiche_env`
- bin/vx.py:548,556-557 — `integrer` : « Retour sur le pack » en dernier
- bin/vx.py:577-644 — `MANQUES_CATEGORIES`, `categorie_manque`, `_manques_result`, `cmd_manques`
- bin/vx.py:909-914 — parser `manques` ; aide integrer « 4 sections »
- bin/agentx:45-46 — aide integrer 4 sections + ligne `manques`
## Vérifié comment
`python3 bin/vx.py integrer --projet orthopro | rg -c "^   -- Retour sur le pack"` → `42`
`integrer --projet agentx-entreprise | rg -o "^   -- .*" | sort | uniq -c` → `8 DoD · 26 Ecarts · 8 Motif · 18 Pour la suite · 26 Retour sur le pack · 8 Verdict · 26 Verifie comment`
`python3 bin/vx.py manques` (extrait) →
```
MANQUES — tous, 254 Manquait
  environnement   73   implementeur 39 · verificateur 18 · eclaireur 10 · architecte 4 · evaluateur 2
     agentx-entreprise/T009 — comportement deck si registre_erreur (remplace ou s'ajoute aux cartes ?)
  autre           69   implementeur 33 · verificateur 19 · eclaireur 6 · scribe 5 · evaluateur 3 · designer 2 · architecte 1
  contrat 39 · coordonnee 28 · outil 15 · wl 11 · baseline 10 · version 9   (3 exemples chacune)
```
`manques --json | python3 -c '…d["perimetre"], d["total"], sum(c["total"]), [(cle,total,len(exemples))], sorted(exemples[0])'` → `tous 254 254 [('environnement', 73, 3), ('autre', 69, 3), ('contrat', 39, 3), ('coordonnee', 28, 3), ('outil', 15, 3), ('wl', 11, 3), ('baseline', 10, 3), ('version', 9, 3)] ['projet', 'role', 'texte', 'tid']`
`manques --projet orthopro --role verificateur` → `MANQUES — orthopro, role verificateur, 12 Manquait` (env 4 · contrat 4 · coordonnee 2 · outil 1 · autre 1) ; `--projet orthopro --json` → `orthopro 42` ; `--role inconnu` → `argument --role: invalid choice`
catégories, `python3 -c` sur 9 lignes (7 cat. + autre + `Manquait: ∅ | Inutile: tout`) →
```
environnement <- compte seed admin et cookie de session
version <- notes de version fastify 5.12
outil <- psql absent des outils autorisés
contrat <- signature de useFoo non recopiée
coordonnee <- coordonnée décalée :10-20
baseline <- fichier déjà modifié, hunk non attribuable
wl <- helper.ts hors WL
autre <- chemin du banc inconnu
8 retenues / 9
```
banc `.cache/banc-T026`, projets `avec` (env.md) / `sans`, `diff sans/T001/context.md avec/T001/context.md` →
```
3c3 / 82c87   < projet: sans  > projet: avec
54a55,59
> Fiche projet (`vault/projets/avec/env.md`, recopiée au scaffold — ne pas éditer ici) :
> - seed : admin@x.fr / admin (cookie `sid`)
> - BASE http://127.0.0.1:3000 · TZ Europe/Paris
> - TODO-PACK base tests à chiffrer
>
```
`pack-lint T001` sans → rc 2 ; avec → rc 2 ; `diff` des sorties → seules L1-2 diffèrent (chemin, `95 lignes ~1610` vs `100 lignes ~1669`) ; mêmes `~ result.md` `~ decisions.md` `x marqueurs a remplir`
`python3 -m py_compile bin/vx.py` → rc 0 ; `./bin/agentx doctor` → `vault coherent.` rc 0
`./bin/agentx help | rg manques` → `  agentx manques [--projet <slug>] [--role R]   les « Manquait » par categorie et role`
`git diff --stat -- bin/vx.py bin/agentx` → `bin/agentx | 3 +- · bin/vx.py | 105 ++++-- · 2 files changed, 101 insertions(+), 7 deletions(-)` (base 0 diff au départ)
## Écarts
- ∅ lecture hors WL
- `lire_frontmatter` non utilisé pour env.md : son `lstrip("-\n")` mange le « - » de la 1re puce (vu au banc) → regex locale
- JSON `exemples[].texte` = texte entier ; texte CLI tronqué 100 car.
## Pour la suite
- regex contrat `port`/`tz`/`type`/`api` en sous-chaîne : 30/73 « environnement » sans mot entier (`comportement`, `rapport`…) → architecte : `\b` ?
- `lire_frontmatter` (bin/vx.py:91) : `lstrip("-\n")` tronque un corps qui commence par `- ` — bug latent hors périmètre
- env.md contenant `TODO-PACK` → recopié → pack-lint KO même pack rempli ; env.md avec `## ` → coupe § Environnement
- séparateur « · Inutile » (gc/T003) et « ∅ (réserve) » (ent/T003) non filtrés : contrat ne cite que `| Inutile` et `∅` exact
- 254 Manquait vs 244 syndicat : lignes multiples par result + result postérieurs au gel
## Retour sur le pack
- Manquait: forme des lignes réelles (« Manquait : » avec espace, « · Inutile », « ∅ (…) ») ; quirk `lire_frontmatter` | Inutile: vault/syndicat/2026-10-15-tous.md (chiffres seulement)
