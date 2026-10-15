---
pack: T033
projet: agentx-entreprise
role: evaluateur
cree: 2026-10-15
---

# Pack T033 — Evaluer T032

> Seule source de vérité de l'agent T033. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger le livrable de T032 (2e remplaçante de T026 : pack-lint robuste aux blocs de code, catégories `manques` justes) contre la DoD de SON pack → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/agentx-entreprise/taches/T032-boucle-d-apprentissage-integrer-manques-env-md-a/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi sur `.cache/banc-T033`
- [ ] les 2 motifs de renvoi de T030 levés : bloc non fermé (```` ``` ```` et `~~~`) → ✗ ; tirage `random.seed(31)` sur la MÊME population que T031 (257 lignes, `T031/result.md` exclu — méthode dans `T032/result.md`) → ≤ 4/15 mal classées selon la définition du pack T032 ; tableau collé
- [ ] 3 packs forgés NEUFS par toi (pas ceux de T031) : bloc ```` ```markdown ```` imbriqué dans le Format de sortie + titre étranger après ; `~~~` ouvert jamais fermé ; pack sain avec 3 blocs → verdicts collés et jugés
- [ ] non-régression : 6 vraies fiches → scaffold 1 H1 + 9 sections ; `integrer --projet orthopro` → Retour sur le pack ; packs `pret|en-cours|revue` du vrai vault → 0 nouveau ✗
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/agentx-entreprise/taches/T032-boucle-d-apprentissage-integrer-manques-env-md-a/context.md` | L | DoD de référence |
| `vault/projets/agentx-entreprise/taches/T032-boucle-d-apprentissage-integrer-manques-env-md-a/result.md` | L | affirmations, méthode de tirage |
| `vault/projets/agentx-entreprise/taches/T031-evaluer-t030/result.md` | L | tirage d'origine, lignes mal classées |
| `bin/vx.py` | L | livrable |
| `vault/projets/*/env.md` | L | 6 vraies fiches |
| `.cache/banc-T031/` | L | packs forgés d'origine |
| `.cache/banc-T033/` | E | ton banc |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T033
projet: agentx-entreprise
statut: fait | bloque
evalue: T032
verdict: retenir | virer
---
## Verdict
## DoD
## Motif
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
Mauvaise catégorie (pack T032) = (a) ligne vide ou `∅…` retenue comme Manquait, ou (b) catégorie obtenue ≠ catégorie du 1er motif de la liste ordonnée que la ligne décrit vraiment (juge, justifié en 6 mots). Lignes multi-faits : la 1re catégorie plausible suffit.

## Décisions actées
- tu ne lances ni `virer` ni `retenir` sur le vrai vault ; NV vaut `[ ]` ; tu ne corriges rien
- chaîne T026 → T030 → T032 : 3e renvoi possible ; juge sur la DoD seule, pas sur l'historique

## Hors périmètre
- éditer `env.md`, `bin/*`, `dash/*` (T011 en cours)

## Environnement
- banc : `B=.cache/banc-T033; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/`
- vrai vault : `python3 bin/vx.py pack-lint|integrer|manques` en lecture seule autorisé
- `rg -h` = aide en rg 14 : utiliser `-I` ; `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, banc), `Bash(python3:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T033)`, `Bash(git diff:*)`, `Bash(./bin/agentx:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/agentx-entreprise/taches/T033-evaluer-t032/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».
