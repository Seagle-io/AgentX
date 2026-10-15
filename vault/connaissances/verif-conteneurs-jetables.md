---
titre: vérification en conteneurs jetables (Docker, préfixe glverif-)
resume: nommage, nettoyage par nom sans prune, MinIO pullable, cookie Secure sous curl, ports, pannes simulées
source: geolens-viewer T042, T045, decisions.md D13
cree: 2026-10-07
tags: [note, docker, verification, geolens-web]
---

# Vérification en conteneurs jetables

## Fait
- tout objet créé porte le préfixe `glverif-` : conteneurs, réseau (`glverif-net`), image (`glverif-api`)
- nettoyage par nom : `docker rm -fv <nom>` · `docker network rm <nom>` · `docker rmi glverif-api`
- `-fv` supprime aussi les volumes anonymes du conteneur
- JAMAIS `prune` (incident T042 : 6 volumes détruits, decisions.md D13) ; `bin/garde_bash.py` refuse prune, `docker volume rm`, `compose down -v`
- contrôle de fin : `docker ps -a --filter name=glverif- -q` → ∅ ; `docker network ls --filter name=glverif` → ∅ ; `docker volume ls` avant = après
- `minio/minio` et `minio/mc` : pull access denied (quay.io 401) → `bitnamilegacy/minio` (mc inclus)
- image tirée mais laissée si non `glverif-*` (ex. bitnamilegacy/minio) : à noter dans Écarts
- `COOKIE_SECURE=1` : `curl -c` ignore le cookie sur http → `curl -D -` puis `-H "Cookie: glx_session=…"`
- cookie de session `glx_session`, login `POST /api/auth/login`
- ports hôte `127.0.0.1:4100-4101` ; API sans port publié en compose
- panne simulée : `docker stop`/`start` ou `docker network disconnect`/`connect` (503 en 0,4-0,5 s ; sonde DB 3 s)
- `docker pause` absent de la liste d'outils → épuisement de pool NV
- zip d'upload : `yazl` dans `G/api/node_modules` (pas à la racine)
- fish : sortie d'un `timeout N tsx …` perdue → rediriger vers fichier

## Pourquoi ça compte
- un prune ou une image non pullable bloque ou détruit hors périmètre

## Voir aussi
- [[geolens-web-securite-carte]]
- [[geolens-web-outillage]]
