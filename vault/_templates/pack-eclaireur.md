---
pack: {{ID}}
projet: {{PROJET}}
role: eclaireur
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type eclaireur : le chef écrit Mission, DoD spécifiques, WL, Contrats ; le reste est constant.

## Mission
Localiser TODO-PACK : coordonnées `chemin:L`, 0 dump. Lecture seule.

## Definition of Done
- [ ] question(s) du chef : réponse en coordonnées `chemin:L` + 1 ligne-fait chacune (TODO-PACK)
- [ ] chaque affirmation vérifiée (`rg -n` / mesure) : sortie brute collée, pas de dump de fichier
- [ ] ce qui n'existe pas : `∅` + commande qui le prouve
- [ ] `## Pour la suite` : ≤ 5 lignes collables telles quelles dans un pack (coordonnées, signatures verbatim)
- [ ] 0 écriture hors `result.md` et `.sorties/` ; 0 proposition de refonte (causes + leviers ≤ 8 mots)
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (zone à cartographier) | L | terrain |
| `TODO-PACK` (scripts de mesure) | E | `.sorties/` seulement |

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
∅

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- corriger, modifier, supprimer quoi que ce soit hors `result.md`
- `vault/projets/**` hors ton `result.md` ; `bin/vx.py`
- TODO-PACK

## Environnement
- service: <nom> → <url> — à activer si le pack en dépend : TODO-PACK ou ∅
- serveur fourni par le chef (`./bin/agentx env up <svc>`) ; agent : n'en lance aucun ; injoignable ⇒ `bloque`
- racine / `cd` / versions exactes des runs de référence : TODO-PACK
- machine partagée : ne supprimer que ce que la tâche a créé, par nom ; durée totale des mesures TODO-PACK min
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Bash(rg:*, ls:*, wc:*, cat:*, which:*, python3 -c:*)
- Arbre de travail partagé : aucune commande git qui modifie l'arbre ou l'index.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- `chemin:L` — fait (une ligne par coordonnée)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
