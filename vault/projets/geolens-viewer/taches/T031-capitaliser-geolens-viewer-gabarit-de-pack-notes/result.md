---
tache: T031
statut: fait
---
## Livré
- vault/_templates/context.md — R1-R6 ajoutées, 76 l (≤ 95)
- R1+R6 → Environnement ; R2+R3 → Fichiers autorisés ; R4 → Décisions ; R5 → Contrats
- vault/connaissances/geolens-web-outillage.md — commandes, versions, pièges (N1), 33 l
- vault/connaissances/geolens-web-securite-carte.md — modules sécurité + contrats (N2), 39 l
- vault/connaissances/fastify-trustproxy-5-12.md — trustProxy numérique retiré (N3), 18 l
## Vérifié comment
python3 bin/vx.py index → index ecrit : vault/INDEX.md (3 projet(s))
grep -c geolens-web vault/INDEX.md → 4 ; grep -c fastify-trustproxy vault/INDEX.md → 1
wc -l vault/_templates/context.md → 76
doctor → NV — non lancé (Bash limité à index)
## Écarts
- ∅
## Pour la suite
- gabarit : R1-R6 intégrées ; packs futurs héritent sans retouche
- futur pack geolens-web : coller [[geolens-web-outillage]] en Environnement, [[geolens-web-securite-carte]] en Contrats
- toute montée fastify/lib → pack vérifie `.d.ts` ([[fastify-trustproxy-5-12]])
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
