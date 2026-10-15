# Decisions — AgentX entreprise : rôles, remplacement des agents défaillants, skills, salle de pilotage

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-15 — cadrage (humain)
- rôles neufs : evaluateur, relecteur, testeur, designer, securite, devops — choix humain
- remplacement : évaluation → viré (`rejete`, motif) → chef corrige pack → tâche remplaçante liée — pas d'auto-relance
- console → poste de pilotage : actions par tâche, palette ⌘K, terminal en tiroir
- skills : officiels anthropics/skills + maison tirés de `vault/connaissances`
- registre unique `roles.json` racine — 4 listes en dur aujourd'hui
- dossier RH calculé depuis task.md — 0 stockage neuf, pas de fake
- serena retiré partout (MCP, binaire, `.serena/`) — demande humaine

## 2026-10-15 — contrat T002
- **Contexte** : 4 implémenteurs parallèles sans canal → 1 propriétaire Python par règle ; front sans logique de permission.
- **Choix** : `roles.json` (13, champs `livre_en`/`juge`/`objet`) + `bin/roles.py` + `bin/rh.py` ; serveur calcule `taches[].actions` ; [[contrat]] C1-C10.
- **Choix** : `set` refuse →rejete, →fait si livre_en=revue, depuis rejete ; reste permissif (compat).
- **Choix** : dep en `revue` satisfaite pour rôles `juge` — sinon évaluateur jamais ready.
- **Choix** : `retenir` exige évaluation `fait` verdict retenir, sauf `--sans-eval` (CLI seul).
- **Choix** : registre KO → hooks replient sur `.claude/agents/<nom>.md` ; vx `tache/virer/doctor` rc 3.
- **Écarté** : listes en dur ×8 sites parce que 1 rôle = 8 edits, dérive.
- **Écarté** : GET `/roles.json` séparé parce que 2 sources de vérité front.
- **Conséquence** : ajouter un rôle = 1 entrée JSON + 1 agent .md ; front L3/L4 séquentiels (3 fichiers partagés).
- **Conséquence** : 1er `virer` = point de non-retour (rejete, liens, deps réécrites).
- **À revoir si** : > 12 rôles affectables (grille salle déborde) ou chef contourne `retenir` par `--sans-eval` > 1/3.

## 2026-10-15 — correctifs après vérif T016 / éval T012

- **Décision** : motif collé dans une commande à copier = `shlex.quote(motif)`, jamais `"{motif}"` ; supersède le gabarit `--motif "{eval_motif}"` de §C5/C6/C8.
- **Décision** : allocation d'id (`tache`, `virer`) sous `flock` exclusif sur `vault/projets/<slug>/.verrou` ; `executer` de dash.py sous `threading.Lock` ; `mkdir(exist_ok=False)`.
- **Décision** : `doctor` sur registre invalide → rc 3 + ligne `x` (écart T007 entériné ; bin/agentx teste rc≠0).
- **Décision** : salle sans épingle → projet non clos au `journal.md` le plus récent, plus le 1er alphabétique.
- **Pourquoi** : T016 D1 (2 `virer` parallèles → 2 T014), D2 (backtick du motif exécuté au collage), capture T014 (salle sur seagle-site).

## 2026-10-15 — rôles métier (T021, éval T022)

- **Décision** : 5 rôles affectables ajoutés — `juriste` (droit + fiscalité), `tresorier`, `produit`, `marketing`, `rssi` (gouvernance ≠ `securite`) ; tous livrent en `revue`.
- **Décision** : trésorier — taux et barèmes publics admis s'ils sont sourcés (URL + date de consultation) ; montants de l'entreprise : fichiers du pack seulement.
- **Conséquence** : packs des rôles métier → `vault/artefacts/<projet>/<TID>/` en E dans la WL ; liste des producteurs de la consigne chef (`terminal.py:43`) supersède le texte de `agentx-immeuble/contrat.md` §C6 sur ce point.

## 2026-10-16 — économies de tokens (humain, après étude syndicat T039)
- **Décision** : sessions chef courtes (R1-R2 : session neuve par vague ou projet, plafond 150k de contexte, `/clear` après une pause > 1 h, état relu par le vault) ; gabarit économe (R3, R5, R7) ; modèle ET niveau d'effort adaptés au besoin de chaque tâche (demande humaine), imposés au dispatch.
- **Écarté pour l'instant** : vérificateurs/évaluateurs cadrés (R4, R8, R9).
