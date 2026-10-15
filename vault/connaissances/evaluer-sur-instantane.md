---
titre: Évaluer sur instantané en arbre partagé
resume: snap-<T> + Δ + hunks de référence quand plusieurs lots éditent les mêmes fichiers
source: agentx-entreprise T013-T015, T021-T022 ; agentx-immeuble T003, T013, T014
cree: 2026-10-15
tags: [note, agentx, evaluation]
---

# Évaluer sur instantané

## Fait
- `git diff --stat` ne vaut que si 1 commit = 1 tâche : HEAD multi-lots (29 fichiers, 5-6 tâches) ⇒ attribution impossible.
- fichier déjà `M` avant le lot ⇒ DoD « 1 hunk » invérifiable.
- remède 1 : le chef commite AVANT le lot.
- remède 2 : instantané `.cache/snap-<T>/` des fichiers E, évaluateur lit l'instantané.
- remède 3 : donner SHA par lot + hunks/compteurs de référence au pack.
- mesure sur vault vivant : comparer des Δ, pas des valeurs absolues.
- état absent du vrai vault (0 dormant, 0 urgent, 0 étage > 4 agents) ⇒ injecter `state.json` au banc.
- Playwright sur la salle : intercepter `/api/term/*`.

## Pourquoi ça compte
- 7 manques « baseline/coordonnee/environnement » sur 40 viennent de là.

## Où
- `vault/_templates/context.md` § Environnement — lignes correspondantes
- `vault/_templates/pack-verificateur.md` § Environnement

## Voir aussi
- [[agentx-remplacement-agent-virer]]
- [[salle-cache-signature-mtime]]
