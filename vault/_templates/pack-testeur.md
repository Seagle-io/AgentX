---
pack: {{ID}}
projet: {{PROJET}}
role: testeur
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
TODO-PACK — 1 phrase : quoi tester, quel fichier de test écrire (`chemin`).

## Definition of Done
- [ ] chaque test : rouge sur le défaut OU vert sur le livrable, sortie brute collée (commande exacte)
- [ ] 0 fichier de production touché : `git diff --stat` limité aux fichiers tests de la WL
- [ ] cas couverts listés 1 par ligne (nominal, limite, erreur) ; ≥ N `it`/`test` — HEAD : N (TODO-PACK)
- [ ] helpers/fixtures existants réutilisés (signatures recopiées § Contrats), 0 helper dupliqué
- [ ] tests isolés : 0 dépendance au vault réel / `AGENTX_ROOT` de la machine (banc jetable)
- [ ] commande de lancement collée (python : `(cd bin && python3 -m unittest <module>)` ; front : `npx vitest run <fichier>`)
- [ ] toute DoD numérique suivie de `— HEAD : <commande → valeur>` (`rg -n` du jour, jamais recopié d'un result) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (fichier de test) | E | test ajouté |
| `TODO-PACK` (helper/fixture) | L | signature |
| `TODO-PACK` (code testé) | L | comportement attendu |

## Contrats
Signatures, formats, clés, helpers : RECOPIÉS verbatim + `chemin:L`. Sinon `∅`.
```
TODO-PACK (signatures testées, fixtures, imports réels du module verbatim)
```

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- code de production : défaut trouvé ⇒ le noter dans `## Pour la suite`, ne pas corriger
- TODO-PACK

## Environnement
- racine / `cd` / versions des runs de référence : TODO-PACK
- banc jetable : `AGENTX_ROOT` temporaire ; `env -u AGENTX_TID` ; jamais le vault réel
- baseline : tests rouges préexistants hors WL listés
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Glob, Bash(python3:*, npx:*, rg:*, wc:*, ls:*, git status:*, git diff:*)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack — **écrit avec l'outil Write** — dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: revue | bloque
---
## Livré
- `chemin:L1-L2` — fait
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
