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
Condenser {{PROJET}} sur {{TIDS}} en notes atomiques réutilisables, compacter, améliorer les gabarits, appliquer les amendements ci-dessous. Raison : {{RAISON}}

## Definition of Done
- [ ] notes atomiques `vault/connaissances/<slug>.md` (gabarit `note.md`) : ≤ 40 lignes, 1 fait réutilisable hors projet, collable sans retouche
- [ ] compaction sans perte : toute information retirée déplacée vers `[[slug]]`
- [ ] `result.md` / `decisions.md` jamais réécrits (append-only) : extraire, superséder en liant
- [ ] brief : carte du terrain, hypothèses invalidées, questions refermées (avec réponse)
- [ ] plan : statuts réels, tâches apparues, vagues restantes
- [ ] env.md à jour
- [ ] 1 ligne `## Livré` par amendement
- [ ] `## Retour sur le pack` de la vague agrégés ; même manque ≥ 2 fois ⇒ défaut de gabarit, proposé en `## Pour la suite`
- [ ] `python3 bin/vx.py index` puis `python3 bin/vx.py doctor` : sorties collées
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/{{PROJET}}/brief.md` | E | carte du terrain |
| `vault/projets/{{PROJET}}/plan.md` | E | statuts |
| `vault/projets/{{PROJET}}/decisions.md` | E | append-only |
| `vault/projets/{{PROJET}}/env.md` | E | environnement |
| `vault/connaissances/` | E | notes |
| `vault/projets/{{PROJET}}/taches/*/result.md` (vague) | L | source |
{{CIBLES_WL}}

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
Sources lues : `{{INTEGRER}}`
Amendements :
{{AMENDEMENTS}}

## Décisions actées
- `result.md` jamais modifié ; `decisions.md` : superséder, pas réécrire
- compaction : déplacer vers `[[slug]]`, jamais supprimer — 0 perte

## Hors périmètre
- code, `bin/*`, `outils-test/` ; `todo.md` ; archivage du projet (chef, après validation humaine)
- autres projets du vault ; fichiers hors WL
- frontmatter des tâches : statuts par le CLI seulement

## Environnement
- Période : {{PERIODE}}
- vault Obsidian : markdown + frontmatter YAML, `[[wikilink]]`, `tags:`, 0 HTML
- `python3 bin/vx.py index` régénère INDEX.md (jamais édité à la main)
- jamais `rm`, jamais git ; arbre partagé : jamais `git stash`, `checkout --`, `reset`, `clean`
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, Grep, Glob, Bash(python3 bin/vx.py index, python3 bin/vx.py doctor, rg:*, ls:*, head:*)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.
- jamais `statut:` du brief (clos, archive) par le scribe — clôture = chef, après accord explicite de l'humain, `vx archive <slug>` (incident 2026-10-20 08:30)

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- [[<id>]] appliqué → chemin:L | [[<id>]] non appliqué — raison
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
