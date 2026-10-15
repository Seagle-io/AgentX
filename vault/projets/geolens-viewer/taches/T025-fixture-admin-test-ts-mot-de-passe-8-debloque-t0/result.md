---
tache: T025
statut: fait
---
## Livré
- api/test/admin.test.ts:21 — `'secret9'` → `'secret99'` (403 member)
- api/test/admin.test.ts:30 — `'secret9'` → `'secret99'` (création 201)
- api/test/admin.test.ts:34 — `'secret9'` → `'secret99'` (login nouveau user)

## Vérifié comment
`rg -n "secret9'" api/test/admin.test.ts` → ∅ (exit 1)
`npx --prefix api vitest run --root api test/admin.test.ts` →
```
 ✓ test/admin.test.ts (4 tests) 548ms
 Test Files  1 passed (1)
      Tests  4 passed (4)
```
`npm --prefix api test` →
```
 Test Files  71 passed (71)
      Tests  617 passed (617)
   Duration  13.06s
```
`npm --prefix api run typecheck` → `tsc -p tsconfig.test.json` · exit 0
`git -C G diff -- api/test/admin.test.ts` →
```
@@ -18,7 +18,7 @@
-      payload: { email: 'x@demo.geolens.fr', password: 'secret9' },
+      payload: { email: 'x@demo.geolens.fr', password: 'secret99' },
@@ -27,11 +27,11 @@
-      payload: { email, password: 'secret9', role: 'member' },
+      payload: { email, password: 'secret99', role: 'member' },
-    const newCookie = await login(app, email, 'secret9');
+    const newCookie = await login(app, email, 'secret99');
```

## Écarts
- ∅

## Pour la suite
- T019 débloqué : suite api 71/71 fichiers, 617/617 tests verts
- règle min 8 (PASSWORD_MIN) désormais respectée par tous fixtures api

## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
