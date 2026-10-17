---
pack: {{ID}}
projet: {{PROJET}}
role: scribe
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type scribe : le chef écrit Mission, DoD spécifiques, WL, Contrats ; le reste est constant.

## Mission
Condenser TODO-PACK en notes atomiques réutilisables, compacter, améliorer les gabarits.

## Definition of Done
- [ ] notes atomiques `vault/connaissances/<slug>.md` (gabarit `note.md`) : ≤ 40 lignes, 1 fait réutilisable hors projet, collable sans retouche
- [ ] compaction sans perte : toute information retirée déplacée vers `[[slug]]`
- [ ] `result.md` / `decisions.md` jamais réécrits (append-only) : extraire, superséder en liant
- [ ] brief : carte du terrain, hypothèses invalidées, questions refermées (avec réponse)
- [ ] plan : statuts réels, tâches apparues, vagues restantes
- [ ] `## Retour sur le pack` de la vague agrégés ; même manque ≥ 2 fois ⇒ défaut de gabarit, proposé en `## Pour la suite`
- [ ] `python3 bin/vx.py index` puis `python3 bin/vx.py doctor` : sorties collées
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (note connaissances) | E | notes |
| `TODO-PACK` (result.md de la vague) | L | source |
| `TODO-PACK` (brief / plan du projet) | E | mise à jour |

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
∅

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- code, `bin/*`, `outils-test/` ; `todo.md` ; archivage du projet (chef, après validation humaine)
- autres projets du vault
- TODO-PACK

## Environnement
- vault Obsidian : markdown + frontmatter YAML, `[[wikilink]]`, `tags:`, 0 HTML
- `python3 bin/vx.py index` régénère INDEX.md (jamais édité à la main)
- jamais `rm`, jamais git
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Glob, Bash(python3 bin/vx.py index, python3 bin/vx.py doctor, rg:*, ls:*, head:*)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- `vault/connaissances/<slug>.md` — résumé 1 ligne
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
