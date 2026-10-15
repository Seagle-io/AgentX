---
tache: T002
projet: agentx-serveur
statut: fait
---
## Livré
- [[contrat]] contrat.md:L12-L31 — C0 options identité/isolation, choix I1+U1
- contrat.md:L33-L68 — C1 topologie, uid, `serveur.json`
- contrat.md:L70-L106 — C2 `bin/comptes.py` signatures, erreurs, peercred
- contrat.md:L108-L150 — C3 identité 2 portes, jeton par compte, oauth2-proxy
- contrat.md:L152-L172 — C4 démon chef par compte, systemd, routes
- contrat.md:L174-L197 — C5 verrou set/retenir, `--si`, `chef:`, `conflits_e`
- contrat.md:L199-L205 — C6 compat locale au bit près
- contrat.md:L207-L218 — C7 invariants S1-S8
- contrat.md:L220-L235 — C8 lots L1-L9, E disjoints
- contrat.md:L237-L250 — C9 non-retour + NV
- decisions.md — 1 entrée append (I1+U1)
## Vérifié comment
- bin/terminal.py:L176-L179 — socket unique `agentx-chef.sock`
- bin/terminal.py:L227-L236 — veilleur unlink après 120 s
- bin/terminal.py:L272-L277 — démon lancé sous uid de dash
- bin/terminal.py:L25 — consigne « seul chef de l'immeuble »
- bin/dash.py:L98-L99 — `JETON` global, `HOTES_OK`
- bin/dash.py:L1085-L1088 — jeton en-tête ou query
- bin/dash.py:L1191-L1201 — POST : hôte local + jeton
- bin/dash.py:L1135 — jeton servi dans state.json
- bin/vx.py:L210-L222 — `verrou` flock, journal sans auteur
- bin/vx.py:L348,L440 — verrou seulement tache/virer
- bin/vx.py:L390-L411 — `cmd_set` sans verrou → course
- bin/agentx:L80-L125 — statut/stop via TCP 127.0.0.1
- .claude/settings.json:L16-L45 — hooks `$CLAUDE_PROJECT_DIR`, partagés
- https://oauth2-proxy.github.io/oauth2-proxy/configuration/providers/github (2026-10-16) — `--github-org`, `--github-team`, `X-Forwarded-Groups`
- https://oauth2-proxy.github.io/oauth2-proxy/configuration/overview (2026-10-16) — `--cookie-expire` 168h, `--pass-user-headers`, upstream unix
- https://blog.codeminer42.com/ai-tip-running-two-claude-code-accounts/ (2026-10-16) — `CLAUDE_CONFIG_DIR` non documenté → écarté
- risques.md : Glob → absent (2 fois, dont fin de tâche)
## Écarts
- ∅
## Pour la suite
- choix : oauth2-proxy GitHub org + 1 uid Unix par compte ; interdit : 1 chef sous l'uid d'un autre, identité lue ailleurs que l'en-tête proxy sur socket peercred
- ordre : L1 → (L2 ∥ L3) → L4 → (L5 ∥ L6) ; L7 parallèle ; L8 → L9 ; 0 lot avant fin Seagle + console vocale
- risques.md absent → tâche archi de réconciliation : table EX-xx → §C, ajout S9+ si EX non couverte
- humain : logins GitHub Julien/Sylvain ; Claude Team (sièges) ou clé API par compte ; shell SSH autorisé ou tunnel seul (S5)
- humain : OAuth App créée dans l'org Seagle-io (callback `http://localhost:7777/oauth2/callback`)
- NV à lever en L7 : `X-Forwarded-User` = login ; cookie Secure sur localhost
## Retour sur le pack
- Manquait: arbo `tests/` (chemins de lots NV) ; texte §C8 seagle (mécanisé ou non)
- Inutile: ∅
