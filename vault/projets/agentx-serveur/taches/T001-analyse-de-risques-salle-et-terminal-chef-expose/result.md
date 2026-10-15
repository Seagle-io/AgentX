---
tache: T001
projet: agentx-serveur
statut: revue
---
## Livré
- vault/projets/agentx-serveur/risques.md — 15 risques (R01–R15), 19 exigences (EX-01–EX-11 B, EX-12–EX-19 R), 10 actifs, 12 mesures existantes local→distant, 11 lignes conformité, 8 hypothèses, 4 questions
## Vérifié comment
- bin/dash.py:98 — `JETON = secrets.token_hex(16)` : 1 jeton/processus, partagé
- bin/dash.py:1130-1135 — GET `/state.json` sans `_hote_local()`, `etat["jeton"] = JETON`
- bin/dash.py:1088 — jeton accepté en query `jeton=`
- bin/dash.py:1081-1083 — garde = en-tête `Host` client, falsifiable
- bin/dash.py:1223-1224 — `log_message` → `pass` : 0 journal HTTP
- bin/dash.py:1260,1278 — `--host` libre, défaut 127.0.0.1
- bin/dash.py:43 — `TERM` unique par salle
- `grep -c 'Content-Security|X-Frame|Access-Control|Set-Cookie' bin/dash.py` → 0
- bin/terminal.py:176-179 — socket `~/.local/state/agentx-chef.sock`, `cwd` ignoré
- bin/terminal.py:186-188 — bind puis chmod 0600 (course)
- bin/terminal.py:80 — env hérité entier hors `CLAUDE_CODE_*`
- bin/terminal.py:54,142-158 — tampon 256 Ko rejoué à tout client
- bin/garde_bash.py:17 — `\bgit\s+push\b` : `git -C . push` non couvert
- bin/garde_bash.py:26 — seul `DROP DATABASE|SCHEMA` ; DML ∅
- bin/garde_dispatch.py:47-48 — rôles non AgentX non gardés
- .claude/settings.json:7-8,10-13,16-46 — Write vault/** allow ; ask push/rm ; hooks dans dépôt
- https://man.openbsd.org/sshd_config (2026-10-16) — AllowTcpForwarding défaut yes ; PermitOpen défaut tout
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html (2026-10-16) — ID en URL « might disclose the session ID »
- https://code.claude.com/docs/en/hooks (2026-10-16) — « use the permission system rather than a hook to enforce a hard allow or deny »
- https://code.claude.com/docs/en/security (2026-10-16) — mode auto = mode de départ interactif
- https://code.claude.com/docs/en/managed-settings (2026-10-16) — Linux `/etc/claude-code/managed-settings.json`
- https://docs.github.com/en/organizations/…/about-oauth-app-access-restrictions (2026-10-16) — restrictions actives par défaut
- https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4#Article32 (2026-10-16) — art. 32.1 a–d, 33.1, 30.1, 28.1
- https://cnil.fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation (2026-10-16) — 6 mois–1 an
- NV : NIS2 art. 2 (eur-lex vide à l'extraction), ANSSI OpenSSH R1–R31 (PDF non extrait), HDS esante (via résultat de recherche)
## Écarts
- ∅ lecture hors WL
- 0 test d'intrusion, 0 accès réseau à un système réel, 0 secret lu ni recopié (`vault/projets/orthopro/env.md` non ouvert)
- R13 (agent → salle via 127.0.0.1) existe déjà en local — hors cadre serveur, signalé
## Pour la suite
- EX-01 B — Écoute loopback seule (7777, 7790) ; `--host` non loopback refusé · EX-02 B — Pare-feu entrant deny par défaut, seul 22/tcp
- EX-03 B — Authentification par compte sur toutes les routes ; jeton jamais dans `/state.json` ni en query string ; `compare_digest` ; expiration ≤ 12 h
- EX-04 B — Isolation des chefs : 1 compte Unix par humain, 1 salle + 1 démon par compte, socket 0600 umask 077
- EX-05 B — sshd durci, forwarding restreint (`AllowTcpForwarding local`, `PermitOpen` par compte, agent/X11/tunnel off) · EX-06 B — GitHub Seagle-io : 2FA exigée, révocation ≤ 24 h
- EX-07 B — Push impossible depuis les sessions `claude` · EX-08 B — Gardes hors de portée des agents (`/etc/claude-code/managed-settings.json`, `allowManagedHooksOnly`)
- EX-09 B — BDD de test Geolens : identifiants serveur en lecture seule · EX-10 B — Kora : 0 donnée patient sans décision datée + hébergeur HDS
- EX-11 B — Journal d'audit {compte, route, code} append-only hors vault, 6–12 mois ; vérifs : risques.md#Exigences
- audit `securite` à commander : bin/dash.py, bin/terminal.py, bin/voix.py, dash/dash.js (auth, SSE, XSS→jeton) ; bin/garde_bash.py (contournements)
## Retour sur le pack
- Manquait: `bin/voix.py` (port 7790, routes voix : H7 NV) ; compte Unix partagé ou non (H1) ; moteur BDD Geolens (H3) ; mode d'auth GitHub visé (clés vs OAuth, H4)
- Inutile: ∅
