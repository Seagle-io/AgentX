# Decisions — GeoLens Web — viewer en ligne

Une decision = un bloc. Jamais de reecriture, on ajoute.

## D1 — 2026-10-07 — filet git avant toute écriture dans G
- humain lance `git init && git add -A && git commit -m base` dans G avant V3
- 0 tâche E sur G tant que `git -C G log -1` KO
- pourquoi : G sans .git, diff agent irréversible

## D2 — 2026-10-07 — cible prod = Scaleway managé
- `docker-compose.scaleway.yml` = cible ; `.prod.yml` hors périmètre durcissement
- sauvegarde = outils managés Scaleway + runbook restauration ; pas de script pg_dump/MinIO
- pourquoi : DEPLOYMENT.md recommande managé

## D3 — 2026-10-07 — PT-5 réponse neutre
- inscription + `POST /api/admin/invitations` (server.ts:1555) : même réponse email existant ou non
- pourquoi : énumération d'emails, email unique global

## D4 — 2026-10-07 — preuves e2e : seuils de tuiles assouplis
- viewer/refine/pnts/interaction : seuils abaissés aux données présentes (seed-data/villelaure-real) ; package/cloudpkg : skip explicite si asset absent
- pourquoi : assets lourds absents ; preuve réduite assumée

## H1 — hypothèses retenues (invalider si signal)
- worker sans secret : refus démarrage si NODE_ENV=production, warn sinon · signal : humain exige refus partout
- nodemailer : 9.1.1 (mineure) seulement ; 10.x = tâche à part sur accord · signal : advisory ≤10.0.5 exploitable via nos usages
- `npm install`/montée fastify 5.12.5 : commande lancée par humain, agent BLQ avec commande exacte
- api/ et web/ ont node_modules (constaté chef) → vitest api/web lançables ; racine, e2e, worker sans deps

## D5 — 2026-10-07 — jamais de publication de code
- 0 push, 0 remote, 0 PR, par chef ou agent ; `git init` D1 = local seulement
- tout pack : HP « push / remote / PR / commit »
- pourquoi : exigence humaine absolue
