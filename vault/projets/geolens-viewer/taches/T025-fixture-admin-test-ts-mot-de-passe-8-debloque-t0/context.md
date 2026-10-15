---
pack: T025
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T025 — Fixture admin.test.ts : mot de passe ≥ 8 (débloque T019)

> Seule source de vérité de l'agent T025. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Aligner le fixture de `api/test/admin.test.ts` sur la nouvelle règle de mot de passe (min 8, livrée par T019) en remplaçant `'secret9'` (7 car) par `'secret99'` aux lignes :21, :30, :34, puis prouver la suite api entièrement verte. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] admin.test.ts:21, :30, :34 : `'secret9'` → `'secret99'` ; `rg -n "secret9'" api/test/admin.test.ts` → ∅
- [ ] 0 autre ligne de admin.test.ts modifiée (assertions, structure inchangées)
- [ ] `npx --prefix api vitest run --root api test/admin.test.ts` → verts, sortie collée
- [ ] `npm --prefix api test` → `Tests 617 passed (617)` attendu, sortie collée
- [ ] `npm --prefix api run typecheck` → exit 0
- [ ] `git -C G diff -- api/test/admin.test.ts` collé (3 lignes changées)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/test/admin.test.ts` | E | :21, :30, :34 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/api/src/passwordPolicy.ts` | L | règle (14 l) |

## Contrats
```ts
// api/src/passwordPolicy.ts (T019)
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 256;
export function passwordProblem(pw: unknown): string | null;
// admin.test.ts actuel
// :21  payload: { email: 'x@demo.geolens.fr', password: 'secret9' },
// :30  payload: { email, password: 'secret9', role: 'member' },
// :34  const newCookie = await login(app, email, 'secret9');
// échec T019 : test/admin.test.ts:32 « expected 400 to be 201 » (création user mdp 7 car)
```

## Décisions actées
- min 8 partout est voulu (PT-6) — le fixture suit la règle, pas l'inverse
- modification d'un test existant autorisée ici seulement — accord chef, tâche dédiée

## Hors périmètre
- api/src/** (T019 livré, ne pas toucher) ; tout autre test
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; api/node_modules ; vitest + pg-mem ; base 71 fichiers / 617 tests (1 KO = admin.test.ts:32)
- G sous git ; seul agent api/ pendant cette tâche

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npx vitest, npm --prefix api test, npm --prefix api run typecheck, git diff, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T025
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
