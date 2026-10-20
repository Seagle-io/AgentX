---
pack: {{ID}}
projet: {{PROJET}}
role: syndicat
cree: {{DATE}}
---

# Pack {{ID}} — Enquête BLQ-contrat {{TID}}
> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Établir la cause du blocage de {{TID}} ({{CONTRAT}}) → cahier §8 `vault/syndicat/enquetes/{{DATE}}-{{PROJET}}-{{TID}}.md`.
## Definition of Done
- [ ] 1. lu, cause ∈ contrat-faux | dod-opposees | pack-perime | mesure-absente (1 ligne) : `{{RESULT}}` (question, `## Écarts`), `{{CONTEXT}}`, `{{CONTRAT_CHEMIN}}`, `vault/projets/{{PROJET}}/decisions.md`
- [ ] 2. preuve suffisante → cahier directement ; sinon ≤ 3 tâches d'enquête (`python3 bin/vx.py tache "<titre>" --projet {{PROJET}} --role eclaireur|architecte|verificateur --dep {{ID}}`) + 1 « Conclure enquête {{TID}} » (syndicat, deps = ces tâches), packs écrits par toi, `pack-lint` OK
- [ ] 3. jamais `vx set|virer|retenir|renoncer|dispatch` ni édition de pack, contrat, gabarit : amendement = brouillon du cahier
- [ ] 4. question à l'humain (si besoin) en français courant, 1 ligne « problème ⇒ proposition ⇒ effet » + `→ {{CAHIER}}` ; 0 code R1/A/B, 0 chemin dans la ligne
- [ ] `result.md` rempli selon « Format de sortie »
## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `{{RESULT}}` | L | question et mesure de l'agent bloqué |
| `{{CONTEXT}}` | L | pack de {{TID}} : DoD, Contrats |
| `{{CONTRAT_CHEMIN}}` | L | contrat cité ({{CONTRAT}}) |
| `vault/projets/{{PROJET}}/decisions.md` | L | décisions liées au contrat |
| `vault/syndicat/enquetes/{{DATE}}-{{PROJET}}-{{TID}}.md` | E | cahier |
| `vault/projets/{{PROJET}}/taches/` | E | tâches d'enquête via `vx tache`, ≤ 3 |

## Contrats
Question de {{TID}} : {{QUESTION}}
Cahier (append-only ensuite) :
```markdown
---
tags: [syndicat, enquete]
projet: {{PROJET}}
tache: {{TID}}
enquete: {{ID}}
contrat: <note>@vN
cause: contrat-faux | dod-opposees | pack-perime | mesure-absente
date: {{DATE}}
---
## Cause
- <cause> — 1 ligne
## Preuve
- `chemin:L` « … » ↔ `commande → sortie brute`
## Proposition
- brouillon non appliqué : « ## vN+1 — AAAA-MM-JJ — raison » + lignes | correction pack {{TID}} (DoD n → …) | ligne de gabarit (`_templates/context.md` § …)
## Coût
- agents : tâches d'enquête + conclusion ; durée : création {{ID}} → fait (journal.md)
```
`garde_bash` (appelant = syndicat) :
```
set, virer, retenir, renoncer, dispatch      → deny « vx <sc> — réservé au chef »
tache, --role ∉ eclaireur|architecte|verificateur → deny « enquête : eclaireur|architecte|verificateur seulement »
tache, --dep ∌ ton TID                       → deny « --dep <ton TID> obligatoire »
≥ 4 tâches ayant déjà ton TID en deps        → deny « enquête : 3 sous-tâches + 1 conclusion max »
```
## Décisions actées
- nom du cahier `<date>-<projet>-<TID>` — TID non unique entre projets
- le chef tranche ; {{TID}} jamais relancé (règle 4)
## Hors périmètre
- amender contrat, pack ou gabarit ; `virer` {{TID}}
## Environnement
- racine AgentX ; lecture libre : `rg`, `wc`, `diff`, `python3 -c` ; refusés : `sed -i`, git modifiant l'arbre, `rm`
## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write (cahier, result.md), Bash(rg:*, wc:*, diff:*, python3 bin/vx.py tache:*, python3 bin/vx.py pack-lint:*)
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
- cahier: vault/syndicat/enquetes/{{DATE}}-{{PROJET}}-{{TID}}.md — cause: <cause>
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : décision attendue du chef (accepte | refuse), proposition en 1 ligne
- question humaine ⇒ `- [ ] ? … → vault/syndicat/enquetes/<cahier>.md` (todo.md, bouton Voir)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
