---
tache: T025
projet: agentx-entreprise
statut: fait
---
## Livré
- vault/syndicat/2026-10-15-tous.md:1-95 — 10 revendications, 5 familles d'indicateurs (38 lignes chiffrées), top 5 répétitions, 17 imputations, 7 sans donnée
## Vérifié comment
date -Is → 2026-10-15T17:48:54+02:00 (gel : 279 tâches, 271 result.md ; imm/T011+ exclues)
vx.py personnel --json → taches 279 · virees 0 (tous rôles) · modeles inherit 255 / opus 23 / sonnet 1
rg "^statut: (rejete|bloque)|^remplace|^remplacee_par" → 2 bloque (op/T042, arc/T007) · 0 rejete · 0 remplace
pack-lint ×270 → KO 0 · lignes moy 97,9 max 176 · >180 : 0 · tokens moy 1749 max 4007 · WL moy 8,31 max 12
rg -l "^## Retour sur le pack" → 271/271 ; Manquait non vide 244 (strict 236)
« lecture hors WL » sans ∅/0 → 119/271 tâches, 227 lignes ; verificateur 70 % moy 1,71 ; > 3 : 8 tâches
vx.py integrer --projet orthopro | rg -o "^   -- .*" | sort | uniq -c → 42 Ecarts · 42 Pour la suite · 42 Verifie comment (0 Retour sur le pack)
rg -c DÉFAUT vault/projets/*/journal.md → orthopro 4 · seagle-site 4
journal → bloque : 6 transitions ; op/T042 ouvert depuis 2026-10-05 23:35
git status --short avant/après (diff) :
```
39a40,42
> ?? vault/projets/agentx-immeuble/taches/T011-vue-d-ensemble-animee-open-space-de-l-immeuble-e/
> ?? vault/projets/agentx-immeuble/taches/T012-correctifs-immeuble-saisie-sur-mauvais-etage-alt/
> ?? vault/projets/agentx-immeuble/taches/T013-evaluer-t010/
40a44
> ?? vault/syndicat/
```
→ seul ajout propre : vault/syndicat/ ; T011-T013 imm = chef en parallèle ; result.md T025 dans dossier déjà `??`
## Écarts
- ∅ lecture hors WL
- journal.md + pack-lint lus via `python3 -c` (subprocess `vx.py pack-lint` ×270, lecture seule)
- `sed -n` sur op/journal.md:55-68 et ss/journal.md:88-121 (fichiers WL) ; scratchpad pour agrégats intermédiaires
- catégories de répétition = regex, recouvrement possible ; « seed » bruité par « compte/décompte »
- imputation : 0 `rejete` → imputé les renvois de fait (reprise, BLQ, bloque, abandon)
- découpe « par modèle » non concluante : inherit 255/279
## Pour la suite
- R1 : `vx integrer` affiche « Retour sur le pack » + commande `vx manques` (agrégat Manquait par catégorie/rôle) — 236 Manquait non vus du chef
- R2 : toute reprise passe par `virer` (ou `vx reprendre` journalisé, compté par `personnel`) — 9 reprises hors comptage, RH affiche 0 %
- R3 : `vault/projets/<p>/env.md` (seed, cookie, login, ports, versions, TZ, base tests/lint chiffrée) recopié verbatim dans `## Environnement` au scaffold — 72 Manquait
- puis : pack type verificateur (result.md vérifiée + helpers + banc en WL, `rg` libre) ; socle d'outils lecture au gabarit L70 + lint commande DoD ∉ Outils
## Retour sur le pack
- Manquait: commande d'agrégat multi-projets des sections result.md (dû écrire un parse `python3 -c`) ; `rg -h` = aide en rg 14 (utiliser `-I`)
- Inutile: ∅
