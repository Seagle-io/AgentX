---
tache: T058
statut: fait
---
## Livré
- G/web/src/pages/Confidentialite.tsx:21 — P1 date → 8 octobre 2026
- G/web/src/pages/Confidentialite.tsx:91-92 — P2 destinataires sans DPA ni Transactional Email
- G/web/src/pages/Confidentialite.tsx:105-107 — P3 durées : 3 ans inactivité, purges auto
- G/web/src/pages/Confidentialite.tsx:119-125 — P4 `<p>` export JSON, limitation, pseudonymisation ajouté
- G/web/src/pages/Confidentialite.tsx:130-132 — P5 sécurité : TLS base, contrôle d'accès par rôle

## Vérifié comment
```
rg -n "DPA|Transactional Email|réseau|privilèges minimaux" web/src/pages/Confidentialite.tsx → ∅ (exit 1)
npm --prefix web run typecheck → tsc --noEmit -p tsconfig.json ; exit 0
npm --prefix web run lint → Admin.tsx 389:6 warning react-hooks/exhaustive-deps ; ✖ 1 problem (0 errors, 1 warning) ; exit 0
npm --prefix web test → Test Files 176 passed (176) ; Tests 1691 passed (1691) ; exit 0
git diff --stat -- web/src/pages/Confidentialite.tsx →
 web/src/pages/Confidentialite.tsx | 25 ++++++++++++++++---------
 1 file changed, 16 insertions(+), 9 deletions(-)
git diff -U0 hunks → -21 +21 · -91,2 +91,2 · -105,3 +105,3 · -118,0 +119,7 · -123,3 +130,3
```

## Écarts
- ∅

## Pour la suite
- Confidentialite.tsx promet : export JSON depuis « Mon compte », purge comptes 3 ans sans connexion, purge journaux 12 mois, pseudonymisation audit à l'effacement, livrables fin contrat + 1 an → chaque promesse doit exister côté api/ (lots D15)
- « au repos » + « sauvegardes automatiques » : vérification console Scaleway = humain
- LEGAL_DOCS_VERSION (server.ts) non bumpé — autre lot
- 0 commit (D5)

## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
