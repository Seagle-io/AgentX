---
pack: T009
projet: geolens-viewer
role: implementeur
cree: 2026-10-07
---

# Pack T009 — Viewer : XSS install.ts + jeton limité à l'origine API (C2, M4)

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Supprimer l'XSS réfléchie de `web/src/viewer/backend/install.ts` (paramètre `project` injecté en innerHTML) et n'ajouter le jeton de tuile qu'aux URL de même origine que l'API dans `makeSignUrl` (`HttpBackend.ts:47-68`), avec 2 tests neufs. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] install.ts `fail()` : message et detail posés via `textContent` (createElement), 0 interpolation dans `innerHTML` de message/detail
- [ ] install.ts:67 : `apiBase = \`${origin}/api/projects/${encodeURIComponent(projectId)}\``
- [ ] HttpBackend.ts makeSignUrl : `if (u.origin !== new URL(ctx.apiBase).origin) return u.href;` avant l'ajout du token
- [ ] `backend/__tests__/makeSignUrl.test.ts` NEUF : 6 cas listés, verts
- [ ] `backend/__tests__/installFail.test.ts` NEUF : garde statique (lecture du source) — 2 cas listés, verts
- [ ] `npm --prefix web run typecheck` → exit 0 (sortie collée)
- [ ] `npm --prefix web test` → verts, compte collé (base ≈ 1665)
- [ ] `git -C G diff --stat` collé : 0 fichier hors WL
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | E | fail :45-58, apiBase :67 (155 l) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | E | makeSignUrl :47-68, ViewerContext :22 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/makeSignUrl.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/installFail.test.ts` | E | NEUF |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/__tests__/copcHttpBackend.test.ts` | L | modèle de test existant (imports, style) |

## Contrats
```ts
// install.ts:45-58 ACTUEL (à réécrire)
function fail(message: string, detail?: string): false {
  const el = document.getElementById('splash-screen') || document.body;
  const box = document.createElement('div');
  box.style.cssText = '…';   // garder tel quel
  box.innerHTML =
    `<div style="font-size:20px;font-weight:600;color:#F15A22">GeoLens Reality</div>` +
    `<div style="font-size:15px;max-width:520px">${message}</div>` +
    (detail ? `<div style="font-size:12px;opacity:.6;max-width:520px">${detail}</div>` : '') +
    `<a href="/" style="color:#F15A22;margin-top:8px">Retour au portail</a>`;
  el.appendChild(box);
  return false;
}
// cible : même rendu visuel ; titre + lien constants peuvent rester en innerHTML ; message/detail = div créés + .textContent
// sources : install.ts:61-62 projectId = params.get('project') ; :79 fail('Projet introuvable ou non autorise.', `id=${projectId}`) ; :86 String(e)
// install.ts:101 : const ctx: ViewerContext = { projectId, token, apiBase, tilesetUrl: tilesetUrlAbs };

// HttpBackend.ts:47-68 ACTUEL
export function makeSignUrl(ctx: ViewerContext): (url: string) => string {
  const storageMarker = '/storage/';
  return (raw: string): string => {
    if (!raw) return raw;
    const s = String(raw);
    if (/^(data:|blob:)/i.test(s)) return s;
    let u: URL;
    try { u = new URL(s, ctx.apiBase + '/'); } catch { return s; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return s;
    if (!u.pathname.includes('/api/projects/') || !u.pathname.includes(storageMarker)) { return u.href; }
    if (!u.searchParams.has('token')) u.searchParams.set('token', ctx.token);
    return u.href;
  };
}
// ViewerContext (HttpBackend.ts:22) : { projectId, token, apiBase, tilesetUrl, … } — lire :22-40 pour les champs exacts
```
Cas makeSignUrl.test.ts (ctx.apiBase = 'https://portail.test/api/projects/p1', token 'T') :
- `https://portail.test/api/projects/p1/storage/a.b3dm` → contient `token=T`
- `https://evil.test/api/projects/p1/storage/a.b3dm` → ∌ `token=`
- relatif `storage/a.b3dm` → même origine → `token=T`
- `data:application/octet-stream;base64,AA` et `blob:https://portail.test/x` → inchangés
- URL déjà `?token=X` → X conservé
- `https://portail.test/autre/route` → ∌ `token=`
Cas installFail.test.ts (readFileSync du source install.ts, env node) :
- corps de `fail` ∌ `${message}` et ∌ `${detail}`
- source contient `encodeURIComponent(projectId)`

## Décisions actées
- textContent plutôt qu'import safeHtml — T008 crée safeHtml en parallèle
- contrôle d'origine via ctx.apiBase — 1 ligne, 0 config
- test install statique — 0 jsdom dans web/node_modules

## Hors périmètre
- logique de redirection 401, chargement du tileset, resolve() HttpBackend.ts:86+
- main.ts, ui/*, safeHtml.ts (T008) ; viewer.html, boot-web.ts, CSP (T010)
- ajouter une dépendance (jsdom…)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules installé ; vitest env node (URL global OK, document ∅)
- `npm --prefix web test` ; `npm --prefix web run typecheck`
- G sous git : baseline 745d46f ; T008 et T010 écrivent dans web/ en parallèle (fichiers disjoints)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, Bash(npm --prefix web test, npm --prefix web run typecheck, npx vitest, git diff, git status, rg, wc)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T009
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
