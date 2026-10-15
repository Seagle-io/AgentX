---
pack: T026
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T026 — Boucle d'apprentissage : integrer + manques + env.md au scaffold

> Seule source de vérité de l'agent T026. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre visibles au chef les « Manquait » des agents (revendications R1 et R3 du syndicat) dans `bin/vx.py` : `integrer` affiche « Retour sur le pack », nouvelle commande `manques` agrège les manques par catégorie et rôle, et `tache` recopie la fiche `env.md` du projet dans le pack généré.

## Definition of Done
- [ ] R1a `integrer` : section `Retour sur le pack` ajoutée en dernier aux sections affichées (rôles non évaluateurs ET évaluateurs) ; `python3 bin/vx.py integrer --projet orthopro | rg -c "^   -- Retour sur le pack"` → ≥ 1
- [ ] R1b `manques` : `python3 bin/vx.py manques [--projet X] [--role R] [--json]` (cf. Contrats) ; texte : par catégorie → total, par rôle, 3 exemples `projet/TID — extrait ≤ 100 car.` ; JSON : forme Contrats ; sortie sur le vrai vault collée (texte + `--json | python3 -c` qui compte)
- [ ] catégories testées : `python3 -c` sur 8 lignes fabriquées (1 par catégorie + 1 `autre` + 1 `∅` ignorée) → catégorie attendue, sortie collée
- [ ] R3 scaffold : `cmd_tache` — si `vault/projets/<slug>/env.md` existe, le `context.md` généré contient, en tête du corps de `## Environnement`, le bloc Contrats « Fiche projet » avec le corps de `env.md` (frontmatter retiré) ; absent → pack inchangé ; prouvé sur banc (`.cache/banc-T026`) : 1 projet avec env.md, 1 sans, `diff` des 2 packs collé
- [ ] `pack-lint` d'un pack scaffoldé avec env.md non rempli → même verdict qu'avant (le bloc env ne lève ni ne masque une erreur) : sortie collée
- [ ] `bin/agentx` : ligne d'aide `agentx manques [--projet <slug>] [--role R]` ajoutée au bloc d'aide ; `./bin/agentx help | rg manques` → 1 ligne
- [ ] `python3 -m py_compile bin/vx.py` rc 0 ; `./bin/agentx doctor` rc 0
- [ ] `git diff --stat -- bin/vx.py bin/agentx` collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | `rendre_template :151` · `cmd_tache :242-275` · `cmd_integrer :506-555` · `_section` · parser `:779-830` |
| `bin/agentx` | E | bloc d'aide `:28-50` seulement |
| `vault/_templates/context.md` | L | § Environnement `:54-67` (forme du pack généré) |
| `vault/syndicat/2026-10-15-tous.md` | L | catégories de manques observées, chiffres de référence |
| `.cache/banc-T026/` | E | banc jetable |

## Contrats
`manques` :
```
python3 bin/vx.py manques [--projet <slug>] [--role <role>] [--json]
source  : vault/projets/*/taches/*/result.md (archive exclue), section « ## Retour sur le pack »
ligne retenue : celle qui commence par « - Manquait » (ou « Manquait ») ; texte après « : » ; ∅ / vide / « Manquait: ∅ » → ignorée ; « | Inutile » et la suite → coupés
catégorie   = 1re regex qui matche (insensible casse, accents retirés), ordre :
  environnement  seed|compte|login|cookie|mot de passe|port|base_url|\.env|tz|fuseau|docker|image
  version        version|v\d+\.\d+|changelog|notes de version|release
  outil          outil|tools?|hors outils|bash\(|commande .* (absente|interdite)|diff|sed|psql|node -e
  contrat        signature|type|contrat|interface|schema|\.d\.ts|props|api
  coordonnee     ligne|:\d+-\d+|coordonn|perime|decal
  baseline       baseline|avant|arbre partage|deja modifie|hunk|commit
  wl             whitelist|wl|hors wl|fichier .* absent
  autre          (aucune)
--json → {"perimetre": "<slug>|tous", "total": int, "categories": [{"cle": str, "total": int, "roles": {role: int}, "exemples": [{"projet","tid","role","texte"}]}]}   # tri total desc ; exemples ≤ 3
```
Bloc scaffold (`cmd_tache`, inséré juste après la ligne `## Environnement` du pack généré) :
```
Fiche projet (`vault/projets/<slug>/env.md`, recopiée au scaffold — ne pas éditer ici) :
<corps de env.md sans frontmatter>
```
`integrer` actuel : sections `("Pour la suite", "Ecarts|Écarts", "Verifie comment|Vérifié comment")`, évaluateur `("Verdict", "Motif", "DoD", "Ecarts|Écarts", "Verifie comment|Vérifié comment")` ; `_section(texte, regex)` ; 40 lignes max par section.

## Décisions actées
- revendications syndicat acceptées par l'humain 2026-10-15 : R1 (boucle d'apprentissage) et R3 (env.md)
- `manques` = lecture seule ; aucune écriture dans le vault
- fiches env.md écrites par la tâche T027 (scribe) en parallèle : ne pas les créer

## Hors périmètre
- `bin/dash.py`, `dash/*` (bouton salle : plus tard) ; `vault/_templates/*` (T028 en parallèle)
- `personnel` (R2 = doctrine, T028)

## Environnement
- arbre partagé : `dash/dash.js` modifié par T012 ; `vault/projets/*/env.md` créés par T027 ; `vault/_templates/context.md` modifié par T028 — tous en parallèle
- banc : `B=.cache/banc-T026; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` ; recopier ton `bin/vx.py` dans `$B/bin/` avant chaque essai
- `rg -h` = aide en rg 14 : utiliser `-I` pour masquer le nom de fichier
- `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T026)`, `Bash(git diff:*)`, `Bash(./bin/agentx:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T026
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
