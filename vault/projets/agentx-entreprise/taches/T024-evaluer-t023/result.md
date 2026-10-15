---
tache: T024
projet: agentx-entreprise
statut: fait
evalue: T023
verdict: retenir
---
## Verdict
retenir — 9/9 cases DoD T023 prouvées
## DoD
- [x] roles.json entrée après rssi, erreur ∅, couleur ≥ 60 — `roles.erreur()` → `''` · ordre → `['rssi', 'syndicat', 'vault']` · `min dist 99.7 relecteur n= 18` · entrée = contrat, `couleur '#65a30d'`
- [x] agents/syndicat.md frontmatter + ossature ≤ 80 + sources/indicateurs/règles — `wc -l` → `73` · L2-5 name/description/tools/model · rôle L8-10 · interdits L12-13,L35-37 · `## Langage` L15 · `## Discipline` L24 · `## Méthode` L39 · `## Sortie` L53
- [x] commands/syndicat.md frontmatter comme rh.md, injecte personnel, tâche avant dispatch — rh.md `description`/`argument-hint`/`allowed-tools: Bash(python3 bin/vx.py:*)` = syndicat.md L2-4 · L12 ``!`python3 bin/vx.py personnel` `` · L15 crée tâche · L17 `Jamais d'appel Agent sans tâche vault en pret au pack validé`
- [x] SKILL.md titre, 1 ligne tableau, Capitalisation — `rg` → `15:## Les dix-sept rôles` · `37:| syndicat | … | opus | fait |` · `245:- syndicat après 2 vagues ou taux de renvoi ≥ 50 % : ses revendications acceptées → gabarit / packs types.`
- [x] CLAUDE.md 17 rôles, syndicat ≠ scribe ≠ evaluateur, /syndicat — `75:17 rôles` · `85-86: syndicat chiffre … (≠ scribe …, ≠ evaluateur …)` · `71:/syndicat [projet]`
- [x] essai à blanc — `personnel --json` → clés `['perimetre','projets','archives','taches','roles','modeles']`, `taches 279 projets 9`, syndicat `taches 1` · `rg -c … | wc -l` → `264` (T023 : 277/262 ; +2 = T024/T025 créées depuis)
- [x] est_role_agentx + doctor — `est= True` · `vault coherent.` `rc=0`
- [x] git diff --stat E, 0 autre fichier — `SKILL.md | 11 +++++++++--` · `CLAUDE.md | 17 ++++++++++++-----` · `roles.json | 6 ++++++` = déclaré · `git status` → `?? agents/syndicat.md` `?? commands/syndicat.md` ; autres M attribués T021/T010/chef
- [x] result.md format — 42 lignes ≤ 60 · 5 sections exactes · `statut: revue`
## Motif
∅
## Vérifié comment
- lignes contrat T023 → syndicat.md (recherche verbatim, 17/17) :
  - Sources 1-6 → L28 · L29 · L30 · L31 · L32 · L33
  - Indicateurs charge/autonomie/qualité/flux/répétition → L42 · L43 · L44 · L45 · L46
  - Règles défend l'agent → L48 · revendication = … → L50 · jamais d'édition → L36 · ∅ donnée → L49 · livrable vault/syndicat + tags → L54, + result.md → L70
- `rg -n "^tools:|Edit" syndicat.md` → `4:tools: Read, Grep, Glob, Bash, Write` (0 Edit) · `36:4. Jamais d'édition des packs, gabarits ou agents : il propose, le chef décide.`
- garde : bin/garde_dispatch.py:47-48 garde si `est_role_agentx(t)` ; `est_role_agentx('syndicat')` → `True` ⇒ dispatch syndicat garde · commande : `allowed-tools` sans `Agent`, pas de contournement
- attribution `git diff` (HEAD 44e45e5) :
  - roles.json : +6 = T021 +5 (juriste…rssi) · T023 +1 (L21 syndicat)
  - SKILL.md +9/-2 : T021 +7/-2 (5 lignes tableau, producteurs L224, titre onze→seize) · T023 +2 (L37, L245) + titre seize→dix-sept (même ligne)
  - CLAUDE.md +12/-5 : T021 +8/-4 (16 rôles, evaluateur·scribe, juriste·tresorier, produit·marketing, rssi, rssi≠securite, Producteurs ×2) · T023 +4/-1 (/clore·/rh L70, /syndicat L71, L85, L86) + 16→17 L75 + `· syndicat` ajouté ligne rssi L82
  - cohérent avec T021 stat `9` / `12` et T023 `+1 · +3/-1 · +6/-3` (lignes T021 réécrites comptées)
## Écarts
- lecture hors WL: .claude/commands/rh.md:1-6 — case DoD « frontmatter comme rh.md »
- ossature evaluateur.md : non ouverte, connue de ce rôle (même gabarit)
## Pour la suite
- T023 `## Écarts` : `- ∅` puis 1 écart réel — contradictoire, gabarit à clarifier
- agent `tools` contient `Write` : interdit d'édition = consigne seule, pas d'outil ; garde mécanique absente
- `/syndicat` : `personnel` injecté non filtré par `$ARGUMENTS` (`--projet`)
- `vault/syndicat/` hors `vault/projets/` : vérifier doctor/index au 1er livrable (T025)
## Retour sur le pack
- Manquait: rh.md et evaluateur.md absents WL alors que DoD T023 y renvoie | Inutile: ∅
