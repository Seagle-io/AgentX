---
tache: T002
statut: fait
---
## Livré
- contrat.md:L13-22 — C0 options A/B/C, choix B
- contrat.md:L23-77 — C1 schéma `immeuble`, todo_total, alertes
- contrat.md:L78-92 — C2 ordre activité, dormance 7 j, sous-sol
- contrat.md:L93-115 — C3 ?projet=, refus 200, hash `#/slug`
- contrat.md:L116-129 — C4 todo agrégée, tri, plafond 40
- contrat.md:L130-155 — C5 événement `projet`, `projet_de()` 3 règles
- contrat.md:L156-193 — C6 CONSIGNE_CHEF + PROGRAMME verbatim
- contrat.md:L194-251 — C7 signatures serveur, séquence, budget perf
- contrat.md:L252-313 — C8 HTML coupe, fonctions JS, 390 px
- contrat.md:L314-354 — C9 lots L1/L3/L2, WL, DoD
- contrat.md:L355-360 — point de non-retour
- decisions.md:L5-10 — entrée 2026-10-15 append
## Vérifié comment
Grep "^" count contrat.md → 360
Grep "TODO" count contrat.md → No matches found (TODO_MAX renommé PLAFOND_CHEF)
Grep "^##+ " contrat.md → 12 sections, 0 vide
coût : non re-mesuré (∅ outil Bash dans cette session) ; base T001 0.0698 s/appel ; mesure à coller par L1 = C7 « Performance »
## Écarts
- lecture hors WL: bin/supervision.py:314-348 (Grep) — sémantique slug de suggestions() → sonde = toit
- lecture hors WL: bin/vx.py:169-182,458-472 (Grep) — board sans --projet = tous projets (consigne chef)
- Bash absent : mesure perf + wc -l remplacés par Grep count
- DoD pack « source : chemin du result.md lu par sonnerie » faux : sonnerie lit `last_assistant_message` → `projet_de` : frontmatter `projet:` → chemin vault/projets/<slug>/taches → TID+rôle unique (en-cours)
- sonde rouge par étage impossible sans donnée (supervision.json ∅ lien projet) → alerte sonde au toit ; étage = bloque|urgent
## Pour la suite
- choix : 1 state.json = global + `immeuble` résumé (cache `_bloc_projet` signature mtime_ns/taille) + détail `?projet=` ; hash `#/slug`
- interdit : tout calcul par étage hors `_bloc_projet` ; relire context/result d'un étage à signature inchangée ; muter un bloc en cache
- vague 1 (1 message) : L1 serveur (dash.py E ; vx.py, supervision.py L) ∥ L3 chef/sonnerie (terminal.py, sonnerie.py E ; agentx L)
- vague 2 : L2 front (dash.js, index.html, dash.css E) après L1 `retenir` + salle relancée par l'humain
- packs : L1 ← C1-C5,C7,C9 L1 · L3 ← C5,C6,C9 L3 · L2 ← C1,C3,C4,C5,C8,C9 L2 (≈ 120-150 l. recopiées chacun)
- seuil d'arrêt L1 : médiane chaude > 300 ms → `bloque`
- après L3 : humain ■ arrêter / ▶ lancer le chef (nouvelle consigne)
- piste scribe : gabarit result.md + `projet:` en frontmatter → sonnerie règle 1 suffit
## Retour sur le pack
- Manquait: sémantique `supervision.suggestions(sup, slug)` (slug = cmd seulement) ; comportement `agentx board` sans --projet ; signatures `lister_projets`/`lister_taches` ; Bash listé autorisé mais outil absent
- Inutile: ∅
