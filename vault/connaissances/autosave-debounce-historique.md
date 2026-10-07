---
titre: auto-save + historique undo — 1 vérité locale, 1 canal PUT
resume: patron : historique = état affiché, PUT entier débouncé, écho ignoré, lastSent
source: dashboard-direct T002 T004 T009 T011
cree: 2026-10-06
tags: [note, pattern, autosave]
---

# Auto-save + historique undo

## Fait
- historique local (`useEditHistory`) = état affiché, vit toute la session ; 1 seul canal d'écriture : PUT entier débouncé 800 ms, 1 en vol max, `dirty` si geste pendant `saving`
- écho serveur ≠ vérité : `echo = fromServer(next)` ; resync `history.reset` seulement si ≠ écho ET statut `idle`
- `sameTabs` doit comparer `config` par contenu (`JSON.stringify(config ?? {})`), pas par référence → sinon écho ≠ → undo perdu
- `lastSent` doit être initialisé à `value` quand `enabled` passe true (et après `reset`) → sinon 1er schedule/Ctrl+S/flèche-contre-bord part en PUT inutile (D2)
- succès → `setError(null)` ; échec → `error`, ∅ retry auto, `flush` retente
- toast « Annuler » ≠ `undo` global (défait le dernier pas, pas celui du toast) → restore = `commit` fonctionnel réinsérant l'élément capturé
- `set` fonctionnel de l'historique s'applique sur `present` courant
- coalesce : drag onglet `'move-tab:'+id` ; nudge `'nudge:'+id` ; config `'config:'+id` ; fenêtre 1000 ms → 1 glisser > 1 s sans reorder = 2 pas
- NV : restore d'une case dont le widget a été re-ajouté → doublon (T012)
- NV : `onLayoutChange` en glisser > 800 ms avec `record=false` → fin de glisser jamais PUT

## Pourquoi ça compte
- 3 alternatives rejetées : PUT/geste + rendu cache (réponses désordonnées rembobinent) ; cache react-query optimiste (refetch écrase le geste) ; PATCH config séparé (courses PUT/PATCH)
- interdit : `setQueryData`/PATCH de la disposition hors hook ; `history.reset` hors effet resync
- limite : multi-poste = dernier PUT gagne

## Où
- `ortho-front/src/modules/dashboard/components/use-layout-autosave.ts` — hook
- `…/components/autosave.core.ts` + `.test.ts` — `sameTabs` (4 tests)
- `…/dashboard-page.tsx:157-186` — history, echo, commit, undo
- `vault/projets/dashboard-direct/decisions.md#2026-10-06`

## Voir aussi
- [[ortho-front-dashboard-carte]]
