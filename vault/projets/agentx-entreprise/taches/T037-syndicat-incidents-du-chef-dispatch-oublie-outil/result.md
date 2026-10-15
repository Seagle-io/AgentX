---
tache: T037
projet: agentx-entreprise
statut: fait
---
## Livré
- vault/syndicat/2026-10-16-incidents-chef.md — 2 incidents mesurés, 6 revendications
- imputation : agent 0 · pack 4 (voix/T001 ×3, voix/T009) · chef 2 · mécanique absente 4
- constat clé : les 2 cas connus durent 9 et 1 min, donc sous le seuil de 15 min de T036 ; le doctor de T036 (`git ls-files`) est aveugle aux 10 livrables non suivis

## Vérifié comment
- `python3 m1.py` (journaux) → `en-cours transitions 328 closed 322 open 4` · `>15min 59` · `KNOWN agentx-voix T009 … 9 min` · `KNOWN seagle-pilotage T007 … 1 min` · `med 4 p90 30 n 322`
- `python3 -c Counter(bool(e['tid']))` sur run/evenements.jsonl → `Counter({False: 138})` ; 4 lignes `WRAP at 4|27|54|111`
- fenêtres rendus/sorties → `2026-10-16 … agent-fini 27` / `sorties en-cours 25` ; `2026-10-15 … agent-fini 57` / `sorties en-cours 56`
- `pret->en-cours n 260 >15min 14`
- `git ls-files bin dash outils .claude docs | xargs grep -nE "/home/[a-z]+/"` → ∅ `rc=123`
- `git ls-files --others --exclude-standard bin dash docs outils .claude` → 10 chemins (bin/dictee … outils/captures/kora.mjs)
- `git log --all --oneline -- <10 chemins>` → ∅
- `rg -n -i "portab|/home|shebang|…" voix/T001/context.md` → `:17 git ls-files --others … (3 lignes)` · `:70 shebangs inchangés (venvs ~/.local/share/*-venv) — dépôt personnel`
- `grep -n` sur run/evenements.jsonl → `115:… "00:07:21" … implementeur` · `137:… "00:32:45" … scribe`

## Écarts
- lecture hors WL : `rg` ciblé sur 6 `context.md` (voix/T001 T009 T011, sp/T004 T010 T014). Raison : DoD « si son pack exigeait la portabilité » ; budget de 5 dépassé si on compte par fichier
- lecture hors WL : `grep` sur produits.json, supervision.json et .claude/skills (chemins machine). Raison : complète la Mesure 2
- `stat` sur les result.md voix/ et sp/ : source de la DoD (mtime), hors table WL
- horaires du contrat (00:20 → 01:05) non retrouvés : 01:05 est postérieur à l'horloge (00:35) ; consigné en `## Sans donnée` du cahier
- au gel, voix/T012 avait déjà corrigé les shebangs et le device de bin/parle et bin/dictee : mesure faite sur l'arbre courant

## Pour la suite
- R1 : hook `Stop` chef, pour que les tâches pret ou en-cours sans dispatch empêchent la fin du tour (seuil 0 min au lieu de 15) ; champ `attente:` contre les 14 faux positifs
- R2 : le doctor de T036 doit aussi balayer `git ls-files --others` (10 livrables invisibles aujourd'hui)
- R3 : `retenir` doit refuser un fichier E non suivi sous bin/ dash/ outils/ docs/ ; la publication « par le chef » de T012 reste manuelle
- R4 : pack-lint doit imposer une vérification de portabilité dans la DoD si la WL contient un E exécutable (le gabarit de T036 reste contournable)
- R5 et R6 : todo « rendu non intégré » (12 cas) ; événements datés en ISO avec tid et projet (138/138 vides)

## Retour sur le pack
- Manquait : `vault/projets/*/taches/*/context.md` (L, `rg` seulement) dans la WL, exigé par la DoD Mesure 2 · `stat` result.md hors table WL · horaires du contrat incohérents avec le journal (T009 en-cours 00:23, pas 00:20) · `run/evenements.jsonl` sans tid ni date : la DoD « ni événement agent » ne peut pas être appliquée par tâche
- Inutile : ∅
