---
tags: [syndicat]
perimetre: tous
date: 2026-10-16
---
Gel : `date -Is → 2026-10-16T00:35:07+02:00`. Complète [[2026-10-15-tous]] (non répété). Abrév. : ent agentx-entreprise · voix agentx-voix · sp seagle-pilotage · ss seagle-site · dg dashboard-grille · gc geolens-charge-3d · gv geolens-viewer · imm agentx-immeuble.

## Incidents
1. préparé mais pas lancé — voix/T009, sp/T007 (humain 2026-10-16)
   - voix/T009 : `pret -> en-cours 00:23` `voix/journal.md:36` · `en-cours -> fait 00:32` `:51` · result.md mtime 00:32:38 · agent-fini scribe 00:32:45 `run/evenements.jsonl:137`
   - sp/T007 : `pret -> en-cours 00:06` `sp/journal.md:27` · `-> revue 00:07` `:32` · result.md mtime 00:07:13 · agent-fini implementeur 00:07:21 `run/evenements.jsonl:115`
   - horaires du contrat « 00:20 → relancé 01:05 » non retrouvés : 01:05 > horloge 00:35 ; durée réelle de l'oubli ∅ donnée (aucun horodatage de dispatch)
2. livré non portable — bin/parle, bin/dictee, docs/INSTALL-voix.md (guide de Sylvain)
   - shebang `/home/jdrac/…` + `device="cuda"` : constatés par voix/T009 (contrat voix/T012) ; au gel déjà corrigés dans l'arbre par voix/T012 (`bin/parle:1`, `bin/dictee:1` → `/usr/bin/env python3` ; `bin/dictee:63,81-82` device auto)
   - non publié : 10 livrables non suivis par git, 0 commit toutes branches (détail Mesure 2)

## Mesure
### 1 — préparé mais pas lancé
- transitions `-> en-cours` : 328 · closes 322 · ouvertes 4 (ent/T036 T037, voix/T012 T013, < 3 min) — `m1.py` (parse journaux)
- `en-cours` > 15 min : 59/322 · méd 4 min · p90 30 — idem
- dont rendu non intégré (result.md écrit ≤ 10 min après en-cours, statut avancé bien après) : 12 — dg/T005 5671 min (result +3) · dg/T007 5457 (+7) · imm/T018 253 (+32) · gc/T031 128 (+2) · ss/T003 125 (+17) · gv/T064 83 (+3) · ent/T001 70 (+1) · dg/T004 32 (+10) · gv/T014 22 (+2) · gv/T016 22 (+3) · gv/T017 22 (+7) · gc/T001 16 (+2)
- 47 autres : result mtime ≈ fin d'en-cours → agent long OU dispatch tardif, indiscernables — ∅ heure de dispatch
- cas connus : voix/T009 9 min · sp/T007 1 min → sous le seuil 15 min, invisibles à la mesure
- rendus vs sorties (fenêtres datables) : 10-16 00:00-00:33 agent-fini 27 / sorties en-cours 25 + 2 virées depuis en-cours · 10-15 13:44-23:51 57 / 56 → 0 tâche close sans agent
- `pret -> en-cours` > 15 min : 14/260 — voix/T001 T002 285 min `voix/journal.md:13-16` · ss/T001-T011 106-113 · gv/T019 28 · ss/T016 20 (vagues entières : attentes probables, ∅ motif)
- `run/evenements.jsonl` : 138/138 `tid` vide, 138/138 `projet` vide, `t` = HH:MM:SS sans date (4 retours à zéro) — `python3 -c Counter(bool(e['tid']))` → `{False: 138}`
- charge chef 10-16 00:00-00:36 : 4 projets · 32 `-> en-cours` · 29 créées · 8 virées (sp 16/17/6, voix 12/8/2) — `grep -c` journaux
### 2 — livré non portable
- `git ls-files bin dash outils .claude docs | xargs grep -lE "/home/[a-z]+/"` → ∅ (rc 123) : les fichiers de l'incident ne sont pas suivis
- `git ls-files --others --exclude-standard bin dash docs outils .claude` → 10 : bin/dictee bin/parle bin/parle_hook.py bin/produits.py bin/publier.py bin/voix.py docs/INSTALL-voix.md outils/captures/{capturer,geolens,kora}.mjs
- `git log --all --oneline -- <ces 10>` → ∅ ; dernier commit b9199fa 10-15 23:43 (publication ent/T034) < voix/T001 en-cours 10-16 00:14
- sur ces 10 au gel : `/home/` → `docs/INSTALL-voix.md:81` (texte sur l'ancien shebang) · shebang absolu 0 · `cuda` forcé → `docs/INSTALL-voix.md:11` (texte) ; code déjà corrigé par voix/T012
- configuration machine (≠ exécutable) : produits.json 17 lignes `~/Documents/Workspace/…` (non suivi) · supervision.json:12-14 (non suivi) · `.claude/skills/conventions-geolens/SKILL.md:7`, `conventions-orthopro/SKILL.md:8` · exemples tiers `.claude/skills/webapp-testing/examples/*.py` `/mnt/user-data/`

| livrable | tâche | pack exigeait portabilité ? |
|---|---|---|
| bin/parle:1, bin/dictee:1 shebang `/home/jdrac` | voix/T001 `voix/journal.md:15-27` | non — exigé contraire : « shebangs inchangés (venvs) — dépôt personnel » `voix/T001/context.md:70` |
| bin/dictee `device="cuda"` | voix/T001 (script pré-vault versionné) | non — « NV d'exécution (charge Whisper GPU + micro) » `:23`, 0 repli |
| 3 scripts voix non suivis | voix/T001 | non — DoD exige non suivis : `git ls-files --others … bin/` → 3 lignes `:17` |
| guide sur prémisse fausse | voix/T009 `voix/journal.md:36-51` | oui portabilité (`:19` jamais `/home/jdrac`) ; prémisse « le dépôt contient bin/parle… » `:18` fausse |
| bin/produits.py, bin/publier.py, outils/captures/*.mjs non suivis | sp/T010, sp/T014, sp/T004 | non — 0 occurrence `portab|/home|shebang|ls-files` dans leurs packs |
| bin/voix.py non suivi | voix/T011 | non — idem |

## Imputation
- 1 oubli de dispatch → chef (oubli d'action) + mécanique absente : `vx set en-cours` à la main sans `Agent` possible ; 0 événement dispatch ; charge 32 dispatch/36 min sur 4 projets — agent 0
- 1 rendu non intégré (12 cas) → mécanique absente : 0 signal « result.md présent, statut en-cours » — chef
- 2a shebang `/home` → pack (exigence contraire `voix/T001/context.md:70`) + gabarit (0 ligne portabilité ; T036 l'ajoute) — agent 0, conforme au pack
- 2b CUDA forcé → pack (repli CPU absent de la DoD voix/T001) — agent 0
- 2c non publié → pack (DoD voix/T001 `:17` exige non suivi) + chef (publication T034 antérieure, non relancée) + mécanique absente (`retenir` accepte des fichiers E non suivis) ; évaluateur voix/T003 a retenu sur la DoD du pack — agent 0
- 2d guide → pack (prémisse fausse voix/T009 `:18`) ; le scribe a signalé les shebangs comme exigé `:19`

## Revendications
1. Oubli invisible au seuil : cas connus 9 et 1 min < filet T036 « pret > 15 min » ; 32 dispatch/36 min — Mesure 1 → hook `Stop` sur la session chef : fin de tour avec tâche `pret` (pack validé, deps OK) ou `en-cours` sans événement dispatch → refus d'arrêt + liste TID ; champ `attente: <motif>` pour les vagues retenues (14/260 attentes > 15 min = faux positifs du filet T036) → oubli détecté à 0 min, avant l'humain · coût : 1 hook + 1 champ · T036 : ∅ (filet à 15 min seulement)
2. Doctor aveugle sur l'incident : `git ls-files … | grep /home` → ∅ alors que 10 livrables sont non suivis — Mesure 2 → doctor T036 balaie aussi `git ls-files --others --exclude-standard` + item todo « livrable non suivi (non publié) : <chemin> » → incident 2 détecté (aujourd'hui 0/10) · coût : 1 option `cmd_doctor` · T036 : non couvert (contrat `git ls-files` seul, `attendu bin/parle:1` impossible)
3. Publication manuelle : 10 livrables, 0 commit ; T012 « publication faite par le chef » = même classe que l'incident 1 — `voix/T012/context.md` Décisions → `retenir` refuse (ou avertit) si un fichier E sous bin/ dash/ outils/ docs/ est non suivi ; ou tâche `publier` créée et dépendante d'office → 0 livrable retenu non publiable · coût : 1 contrôle `retenir` · T036, T012 : non couvert
4. Pack contraire à la portabilité : voix/T001 `:70` « dépôt personnel » + `:17` non suivi, retenu par voix/T003 — Imputation 2a/2c → pack-lint : WL avec E sous bin/ dash/ outils/ → DoD doit contenir `grep -nE "/home/[a-z]+"` → ∅, shebang `/usr/bin/env`, dépendance matérielle avec repli ; KO sinon (la ligne gabarit T036 reste contournable par un pack) → 6/6 packs livreurs de la Mesure 2 auraient été KO · coût : 1 règle lint
5. Rendus non intégrés : 12 tâches, result écrit +1 à +32 min, statut avancé 16 à 5671 min après — Mesure 1 → todo prio 1 « T0xx a rendu (result.md), statut en-cours — intégrer » (événement SubagentStop ou mtime) → 12 attentes chef supprimées · coût : 1 règle `_todo` · T036 : non couvert
6. Événements inexploitables : 138/138 `tid` et `projet` vides, `t` sans date — `run/evenements.jsonl` → `sonnerie.py` écrit `t` ISO daté + tid/projet (corrélation avec l'événement dispatch T036 par ordre/agent) → durée de dispatch, durée agent, « dispatch sans rendu » mesurables (aujourd'hui ∅) · coût : `bin/sonnerie.py` · T036 : partiel (dispatch daté HH:MM:SS seulement, rendus sans tid)

## Sans donnée
- heure réelle de lancement de chaque agent (0 événement dispatch avant T036) → durée de l'oubli voix/T009, sp/T007
- horaires du contrat (00:20 / 01:05) — absents du vault
- dates des événements 0-53 de `run/evenements.jsonl` (`t` sans date)
- motif des 14 attentes `pret` > 15 min (choix chef ou oubli)
- installation réelle chez Sylvain (seul le guide existe)
