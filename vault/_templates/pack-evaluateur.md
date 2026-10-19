---
pack: {{ID}}
projet: {{PROJET}}
role: evaluateur
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type evaluateur : le chef écrit Mission, DoD spécifiques, WL, Contrats ; le reste est constant.

## Mission
Juger TODO-PACK (TID) contre sa DoD : `retenir` | `virer`. 0 correction.
Variante juge unique (retouche front, remplace évaluateur + critique) :
- DoD en plus : captures par viewport (TODO-PACK) lues image par image, 1 ligne par image
- DoD en plus : contrastes calculés (texte ≥ 4,5:1, contrôles ≥ 3:1) ; défauts `bloquant|majeur|mineur`
- Format de sortie : `VERDICT` + défauts dans `## Livré` ; WL critique (scénario banc E) ajoutée

## Definition of Done
- [ ] chaque case DoD du jugé : `OK` (commande → sortie) | `KO` (repro) | `HP` (hors périmètre, raison), rejouée soi-même
- [ ] lint / tsc / tests du livrable : sorties collées vs déclaré (TODO-PACK)
- [ ] frontières `rg` du pack jugé rejouées → sorties
- [ ] `VERDICT Txxx: retenir|virer` en tête de `## Livré`, un par tâche jugée
- [ ] points pré-tranchés par le chef : listés hors verdict, non rejugés (TODO-PACK ou ∅)
- [ ] 0 `virer` / `retenir` lancé : verdict écrit seulement
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (result.md du jugé) | L | affirmations |
| `TODO-PACK` (pack du jugé) | L | DoD à rejouer |
| `TODO-PACK` (fichiers E du jugé) | L | vérifier |

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
```
TODO-PACK (DoD du jugé verbatim si hors WL ; pré-tranchés)
```

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- corriger quoi que ce soit ; lancer `vite` ; formater ; lancer `virer`/`retenir`
- juger ce qui n'est pas dans le livrable évalué
- TODO-PACK

## Environnement
- service: <nom> → <url> — à activer si le pack en dépend : TODO-PACK ou ∅
- serveur fourni par le chef (`./bin/agentx env up <svc>`) ; agent : n'en lance aucun ; injoignable ⇒ `bloque`
- racine / `cd` / versions exactes des runs de référence : TODO-PACK
- lint/tests globaux verts sur HEAD au dispatch (TODO-PACK) : un KO global ⇒ préciser si le fichier est dans le livrable jugé
- banc hors `src` : config vitest dans `.sorties/` ; effort borné TODO-PACK min ; non réalisable ⇒ `NV — raison`
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Bash(npx:*, node:*, python3:*, rg:*, wc:*, find:*, ls:*, git diff:*)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack — **écrit avec l'outil Write** (un rendu seulement affiché est perdu) — dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
verdict: retenir | virer
motif: <≤ 200 car. si virer, sinon ∅>
---
## Livré
- VERDICT Txxx: retenir | virer — motif ≤ 1 ligne
- case n: OK | KO | HP — preuve
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
