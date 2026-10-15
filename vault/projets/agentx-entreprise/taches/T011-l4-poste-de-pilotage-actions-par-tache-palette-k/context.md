---
pack: T011
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T011 — L4 : poste de pilotage — actions par tâche, palette ⌘K, terminal en tiroir

> Seule source de vérité de l'agent T011. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer la console legacy de la salle par le poste de pilotage (`pilote`, actions par ligne de tâche avec saisie inline du motif, palette Ctrl/⌘K, terminal chef en tiroir fixe) dans `dash/dash.js`, `dash/index.html`, `dash/dash.css` — à la lettre de `contrat.md` §C9-L4.

## Definition of Done
- [ ] supprimés : `sortie`, `ecrire`, `lancer`, `peuplerConsole`, `brancherConsole` + appel `peuplerConsole(s)` + `#console-out` + CSS `.console-*` : `rg -n "peuplerConsole|brancherConsole|console-out|console-etat|console-barre" dash/` → ∅
- [ ] `copier` conservé verbatim ; `pilote(req, bouton)` = ex-`lancer` (POST `api/run`, header `X-AgentX-Jeton`, écrit `#sortie` + `#sortie-etat`, puis `await charger()`)
- [ ] `brancherTodo` (délégation `#todo` : `data-exe` → `pilote(ETAT.todo[i].exe)`, `data-copie` → `copier`) — boutons todo existants fonctionnent comme avant
- [ ] `rendreTaches` : colonne ACTIONS, boutons `.tbtn[data-act][data-tid]` depuis `t.actions` ; classe `rejete` ; pas de repeinte si `SAISIE.tid !== null`
- [ ] `actionTache` / `ouvrirSaisie` / `fermerSaisie` : saisie inline `#saisie-motif` maxlength 200, prérempli `a.exe.motif` ; Entrée → `pilote({...a.exe, motif})` ; vide → `.ko`, rien envoyé ; Échap → ferme
- [ ] palette `#palette` HTML §C9 verbatim ; `entreesPalette(s)` (globales + actions par tâche + `/dispatch` copie) ; filtre sous-chaîne sans accents ; ↑/↓/Entrée/Échap ; entrée `saisie:"motif"` → `#palette-q` devient saisie du motif
- [ ] raccourcis §C9 : Ctrl/⌘+K (ignoré dans xterm), Ctrl+` (partout), Échap (palette > saisie > plein écran)
- [ ] tiroir : `#tiroir.term-panel.tiroir` fixe en bas, fermé = `translateY(calc(100% - 34px))`, jamais `display:none` ; `#tiroir-btn` ; `localStorage 'agentx:tiroir'` sous try/catch ; `fit()` 50 ms après bascule ; `.frame` `padding-bottom: 40px` ; ids `#term #term-etat #term-full #term-start #term-stop` conservés ; plein écran existant marche encore
- [ ] panneau tâches titré `POSTE DE PILOTAGE` + `#pilote-barre` (`data-lire` board|ready|doctor|index|personnel|integrer) + `<kbd class="kbd">⌘K</kbd>` + `#sortie`/`#sortie-etat`
- [ ] amorçage = `brancherTodo(); brancherTaches(); brancherPalette(); brancherTerminal(); brancherSon(); boucle();`
- [ ] `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅
- [ ] `node --check dash/dash.js` → rc 0
- [ ] harnais node jetable `.cache/pilote-T011.mjs` (vm + DOM minimal ou jsdom ABSENT → stubs) : `entreesPalette` sur un état à 2 tâches (actions §C7 exemple) → titres collés ; filtre `"vir"` → n'entrées collées ; `actionTache` d'une action `saisie:"motif"` → ouvre la saisie (stub)
- [ ] `git diff --stat -- dash/` collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `rendreTaches :589-603` · `rendreTodo :608-630` · `rendre :955-1005` (appel peuplerConsole ~`:981`) · `charger :1027` · console legacy `:1047-1142` (sortie, ecrire, lancer, copier `:1087`, peuplerConsole `:1102`, brancherConsole `:1119`) · terminal `:1144-1333` (brancherTerminal `:1281`) · amorçage `:1335-1338` |
| `dash/index.html` | E | panneau tâches `:103-116` · `term-panel` `:133-146` · fin body `:148-155` |
| `dash/dash.css` | E | `.console-*` `~:405-450`, `.console-out` `~:464-470` · terminal `:453-462` · `.frame :28` |
| `vault/projets/agentx-entreprise/contrat.md` | L | **§C7 L315-351 (state.json, `taches[].actions`) · §C8 L352-396 (actions, api/run) · §C9 L397-468 (L4) : contrat verbatim** |

## Contrats
`contrat.md` §C9-L4 = contrat recopié, à appliquer à la lettre. Rappels :
```js
entrée d'action (serveur) : {k, libelle, exe: {action, tid, projet, motif?} | null, cmd: string, saisie: "" | "motif"}
POST api/run  body JSON {action, projet, tid, statut?, motif?, role?, modele?}  header X-AgentX-Jeton: ETAT.jeton
réponse : {commande, code, out, err}
actions /api/run : board ready doctor index (lecture) · set · pack-lint · virer · retenir · personnel · integrer
```
Lignes actuelles (HEAD de travail, après L3) :
```js
// dash.js:1335-1338
brancherConsole();
brancherTerminal();
brancherSon();
boucle();
// rendreTodo : boutons `<button class="ti-act run" data-exe="${i}">▶ lancer</button>` et `data-copie="${i}"` — à brancher par brancherTodo
```
```html
<!-- index.html:133 --> <section class="panel term-panel"> … <pre class="console-out" id="console-out" hidden></pre>
<!-- index.html:105 --> <span class="panel-title">PACKS · ANALYSE</span>
<!-- index.html:108-110 --> .tasks-head : ID TÂCHE RÔLE TOK FIC LINT
```

## Décisions actées
- le front affiche `taches[].actions`, ne calcule aucune permission — contrat C0 B
- jamais `alert/confirm/prompt` — bloquent la page et l'automatisation
- dispatcher et écrire un pack : copie de commande, jamais exécution — liste blanche serveur
- tiroir par `transform`, jamais `display:none` — xterm garde ses colonnes
- état serveur peut être à l'ancien format (L2 en parallèle) : `t.actions` absent → colonne vide, pas d'erreur

## Hors périmètre
- `bin/*` (serveur, CLI : autres lots)
- Salle SVG, deck, RH (L3 livré, ne pas retoucher `:1-580` hors `COULEUR_*` lus)
- Nouveau protocole terminal, multi-sessions

## Environnement
- JS sans build ni module ; `node` v22 ; pas de jsdom installé → stubs dans le harnais ; harnais et fichiers jetables sous `.cache/` seulement
- `dash.js`/`dash.css`/`index.html` servis à chaque requête : 0 relance serveur
- salle possiblement lancée par l'humain sur :7777 : ne pas l'arrêter ; pas de navigateur requis (capture = vérif suivante)
- arbre partagé : `bin/vx.py`, `bin/dash.py` écrits par d'autres agents en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/` seulement), Grep, `Bash(node:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T011
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : scénario de vérif navigateur (clics, raccourcis) prêt à coller
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
