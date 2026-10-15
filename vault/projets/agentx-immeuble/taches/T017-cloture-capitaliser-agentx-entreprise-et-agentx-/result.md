---
tache: T017
projet: agentx-immeuble
statut: fait
---
## Livré
- `vault/_templates/context.md` § Environnement/Contrats — +7 lignes : multi-lots, snap, Δ, marqueur scindé, outils/CLI, /api/term, forme d'objet
- `vault/_templates/pack-verificateur.md` § Environnement — +2 lignes : /api/term obligatoire, statuts/snap/Δ
- tableau manque → action :
  - autre 15 → ∅ ajouté : hétérogène (comportements propres à chaque tâche), déjà couvert par « prémisse de comportement »
  - contrat 6 → +ligne « forme d'objet consommé » (clés, format nombre)
  - coordonnee 5 / baseline 3 → +ligne multi-lots (SHA par lot, hunks de départ)
  - outil 5 → +ligne outils absents + syntaxe CLI exacte
  - environnement 4 → +lignes snap, Δ, injection state.json
  - wl 2 → ∅ : « fichier cité en DoD ⇒ L » déjà au gabarit
- todo entreprise : 4/16 → [x] (preuve inline) ; 12 gardées ; 0 supprimée
- todo immeuble : 1/6 → [x] (`bin/sonnerie.py:45`) ; 5 gardées ; R6-R10 syndicat ≠ appliquées, non listées en todo (0 ligne existante)
- briefs entreprise + immeuble — `## Bilan` ajouté (≤ 8 lignes), `statut:` inchangé
- `vault/connaissances/agentx-remplacement-agent-virer.md` — virer → remplaçante → 2e renvoi opus
- `vault/connaissances/evaluer-sur-instantane.md` — snap, Δ, hunks, state.json, /api/term
- `vault/connaissances/salle-cache-signature-mtime.md` — cache par étage, trous roles.json/personnel()
## Vérifié comment
```
python3 bin/vx.py index → index ecrit : vault/INDEX.md (9 projet(s))
python3 bin/vx.py doctor → vault coherent. (rc=0)
vx manques --projet agentx-entreprise → 28 Manquait ; --projet agentx-immeuble → 12
rg -I 'snap-|--no-index|/api/term' vault/_templates → absent avant, présent après
```
## Écarts
- ∅ (0 lecture hors WL ; bin/vx.py, bin/dash.py, bin/sonnerie.py lus via rg/sed -n seulement)
- todo entreprise L15 `_pack_remplacant` NV : rg « Seule source » bin/*.py → ∅, gardée
## Pour la suite
- chef : clore (`statut:`) les 2 projets ; commiter les templates
- trancher R6-R10 syndicat (refusées) : à ajouter en todo si gardées
- défaut de gabarit récurrent : DoD `git diff --stat` en arbre partagé (6 manques) → chef commite avant lot
- à corriger côté code : signature `_signature` sans `roles.json`, `rh.personnel()` sans cache
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
