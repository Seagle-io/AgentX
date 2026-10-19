---
pack: {{ID}}
projet: {{PROJET}}
role: scribe
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Capitaliser {{PROJET}} sur {{TIDS}} + appliquer les amendements ci-dessous. Raison : {{RAISON}}

## Definition of Done
- [ ] notes atomiques créées pour tout fait réutilisable hors projet (≤ 40 lignes)
- [ ] brief.md, plan.md, env.md à jour (statuts réels, hypothèses invalidées)
- [ ] 1 ligne `## Livré` par amendement
- [ ] `python3 bin/vx.py index` puis `doctor` collés
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/{{PROJET}}/brief.md` | E | carte du terrain |
| `vault/projets/{{PROJET}}/plan.md` | E | statuts |
| `vault/projets/{{PROJET}}/decisions.md` | E | append-only |
| `vault/projets/{{PROJET}}/env.md` | E | environnement |
| `vault/connaissances/` | E | notes |
{{CIBLES_WL}}

## Contrats
Sources lues : `{{INTEGRER}}`
Amendements :
{{AMENDEMENTS}}

## Décisions actées
- `result.md` jamais modifié ; `decisions.md` : superséder, pas réécrire

## Hors périmètre
- code ; fichiers hors WL

## Environnement
Période : {{PERIODE}}. Arbre partagé : jamais `git stash`, `checkout --`, `reset`, `clean`.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(python3 bin/vx.py:*)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

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
- note créée : `slug` — 1 ligne
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
