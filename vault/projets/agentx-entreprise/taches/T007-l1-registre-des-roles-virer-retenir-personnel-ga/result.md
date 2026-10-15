---
tache: T007
statut: fait
---
## Livré
- `roles.json`:L1-L18 — §C1 verbatim, 13 rôles
- `bin/roles.py`:L1-L157 — registre, validation C1, cache mtime, API §C2
- `bin/rh.py`:L1-L43 — `personnel(projet)` §C5, projets + archives
- `bin/vx.py`:L27-L38 — `import roles`, ROLES/MODELES/STATUTS/STATUT_FERME/MARQUEUR
- `bin/vx.py`:L226-L299 — `tache` rc 3 + modèle registre ; `set` 3 refus §C3
- `bin/vx.py`:L301-L436 — `_pack_remplacant`, `virer`, `retenir`, `personnel`
- `bin/vx.py`:L444-L580 — board/ready via `dep_satisfaite` ; integrer évaluateur + rejete
- `bin/vx.py`:L687-L720 — doctor : registre, statut inconnu, rejete, deps rejetées
- `bin/vx.py`:L766-L787 — argparse `virer`/`retenir`/`personnel`, `--role` `choices=ROLES or None`
- `bin/garde_dispatch.py`:L30-L67 — `roles.est_role_agentx` + repli ; refus rôle ≠ subagent_type
- `bin/sonnerie.py`:L30-L63 — `roles.est_role_agentx` + repli ; champ `verdict`
## Vérifié comment
Banc `.cache/banc-T007` (recette pack), projet `demo`. Supprimé en fin.
```
roles.charger → 13 ('eclaireur','architecte','designer','implementeur','testeur','devops','verificateur','relecteur','securite','evaluateur','scribe')
couleur #FFF : tache → "vx: erreur: roles.json invalide : roles[0].couleur : #FFF invalide" rc=3 · board rc=0 · doctor "x roles.json invalide : …" rc=3
tache --role evaluateur rc=0 modele: opus · --role inconnu → "invalid choice: 'inconnu'" rc=2 · implementeur → modele: inherit
set T001 --statut rejete → "rejete : passe par `virer T001 --motif \"...\"`" rc=1
set T001 --statut fait (revue) → "T001 (implementeur) livre en revue : `retenir T001`" rc=1
set T001 a-faire|--note (rejetee) → "T001 rejetee : statut terminal (remplacante : T003)" rc=1
virer T001 --motif '  tests   non [lances] ' →
  T001 : revue -> rejete (motif : tests non (lances))
  T003  vault/projets/demo/taches/T003-coder-le-truc
  deps reecrites : T002
  -> corrige le pack : vault/projets/demo/taches/T003-coder-le-truc/context.md
  -> puis : python3 bin/vx.py pack-lint T003 --projet demo
T003 task.md : …tags: [tache] · remplace: T001 ; context.md pack: T003, "# Pack T003", "- TODO-PACK remplace T001 — vire : tests non (lances) — corrige…" sous Décisions actées ; result.md absent
pack-lint T003 → "x le pack contient encore des marqueurs a remplir" rc=2 (T001 lint OK avant)
T001 : statut: rejete · motif: tests non (lances) · remplacee_par: T003 ; T002 deps: [T003]
journal : "T001 viree -> rejete (tests non (lances)) ; remplacante T003 [implementeur/inherit]" · "T003 creee — Coder le truc [implementeur] (remplace T001)" · "T002 deps T001 -> T003"
virer T008 en-cours --role implementeur --modele sonnet → …"~ T008 etait en-cours : verifie qu'aucun agent ne tourne encore" ; T009 role implementeur modele sonnet
virer T006 a-faire → "T006 en statut « a-faire » : aucun agent a virer (abandonne-la)" rc=1 · motif '  "" ' → rc=1
retenir T007 → "aucune evaluation de T007 — python3 bin/vx.py tache \"Evaluer T007\" --projet demo --role evaluateur --dep T007 (ou --sans-eval)" rc=1
retenir T004 (T005 a-faire) → "evaluation T005 pas encore faite (statut a-faire)" rc=1
retenir T004 (T005 fait, verdict virer) → "T005 conclut virer : python3 bin/vx.py virer T004 --motif \"tests non lances\" --projet demo (ou --sans-eval)" rc=1
retenir T004 (verdict retenir) → "T004 : revue -> fait (retenue, eval T005)" ; retenu: 2026-10-15 · evaluation: T005
retenir T007 --sans-eval → "T007 : revue -> fait (retenue, eval chef)" ; evaluation: chef
ready (T005 evaluateur dep T004 revue ; T006 implementeur dep T004 revue, packs remplis) → "T005  evaluateur …" seule ; avant : T002 impl dep T001 revue → "rien a dispatcher"
personnel → "PERSONNEL — 1 projet(s) + 0 archive(s), 9 tache(s)" / "  ROLE          TACHES LIVREES RETENUES VIREES  RENVOI" / "  implementeur       7       3        2      1    33 %" / "  eclaireur          0       0        0      0       —" … MODELE idem ; --projet demo → "PERSONNEL — demo, 9 tache(s)" ; --json → {"perimetre": "tout","projets": 1,"archives": 0,"taches": 9,"roles": [...11],"modeles": [inherit,opus,sonnet]} ; banc vide → "aucune tache — rien a mesurer." rc=0
integrer T005 → "== demo/T005 [fait · result: fait · verdict: virer → T004] — Evaluer T004" / -- Verdict / -- Motif / -- DoD / -- Ecarts / -- Verifie comment / "   -> python3 bin/vx.py virer T004 --motif \"tests non lances\" --projet demo" ; verdict retenir → "   -> python3 bin/vx.py retenir T004 --projet demo"
integrer T001 → "== demo/T001 [rejete] — Coder le truc" / "   remplacee par T003 — motif : tests non (lances)" / "   result.md ABSENT"
doctor (remplacee_par retiré de T001) → "x demo/T001 : rejete sans remplacee_par" rc=2 ; + "x demo/T002 : statut inconnu « zarb »", "x demo/T006 : depend de T008 rejetee (remplacante T009)"
garde evaluateur "rien" → {"…permissionDecision": "deny", …"le prompt ne nomme aucun pack…"} rc=0
garde T006 (implementeur, pret, lint OK) en testeur → deny "T006 est une tache « implementeur », pas « testeur » : dispatche subagent_type=implementeur." ; en implementeur → vide rc=0 ; Explore → vide rc=0 ; registre KO (version 2) → evaluateur deny (repli .claude/agents), Explore vide
sonnerie evaluateur → {"id": "c15bb89a81cf4ba8", "t": "15:19:45", "quoi": "agent-fini", "role": "evaluateur", "tid": "T004", "statut": "fait", "verdict": "virer"} ; Explore → 0 ligne ajoutée
vrai vault AVANT : doctor "vault coherent." rc=0 · board rc=0 ; APRÈS : doctor "vault coherent." rc=0 · board rc=0 · ready rc=0 ; py_compile 5 fichiers rc=0
git diff --stat -- bin/vx.py bin/garde_dispatch.py bin/sonnerie.py → garde_dispatch.py 16 +++- · sonnerie.py 14 ++- · vx.py 234 +++---  (248+, 16-)
git status --short roles.json bin/roles.py bin/rh.py → ?? bin/rh.py · ?? bin/roles.py · ?? roles.json
```
## Écarts
- écart au contrat: C2 vs C5 doctor — C2 `die(...,3)`, C5 ligne `x roles.json invalide` rc 2 → choisi : ligne `x …` stdout + rc 3
- écart au contrat: C5 retenir `--motif "<motif>"` → rempli avec 1re ligne `## Motif` de l'éval (`<motif>` si ∅), cohérent C6
- interprétation: `personnel --json` 0 tâche → JSON (taches 0), message texte seulement hors `--json`
- interprétation: integrer évaluateur, T évaluée = `deps[0]` du task.md (comme retenir), pas `evalue:` du result
- outils hors liste sur banc : sed, mv, grep, ls, head, tail, wc ; dossier `.cache/banc-T007-vide-inutile` créé par erreur, supprimé (os.rmdir)
## Pour la suite
- `import roles` en tête de vx.py : tout importeur de vx (rh, dash) doit avoir `bin/` dans sys.path
- `personnel --json` = indent 2 (idiome `ready --json`) ; dash appelle `rh.personnel()` directement
- `_pack_rempli`/`cmd_pack_lint` gardent le littéral marqueur existant ; `MARQUEUR` sert seulement à `virer`
- garde_dispatch refuse aussi une tâche legacy sans `role:` (r="?") dispatchée sous un rôle AgentX
- `virer` remplaçante : modèle = ancien (pas celui du registre) si `--modele` absent, conforme C5
## Retour sur le pack
- Manquait: arbitrage C2/C5 doctor registre invalide ; sed/grep/mv absents des outils alors que banc les appelle
- Inutile: ∅
