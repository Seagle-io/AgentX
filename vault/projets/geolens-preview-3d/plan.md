---
projet: geolens-preview-3d
tags: [plan]
---

# Plan — preview 3D

Source des hypothèses : T001 (H1-H15). Banc : [[geolens-charge-3d]] T034 (`G/e2e/bench-tileset.mjs`, `bench-3d.mjs`).

## Vague 0 — banc et référence
- charge-3d T034 banc (en cours) → charge-3d vérif du gel D24
- T002 verificateur : mesure de référence au banc de H1-H6, H8-H11, H13-H15 (confirme / infirme, chiffres)

## Vague 1 — qualité à l'arrêt (après T002)
- L1 loader : plancher 0,5 px (D1), garde 90 % avec hystérésis + budget, watchdog restauré et limité aux tuiles, backpressure sans blocage, anisotropie, retry des tuiles en échec, caméra active (écoute contrat S1)
- S1 SceneManager : dpr réel relu au changement (D1), événement de changement de caméra (contrat), near/far unifiés si T002 confirme H14
- vérif L1 + S1

## Vague 2 — chargement sobre
- L2 loader : purge des tuiles non utilisées à la reprise du gel, priorité frustum avant profondeur, saut direct au plancher après 500 ms, coût CPU par tuile (traverse)
- vérif L2

## Vague 3 — capitalisation
- scribe : notes banc + preview 3D
