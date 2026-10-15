---
titre: fastify ≥ 5.12.5 — trustProxy numérique retiré
resume: trustProxy nombre fail-closed et absent des types ; utiliser IP/CIDR ou mot-clé
source: geolens-viewer T001-T030
cree: 2026-10-07
tags: [note, fastify, securite]
---

# fastify ≥ 5.12.5 — trustProxy

## Fait
- `trustProxy: <number>` fail-closed : `lib/request.js:51-54`, jamais XFF
- retiré des types : `fastify.d.ts:152` → `boolean | string | string[] | fn`
- utiliser IP/CIDR ou `'loopback'|'linklocal'|'uniquelocal'`

## Pourquoi ça compte
- montée de version casse silencieusement l'IP cliente (rate-limit, logs) → vérifier le `.d.ts` installé

## Voir aussi
- [[geolens-web-securite-carte]]
