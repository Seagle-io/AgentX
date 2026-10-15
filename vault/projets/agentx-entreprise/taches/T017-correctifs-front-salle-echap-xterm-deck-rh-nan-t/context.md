---
pack: T017
projet: agentx-entreprise
role: designer
cree: 2026-10-15
---

# Pack T017 — Correctifs front de la salle : Échap xterm, deck, RH NaN, tiroir

> Seule source de vérité de l'agent T017. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger 5 défauts constatés (vérif T016 + capture T014) dans `dash/dash.js` et `dash/dash.css`, sans toucher au reste de la salle, et le prouver par captures Chromium à 1600 et 390 px.

## Definition of Done
- [ ] F1 Échap : saisie de motif ouverte + focus dans `.xterm-helper-textarea` + Échap → l'Échap part au terminal (pas de `preventDefault`), la saisie reste ouverte ; focus hors xterm → Échap ferme palette puis saisie comme avant
- [ ] F2 deck : à 150 px de large, `.card-tag` ne chevauche plus `.card-nom` ; noms des 13 rôles lisibles en entier à 1600 px (IMPLÉMENTEUR, VÉRIFICATEUR inclus) ; mesure collée : pour chaque carte, `tag.getBoundingClientRect()` ∩ `nom.getBoundingClientRect()` = ∅ et `nom.scrollWidth <= nom.clientWidth`
- [ ] F3 RH : `tableRH` n'affiche jamais `NaN` : `taux_renvoi` `null` ou `undefined` → `—` ; `rg -n "t === null" dash/dash.js` → ∅
- [ ] F4 tiroir ouvert : le bas de `#tasks` reste atteignable (`.frame` gagne la hauteur du tiroir quand `.tiroir.ouvert`) ; fermé : `padding-bottom:40px` inchangé
- [ ] F5 z-index : `.demo-flag` passe sous le tiroir (`z-index` < 39) ; `.toasts` inchangé
- [ ] `node --check dash/dash.js` → rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅
- [ ] script `.cache/T017/capture.mjs` (Playwright Node, cf. Environnement) : mesures F2 + F1 collées, 0 erreur console
- [ ] captures `.cache/T017/deck-1600.png`, `.cache/T017/deck-390.png`, `.cache/T017/tiroir-ouvert.png` listées
- [ ] `git diff --stat -- dash/` collé ; 0 autre fichier hors `.cache/T017/`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | deck `:45-62` · tableRH `:564-571` · raccourcis `:1248-1262` · basculerTiroir `:1264-1270` |
| `dash/dash.css` | E | `.card-*` `:103-121` · `.frame :28` · `.tiroir :514-520` · `.demo-flag :564-570` |
| `.cache/T017/` | E | script et captures jetables |

## Contrats
Défauts verbatim (T016 result.md) :
```
D3 · saisie de motif ouverte + focus dans xterm (session vivante) + Échap
  obtenu : Échap avalé, 0 `api/term/in` ; claude n'est pas interrompu
  témoin sans saisie → `in {"data":"\u001b"}`
  dash/dash.js:1257 — branche Échap n'exclut pas `xterm-helper-textarea` ; :1457 l'exclut
- tiroir ouvert masque le bas de la liste des tâches
```
Lignes actuelles :
```js
// dash.js:1249-1261 (keydown, capture)
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'
    && document.activeElement?.className !== 'xterm-helper-textarea'){ … }
else if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')){ … basculerTiroir(); }
else if (e.key === 'Escape' && (PALETTE.ouverte || SAISIE.tid !== null)){
  e.preventDefault(); e.stopPropagation();
  if (PALETTE.ouverte) fermerPalette(); else fermerSaisie(); }
// dash.js:567-569
const t = l.taux_renvoi;
<td class="${t !== null && t >= .5 ? 'ko' : ''}">${t === null ? '—' : Math.round(100 * t) + ' %'}</td>
// dash.js:52-58 carte
<div class="card-top"><div class="card-face">…</div>
  <div class="card-id"><div class="card-nom">…</div><div class="card-sous">…</div></div>
  <div class="card-tag" data-f="tag"></div></div>
```
```css
/* dash.css */
.card-id{min-width:0;flex:1}
.card-nom{font-size:15px;font-weight:800;letter-spacing:.07em;color:var(--c);line-height:1.1}
.card-tag{font-size:7.5px;…;flex:none;align-self:flex-start}
.frame{…;padding-bottom:40px}
.tiroir{position:fixed;…;z-index:39;height:min(70vh,640px);…}
.demo-flag{position:fixed;right:16px;bottom:14px;z-index:40;…}
```
`#deck` = grille `repeat(auto-fill, minmax(150px, 1fr))` (T009, retenu) — garder la grille.

## Décisions actées
- F2 : liberté de solution (tag sous le nom, en coin, taille du nom en `clamp`) ; jamais de `display:none` du tag
- 0 donnée inventée ; rien d'autre restylé
- Échap dans xterm = interruption de claude : prioritaire sur la fermeture de saisie

## Hors périmètre
- `bin/*`, `dash/index.html`, salle SVG, palette, actions par tâche
- autres défauts T016 (D1, D2 : tâche serveur parallèle)

## Environnement
- skill `frontend-design` préchargé ; JS sans build ni module ; `dash.js`/`dash.css` servis à chaque requête
- banc de capture : `python3 bin/dash.py --port 7794 --no-open &` (lit le vrai vault, GET seulement) ; tuer par pid à la fin, `curl -s -o /dev/null -w '%{http_code}' 127.0.0.1:7794` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; navigateurs `~/.cache/ms-playwright` ; 0 `npm install`
- OBLIGATOIRE dans le script : `page.route('**/api/term/**', r => r.fulfill({status:200, contentType:'application/json', body:'{}'}))` et `page.route('**/api/run', r => r.abort())` — la page POST seule `/api/term/open` au chargement ; le socket chef est celui de la vraie session
- F1 testable sans session : cliquer `.tbtn[data-act=virer]`, puis `page.focus('.xterm-helper-textarea')`, Échap → `#saisie-motif` toujours présent ; requêtes `api/term/in` interceptées comptées
- salle réelle :7777 : ne pas lancer, ne pas arrêter
- `localStorage 'agentx:tiroir'` sous try/catch (existant)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/T017/` + WL), Grep, `Bash(node:*)`, `Bash(python3 bin/dash.py:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T017
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (mesures F1/F2, captures)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
