---
projet: agentx-serveur
tache: T001
role: rssi
cree: 2026-10-16
tags: [risques]
---

# Risques — AgentX sur serveur distant, 2 comptes, 1 chef par compte

Échelles : V (vraisemblance) 1–4 · I (impact) 1–4 · score = V×I · résiduel = V×I estimé après mesures EX.
Cadrage : [[decisions]]#2026-10-16 — 1 chef par compte (Julien, Sylvain), même vault, accès tunnel SSH + GitHub Seagle-io, hébergeur non choisi.

## Actifs
| ID | Actif | Source | Note |
|---|---|---|---|
| A1 | code des produits (OrthoPro/Kora, Geolens, Seagle) | pack T001:L38 | lu/écrit par `claude` |
| A2 | secrets `.env` des dépôts | pack T001:L17 | inventaire noms de variables ∅ — à faire |
| A3 | BDD serveur de test Geolens | pack T001:L38 | intouchable ; moteur NV |
| A4 | vault (packs, journaux, `orthopro/env.md`) | pack T001:L38 | écrit par 2 comptes + agents (`.claude/settings.json:7-8`) |
| A5 | clés SSH / credentials GitHub | pack T001:L17 | sur serveur = joignables par `claude` |
| A6 | session Claude chef + quota | `bin/terminal.py:52-53` | credentials Linux fichier 0600 (doc security) |
| A7 | serveur (OS, comptes Unix) | decisions.md:L6 | non choisi |
| A8 | jeton salle `JETON` | `bin/dash.py:98` | `secrets.token_hex(16)` = 128 bits, 1 par processus |
| A9 | traces (`run/evenements.jsonl`, `~/.local/state/agentx-chef.log`) | `CLAUDE.md` (sonnerie) · `bin/terminal.py:273-277` | |
| A10 | données patients Kora (catégorie art. 9 RGPD) | pack T001:L38 | jamais sur ce serveur sans décision |

## Mesures existantes : local → distant
| Mesure | Coordonnées | Protège en local | Ne protège plus en distant |
|---|---|---|---|
| bind loopback par défaut | `bin/dash.py:1260,1278` | seul le poste joint 7777 | tout compte Unix + tout agent du serveur joint 127.0.0.1:7777 ; `--host` accepte 0.0.0.0 sans garde |
| garde `Host` local | `bin/dash.py:99,1081-1083,1093,1196` | DNS rebinding | via tunnel `Host: 127.0.0.1` passe ; en-tête fourni par client → falsifiable, ≠ authentification ; GET `/state.json` et fichiers statiques non gardés (`bin/dash.py:1130-1146`) |
| jeton `X-AgentX-Jeton` | `bin/dash.py:98,1085-1088,1199` | CSRF (préflight CORS) | servi en clair par GET `/state.json` sans garde (`bin/dash.py:1135`) ; accepté en query string (`bin/dash.py:1088`) ; 1 jeton pour tous les clients ; ∅ lien compte ; ∅ expiration ; `==` non constant-time (`bin/dash.py:1086,1199`) |
| liste blanche `/api/run`, argv sans shell | `bin/dash.py:101-191` | injection de commande | reste valide ; mais `virer`/`retenir`/`set` exécutés sans identité |
| programme fixe `claude` | `bin/terminal.py:52-53` · `bin/dash.py:1155-1158` | pas de shell direct | `claude` a l'outil Bash → shell indirect ; mode par défaut = auto (doc security) ; `!cmd` NV (H6) |
| socket unix 0600 | `bin/terminal.py:176-189` | autres comptes Unix | chemin `~/.local/state/agentx-chef.sock` fixe, `cwd` ignoré (L176-179) → 1 chef par compte Unix max ; si compte Unix partagé : 0 séparation ; course bind→chmod (L187-188) ; ops `stop`/`quitter` sans auth (L203-212) ; tampon 256 Ko rejoué à tout client (L54,142-158) |
| 1 terminal par salle | `bin/dash.py:43` · `bin/terminal.py:7` | — | 2 comptes sur 1 salle = même chef |
| `garde_bash` (PreToolUse Bash) | `bin/garde_bash.py:16-51` · `.claude/settings.json:27-33` | erreur d'agent honnête | liste noire regex : `git -C . push` non couvert (L17), DML (`DELETE`/`TRUNCATE`/`UPDATE`) non couvert (L26), script/base64 contournent ; hooks + scripts dans le dépôt, modifiables par agent ; doc hooks : hard deny → système de permissions |
| `garde_dispatch` (PreToolUse Agent) | `bin/garde_dispatch.py:43-72` | traçabilité vault | ≠ sécurité : rôles non AgentX libres (L9-11,47-48) |
| `ask` git push / rm | `.claude/settings.json:10-13` | prompt humain | dépend de qui répond au terminal ; mode auto ; contournable (`git -C`) |
| ∅ journal HTTP | `bin/dash.py:1223-1224` | — | qui a fait quoi : ∅ |
| ∅ en-têtes CSP/X-Frame-Options | `grep -c 'Content-Security\|X-Frame' bin/dash.py` → 0 | — | clickjacking/Referer |

## Registre des risques (trié par score)
| ID | Actif | Menace | V | I | Score | Mesure | Résiduel | Porteur |
|---|---|---|---|---|---|---|---|---|
| R01 | A8, A6 | vol du jeton : GET `/state.json` non gardé (`bin/dash.py:1130-1135`), query string (L1088), jeton partagé (L98) | 3 | 4 | 12 | EX-03 EX-12 | 1×4=4 | architecte T002 |
| R02 | A1, A5, A7 | terminal web = exécution de code : `/api/term/in` (`bin/dash.py:1162-1169`) → pty `claude` (`bin/terminal.py:131-133`) → Bash | 3 | 4 | 12 | EX-01 EX-03 EX-04 EX-08 | 1×4=4 | devops |
| R03 | A6 | un compte pilote, lit ou arrête le chef de l'autre : socket unique (`bin/terminal.py:176-179`), TERM unique (`bin/dash.py:43`), tampon rejoué (`bin/terminal.py:142-158`) | 4 | 3 | 12 | EX-03 EX-04 | 1×3=3 | architecte T002 |
| R04 | A1, A3 | agent hors périmètre : push, migration, DML BDD Geolens ; liste noire contournable (`bin/garde_bash.py:16-31`) | 3 | 4 | 12 | EX-07 EX-08 EX-09 | 2×2=4 | devops |
| R05 | A7, A3 | tunnel SSH : forwarding ouvert par défaut (`AllowTcpForwarding yes`, `PermitOpen any`, `AllowStreamLocalForwarding yes`) → pivot vers BDD Geolens, salle/socket de l'autre ; agent forwarding | 3 | 4 | 12 | EX-05 EX-17 | 2×3=6 | devops |
| R06 | A9 | traçabilité : 0 log HTTP (`bin/dash.py:1223-1224`), 0 identité par requête (L98), sonnerie = rôle/TID seuls (`CLAUDE.md`) | 4 | 3 | 12 | EX-03 EX-11 | 1×2=2 | devops |
| R07 | A2, A4 | fuite de secrets : vault `orthopro/env.md` (pack:L38), tampon 256 Ko (`bin/terminal.py:54`), log démon (L273-277), env hérité entier (L80), sortie `/api/run` (`bin/dash.py:186-191`), captures salle | 3 | 3 | 9 | EX-04 EX-14 EX-15 | 2×3=6 | chef + humain |
| R08 | A4, A6 | prompt injection : vault écrit par 2 comptes + agents (`.claude/settings.json:7-8`), chef lit `vault/INDEX.md` au démarrage (`bin/terminal.py:28`), dépôts, WebFetch | 3 | 3 | 9 | EX-08 EX-13 + Q4 | 2×3=6 | chef |
| R09 | A7 | exposition accidentelle 7777/7790 : `--host` libre (`bin/dash.py:1260`), garde Host falsifiable (L1081-1083) → avec R01 = RCE non authentifiée | 2 | 4 | 8 | EX-01 EX-02 | 1×4=4 | devops |
| R10 | A7, A1 | dépendance GitHub : compte membre compromis, révocation tardive, indisponibilité GitHub = perte d'accès | 2 | 4 | 8 | EX-06 EX-17 EX-18 | 1×4=4 | humain |
| R11 | A10 | données de santé Kora sur serveur non HDS | 2 | 4 | 8 | EX-10 | 1×4=4 | humain (responsable de traitement) |
| R12 | hooks, settings | gardes modifiées/désactivées par agent ou chef (`.claude/settings.json:16-46` dans le dépôt, `bin/garde_*.py`) | 2 | 4 | 8 | EX-08 | 1×4=4 | devops |
| R13 | A6 | agent local pilote la salle : `curl 127.0.0.1:7777/state.json` → jeton → `/api/term/in` → auto-approbation ; existe déjà en local | 2 | 4 | 8 | EX-03 EX-13 | 1×4=4 | architecte T002 |
| R14 | A6 | quota/compte Claude partagé : épuisement, actions sous l'identité d'un autre | 3 | 2 | 6 | EX-16 | 1×2=2 | humain |
| R15 | navigateur | clickjacking, fuite jeton par Referer (∅ CSP/XFO) | 1 | 3 | 3 | EX-12 | 1×2=2 | architecte T002 |

## Conformité
| Exigence | Source (consultée 2026-10-16) | État constaté | Action |
|---|---|---|---|
| RGPD art. 9.1 — données de santé = catégorie particulière | https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2#Article9 | Kora = santé (pack:L38) ; serveur ∅ décision | EX-10 |
| RGPD art. 5.1.f — « sécurité appropriée » | idem | 0 authentification par compte (`bin/dash.py:98`) | EX-03 EX-04 |
| RGPD art. 32.1.b — confidentialité, intégrité, disponibilité | https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4#Article32 | jeton partagé, chef partageable | EX-03 EX-04 EX-05 |
| RGPD art. 32.1.d — tester, analyser, évaluer régulièrement | idem | ∅ procédure | EX-19 + audit `securite` |
| RGPD art. 33.1 — notification de violation | idem | détection impossible sans journal (`bin/dash.py:1223`) | EX-11 |
| RGPD art. 30.1 — registre des traitements | idem | journal d'audit = données perso (comptes) ; NV au registre | inscrire le traitement |
| RGPD art. 28.1 — sous-traitants | idem | hébergeur + Anthropic (API reçoit code/vault) ; DPA NV | revue fournisseurs |
| CSP art. L.1111-8 — hébergement données de santé : certification HDS (support numérique) | https://esante.gouv.fr/produits-et-services/hds-certification-hebergeur-de-donnees-de-sante | hébergeur non choisi | EX-10 |
| CNIL délib. 2021-122 — journalisation, conservation 6 mois–1 an | https://cnil.fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation | ∅ journal | EX-11 |
| NIS2 (dir. 2022/2555) art. 2 — plafond « moyenne entreprise » | https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022L2555 (texte non extrait → NV) | H5 hors champ | test https://monespacenis2.cyber.gouv.fr |
| ISO 27001:2022 A.5.15 contrôle d'accès · A.8.2 accès privilégiés · A.8.5 authentification sécurisée · A.8.15 journalisation · A.8.20 sécurité réseau | sources secondaires : https://hightable.io/iso-27001-annex-a-controls-list/ ; https://www.euronext.com/sites/default/files/2025-06/Euronext%20Clearing%20SoA%20-%20ISO%2027001%20-%20Public.pdf | référentiel, pas d'obligation (∅ certification visée, H) | EX-03 EX-05 EX-08 EX-11 |

## Exigences
B = bloquant (avant toute mise en service) · R = recommandé.

- **EX-01 · B — Écoute loopback seule.** Salle (7777), voix (7790), tout service AgentX liés à `127.0.0.1`/`::1` ou socket unix ; `--host` non loopback refusé au démarrage.
  vérif : `ss -ltnp | grep -E ':(7777|7790)\b'` → uniquement `127.0.0.1:`/`[::1]:` ; `python3 bin/dash.py --host 0.0.0.0 --no-open; echo $?` → ≠ 0
- **EX-02 · B — Pare-feu entrant deny par défaut, seul 22/tcp.**
  vérif : `sudo nft list ruleset` → `policy drop` en input, seul `tcp dport 22 accept` (ou `sudo ufw status verbose` → `deny (incoming)`, `22/tcp ALLOW`)
- **EX-03 · B — Authentification par compte sur toutes les routes.** `/`, `/state.json`, `/api/term/*`, `/api/run`, `/api/voix/*` : sans preuve d'identité → 401 ; jeton/cookie par compte et par session, ≥ 128 bits, comparé par `hmac.compare_digest`, expiration ≤ 12 h ; jamais renvoyé dans `/state.json`, jamais en query string (SSE : cookie `HttpOnly; SameSite=Strict` ou équivalent — choix T002).
  vérif : `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:7777/state.json` → `401` ; `grep -n compare_digest bin/dash.py` → ≥ 1 ; `grep -nE "get\(\"jeton\"|\[\"jeton\"\] *=" bin/dash.py` → ∅
- **EX-04 · B — Isolation des chefs.** 1 compte Unix par humain (`julien`, `sylvain`) ; 1 salle + 1 démon chef par compte ; socket créé sous `umask 077`, 0600, propriétaire = compte ; compte A n'atteint ni salle ni socket de B.
  vérif : `stat -c '%U %a' /home/julien/.local/state/agentx-chef.sock /home/sylvain/.local/state/agentx-chef.sock` → `julien 600` / `sylvain 600` ; sous `sylvain` : `python3 -c "import socket;socket.socket(socket.AF_UNIX).connect('/home/julien/.local/state/agentx-chef.sock')"` → `PermissionError` ; `curl` salle de julien sans son identité → 401/403
- **EX-05 · B — sshd durci, forwarding restreint.** Clés seules ; `PasswordAuthentication no` · `KbdInteractiveAuthentication no` · `PermitRootLogin no` · `AllowUsers julien sylvain` · `AllowTcpForwarding local` · `PermitOpen 127.0.0.1:<port salle du compte>` (Match User) · `GatewayPorts no` · `AllowAgentForwarding no` · `PermitTunnel no` · `X11Forwarding no`.
  vérif : `sudo sshd -T -C user=julien,host=x,addr=192.0.2.1 | grep -Ei '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin|allowusers|allowtcpforwarding|permitopen|gatewayports|allowagentforwarding|permittunnel|x11forwarding) '` → valeurs ci-dessus
- **EX-06 · B — GitHub Seagle-io : 2FA exigée, révocation ≤ 24 h.** 2FA obligatoire sur l'org ; restriction d'accès OAuth active ; sortie d'un membre → clé SSH serveur retirée ≤ 24 h.
  vérif : org Settings → Authentication security → « Require two-factor authentication » coché (constat humain) ; après retrait clé : `ssh -o BatchMode=yes <compte>@<serveur> true` → `Permission denied (publickey)`
- **EX-07 · B — Push impossible depuis les sessions `claude`.** 0 credential d'écriture GitHub lisible par les comptes qui font tourner `claude` (deploy key lecture seule ou rien) ; branche `main` protégée sur chaque dépôt.
  vérif : sous le compte de session, `ssh -T git@github.com` → deploy key RO ou refus ; `gh api repos/Seagle-io/<depot>/branches/main --jq .protected` → `true`
- **EX-08 · B — Gardes hors de portée des agents.** Hooks `garde_bash`/`garde_dispatch`/`sonnerie` + `permissions.deny` (push dont `git -C … push`, migrations, `DROP`/`DELETE`/`TRUNCATE`) dans `/etc/claude-code/managed-settings.json` root:root 0644 avec `allowManagedHooksOnly: true` ; scripts garde root:root hors dépôt ; `permissions.defaultMode` ∉ {`auto`, `bypassPermissions`} ; `disableBypassPermissionsMode: "disable"`.
  vérif : `stat -c '%U:%G %a' /etc/claude-code/managed-settings.json` → `root:root 644` ; `echo '{"tool_name":"Bash","tool_input":{"command":"git -C . push"}}' | python3 <garde_bash managé>` → contient `"deny"`
- **EX-09 · B — BDD de test Geolens : identifiants serveur en lecture seule.**
  vérif (H3 PostgreSQL) : `psql "$GEOLENS_RO_URL" -Atc "select bool_or(has_table_privilege(c.oid,'INSERT,UPDATE,DELETE,TRUNCATE')) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'"` → `f`
- **EX-10 · B — Kora : 0 donnée patient sur le serveur sans décision datée + hébergeur HDS.** Variables de connexion BDD des `.env` OrthoPro du serveur → hôtes ∈ liste dev/anonymisée.
  vérif : `grep -n "HDS" vault/projets/agentx-serveur/decisions.md` → décision datée avant tout import ; revue humaine des hôtes BDD des `.env` OrthoPro (noms de variables NV) → ∈ liste blanche
- **EX-11 · B — Journal d'audit.** Chaque POST et ouverture SSE de la salle + chaque connexion sshd → ligne horodatée {compte, route/action, code}, append-only hors vault, conservation 6–12 mois.
  vérif : POST test → `tail -1 /var/log/agentx/audit.log` contient compte + route ; `lsattr /var/log/agentx/audit.log` → `a` ; `journalctl -u ssh --since -1h` → connexions nommées
- **EX-12 · R — En-têtes HTTP.** `Content-Security-Policy: frame-ancestors 'none'` · `X-Frame-Options: DENY` · `Referrer-Policy: no-referrer`.
  vérif : `curl -sI http://127.0.0.1:7777/ | grep -ciE 'content-security-policy|x-frame-options|referrer-policy'` → `3`
- **EX-13 · R — Agents sans accès réseau à la salle.** Sandbox Bash des sessions ; 127.0.0.1:7777/7790 refusés depuis un agent.
  vérif : dans une session agent `curl -s -m 3 http://127.0.0.1:7777/state.json; echo $?` → ≠ 0
- **EX-14 · R — Environnement du chef en liste blanche.** `bin/terminal.py:80` transmet `os.environ` entier → limiter à {PATH, HOME, USER, LANG, TERM, COLORTERM}.
  vérif : `tr '\0' '\n' < /proc/$(pgrep -u julien -x claude | head -1)/environ | cut -d= -f1 | sort` → ⊂ liste
- **EX-15 · R — 0 secret en clair dans vault et logs.**
  vérif : `gitleaks detect --no-git --source vault -v` → `no leaks found` ; `stat -c '%a' /home/*/.local/state/agentx-chef.log` → `600`
- **EX-16 · R — 1 compte Anthropic par humain, credentials isolés.**
  vérif : `stat -c '%U %a' /home/julien/.claude/.credentials.json /home/sylvain/.claude/.credentials.json` → `julien 600` / `sylvain 600`
- **EX-17 · R — Comptes SSH tunnel seul, sans shell.** `authorized_keys` : `restrict,port-forwarding,permitopen="127.0.0.1:<port>"` (sshd_config : restreindre le forwarding n'aide pas si shell).
  vérif : `ssh -o BatchMode=yes julien@<serveur> id` → refus/`PTY allocation request failed` ; tunnel `-L` → OK
- **EX-18 · R — Clés SSH ed25519 ou ed25519-sk, accès de secours hors GitHub.**
  vérif : `ssh-keygen -lf /home/julien/.ssh/authorized_keys` → types `ED25519`/`ED25519-SK` seuls ; clé de secours documentée dans decisions.md
- **EX-19 · R — Procédure de révocation testée 1×/an.** Jeton salle, clés SSH, deploy keys, session Claude (`/logout`).
  vérif : entrée datée « exercice révocation » dans decisions.md

## Hypothèses
- H1 : 2 comptes Unix distincts — invalidée si compte Unix partagé (EX-04 impossible sans refonte `bin/terminal.py:176-179`)
- H2 : les humains poussent depuis leur poste — invalidée si push requis depuis le serveur (EX-07 à revoir)
- H3 : BDD Geolens = PostgreSQL — invalidée par l'env geolens (adapter la vérif EX-09)
- H4 : « compte GitHub » = clés publiées GitHub ou proxy OAuth restreint à l'org — tranche T002
- H5 : Seagle hors NIS2 (< moyenne entreprise) — invalidée si effectif ≥ 50 ou CA > 10 M€ dans un secteur annexe I/II
- H6 : `!cmd` (mode bash Claude Code) ne passe pas par PreToolUse — NV ; si vrai, terminal web = shell direct
- H7 : 7790 = serveur voix (pack:L18) — NV, `bin/voix.py` hors WL
- H8 : version Claude Code serveur ≥ 2.1.257 (`bypassPermissions` ignoré depuis le projet, doc settings) — NV

## Plan d'action (score décroissant)
1. R01 R02 R03 R13 → EX-03 EX-04 dans le contrat T002 (architecte)
2. R02 R09 → EX-01 EX-02 dans le pack devops
3. R04 R12 → EX-07 EX-08 EX-09 (devops + humain)
4. R05 → EX-05 EX-17 (devops)
5. R06 → EX-11 (devops) ; R07 → EX-14 EX-15 ; R08 → EX-08 EX-13 + Q4
6. R10 R11 → EX-06 EX-10 (humain) ; R14 → EX-16 ; R15 → EX-12

## Audits `securite` à commander
- périmètre : `bin/dash.py`, `bin/terminal.py`, `bin/voix.py`, `dash/dash.js`, `dash/index.html` — auth, jeton, SSE, CSRF, XSS (contenu vault rendu dans la page → vol du jeton : NV)
- périmètre : `bin/garde_bash.py` — corpus de contournement (`git -C`, alias, script, base64, `gh api`)
- périmètre : `vault/` — scan secrets (`gitleaks`), `projets/orthopro/env.md` en priorité

## Questions ouvertes (arbitrage humain)
- Q1 : comptes SSH « tunnel seul » (EX-17) ou shell autorisé (R05 résiduel 2×3=6) ?
- Q2 : Kora sur ce serveur : jamais, ou hébergeur HDS (coût) ?
- Q3 : 1 abonnement Anthropic par humain (EX-16) ou partagé (R14 résiduel 3×2=6) ?
- Q4 : mode permissions des chefs : manuel (prompts) ou auto (classifieur) — R08 résiduel 2×3 vs 3×3 ?

## Sources (consultées 2026-10-16)
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html — ID en URL divulgable ; ≥ 64 bits, CSPRNG 128 bits
- https://man.openbsd.org/sshd_config — `AllowTcpForwarding` défaut `yes` ; `PermitOpen` défaut tout ; `AllowStreamLocalForwarding` défaut `yes` ; `GatewayPorts` défaut `no`
- https://messervices.cyber.gouv.fr/guides/usage-securise-dopenssh — ANSSI, usage sécurisé d'(Open)SSH (R1–R31 non extraits : NV)
- https://code.claude.com/docs/en/hooks — « use the permission system rather than a hook to enforce a hard allow or deny » ; `allowManagedHooksOnly` ; hooks actifs dans les sous-agents
- https://code.claude.com/docs/en/security — mode auto par défaut ; credentials Linux 0600 ; sandbox ; VM pour contenu non fiable
- https://code.claude.com/docs/en/managed-settings — Linux : `/etc/claude-code/managed-settings.json`
- https://code.claude.com/docs/en/settings — `defaultMode` `auto`/`bypassPermissions` ignorés depuis projet (≥ 2.1.257)
- https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions — restrictions OAuth actives par défaut
- https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization — sans 2FA : accès aux ressources coupé
- https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2#Article9 · …/chapitre4#Article32 — RGPD art. 5, 9, 28, 30, 32, 33
- https://esante.gouv.fr/produits-et-services/hds-certification-hebergeur-de-donnees-de-sante — HDS obligatoire support numérique (résultat de recherche ; page non extraite)
- https://cnil.fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation — 6 mois–1 an
