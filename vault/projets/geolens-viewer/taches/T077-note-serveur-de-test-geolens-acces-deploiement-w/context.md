---
pack: T077
projet: geolens-viewer
role: scribe
cree: 2026-10-09
---

# Pack T077 — Note : serveur de test GeoLens (accès, déploiement web seul, k6, règle BDD)

> Seule source de vérité de l'agent T077. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer UNE note atomique `vault/connaissances/geolens-serveur-test.md` (≤ 45 lignes) réutilisable par un futur pack qui doit mesurer ou déployer sur le serveur de test GeoLens, à partir des faits ci-dessous ; mettre à jour l'index ; 0 identifiant dans la note.

## Definition of Done
- [ ] note NEUVE, frontmatter `titre`, `resume`, `source: geolens-viewer T074-T076, D24-D26`, `cree: 2026-10-09`, `tags: [note, geolens, serveur-test, charge]` ; sections : Accès · Pile · Déployer le front seul · Revenir en arrière · Mesurer (k6, navigateur headless) · Interdits ; liens `[[geolens-web-outillage]]`, `[[geolens-web-securite-carte]]`
- [ ] 0 mot de passe, 0 email de compte, 0 PROJECT_ID, 0 jeton dans la note (rg de contrôle collé)
- [ ] `python3 bin/vx.py index` (cwd AgentX) → sortie collée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-serveur-test.md` | E | NEUF |
| `/home/jdrac/Documents/Workspace/AgentX/vault/connaissances/geolens-web-outillage.md` | L | modèle de note + lien |

## Contrats
Faits (chef, 08-09/10/2026) :
- accès : `ssh -p 34522 geo-test@82.65.97.67` ; clé hôte ED25519 SHA256:IS5Q98L1fJGV2qefKxCD2so4CkMOtGZ1mal2zt+NVx0 (vérifiée par l'humain) ; RSA aussi présentée ; trop de connexions rapprochées → coupure temporaire du port (regrouper les commandes dans 1 connexion)
- web : http://82.65.97.67:34580 (portail, /viewer.html) ; machine KVM 4 vCPU / 15 Go, disque 96 Go
- pile : `~/geolens-web` (copie SANS git, plus ancienne que le dépôt de travail) ; `docker compose -f docker-compose.prod.yml` : api, web, caddy, db (postgres:16-alpine), minio ; `.env` présent — ne jamais l'écraser ni l'afficher ; MinIO ≈ 29 Go
- déployer le front seul : comparer les fichiers serveur au dépôt (md5) → `patch -p1 --dry-run` → appliquer → `docker compose -f docker-compose.prod.yml build web` → `up -d --no-deps web` → contrôle du bundle (`docker exec geolens-web-web-1 grep … /usr/share/nginx/html/assets/*.js`) ; l'API et la base ne redémarrent pas
- revenir en arrière : copies d'origine dans `~/deploy-c23/backup/`, versions corrigées dans `~/deploy-c23/patched/` ; même séquence build web + up --no-deps
- l'API lance `migrate()` au démarrage → la redémarrer = accord humain explicite
- k6 : `~/Makefile` (`make run VUS=N DURATION=2m`, `make report VUS=N`, `make stop`), `~/viewer-navigation.js` (rejoue des téléchargements par zones, sans moteur 3D, sans cache → ne mesure pas les correctifs du renderer), identifiants dans `~/.env.k6` (600) ; référence 09/10 : 5 utilisateurs 35 640 tuiles / 8,5 Go / médiane 22 ms ; 10 utilisateurs 48 480 / 11,7 Go / 78 ms ; API ≈ 1,15 cœur = goulot
- navigateur headless : script `measure.mjs` (playwright-core de G/e2e, swiftshader, CDP cache désactivé) ; scénarios open, open3d (clic « Explorer en 3D »), nav 300 s ; la caméra par défaut ne charge que ≈ 90 tuiles (2 % du modèle de 4 558) → ne reproduit pas le cas lourd ; mémoire GPU non représentative
- interdits : toucher à la base (0 écriture destructive, 0 migration, 0 down -v, 0 seed, 0 restauration) ; écraser .env ; afficher un identifiant ; push

## Décisions actées
- D24, D25, D26 (decisions.md) ; note atomique, 1 sujet

## Hors périmètre
- tout fichier hors de la note ; copier un identifiant ; ssh
- push, remote, PR, commit

## Environnement
- vault Obsidian : markdown + frontmatter YAML, `[[wikilink]]`, 0 HTML, 0 section vide

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Grep, Bash(python3 bin/vx.py index, rg)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T077
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
