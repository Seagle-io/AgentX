---
pack: T052
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T052 — D15-web : fin de contrat (Admin) + bouton export (Mon compte)

> Seule source de vérité de l'agent T052. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter côté web (1) dans l'éditeur d'organisation de `Admin.tsx` la saisie de la date de fin de contrat (route `PATCH /api/admin/organizations/:id/contract`), (2) dans `Account.tsx` une carte « Mes données » avec téléchargement JSON de `GET /api/me/export` ; les routes API sont livrées par un autre lot (contrat ci-dessous). G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] `web/src/api.ts:120` : `Organization` + `contractEndAt?: string | null`
- [ ] `Admin.tsx` OrgPacksEditor (~:102) : bloc contrat inséré avant le bloc « Logo de l'organisation » (~:246) — label, `<input type="date" className="gl-input">` prérempli `org.contractEndAt ?? ''`, bouton « Enregistrer » (`gl-btn`) + bouton « Effacer » (ghost, envoie null) → `api.patch(...)` puis `onChanged()`, erreur → `onError(...)`
- [ ] `Account.tsx` : carte « Mes données » entre la carte mot de passe et la fin du Layout (~:60-61) : texte 1 ligne + bouton « Télécharger mes données (JSON) » → `api.get<unknown>('/api/me/export')` → Blob → téléchargement `geolens-export-AAAA-MM-JJ.json` ; état busy + message d'erreur
- [ ] mêmes classes/composants que l'existant (gl-card/gl-label/gl-btn, styles inline du fichier) ; responsive conservé (T049)
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web run lint` → 0 erreur sur les 3 fichiers (sortie collée) ; `npm --prefix web test` → verts (base 176 / 1691)
- [ ] `git -C G diff --stat -- web` collé : 3 fichiers
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/api.ts` | E | :120 type Organization ; :83-90 api (L) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Admin.tsx` | E | OrgPacksEditor :102-300 ; modèle download :1070-1085 (L) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Account.tsx` | E | 64 l |

## Contrats
```ts
// web/src/api.ts:83-87
export const api = { … patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body), … }   // get<T>(url) existe à côté
// :120 ACTUEL
export interface Organization { id: string; name: string; createdAt: string; users: number; projects: number; status?: string; packs?: string[]; whiteLabel?: boolean; selfImport?: boolean; orgContact?: OrgContact; orgLogo?: string; }
// Admin.tsx:102 function OrgPacksEditor({ org, onChanged, onError }: { … }) ; utilisé :1144 <OrgPacksEditor org={o} onChanged={reload} onError={flashErr} />
//   pattern existant dans ce composant : useState busy ('orgContact'…), saved, boutons `gl-btn` « Enregistrer le contact »
// Admin.tsx:1078-1080 : modèle de téléchargement Blob (lire)

// ═══ API (livrée par un autre lot, ne pas implémenter ici)
// PATCH /api/admin/organizations/:id/contract  Body { contractEndAt: 'YYYY-MM-DD' | null }
//   200 { ok: true, organization: { id, contractEndAt } } · 400 bad_request | platform_org · 403 · 404
// GET /api/admin/organizations → items + contractEndAt: 'YYYY-MM-DD' | null
// GET /api/me/export → JSON UserExportV1 { format: 'geolens-user-export', version: 1, exportedAt, user, projectAccess, auditLog, layers, reportArtifacts, sidecarEdits } ; 401 anonyme ; 429 au-delà de 5/h
```
Libellés (verbatim) :
- Admin : label « Fin de contrat — livrables purgés à fin + 1 an si rétention active » ; boutons « Enregistrer » / « Effacer » ; erreur 400 platform_org → afficher le message renvoyé
- Account : titre « Mes données » ; texte « Téléchargez une copie de vos données personnelles (compte, accès, journal, couches, rapports). » ; bouton « Télécharger mes données (JSON) »

## Décisions actées
- fin de contrat saisie par l'admin plateforme seulement (la route l'impose) — decisions.md D17
- export côté client par Blob, nom `geolens-export-AAAA-MM-JJ.json` — D17
- 0 nouvelle dépendance ; réutiliser classes et patterns du fichier

## Hors périmètre
- api/ (T051 en parallèle, autres lots ensuite) ; autres pages ; refonte visuelle
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; `npm --prefix web run typecheck` ; `npm --prefix web run lint` (eslint src/**/*.{ts,tsx}) ; vitest env node (0 test de rendu possible)
- routes API absentes tant que les lots API ne sont pas livrés → vérif navigateur NV, attendue
- G sous git HEAD 003e284 ; T051 écrit api/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Bash(npm --prefix web run typecheck, npm --prefix web run lint, npm --prefix web test, git diff, git status, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T052
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
