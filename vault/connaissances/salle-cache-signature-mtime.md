---
titre: Salle multi-projets — cache par signature mtime
resume: bloc par étage recalculé seulement si (chemin, mtime_ns, taille) change
source: agentx-immeuble T002-T003, T007
cree: 2026-10-15
tags: [note, agentx, salle]
---

# Salle multi-projets : cache par signature

## Fait
- `_CACHE: slug -> (signature, bloc)` ; verrou `_CACHE_VERROU` (ThreadingHTTPServer).
- signature = (chemin, mtime_ns, taille) de brief/journal/todo + task/context/result de chaque tâche ; `os.stat` seul.
- `_doctor_rapide` → `_pack_rempli` relit context.md des tâches en-cours : à dire dans tout pack touchant le cache.
- trou connu : `roles.json` ∉ signature ⇒ changement de rôles non invalidé.
- trou connu : `rh.personnel()` relit ~118 task.md par poll, sans cache.
- `bin/dash.py`/`supervision.py` chargés au démarrage : relancer la salle après modif.

## Où
- `bin/dash.py:314-345` — `_CACHE`, `_signature`, `_bloc_projet`
- `bin/rh.py` — `personnel()`

## Voir aussi
- [[evaluer-sur-instantane]]
