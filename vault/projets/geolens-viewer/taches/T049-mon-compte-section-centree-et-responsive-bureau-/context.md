---
pack: T049
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T049 — Mon compte : section centrée et responsive (bureau, tablette, mobile)

> Seule source de vérité de l'agent T049. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Centrer la page `/account` (titre, sous-titre, messages, carte) dans une colonne unique et la rendre confortable de 360 px à 1440 px, dans G=/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web, sans toucher aux autres pages.

## Definition of Done
- [ ] Account.tsx : contenu enveloppé dans `<div className="gl-account-page">` ; styles inline de la carte (`padding`, `marginTop`, `maxWidth`) remplacés par la classe `gl-account-card` ; 0 changement de logique (submit, champs, ids, htmlFor)
- [ ] theme.css : bloc CSS du Contrat ajouté en fin de fichier (≤ 15 lignes), 0 règle existante modifiée
- [ ] mesures (script ci-dessous) à 1440, 768, 390, 360 px : `|card.left − (winW − card.right)| ≤ 2` (centrée) ; `h1.left === card.left` (même colonne) ; `docW === winW` (0 scroll horizontal) ; à ≤ 560 px bouton pleine largeur (`btn.width ≈ card.width − 2×padding`)
- [ ] 4 captures `account-<largeur>.png` dans `/home/jdrac/Documents/Workspace/AgentX/.cache/shots-T049/` + mesures JSON collées
- [ ] `npm --prefix web run typecheck` exit 0 ; `npm --prefix web run lint` 0 erreur ; `npm --prefix web test -- --run` vert (176 fichiers, 1691 tests)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Account.tsx` | E | :35-61 rendu |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/theme.css` | E | ajout en fin (623 l) |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/shot-account.mjs` | E | script de mesure/capture à étendre (largeurs, bouton) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/components/Layout.tsx` | L | `.gl-container` :40 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/components/PasswordInput.tsx` | L | champ + œil |

## Contrats
```css
/* theme.css existant (ne pas modifier) */
* { box-sizing: border-box; }                                        /* :66 */
.gl-container { max-width: 1180px; margin: 0 auto; padding: 28px 22px 84px; }   /* :117, Layout.tsx:40 */
.gl-card { background: var(--gl-surface); border: 1px solid var(--gl-line); border-radius: var(--gl-r-lg); box-shadow: var(--gl-e2); }  /* :163 */
.gl-input { width: 100%; padding: 12px 14px; … }                     /* :151 */
.gl-pwd-input { padding-right: 42px; width: 100%; box-sizing: border-box; }    /* :435 */

/* CIBLE — ajout en fin de theme.css */
/* Mon compte : colonne unique centrée (titre + carte alignés), pleine largeur sur téléphone. */
.gl-account-page { max-width: 520px; margin: 0 auto; }
.gl-account-card { padding: 24px; margin-top: 18px; }
@media (max-width: 560px) {
  .gl-account-card { padding: 18px; }
  .gl-account-card .gl-btn { width: 100%; }
}
```
```tsx
// Account.tsx:35-61 ACTUEL (extrait)
<Layout>
  <h1 className="gl-h1">Mon compte</h1>
  <p className="gl-sub">{user?.email}{user?.role === 'org_admin' ? ' · administrateur' : ''}</p>
  {msg && <div className="gl-ok" role="status">{msg}</div>}
  {err && <div className="gl-error" role="alert">{err}</div>}
  <div className="gl-card" style={{ padding: 20, marginTop: 18, maxWidth: 460 }}>
// CIBLE : <Layout><div className="gl-account-page"> … tout le contenu … </div></Layout> ; carte : className="gl-card gl-account-card" sans style
// l'email du sous-titre peut être long : .gl-sub doit passer à la ligne (overflow-wrap: anywhere dans .gl-account-page .gl-sub)
```
Mesures avant (chef, 2026-10-08, :5180) : 1440 px → card left 152 right 612 (décalée à gauche, h1 1136 px de large) ; 390 px → card 12..378, docW 390 (pas de débordement) ; bouton 134 px.
Script : `node /home/jdrac/Documents/Workspace/AgentX/.cache/shot-account.mjs <dossier>` — login `admin@demo.geolens.fr` / `demo1234`, `BASE=http://localhost:5180` ; importe playwright-core depuis `G/e2e/node_modules` (chromium 1228 installé).

## Décisions actées
- colonne 520 px centrée — formulaire unique, lecture confortable
- correctif local à la page — pas de refonte de `.gl-container`

## Hors périmètre
- autres pages (Admin, Dashboard, Login…) ; Layout.tsx ; en-tête/pied
- textes, logique de changement de mot de passe, API
- push, remote, PR, commit — D5/D9 ; git stash/checkout/reset/clean ; npm install

## Environnement
- serveurs DÉJÀ lancés par le chef : API :4000 (`npm run dev:api`), front Vite dev :5180 (HMR → modifications visibles sans relance) ; ne pas les arrêter ni en lancer d'autres ; :5173 et :5174 = autres projets, intouchables
- node v22.22.1 ; web/node_modules ; G HEAD `fe397e8`, arbre propre ; lint : 1 warning préexistant Admin.tsx:368
- règle G : 0 `any`, 0 `@ts-ignore`, pas de style inline nouveau

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Grep, Bash(node …/.cache/shot-account.mjs, npm --prefix web run typecheck, npm --prefix web run lint, npm --prefix web test -- --run, mkdir -p …/.cache/shots-T049, rg, git -C G diff, git -C G status)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom ; jamais de nettoyage global.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T049
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
