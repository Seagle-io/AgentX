---
pack: {{ID}}
projet: {{PROJET}}
role: architecte
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type architecte : le chef écrit Mission, DoD spécifiques, WL, Contrats ; le reste est constant.

## Mission
Trancher TODO-PACK et produire le contrat (`chemin`) ; découper en tâches. 0 code.

## Definition of Done
- [ ] arborescence / structure vérifiées sur HEAD : `ls` / `rg` collés avant de trancher
- [ ] contrat ≤ 220 lignes : signatures, formats, erreurs, verbatim (collable en Contrats d'un pack)
- [ ] `decisions.md` du projet : entrée E en append (supersède en liant l'ancienne, jamais de réécriture)
- [ ] découpe en tâches : une ligne par tâche (rôle, WL ≤ 12, dépend de), parallélisables signalées
- [ ] questions refermées avec réponse ; hypothèses invalidées listées
- [ ] 0 code produit, 0 fichier source modifié
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (contrat à produire) | E | livrable |
| `TODO-PACK` (decisions.md du projet) | E | append |
| `TODO-PACK` (code existant) | L | vérifier structure |

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
```
TODO-PACK (contraintes amont recopiées verbatim)
```

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- écrire du code ; modifier `task.md`, `SKILL.md`, gardes, `vx.py`
- réécrire les dépendances des tâches existantes
- TODO-PACK

## Environnement
- aucun service ; WebSearch/WebFetch seulement si le pack l'autorise : TODO-PACK ou ∅
- faits CLI/outil non exécutables par toi : extraits recopiés en Contrats
- stack / versions : TODO-PACK
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit (+ WebSearch, WebFetch si autorisés)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack — **écrit avec l'outil Write** (un rendu seulement affiché est perdu) — dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- contrat: `chemin` — N l.
- décision: `decisions.md` E<n>
- tâches: Txxx rôle — WL n — dépend de
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
